cmake_minimum_required(VERSION 3.19)
project(MikoLauncher)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Set runtime library to dynamic for all targets and disable warnings as errors for MSVC
if(MSVC)
    # Set runtime library to static for all targets to avoid conflicts
    set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
    
    # Remove /WX flag if present and add /W3 for reasonable warning level
    string(REPLACE "/WX" "" CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS}")
    string(REPLACE "/WX" "" CMAKE_C_FLAGS "${CMAKE_C_FLAGS}")
    string(REPLACE "/WX" "" CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG}")
    string(REPLACE "/WX" "" CMAKE_C_FLAGS_DEBUG "${CMAKE_C_FLAGS_DEBUG}")
    string(REPLACE "/WX" "" CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE}")
    string(REPLACE "/WX" "" CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS_RELEASE}")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /W3")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} /W3")
    
    # Explicitly disable warnings as errors
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /WX-")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} /WX-")
endif()

# Include FetchContent for downloading dependencies
include(FetchContent)

# Download and build SDL3
FetchContent_Declare(
    SDL3
    GIT_REPOSITORY https://github.com/libsdl-org/SDL.git
    GIT_TAG main
    GIT_SHALLOW TRUE
)

# Download RapidJSON
FetchContent_Declare(
    rapidjson
    GIT_REPOSITORY https://github.com/Tencent/rapidjson.git
    GIT_TAG v1.1.0
    GIT_SHALLOW TRUE
)

# Fetch cpp-httplib
FetchContent_Declare(
  httplib
  GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
  GIT_TAG v0.15.3
)

# Configure cpp-httplib options
set(HTTPLIB_COMPILE OFF CACHE BOOL "Use header-only httplib")
set(HTTPLIB_REQUIRE_OPENSSL OFF CACHE BOOL "Disable OpenSSL requirement")
set(HTTPLIB_REQUIRE_ZLIB OFF CACHE BOOL "Disable zlib requirement")
set(HTTPLIB_REQUIRE_BROTLI OFF CACHE BOOL "Disable brotli requirement")

# et(SDL_TEST OFF CACHE BOOL "Build SDL3 test programs")

# Configure RapidJSON options
set(RAPIDJSON_BUILD_DOC OFF CACHE BOOL "Build rapidjson documentation")
set(RAPIDJSON_BUILD_EXAMPLES OFF CACHE BOOL "Build rapidjson examples")
set(RAPIDJSON_BUILD_TESTS OFF CACHE BOOL "Build rapidjson tests")

FetchContent_MakeAvailable(SDL3)
FetchContent_MakeAvailable(rapidjson)
FetchContent_MakeAvailable(httplib)

# Add Crashpad subdirectory with warning suppression
if(MSVC)
    # Temporarily disable specific warnings for Crashpad compilation
    set(CMAKE_CXX_FLAGS_BACKUP "${CMAKE_CXX_FLAGS}")
    set(CMAKE_C_FLAGS_BACKUP "${CMAKE_C_FLAGS}")
    
    # Disable specific warnings that cause issues in Crashpad
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /wd4244 /wd4267 /wd4996 /wd4005 /wd4018")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} /wd4244 /wd4267 /wd4996 /wd4005 /wd4018")
endif()

add_subdirectory(helper/crashpad)

if(MSVC)
    # Restore original flags after Crashpad
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS_BACKUP}")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS_BACKUP}")
endif()

# Configure Crashpad handler output directory
if(TARGET handler)
    set_target_properties(handler PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/$<CONFIG>"
        OUTPUT_NAME "crashpad_handler"
    )
endif()

if(TARGET handler_console)
    set_target_properties(handler_console PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/$<CONFIG>"
        OUTPUT_NAME "crashpad_handler_console"
    )
endif()

# Set CEF version and platform
set(CEF_VERSION "138.0.27+g0b28f18+chromium-138.0.7204.158")
if(WIN32)
    if(CMAKE_SIZEOF_VOID_P EQUAL 8)
        set(CEF_PLATFORM "windows64")
    else()
        set(CEF_PLATFORM "windows32")
    endif()
elseif(APPLE)
    set(CEF_PLATFORM "macosx64")
else()
    if(CMAKE_SIZEOF_VOID_P EQUAL 8)
        set(CEF_PLATFORM "linux64")
    else()
        set(CEF_PLATFORM "linux32")
    endif()
