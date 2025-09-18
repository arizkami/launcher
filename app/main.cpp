// Remove the manual defines since CEF already defines them on command line
// #define WIN32_LEAN_AND_MEAN
// #define NOMINMAX
#include <windows.h>
#include <shellapi.h>  // Add this for Shell_NotifyIcon

// Undefine Windows macros that conflict with CEF
#ifdef GetFirstChild
#undef GetFirstChild
#endif
#ifdef GetNextSibling
#undef GetNextSibling
#endif
#ifdef GetPrevSibling
#undef GetPrevSibling
#endif
#ifdef GetParent
#undef GetParent
#endif

// SDL3 includes for window management
#include <SDL3/SDL.h>

// CEF includes - using browser container instead of views
#include "include/cef_app.h"
#include "include/cef_browser.h"
#include "include/cef_crash_util.h"
#include "include/wrapper/cef_helpers.h"
#include "include/cef_image.h"

// Crashpad includes
#include <client/crash_report_database.h>
#include <client/settings.h>
#include <client/crashpad_client.h>
#include <client/crashpad_info.h>

#include <filesystem>
#include <fstream>

// Local includes
#include "global/config.hpp"
#include "global/logger.hpp"
#include "cefview/client.hpp"
#include "cefview/app.hpp"
#include "resources/binaryresourceprovider.hpp"

// Global variables
CefRefPtr<SimpleClient> g_client;
SDL_Window* g_sdl_window = nullptr;
CefRefPtr<CefBrowser> g_browser;
bool g_running = true;
bool g_is_fullscreen = true;

// Global icon handle
static HICON g_app_icon = NULL;

// Crashpad database
std::unique_ptr<crashpad::CrashReportDatabase> g_crash_database;

// Initialize Crashpad crash handler
static bool InitializeCrashpad(const std::string& url, const std::wstring& handler_path, const std::wstring& db_path) {
    using namespace crashpad;

    std::map<std::string, std::string> annotations;
    std::vector<std::string> arguments;

    // Set required annotations
    annotations["format"] = "minidump";
    annotations["app_version"] = "1.0.0";
    annotations["component"] = "main_process";

    // Disable rate limiting for development
    arguments.push_back("--no-rate-limit");

    base::FilePath db(db_path);
    base::FilePath handler(handler_path);

    g_crash_database = crashpad::CrashReportDatabase::Initialize(db);

    if (g_crash_database == nullptr || g_crash_database->GetSettings() == nullptr) {
        Logger::LogMessage("Failed to initialize Crashpad database");
        return false;
    }

    // Enable automated uploads
    g_crash_database->GetSettings()->SetUploadsEnabled(true);

    bool success = CrashpadClient{}.StartHandler(
        handler, db, db, url, annotations, arguments, false, false, {}
    );

    if (success) {
        Logger::LogMessage("Crashpad initialized successfully");
    } else {
        Logger::LogMessage("Failed to start Crashpad handler");
    }

    return success;
}

// Load application icon once and cache it
HICON LoadApplicationIcon() {
    if (g_app_icon) {
        return g_app_icon; // Return cached icon
    }
    
    HINSTANCE hInstance = GetModuleHandle(NULL);
    if (!hInstance) {
        Logger::LogMessage("Failed to get module handle for icon loading");
        return NULL;
    }
    
    // Try to load icon from resource (ID 101 as defined in app.rc)
    g_app_icon = LoadIcon(hInstance, MAKEINTRESOURCE(101));
    if (!g_app_icon) {
        Logger::LogMessage("Failed to load application icon from resource ID 101");
        // Fallback to system default application icon
        g_app_icon = LoadIcon(NULL, IDI_APPLICATION);
    }
    
    if (g_app_icon) {
        Logger::LogMessage("Application icon loaded successfully");
    } else {
        Logger::LogMessage("Failed to load any application icon");
    }
    
    return g_app_icon;
}

