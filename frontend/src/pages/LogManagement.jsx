import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  Trash2, Search, Calendar, Filter,
  Loader2, RotateCcw, Terminal, SlidersHorizontal,
  ChevronLeft, ChevronRight
} from 'lucide-react';

export default function LogManagement() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [totalLogsCount, setTotalLogsCount] = useState(0);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 8;

  //  Fixed keys to match Backend expectations
  const initialFilters = {
    search: '',
    start_date: '',
    end_date: '',
    severity_code: '',
    team_id: ''
  };

  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    fetchTeams();
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [filters]);

  // this is for the purprose of sever-side pagination
  useEffect(() => {
    fetchLogs();
  }, [filters,currentPage]);


  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams');
      setTeams(res.data);
    } catch (err) { console.error("Could not fetch teams"); }
  };



  //we need to send the limit and offset(based on the current page) to the backend to fetch the logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Define the limit and calculate the offset
      const limit = 10; 
      const offset = (currentPage - 1) * limit;

      //Prepare the parameters object
      const queryParams = {
        ...filters,
        limit: limit,   // this will tell backend how many rows to send
        offset: offset  // this will tell backend how many rows to skip
      };

      //Clean parameters (Remove empty strings)
      const cleanedParams = Object.fromEntries(
        Object.entries(queryParams).filter(([_, v]) => v !== "" && v !== null)
      );

      //API Call
      const res = await api.get('/logs', { params: cleanedParams });
      
      //Update State
      setLogs(res.data?.items || []);
      
      // IMPORTANT: Update total count for pagination UI calculation
      setTotalLogsCount(res.data?.total || 0); 

    } catch (err) {
      console.error("API Error", err);
      setLogs([]);
    }
    setLoading(false);
  };


const currentLogs = logs; 

// 2. totalPages MUST use the total count from the database, not the array length
// (Because logs.length will always be 10)
const totalPages = Math.ceil(totalLogsCount / logsPerPage);

// 3. These are now used ONLY for the "Showing X to Y" text labels
const indexOfFirstLog = (currentPage - 1) * logsPerPage; 
const indexOfLastLog = indexOfFirstLog + currentLogs.length;


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
     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-50 pb-4">
               <SlidersHorizontal size={18} className="text-indigo-600" />
               <span>Search & Filter</span>
             </div>
     
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end border-t border-slate-50 mt-4 pt-4">
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
                   <option value="FATAL">FATAL</option>
                 </select>
               </div>
               <button 
                 onClick={clearFilters} 
                 className="flex items-center justify-center gap-2 h-[38px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-all shadow-sm"
               >
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
        {!loading && logs.length > logsPerPage && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
            {/* Left side: Range Info */}
            <div className="text-sm text-slate-500">
  Showing <span className="font-medium">{indexOfFirstLog + 1}</span> to{" "}
  <span className="font-medium">{Math.min(indexOfLastLog, totalLogsCount)}</span> of{" "}
  <span className="font-medium">{totalLogsCount}</span> entries
</div>

            {/* Right side: Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft size={18} className="text-slate-600" />
              </button>

              {/* Page indicator text instead of numbers */}
              <span className="text-sm font-bold text-slate-600 px-4 tabular-nums">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight size={18} className="text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}