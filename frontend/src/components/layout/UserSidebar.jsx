import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileUp, 
  History, 
  Settings, 
  LogOut, 
  Activity 
} from 'lucide-react';

const UserSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = [
    { path: '/user/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/user/my-files', icon: FileUp, label: 'My Uploads' },
    { path: '/user/my-logs', icon: Activity, label: 'View Logs' },
    { path: '/user/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0">
      {/* App Branding */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-indigo-500 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
          <Activity className="text-white" size={20} />
        </div>
        <span className="text-lg font-bold tracking-tight">Log<span className="text-indigo-400">Flow</span></span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon size={18} />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Area */}
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default UserSidebar;