endif()

# CEF download URL and paths
set(CEF_DOWNLOAD_URL "https://cef-builds.spotifycdn.com/cef_binary_${CEF_VERSION}_${CEF_PLATFORM}.tar.bz2")
set(CEF_ROOT "${CMAKE_BINARY_DIR}/cef")
set(CEF_ARCHIVE "${CMAKE_BINARY_DIR}/cef_binary.tar.bz2")
set(CEF_EXTRACTED_DIR "${CMAKE_BINARY_DIR}/cef_binary_${CEF_VERSION}_${CEF_PLATFORM}")

# Function to download and extract CEF
function(download_cef)
    if(NOT EXISTS "${CEF_ROOT}")
        message(STATUS "Downloading CEF from ${CEF_DOWNLOAD_URL}")
        
        # Download CEF
        file(DOWNLOAD "${CEF_DOWNLOAD_URL}" "${CEF_ARCHIVE}"
             SHOW_PROGRESS
             STATUS download_status
             LOG download_log)
        
        list(GET download_status 0 status_code)
        if(NOT status_code EQUAL 0)
            message(FATAL_ERROR "Failed to download CEF: ${download_log}")
        endif()
        
        # Extract CEF
        message(STATUS "Extracting CEF...")
        execute_process(
            COMMAND ${CMAKE_COMMAND} -E tar xjf "${CEF_ARCHIVE}"
            WORKING_DIRECTORY "${CMAKE_BINARY_DIR}"
            RESULT_VARIABLE extract_result
        )
        
        if(NOT extract_result EQUAL 0)
            message(FATAL_ERROR "Failed to extract CEF archive")
        endif()
        
        # Remove existing CEF directory if it exists
        if(EXISTS "${CEF_ROOT}")
            file(REMOVE_RECURSE "${CEF_ROOT}")
        endif()
        
        # Move extracted directory to CEF_ROOT using execute_process
        if(WIN32)
            execute_process(
                COMMAND ${CMAKE_COMMAND} -E rename "${CEF_EXTRACTED_DIR}" "${CEF_ROOT}"
                RESULT_VARIABLE rename_result
            )
            if(NOT rename_result EQUAL 0)
                # Fallback: copy and remove
                execute_process(
                    COMMAND ${CMAKE_COMMAND} -E copy_directory "${CEF_EXTRACTED_DIR}" "${CEF_ROOT}"
                    RESULT_VARIABLE copy_result
                )
                if(copy_result EQUAL 0)
                    file(REMOVE_RECURSE "${CEF_EXTRACTED_DIR}")
                else()
                    message(FATAL_ERROR "Failed to move CEF directory")
                endif()
            endif()
        else()
            file(RENAME "${CEF_EXTRACTED_DIR}" "${CEF_ROOT}")
        endif()
        
        # Clean up archive
        file(REMOVE "${CEF_ARCHIVE}")
        
        message(STATUS "CEF downloaded and extracted successfully")
    else()
        message(STATUS "CEF already exists at ${CEF_ROOT}")
    endif()
endfunction()

# Download CEF
download_cef()

# Set CEF_ROOT for find_package
set(CEF_ROOT "${CEF_ROOT}")

# Add CEF cmake modules to path
list(APPEND CMAKE_MODULE_PATH "${CEF_ROOT}/cmake")

# Find CEF
find_package(CEF REQUIRED)

# Determine the target output directory based on platform and generator
if(CMAKE_CONFIGURATION_TYPES)
    # Multi-config generators (Visual Studio, Xcode)
    set(CEF_TARGET_OUT_DIR "${CMAKE_CURRENT_BINARY_DIR}/$<CONFIGURATION>")
else()
    # Single-config generators (Ninja, Make)
    set(CEF_TARGET_OUT_DIR "${CMAKE_CURRENT_BINARY_DIR}/${CMAKE_BUILD_TYPE}")
    set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CEF_TARGET_OUT_DIR})
    set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CEF_TARGET_OUT_DIR})
endif()

