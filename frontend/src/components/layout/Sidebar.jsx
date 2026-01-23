import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileStack, Terminal, LogOut } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menu = [
    { path: '/admin/dashboard', icon: <LayoutDashboard size={20}/>, label: 'Dashboard' },
    { path: '/admin/users', icon: <Users size={20}/>, label: 'Users' },
    { path: '/admin/files', icon: <FileStack size={20}/>, label: 'Files' },
    { path: '/admin/logs', icon: <Terminal size={20}/>, label: 'Logs' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0">
      <div className="p-6 text-xl font-bold border-b border-slate-800 text-indigo-400">LogMaster Admin</div>
      <nav className="flex-1 p-4 space-y-2">
        {menu.map(item => (
          <NavLink key={item.path} to={item.path} className={({isActive}) => 
            `flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`
          }>
            {item.icon} {item.label}
          </NavLink>
        ))}
      </nav>
      <button onClick={handleLogout} className="p-6 border-t border-slate-800 flex items-center gap-3 text-red-400 hover:bg-slate-800">
        <LogOut size={20}/> Logout
      </button>
    </aside>
  );
}