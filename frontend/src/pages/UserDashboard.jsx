import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  Activity, ShieldAlert, AlertTriangle, FileText, 
  Clock, CheckCircle, ArrowUpRight, Loader2, HardDrive 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function UserDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/dashboard/user-summary');
      setData(res.data);
    } catch (err) {
      console.error("Dashboard error", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  // Data for the mini pie chart
  const chartData = [
    { name: 'Errors', value: data?.personal_stats.errors, color: '#ef4444' },
    { name: 'Warnings', value: data?.personal_stats.warnings, color: '#f59e0b' },
    { name: 'Info', value: data?.personal_stats.info, color: '#3b82f6' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">My Activity Overview</h1></div>

      {/* --- STAT CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <UserStatCard 
          label="My Total Logs" 
          value={data?.personal_stats.total_logs} 
          icon={<Activity className="text-indigo-600" />} 
          trend="Logs"
        />
        <UserStatCard 
          label="Security Events" 
          value={data?.personal_stats.security_logs} 
          icon={<ShieldAlert className="text-red-600" />} 
          trend="Security"
        />
        <UserStatCard 
          label="Error Count" 
          value={data?.personal_stats.errors} 
          icon={<AlertTriangle className="text-amber-600" />} 
          trend="Action required"
        />
        <UserStatCard 
          label="Recent File ID" 
          value={data?.recent_file ? `#${data.recent_file.id}` : "N/A"} 
          icon={<FileText className="text-blue-600" />} 
          trend="Last processed"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- RECENT FILE DETAIL --- */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                 <HardDrive size={28} />
              </div>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                System Verified
              </span>
            </div>
            
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Most Recent Contribution</h3>
            <h2 className="text-4xl font-black text-slate-800 mb-6 truncate">{data?.recent_file?.name || "No files uploaded"}</h2>
            
            <div className="grid grid-cols-2 gap-10">
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Upload Timestamp</p>
                <p className="font-bold text-slate-700">
                  {data?.recent_file ? new Date(data.recent_file.timestamp).toLocaleString() : "Never"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">File Size</p>
                <p className="font-bold text-slate-700">{data?.recent_file?.size_kb} KB</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- SEVERITY SUMMARY --- */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
          <h3 className="text-slate-800 font-bold flex items-center gap-2">
            <Clock size={18} className="text-indigo-500" /> Severity Summary
          </h3>
          
          <div className="h-48 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} innerRadius={50} outerRadius={70} paddingAngle={8} dataKey="value">
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">No data to display</div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Info Logs</span>
              <span className="font-bold">{data?.personal_stats.info}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Warning Logs</span>
              <span className="font-bold">{data?.personal_stats.warnings}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-slate-500 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Error Logs</span>
              <span className="font-bold text-red-600">{data?.personal_stats.errors}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserStatCard({ label, value, icon, trend }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">
          {trend}
        </span>
      </div>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
      <h3 className="text-2xl font-black text-slate-800">{value ?? 0}</h3>
    </div>
  );
}