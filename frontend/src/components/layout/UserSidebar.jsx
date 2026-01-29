import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileUp, 
  Terminal, 
  UserCircle, 
  LogOut, 
  Activity 
} from 'lucide-react';
import { ShieldCheck, History } from 'lucide-react';

const UserSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // CHANGE: Pass the component reference (LayoutDashboard), not the element (<LayoutDashboard />)
  const menuItems = [
  { path: '/user/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/user/my-logs', icon: FileUp, label: 'My Logs' },
  { path: '/user/view-logs', icon: Terminal, label: 'View Logs' }, // Ensure this is 'view-logs'
  { path: '/user/security', icon: ShieldCheck, label: 'Security' }, 
  { path: '/user/profile', icon: UserCircle, label: 'My Profile' },
];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 shadow-xl">
      {/* App Branding */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-indigo-500 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
          <Activity className="text-white" size={20} />
        </div>
        <span className="text-lg font-bold tracking-tight uppercase">
          User Dashboard<span className="text-indigo-400"> </span>
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50 scale-[1.02]' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {/* This now works because item.icon is a component function */}
            <item.icon size={19} /> 
            <span className="text-sm font-semibold tracking-wide">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Area */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-50/10 hover:text-red-300 rounded-xl transition-all group font-semibold text-sm"
        >
          <LogOut size={18} className="group-hover:-translate-x-2 transition-transform" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default UserSidebar;