import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Database, Activity, Settings } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import clsx from 'clsx';

export default function Layout() {
  const { isConnected } = useWebSocket();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Bank Sentinel</h1>
                <p className="text-sm text-slate-400">Multi-Agent Control Panel</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={clsx(
                'w-3 h-3 rounded-full',
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              )} />
              <span className="text-sm text-slate-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-6">
          <div className="flex space-x-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                clsx(
                  'flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors border-b-2',
                  isActive
                    ? 'text-primary-400 border-primary-400 bg-slate-900/50'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-700/50'
                )
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/posts"
              className={({ isActive }) =>
                clsx(
                  'flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors border-b-2',
                  isActive
                    ? 'text-primary-400 border-primary-400 bg-slate-900/50'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-700/50'
                )
              }
            >
              <FileText className="w-4 h-4" />
              <span>PR Posts</span>
            </NavLink>

            <NavLink
              to="/database"
              className={({ isActive }) =>
                clsx(
                  'flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors border-b-2',
                  isActive
                    ? 'text-primary-400 border-primary-400 bg-slate-900/50'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-700/50'
                )
              }
            >
              <Database className="w-4 h-4" />
              <span>Database</span>
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                clsx(
                  'flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors border-b-2',
                  isActive
                    ? 'text-primary-400 border-primary-400 bg-slate-900/50'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-700/50'
                )
              }
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