// Set taskbar icon with proper window class registration
void SetPermanentTaskbarIcon(HWND hwnd) {
    if (!hwnd) {
        Logger::LogMessage("Invalid window handle for taskbar icon");
        return;
    }

    HICON hIcon = LoadApplicationIcon();
    if (!hIcon) {
        Logger::LogMessage("No icon available for taskbar");
        return;
    }
    
    // Set both large and small icons
    SendMessage(hwnd, WM_SETICON, ICON_BIG, (LPARAM)hIcon);
    SendMessage(hwnd, WM_SETICON, ICON_SMALL, (LPARAM)hIcon);
    
    // Ensure window appears in taskbar with proper extended style
    LONG_PTR exStyle = GetWindowLongPtr(hwnd, GWL_EXSTYLE);
    SetWindowLongPtr(hwnd, GWL_EXSTYLE, exStyle | WS_EX_APPWINDOW);
    
    // Force taskbar to update the icon
    SetWindowPos(hwnd, NULL, 0, 0, 0, 0, 
                 SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED);
    
    Logger::LogMessage("Permanent taskbar icon set successfully");
}

// Alternative method: Set application ID to distinguish from Chromium
void SetApplicationUserModelID(HWND hwnd) {
    // Load Shell32.dll dynamically to avoid dependency issues
    HMODULE hShell32 = LoadLibrary(L"Shell32.dll");
    if (hShell32) {
        typedef HRESULT (WINAPI *SetCurrentProcessExplicitAppUserModelIDProc)(PCWSTR);
        SetCurrentProcessExplicitAppUserModelIDProc SetCurrentProcessExplicitAppUserModelID = 
            (SetCurrentProcessExplicitAppUserModelIDProc)GetProcAddress(hShell32, "SetCurrentProcessExplicitAppUserModelID");
        
        if (SetCurrentProcessExplicitAppUserModelID) {
            // Set unique application ID to separate from Chromium
            HRESULT hr = SetCurrentProcessExplicitAppUserModelID(L"SwipeIDE.Application.1.0");
            if (SUCCEEDED(hr)) {
                Logger::LogMessage("Application User Model ID set successfully");
            } else {
                Logger::LogMessage("Failed to set Application User Model ID");
            }
        }
        FreeLibrary(hShell32);
    }
}

// Create SDL3 borderless window
SDL_Window* CreateBorderlessWindow() {
    int init_result = SDL_Init(SDL_INIT_VIDEO);
    if (init_result < 0) {
        Logger::LogMessage("Failed to initialize SDL: " + std::string(SDL_GetError()));
        return nullptr;
    }
    
    Uint32 window_flags = SDL_WINDOW_BORDERLESS | SDL_WINDOW_RESIZABLE;
    if (g_is_fullscreen) {
        window_flags |= SDL_WINDOW_FULLSCREEN;
    }
    
    int width = g_is_fullscreen ? 0 : 1200;  // 0 for fullscreen desktop
    int height = g_is_fullscreen ? 0 : 800;
    
    SDL_Window* window = SDL_CreateWindow(
        "SwipeIDE",
        width, height,
        window_flags
    );
    
    if (!window) {
        Logger::LogMessage("Failed to create SDL window: " + std::string(SDL_GetError()));
        SDL_Quit();
        return nullptr;
    }
    
    // Get native window handle for CEF integration using SDL3 properties API
    SDL_PropertiesID props = SDL_GetWindowProperties(window);
    HWND hwnd = (HWND)SDL_GetPointerProperty(props, SDL_PROP_WINDOW_WIN32_HWND_POINTER, nullptr);
    
    if (hwnd) {
        // Set application ID and taskbar icon
        SetApplicationUserModelID(hwnd);
        SetPermanentTaskbarIcon(hwnd);
        
        Logger::LogMessage("SDL3 borderless window created successfully");
    } else {
        Logger::LogMessage("Failed to get native window handle from SDL3 properties");
    }
    
    return window;
}

