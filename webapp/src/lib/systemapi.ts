// System API for interfacing with system dialogs and native functionality
// This uses CefQuery to communicate directly with C++ backend

export interface ShowFolderDialogResponse {
  success: boolean;
  path?: string;
  cancelled?: boolean;
  error?: string;
}

export interface DriveInfo {
  letter: string;
  label: string;
  type: string;
  totalSpace: number;
  freeSpace: number;
  usedSpace: number;
}

export interface GetDriveLettersResponse {
  success: boolean;
  drives?: DriveInfo[];
  error?: string;
}

declare global {
  interface Window {
    cefQuery: (options: {
      request: string;
      onSuccess: (response: string) => void;
      onFailure: (error_code: number, error_message: string) => void;
    }) => void;
  }
}

export class SystemAPI {
  /**
   * Show a folder selection dialog using CefQuery
   */
  static async showFolderDialog(): Promise<ShowFolderDialogResponse> {
    return new Promise((resolve) => {
      if (!window.cefQuery) {
        resolve({
          success: false,
          error: 'CEF not available'
        });
        return;
      }

      window.cefQuery({
        request: 'ipc_call:showFolderDialog:',
        onSuccess: (response: string) => {
          try {
            const result = JSON.parse(response) as ShowFolderDialogResponse;
            resolve(result);
          } catch (error) {
            resolve({
              success: false,
              error: 'Failed to parse response'
            });
          }
        },
        onFailure: (error_code: number, error_message: string) => {
          resolve({
            success: false,
            error: `CEF Error ${error_code}: ${error_message}`
          });
        }
      });
    });
  }

  /**
   * Get available drive letters with their information
   */
  static async getDriveLetters(): Promise<GetDriveLettersResponse> {
    return new Promise((resolve) => {
      if (!window.cefQuery) {
        resolve({
          success: false,
          error: 'CEF not available'
        });
        return;
      }

      window.cefQuery({
        request: 'ipc_call:getDriveLetters:',
        onSuccess: (response: string) => {
          try {
            const result = JSON.parse(response) as GetDriveLettersResponse;
            resolve(result);
          } catch (error) {
            resolve({
              success: false,
              error: 'Failed to parse response'
            });
          }
        },
        onFailure: (error_code: number, error_message: string) => {
          resolve({
            success: false,
            error: `CEF Error ${error_code}: ${error_message}`
          });
        }
      });
    });
  }
}