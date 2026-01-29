import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  Trash2, Search, Calendar, Filter, 
  Loader2, RotateCcw, Terminal, SlidersHorizontal,
  ChevronLeft, ChevronRight // Added for pagination
} from 'lucide-react';

export default function LogManagement() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  // 🔥 Fixed keys to match Backend expectations
  const initialFilters = {
    search: '',
    start_date: '',
    end_date: '',
    severity_code: '',      
    environment_code: '',   
    category_name: '',      
    team_id: ''
  };

  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    fetchTeams();
    fetchLogs();
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [filters]); 

  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams');
      setTeams(res.data);
    } catch (err) { console.error("Could not fetch teams"); }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const cleanedParams = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== "")
      );

      const res = await api.get('/logs', { params: cleanedParams });
      setLogs(res.data?.items || []);
    } catch (err) { 
      console.error("API Error", err); 
      setLogs([]);
    }
    setLoading(false);
  };

  // Pagination Logic
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(logs.length / logsPerPage);

  const clearFilters = () => setFilters(initialFilters);

  const deleteLog = async (id) => {
    if (window.confirm("Delete this log entry permanently?")) {
      try {
        await api.delete(`/logs/${id}`);
        fetchLogs();
      } catch (err) { alert("Delete failed"); }
    }
  };

  const getSeverityColor = (code) => {
    switch (code) {
      case 'ERROR': return 'text-red-600 bg-red-50 border-red-100';
      case 'WARN': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'INFO': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'DEBUG': return 'text-slate-600 bg-slate-50 border-slate-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const inputClass = "bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-full";
  const labelClass = "text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block";

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen font-sans text-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-600 rounded-lg text-white"><Terminal size={24} /></div>
        <h1 className="text-2xl font-bold tracking-tight">Log Explorer</h1>
      </div>

      {/* --- FILTER BAR --- */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2">
            <label className={labelClass}>Keyword Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                placeholder="Search message content..."
                className={`${inputClass} pl-10`}
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Team</label>
            <select className={inputClass} value={filters.team_id} onChange={(e) => setFilters({...filters, team_id: e.target.value})}>
              <option value="">All Teams</option>
              {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Environment</label>
            <select className={inputClass} value={filters.environment_code} onChange={(e) => setFilters({...filters, environment_code: e.target.value})}>
              <option value="">All Environments</option>
              <option value="DEV">DEV</option>
              <option value="PROD">PROD</option>
              <option value="QA">QA</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end border-t pt-4 border-slate-50">
          <div>
            <label className={labelClass}>From Date</label>
            <input type="date" className={inputClass} value={filters.start_date} onChange={(e) => setFilters({...filters, start_date: e.target.value})} />
          </div>
          <div>
            <label className={labelClass}>To Date</label>
            <input type="date" className={inputClass} value={filters.end_date} onChange={(e) => setFilters({...filters, end_date: e.target.value})} />
          </div>
          <div>
            <label className={labelClass}>Severity</label>
            <select className={inputClass} value={filters.severity_code} onChange={(e) => setFilters({...filters, severity_code: e.target.value})}>
              <option value="">All Severities</option>
              <option value="ERROR">ERROR</option>
              <option value="WARN">WARN</option>
              <option value="INFO">INFO</option>
            </select>
          </div>
          <button onClick={clearFilters} className="flex items-center justify-center gap-2 h-[42px] font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 border border-indigo-200 transition-all">
            <RotateCcw size={16} /> Reset Filters
          </button>
        </div>
      </div>

      {/* --- LOGS TABLE --- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase font-bold">
              <tr>
                <th className="p-4 w-48 text-center">Timestamp</th>
                <th className="p-4 w-28 text-center">Level</th>
                <th className="p-4 w-32 text-center">Category</th>
                <th className="p-4 w-24 text-center">Env</th>
                <th className="p-4">Message</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px] font-mono">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-20"><Loader2 className="animate-spin mx-auto text-indigo-500" size={32} /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="6" className="py-20 text-center text-slate-400 italic font-sans text-lg">No matching logs found.</td></tr>
              ) : currentLogs.map(log => (
                <tr key={log.log_id} className="hover:bg-slate-50 transition align-top">
                  <td className="p-4 text-slate-400 whitespace-nowrap tabular-nums text-center">{new Date(log.log_timestamp).toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getSeverityColor(log.severity_code)}`}>
                      {log.severity_code}
                    </span>
                  </td>
                  <td className="p-4 text-indigo-600 font-semibold text-center">{log.category_name}</td>
                  <td className="p-4 text-slate-500 text-center">{log.environment_code}</td>
                  <td className="p-4 text-slate-700 break-all max-w-2xl">{log.message_line}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => deleteLog(log.log_id)} className="p-2 text-slate-300 hover:text-red-600 transition"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {logs.length > logsPerPage && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
            <div className="text-sm text-slate-500">
              Showing <span className="font-medium">{indexOfFirstLog + 1}</span> to <span className="font-medium">{Math.min(indexOfLastLog, logs.length)}</span> of <span className="font-medium">{logs.length}</span> entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded border bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 rounded border text-sm font-bold transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded border bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}