import type { SettingsSectionProps } from "../types";
import { useSettingsHandlers } from "../hooks";
import { RefreshCcw, Trash2, Download } from "lucide-react";

export function SystemSettings({ activeSection }: SettingsSectionProps) {
  const { handleRestartLauncher, handleCleanMemory, handleCheckUpdates } =
    useSettingsHandlers();

  if (activeSection !== "system") return null;

  return (
    <div className="space-y-8">
      {/* Title */}
      <h2 className="text-2xl font-bold text-white">System Settings</h2>

      {/* Toggles */}
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
          <div>
            <h3 className="text-white font-medium">Hardware Acceleration</h3>
            <p className="text-sm text-gray-400">
              Use GPU for better performance
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
            <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5"></div>
          </label>
        </div>

        <div className="flex items-center justify-between bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
          <div>
            <h3 className="text-white font-medium">Background Processing</h3>
            <p className="text-sm text-gray-400">
              Allow downloads when launcher is minimized
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
            <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5"></div>
          </label>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-800 pt-6">
        <h3 className="text-white font-medium mb-4">System Actions</h3>
        <div className="flex space-x-4">
          <button
            onClick={handleRestartLauncher}
            className="flex items-center justify-center gap-2 w-full bg-[#D9D9D9] hover:bg-[#000000] hover:text-white text-black py-2.5 px-4 rounded-lg transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
            Restart Launcher
          </button>

          <button
            onClick={handleCleanMemory}
            className="flex items-center justify-center gap-2 w-full bg-[#D9D9D9] hover:bg-[#000000] hover:text-white text-black py-2.5 px-4 rounded-lg transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Clean Memory Cache
          </button>

          <button
            onClick={handleCheckUpdates}
            className="flex items-center justify-center gap-2 w-full bg-[#D9D9D9] hover:bg-[#000000] hover:text-white text-black py-2.5 px-4 rounded-lg transition-all"
          >
            <Download className="w-4 h-4" />
            Check for Windows Updates
          </button>
        </div>
      </div>
    </div>
  );
}
