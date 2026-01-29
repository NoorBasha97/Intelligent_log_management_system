import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  Activity, FileText, AlertOctagon, Server, Clock, 
  ArrowUpRight, ShieldAlert, CalendarClock, 
  Calendar
} from 'lucide-react';

const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#64748b'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/dashboard/summary');
      setStats(res.data);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  // Format the last uploaded timestamp
  const lastUploadTime = stats?.last_file?.at 
    ? new Date(stats.last_file.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : "N/A";
  
  const lastUploadDate = stats?.last_file?.at 
    ? new Date(stats.last_file.at).toLocaleDateString()
    : "";

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen font-sans">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">System-wide log activity and performance analytics</p>
      </div>

      {/* --- STATCARDS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
        icon={<FileText size={20} className="text-blue-600" />} 
          title="Recent File" 
          value={stats?.last_file?.name || "No files"} 
          subText={`File ID: #${stats?.last_file?.id || '0'}`}
          
          color="bg-blue-100/50"
        />
        
        <StatCard 
          title="Last Upload Time" 
          value={lastUploadTime} 
          subText={lastUploadDate || "Waiting for data"}
          icon={<CalendarClock size={20} className="text-green-600" />} 
          color="bg-purple-100/50"
        />

        <StatCard 
  title="Files Uploaded Today"  // Updated Label
  value={stats?.files_uploaded_today ?? 0} // Matches Backend Key
  subText="New log sources"
  icon={<FileText size={20} className="text-indigo-600" />} 
  color="bg-indigo-100/50"
/>

        <StatCard 
          title="Security Logs" 
          value={stats?.security_logs_count || 0}
          subText="Total Security Events"
          icon={<ShieldAlert size={20} className="text-red-600" />} 
          color="bg-red-100/50"
        />
      </div>

      {/* --- LOWER SECTION: ACTIVE SYSTEMS & FEATURE CARD --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
        
        {/* Active Systems List */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
            <Server size={16} className="text-purple-500" /> Most Active Log Systems
          </h3>
          <div className="space-y-3">
            {stats?.active_systems?.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm font-bold text-indigo-600 text-sm border border-slate-100">
                    {i+1}
                  </span>
                  <span className="font-bold text-slate-700">{s.system}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-white rounded-lg text-sm font-bold text-slate-600 border border-slate-100">
                    {s.count.toLocaleString()} logs
                  </span>
                  <ArrowUpRight size={16} className="text-slate-300" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Card: Last Uploaded Detail */}
        <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden flex flex-col justify-between group">
            <div className="relative z-10">
                <div className="flex justify-between items-start">
                   <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md mb-6">
                      <FileText size={28} className="text-indigo-200" />
                   </div>
                   <span className="bg-green-400 text-indigo-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg">
                      Live Processing
                   </span>
                </div>
                <h3 className="text-indigo-100 font-medium text-sm mb-1 opacity-80 uppercase tracking-widest">Latest Data Stream</h3>
                <h2 className="text-3xl font-black mb-6 leading-tight">{stats?.last_file?.name || "System Idle"}</h2>
                
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                        <p className="text-indigo-200 text-[10px] uppercase font-bold tracking-widest">Size</p>
                        <p className="text-xl font-bold">{(stats?.last_file?.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-indigo-200 text-[10px] uppercase font-bold tracking-widest">System Status</p>
                        <p className="text-xl font-bold flex items-center gap-2">
                           Parsed <Clock size={16} />
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="mt-10 relative z-10 pt-6 border-t border-white/10 flex justify-between items-center text-xs text-indigo-100 font-medium">
                <span>Entry Timestamp:</span>
                <span className="bg-white/10 px-3 py-1 rounded-md">{new Date(stats?.last_file?.at).toLocaleString()}</span>
            </div>

            {/* Background decoration elements */}
            {/* <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-indigo-500 rounded-full opacity-30 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute -left-10 top-20 w-20 h-20 bg-indigo-400 rounded-full opacity-20 blur-2xl"></div> */}
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, subText, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-lg transition-shadow">
      <div className={`p-4 rounded-2xl ${color} flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-800 truncate leading-tight">{value}</h3>
        <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">{subText}</p>
      </div>
    </div>
  );
}