# Create logical targets for CEF libraries
if(OS_WINDOWS)
    # Create libcef_lib target
    add_library(libcef_lib SHARED IMPORTED)
    set_target_properties(libcef_lib PROPERTIES
        IMPORTED_LOCATION "${CEF_ROOT}/Release/libcef.dll"
        IMPORTED_LOCATION_DEBUG "${CEF_ROOT}/Debug/libcef.dll"
        IMPORTED_LOCATION_RELEASE "${CEF_ROOT}/Release/libcef.dll"
        IMPORTED_IMPLIB "${CEF_ROOT}/Release/libcef.lib"
        IMPORTED_IMPLIB_DEBUG "${CEF_ROOT}/Debug/libcef.lib"
        IMPORTED_IMPLIB_RELEASE "${CEF_ROOT}/Release/libcef.lib"
    )
    
    # Create libcef_dll_wrapper target
    add_subdirectory("${CEF_ROOT}/libcef_dll" libcef_dll_wrapper)
endif()

# Add executable as Windows application (no console)
add_executable(${PROJECT_NAME} WIN32
    app/main.cpp
    app/global/logger.cpp
    app/cefview/client.cpp
    app/cefview/app.cpp
    app/resources/webapp.cpp
    app/resources/binaryresourceprovider.cpp
    app/resources/resourceutil.cpp
    app/internal/ipc.cpp
    app/internal/gamemanager.cpp
    app/internal/downloadmanager.cpp
    app/internal/fs.cpp
)

# Set target properties to disable warnings as errors specifically for this target
if(MSVC)
    target_compile_options(${PROJECT_NAME} PRIVATE 
        /WX-  # Disable warnings as errors
        /wd4005  # Disable macro redefinition warnings
        /wd4244  # Disable conversion warnings
        /wd4267  # Disable size_t conversion warnings
        /wd4996  # Disable deprecated function warnings
    )
endif()

# Add Windows resource file
if(WIN32)
    target_sources(${PROJECT_NAME} PRIVATE shared/windows/assets/app.rc)
endif()

# Set target properties using CEF macros
SET_EXECUTABLE_TARGET_PROPERTIES(${PROJECT_NAME})

# Link SDL3, httplib, CEF and Crashpad libraries
target_link_libraries(${PROJECT_NAME} PRIVATE
    SDL3::SDL3
    SDL3::SDL3-shared
    httplib::httplib
    libcef_lib
    libcef_dll_wrapper
    ${CEF_STANDARD_LIBS}
    client
    util
    # Windows system libraries needed for Crashpad
    advapi32
    kernel32
    rpcrt4
    version
    wininet
    ws2_32
    dbghelp
    powrprof
    setupapi
    wtsapi32
    userenv
    netapi32
    psapi
    iphlpapi
    comctl32
    comdlg32
    gdi32
    ole32
    oleaut32
    shell32
    shlwapi
    user32
    uuid
    winspool
    winmm
    crypt32
    secur32
    bcrypt
    ntdll
)

# Handle multiply defined symbols more selectively
if(MSVC)
    target_link_options(${PROJECT_NAME} PRIVATE
        /IGNORE:4006  # Ignore multiply defined symbols warning
        /IGNORE:4088  # Ignore image being created due to /FORCE option
    )
endif()

# Include directories
target_include_directories(${PROJECT_NAME} PRIVATE
    ${CEF_ROOT}
    ${rapidjson_SOURCE_DIR}/include
    helper/crashpad
)

# Copy CEF binaries and resources to output directory
if(OS_WINDOWS)
    # Copy CEF binary files
    COPY_FILES("${PROJECT_NAME}" "${CEF_BINARY_FILES}" "${CEF_BINARY_DIR}" "${CEF_TARGET_OUT_DIR}")
    
    # Copy CEF resource files
    COPY_FILES("${PROJECT_NAME}" "${CEF_RESOURCE_FILES}" "${CEF_RESOURCE_DIR}" "${CEF_TARGET_OUT_DIR}")
    
    # Copy SDL3 DLL to output directory
    add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
        $<TARGET_FILE:SDL3::SDL3-shared>
        $<TARGET_FILE_DIR:${PROJECT_NAME}>
        COMMENT "Copying SDL3 DLL to output directory"
    )
endif()

# Set startup project for Visual Studio
if(WIN32)
    set_property(DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR} PROPERTY VS_STARTUP_PROJECT ${PROJECT_NAME})
endif()

# Print CEF configuration
PRINT_CEF_CONFIG()