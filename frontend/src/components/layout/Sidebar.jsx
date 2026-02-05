import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileStack, 
  Terminal, 
  LogOut, 
  History as HistoryIcon, 
  ShieldCheck
} from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menu = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/files', icon: FileStack, label: 'Files' },
    { path: '/admin/logs', icon: Terminal, label: 'Logs' },
    { path: '/admin/login-audits', icon: ShieldCheck, label: 'Login Audits' },
    { path: '/admin/audit', icon: HistoryIcon, label: 'Audit Trails' }, // 🔥 Use the renamed icon
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 shadow-2xl">
      {/* Brand Logo */}
      <div className="p-6 text-xl font-black border-b border-slate-800 text-indigo-300 tracking-wider uppercase">
        Admin Pannel
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menu.map(item => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({isActive}) => 
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 scale-[1.02]' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {/* item.icon is a component reference, so we render it like this */}
            <item.icon size={20} className="group-hover:scale-120 transition-transform" /> 
            <span className="text-sm font-semibold tracking-wide">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <button 
          onClick={handleLogout} 
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> 
          <span className="font-bold text-sm">Logout Session</span>
        </button>
      </div>
    </aside>
  );
}