// Convert Windows HICON to CEF image for window icon
CefRefPtr<CefImage> ConvertIconToCefImage(HICON hIcon) {
    if (!hIcon) {
        return nullptr;
    }
    
    // Get icon info to extract bitmap data
    ICONINFO iconInfo;
    if (!GetIconInfo(hIcon, &iconInfo)) {
        Logger::LogMessage("Failed to get icon info for CEF conversion");
        return nullptr;
    }
    
    // Get bitmap info for the color bitmap
    BITMAP bmp;
    if (!GetObject(iconInfo.hbmColor, sizeof(BITMAP), &bmp)) {
        Logger::LogMessage("Failed to get bitmap object for CEF conversion");
        DeleteObject(iconInfo.hbmColor);
        DeleteObject(iconInfo.hbmMask);
        return nullptr;
    }
    
    // Create device context and get bitmap bits
    HDC hdc = GetDC(NULL);
    HDC hdcMem = CreateCompatibleDC(hdc);
    
    BITMAPINFOHEADER bi = {};
    bi.biSize = sizeof(BITMAPINFOHEADER);
    bi.biWidth = bmp.bmWidth;
    bi.biHeight = -bmp.bmHeight; // Negative for top-down DIB
    bi.biPlanes = 1;
    bi.biBitCount = 32;
    bi.biCompression = BI_RGB;
    
    std::vector<uint8_t> bitmapData(bmp.bmWidth * bmp.bmHeight * 4);
    
    if (!GetDIBits(hdcMem, iconInfo.hbmColor, 0, bmp.bmHeight, bitmapData.data(), 
                   (BITMAPINFO*)&bi, DIB_RGB_COLORS)) {
        Logger::LogMessage("Failed to get DIB bits for CEF conversion");
        DeleteDC(hdcMem);
        ReleaseDC(NULL, hdc);
        DeleteObject(iconInfo.hbmColor);
        DeleteObject(iconInfo.hbmMask);
        return nullptr;
    }
    
    // Create CefImage from bitmap data
    CefRefPtr<CefImage> image = CefImage::CreateImage();
    if (!image->AddBitmap(1.0f, bmp.bmWidth, bmp.bmHeight, CEF_COLOR_TYPE_BGRA_8888, 
                         CEF_ALPHA_TYPE_PREMULTIPLIED, bitmapData.data(), bmp.bmWidth * 4)) {
        Logger::LogMessage("Failed to create CefImage from bitmap data");
        DeleteDC(hdcMem);
        ReleaseDC(NULL, hdc);
        DeleteObject(iconInfo.hbmColor);
        DeleteObject(iconInfo.hbmMask);
        return nullptr;
    }
    
    // Cleanup
    DeleteDC(hdcMem);
    ReleaseDC(NULL, hdc);
    DeleteObject(iconInfo.hbmColor);
    DeleteObject(iconInfo.hbmMask);
    
    return image;
}

// Handle SDL events
void HandleEvents() {
    SDL_Event event;
    while (SDL_PollEvent(&event)) {
        switch (event.type) {
            case SDL_EVENT_QUIT:
                g_running = false;
                break;
            case SDL_EVENT_WINDOW_CLOSE_REQUESTED:
                g_running = false;
                break;
            case SDL_EVENT_KEY_DOWN:
                // Handle special key combinations
                if (event.key.key == SDLK_F4 && (event.key.mod & SDL_KMOD_ALT)) {
                    g_running = false;
                }
                break;
        }
    }
}

// Use WinMain instead of main for Windows applications without console
int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    // Pre-load application icon to ensure it's available
    LoadApplicationIcon();
    
    // Set Application User Model ID early in the process
    SetApplicationUserModelID(NULL);
    
    // Initialize Crashpad crash reporting
    std::string crash_url("https://crashreport.mikofure.org/submit");
    
    // Determine handler path based on build configuration
    std::wstring handler_path;
#ifdef _DEBUG
    handler_path = L"build/Debug/crashpad_handler.exe";
#else
    handler_path = L"build/Release/crashpad_handler.exe";
