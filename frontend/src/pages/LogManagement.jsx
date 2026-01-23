import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  Trash2, Search, Calendar, Filter, 
  Loader2, RotateCcw, Terminal, SlidersHorizontal 
} from 'lucide-react';

export default function LogManagement() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);

  const initialFilters = {
    search: '',
    start_date: '',
    end_date: '',
    severity: '',
    environment: '',
    category: '',
    team_id: ''
  };

  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    fetchTeams();
    fetchLogs();
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
      const res = await api.get('/logs');
      console.log(res);
      setLogs(res.data?.items || []);
    } catch (err) { console.error("API Error", err); }
    setLoading(false);
  };

  const clearFilters = () => setFilters(initialFilters);

  const deleteLog = async (id) => {
    if (window.confirm("Delete this log entry permanently?")) {
      await api.delete(`/logs/${id}`);
      fetchLogs();
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

  const inputClass = "bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all w-full";
  const labelClass = "text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block";

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen font-sans">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Terminal className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Log Explorer</h1>
            <p className="text-sm text-slate-500">Search and analyze system-wide log entries</p>
          </div>
        </div>
      </div>

      {/* --- RESTRUCTURED FILTER BAR --- */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 text-slate-800 font-semibold mb-2">
          <SlidersHorizontal size={18} className="text-indigo-600" />
          <span>Filters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Row 1, Col 1-2: Search */}
          <div className="lg:col-span-2">
            <label className={labelClass}>Keyword Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                placeholder="Search message content, IDs, or services..."
                className={`${inputClass} pl-10`}
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
          </div>

          {/* Row 1, Col 3: Team */}
          <div>
            <label className={labelClass}>Owning Team</label>
            <select className={inputClass} value={filters.team_id} onChange={(e) => setFilters({...filters, team_id: e.target.value})}>
              <option value="">All Teams</option>
              {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
            </select>
          </div>

          {/* Row 1, Col 4: Env */}
          <div>
            <label className={labelClass}>Environment</label>
            <select className={inputClass} value={filters.environment} onChange={(e) => setFilters({...filters, environment: e.target.value})}>
              <option value="">All Environments</option>
              <option value="DEV">Development (DEV)</option>
              <option value="PROD">Production (PROD)</option>
              <option value="STAGING">Staging (STAGING)</option>
              <option value="QA">Quality Assurance (QA)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
          {/* Row 2, Col 1: From Date */}
          <div>
            <label className={labelClass}>From Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="date"
                className={`${inputClass} pl-10`}
                value={filters.start_date}
                onChange={(e) => setFilters({...filters, start_date: e.target.value})}
              />
            </div>
          </div>

          {/* Row 2, Col 2: To Date */}
          <div>
            <label className={labelClass}>To Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="date"
                className={`${inputClass} pl-10`}
                value={filters.end_date}
                onChange={(e) => setFilters({...filters, end_date: e.target.value})}
              />
            </div>
          </div>

          {/* Row 2, Col 3: Severity */}
          <div>
            <label className={labelClass}>Severity Level</label>
            <select className={inputClass} value={filters.severity} onChange={(e) => setFilters({...filters, severity: e.target.value})}>
              <option value="">All Severities</option>
              <option value="ERROR"> ERROR</option>
              <option value="WARN"> WARNING</option>
              <option value="INFO"> INFO</option>
              <option value="DEBUG"> DEBUG</option>
            </select>
          </div>

          {/* Row 2, Col 4: Action Button */}
          <div className="flex items-end">
            <button 
              onClick={clearFilters} 
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors shadow-sm"
            >
              <RotateCcw size={18} /> 
              Clear All Filters
            </button>
          </div>
        </div>
      </div>

      {/* --- LOGS TABLE --- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
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
                <tr>
                  <td colSpan="6" className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                       {/* <Filter className="text-slate-200" size={64} /> */}
                       <h1 className="text-xl font-bold text-slate-400">No matching logs found</h1>
                       {/* <p className="text-slate-400 text-sm max-w-xs mx-auto">Try broadening your search or adjusting your date range parameters.</p> */}
                    </div>
                  </td>
                </tr>
              ) : logs.map(log => (
                <tr key={log.log_id} className="hover:bg-slate-50/50 transition align-top">
                  <td className="p-4 text-slate-500 whitespace-nowrap text-center">{new Date(log.log_timestamp).toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getSeverityColor(log.severity_code)}`}>
                      {log.severity_code}
                    </span>
                  </td>
                  <td className="p-4 text-indigo-600 font-semibold text-center">{log.category_name}</td>
                  <td className="p-4 text-slate-500 text-center">{log.environment_code}</td>
                  <td className="p-4 text-slate-700 break-all max-w-2xl">{log.message_line}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => deleteLog(log.log_id)} 
                      className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}