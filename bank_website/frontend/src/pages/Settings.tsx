import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RotateCcw } from 'lucide-react';

interface AppSettings {
  approvalCountdown: number;
  autoRefresh: boolean;
  refreshInterval: number;
  darkMode: boolean;
  notificationsEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  approvalCountdown: 5,
  autoRefresh: true,
  refreshInterval: 5000,
  darkMode: true,
  notificationsEnabled: true,
};

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('bankSentinelSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('bankSentinelSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Reset all settings to defaults?')) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.removeItem('bankSentinelSettings');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white flex items-center space-x-3">
          <SettingsIcon className="w-8 h-8" />
          <span>Settings</span>
        </h2>
        <p className="text-slate-400 mt-1">Configure your Bank Sentinel preferences</p>
      </div>

      {/* Save Confirmation */}
      {saved && (
        <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
          <p className="text-green-300">✓ Settings saved successfully!</p>
        </div>
      )}

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* General Settings */}
        <Section title="General Settings">
          <SettingRow
            label="Approval Countdown"
            description="Time (in seconds) before auto-posting an approved post"
          >
            <select
              value={settings.approvalCountdown}
              onChange={(e) =>
                setSettings({ ...settings, approvalCountdown: Number(e.target.value) })
              }
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={0}>Immediate (no countdown)</option>
              <option value={3}>3 seconds</option>
              <option value={5}>5 seconds</option>
              <option value={10}>10 seconds</option>
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
            </select>
          </SettingRow>

          <SettingRow
            label="Dark Mode"
            description="Use dark theme (currently always enabled)"
          >
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={(e) =>
                  setSettings({ ...settings, darkMode: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </SettingRow>
        </Section>

        {/* Workflow Settings */}
        <Section title="Workflow Settings">
          <SettingRow
            label="Auto-Refresh Workflows"
            description="Automatically refresh the workflow list"
          >
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoRefresh}
                onChange={(e) =>
                  setSettings({ ...settings, autoRefresh: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </SettingRow>

          {settings.autoRefresh && (
            <SettingRow
              label="Refresh Interval"
              description="How often to refresh workflow data"
            >
              <select
                value={settings.refreshInterval}
                onChange={(e) =>
                  setSettings({ ...settings, refreshInterval: Number(e.target.value) })
                }
                className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={2000}>2 seconds</option>
                <option value={5000}>5 seconds</option>
                <option value={10000}>10 seconds</option>
                <option value={30000}>30 seconds</option>
                <option value={60000}>1 minute</option>
              </select>
            </SettingRow>
          )}
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <SettingRow
            label="Browser Notifications"
            description="Show desktop notifications for new workflows (requires permission)"
          >
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  if (enabled && 'Notification' in window && Notification.permission === 'default') {
                    Notification.requestPermission();
                  }
                  setSettings({ ...settings, notificationsEnabled: enabled });
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </SettingRow>
        </Section>

        {/* System Info */}
        <Section title="System Information">
          <div className="bg-slate-900/50 rounded-lg p-4 space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Version:</span>
              <span className="text-slate-200">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Backend API:</span>
              <span className="text-slate-200">http://localhost:8000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">WebSocket:</span>
              <span className="text-slate-200">ws://localhost:8000/api/ws</span>
            </div>
          </div>
        </Section>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-4 pt-4 border-t border-slate-700">
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-semibold"
        >
          <Save className="w-5 h-5" />
          <span>Save Settings</span>
        </button>
        <button
          onClick={handleReset}
          className="flex items-center space-x-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Reset to Defaults</span>
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <div className="bg-slate-900/50 px-6 py-3 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="p-6 space-y-6">{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="font-medium text-slate-200">{label}</div>
        <div className="text-sm text-slate-400 mt-1">{description}</div>
      </div>
      <div className="ml-6">{children}</div>
    </div>
  );
}