#endif
    
    std::wstring db_path(L"./crashpad_db");
    
    InitializeCrashpad(crash_url, handler_path, db_path);
    
    void* sandbox_info = nullptr;
    CefMainArgs main_args(GetModuleHandle(nullptr));

    // Create app instance for both main and sub-processes
    CefRefPtr<SimpleApp> app(new SimpleApp);
    
    // CEF sub-process check
    int exit_code = CefExecuteProcess(main_args, app.get(), sandbox_info);
    if (exit_code >= 0) {
        return exit_code;
    }

    std::string windowTitle = AppConfig::IsDebugMode() ? 
        "SwipeIDE - Development Mode" : "SwipeIDE - Release Mode";

    // CEF settings with security enhancements
    CefSettings settings;
    settings.no_sandbox = false;  // Enable sandboxing for security
    settings.multi_threaded_message_loop = false;
    settings.windowless_rendering_enabled = false;
    settings.log_severity = LOGSEVERITY_DISABLE;  // Disable logging to reduce overhead
    settings.remote_debugging_port = -1;  // Disable remote debugging
    
    // Set absolute cache paths to avoid singleton warnings
    std::filesystem::path cache_dir = std::filesystem::current_path() / "cache";
    std::string cache_path = cache_dir.string();
    CefString(&settings.cache_path).FromASCII(cache_path.c_str());
    CefString(&settings.root_cache_path).FromASCII(cache_path.c_str());
    
    // Use empty subprocess path to let CEF handle it automatically
    CefString(&settings.browser_subprocess_path).FromASCII("");

    CefInitialize(main_args, settings, app.get(), sandbox_info);

    // Initialize crash reporting if enabled
    if (CefCrashReportingEnabled()) {
        // Set crash keys for debugging purposes
        CefSetCrashKeyValue("app_version", "1.0.0");
        CefSetCrashKeyValue("component", "main_process");
        CefSetCrashKeyValue("user_action", "startup");
        Logger::LogMessage("Crash reporting enabled");
    } else {
        Logger::LogMessage("Crash reporting disabled - check crash_reporter.cfg");
    }

    // Register scheme handler factory for miko:// protocol
    CefRegisterSchemeHandlerFactory("miko", "", new BinaryResourceProvider());

    // Create SDL3 borderless window
    g_sdl_window = CreateBorderlessWindow();
    if (!g_sdl_window) {
        Logger::LogMessage("Failed to create SDL window, exiting");
        CefShutdown();
        return -1;
    }

    // Create CEF client and browser
    g_client = new SimpleClient();
    std::string startupUrl = AppConfig::GetStartupUrl();
    
    // Get native window handle for CEF browser creation using SDL3 properties API
    SDL_PropertiesID props = SDL_GetWindowProperties(g_sdl_window);
    HWND hwnd = (HWND)SDL_GetPointerProperty(props, SDL_PROP_WINDOW_WIN32_HWND_POINTER, nullptr);
    
    if (!hwnd) {
        Logger::LogMessage("Failed to get native window handle from SDL3 properties");
        SDL_DestroyWindow(g_sdl_window);
        SDL_Quit();
        CefShutdown();
        return -1;
    }
    
    // Configure CEF browser settings
    CefBrowserSettings browser_settings;
    browser_settings.javascript_access_clipboard = STATE_DISABLED;
    browser_settings.javascript_dom_paste = STATE_DISABLED;
    browser_settings.local_storage = STATE_ENABLED;
    browser_settings.javascript_close_windows = STATE_DISABLED;

    // Create CEF window info for the browser
    CefWindowInfo window_info;
    RECT rect;
    GetClientRect(hwnd, &rect);
    CefRect cef_rect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
    window_info.SetAsChild(hwnd, cef_rect);
    
    // Create the browser
    g_browser = CefBrowserHost::CreateBrowserSync(window_info, g_client.get(), startupUrl, browser_settings, nullptr, nullptr);
    
    if (!g_browser) {
        Logger::LogMessage("Failed to create CEF browser");
        SDL_DestroyWindow(g_sdl_window);
        SDL_Quit();
        CefShutdown();
        return -1;
    }

    // Log startup information
    Logger::LogMessage("=== SwipeIDE SDL3 + CEF Application ===");
    Logger::LogMessage("Mode: " + std::string(AppConfig::IsDebugMode() ? "DEBUG" : "RELEASE"));
    Logger::LogMessage("URL: " + startupUrl);
    if (AppConfig::IsDebugMode()) {
        Logger::LogMessage("Remote debugging: http://localhost:9222");
        Logger::LogMessage("Make sure React dev server is running: cd renderer && bun run dev");
    }
    Logger::LogMessage("======================================");

    // Main loop
    while (g_running && g_sdl_window) {
        HandleEvents();
        CefDoMessageLoopWork();
        Sleep(1); // Small delay to prevent 100% CPU usage
    }

    // Cleanup
    if (g_browser) {
        g_browser->GetHost()->CloseBrowser(true);
        g_browser = nullptr;
    }
    
    if (g_sdl_window) {
        SDL_DestroyWindow(g_sdl_window);
        g_sdl_window = nullptr;
    }
    
    SDL_Quit();
    CefShutdown();

    return 0;
}