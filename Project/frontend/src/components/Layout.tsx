import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { hasRole } from '../utils/helpers';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['ADMIN', 'INFRASTRUCTURE_ENGINEER', 'AUDITOR', 'READ_ONLY'] },
  { path: '/upload', label: 'Upload Files', icon: '📁', roles: ['ADMIN', 'INFRASTRUCTURE_ENGINEER'] },
  { path: '/reconciliation', label: 'Reconciliation', icon: '🔍', roles: ['ADMIN', 'INFRASTRUCTURE_ENGINEER', 'AUDITOR', 'READ_ONLY'] },
  { path: '/reports', label: 'Reports', icon: '📋', roles: ['ADMIN', 'INFRASTRUCTURE_ENGINEER', 'AUDITOR'] },
  { path: '/chatbot', label: 'AI Chatbot', icon: '🤖', roles: ['ADMIN', 'INFRASTRUCTURE_ENGINEER', 'AUDITOR'] },
  { path: '/users', label: 'User Management', icon: '👥', roles: ['ADMIN'] },
  { path: '/audit', label: 'Audit Logs', icon: '📝', roles: ['ADMIN'] },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter((item) =>
    user ? hasRole(user.role, item.roles) : false
  );

  return (
    <div className="flex h-screen bg-[#f0f2f5]">
      {/* Sidebar */}
      <motion.aside
        className="bg-primary text-white flex flex-col shadow-xl z-20"
        animate={{ width: sidebarCollapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Logo area */}
        <div className="p-4 border-b border-primary-400/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center font-bold text-lg flex-shrink-0">
              IR
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <h1 className="font-bold text-sm leading-tight">Inventory</h1>
                  <p className="text-[10px] text-primary-200">Reconciliation System</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {filteredNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 my-0.5 rounded-lg transition-all duration-200 text-sm ${
                  isActive
                    ? 'bg-white/20 text-white font-semibold shadow-sm'
                    : 'text-primary-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="text-lg flex-shrink-0 w-6 text-center">{item.icon}</span>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle + User */}
        <div className="border-t border-primary-400/30 p-3">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center py-2 rounded-lg hover:bg-white/10 transition-colors text-primary-200 mb-2"
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
          <AnimatePresence>
            {!sidebarCollapsed && user && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-1"
              >
                <div className="text-xs text-primary-200 truncate">{user.full_name}</div>
                <div className="text-[10px] text-primary-300 truncate">{user.role.replace('_', ' ')}</div>
                <button
                  onClick={handleLogout}
                  className="mt-2 w-full text-xs py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {sidebarCollapsed && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
              title="Sign Out"
            >
              🚪
            </button>
          )}
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-100 px-6 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">
              AI-Powered Inventory Reconciliation
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                {user?.full_name}
              </span>
              <span className="badge text-primary bg-primary-50 border-primary-200">
                {user?.role.replace('_', ' ')}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
