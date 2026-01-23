import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Search, UserCircle } from 'lucide-react';

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar - Fixed on the left */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navigation Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4 text-slate-400">
             {/* Dynamic Breadcrumb (Optional) */}
             <span className="text-sm font-medium text-slate-400">Admin</span>
             <span className="text-slate-300">/</span>
             <span className="text-sm font-semibold text-slate-700 capitalize">
                {window.location.pathname.split('/').pop()}
             </span>
          </div>

          <div className="flex items-center gap-5">
            <button className="text-slate-400 hover:text-indigo-600 transition-colors">
              <Bell size={20} />
            </button>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-700 leading-none">Admin User</p>
                <p className="text-[10px] text-slate-400 mt-1">Super Admin</p>
              </div>
              <UserCircle className="text-slate-300 h-8 w-8" />
            </div>
          </div>
        </header>

        {/* Page Content - Injected via Outlet */}
        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div> 
  );
};

export default AdminLayout;