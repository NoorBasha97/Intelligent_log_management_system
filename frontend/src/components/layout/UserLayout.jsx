import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import UserSidebar from './UserSidebar'; // We'll create this below
import { Bell, UserCircle, LayoutGrid } from 'lucide-react';

const UserLayout = () => {
  const location = useLocation();
  const currentPage = location.pathname.split('/').pop() || 'Dashboard';

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar - Restricted to User actions */}
      <UserSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navigation Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4 text-slate-400">
             {/* Context Breadcrumb */}
             <div className="p-1.5 bg-indigo-50 rounded-md">
                <LayoutGrid size={16} className="text-indigo-600" />
             </div>
             <span className="text-sm font-medium text-slate-400">User</span>
             <span className="text-slate-300">/</span>
             <span className="text-sm font-semibold text-slate-700 capitalize">
                {currentPage}
             </span>
          </div>

          <div className="flex items-center gap-5">
          
            <div className="h-8 w-[1px] bg-slate-200"></div>
            
            {/* User Info */}
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-700 leading-none">User Member</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-medium">Standard Access</p>
              </div>
              <div className="bg-indigo-100 p-1 rounded-full border border-indigo-200">
                <UserCircle className="text-indigo-600 h-7 w-7" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div> 
  );
};

export default UserLayout;