import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  Terminal, Loader2, FileText, Clock, 
  Search, Calendar, RotateCcw, SlidersHorizontal,
  ChevronLeft, ChevronRight 
} from 'lucide-react';

export default function ViewLogs() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalLogsCount, setTotalLogsCount] = useState(0);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const initialFilters = {
    search: '',
    start_date: '',
    end_date: '',
    severity_code: '',
  };

  const [filters, setFilters] = useState(initialFilters);

  // 1. Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // 2. Fetch data when page OR filters change
  useEffect(() => { 
    fetchLogEntries(); 
  }, [currentPage, filters]);

  const fetchLogEntries = async () => {
    setLoading(true);
    try {
      const limit = itemsPerPage;
      const offset = (currentPage - 1) * limit;

      const params = {
        ...filters,
        limit: limit,
        offset: offset
      };

      // Clean empty strings
      const cleanedParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== "")
      );

      // 🔥 FIX: Ensure this URL matches your Backend Route exactly
      const res = await api.get('/logs/me/entries', { params: cleanedParams });
      
      setEntries(res.data?.items || []);
      setTotalLogsCount(res.data?.total || 0);
    } catch (err) { 
      console.error("Error fetching logs:", err); 
      setEntries([]);
    }
    setLoading(false);
  };

  // Pagination Math
  const totalPages = Math.ceil(totalLogsCount / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + entries.length;

  const clearFilters = () => setFilters(initialFilters);

  const getSeverityStyle = (code) => {
    switch (code) {
      case 'ERROR': return 'bg-red-100 text-red-700 border-red-200';
      case 'WARN': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'INFO': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all";
  const labelClass = "text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block";

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen font-sans">

      {/* Header Area */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md">
          <Terminal size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Personal Log Explorer</h1>
          <p className="text-sm text-slate-500 font-medium">Search and filter through your uploaded log data</p>
        </div>
      </div>

      {/* --- ADVANCED FILTER BAR --- */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-50 pb-4">
          <SlidersHorizontal size={18} className="text-indigo-600" />
          <span>Search & Filter</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end border-t border-slate-50 mt-4 pt-4">
          <div>
            <label className={labelClass}>From Date</label>
            <input type="date" className={inputClass} value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>To Date</label>
            <input type="date" className={inputClass} value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Severity</label>
            <select className={inputClass} value={filters.severity_code} onChange={(e) => setFilters({ ...filters, severity_code: e.target.value })}>
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

      {/* --- TABLE AREA --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                <th className="p-4 w-48"><div className="flex items-center gap-2"><Clock size={12} /> Timestamp</div></th>
                <th className="p-4 w-28 text-center">Level</th>
                <th className="p-4 w-40">Source File</th>
                <th className="p-4">Message Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[13px] text-black">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-indigo-600" size={32} />
                    <p className="mt-2 text-slate-400 font-sans text-sm font-medium">Filtering logs...</p>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-32 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 font-sans italic">
                      <p className="text-lg font-bold text-slate-300 mb-2">No entries found matching criteria</p>
                      <button onClick={clearFilters} className="text-indigo-600 hover:underline text-sm font-semibold not-italic">Reset all filters</button>
                    </div>
                  </td>
                </tr>
              ) : (
                currentEntries.map(log => (
                  <tr key={log.log_id} className="hover:bg-slate-50 transition-colors align-top">
                    <td className="p-4 text-slate-500 whitespace-nowrap tabular-nums">
                      {new Date(log.log_timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getSeverityStyle(log.severity_code)}`}>
                        {log.severity_code}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-indigo-600 font-semibold truncate max-w-[150px]" title={log.file_name}>
                        <FileText size={14} className="opacity-70 shrink-0" />
                        {log.file_name}
                      </div>
                    </td>
                    <td className="p-4 text-slate-900 break-all leading-relaxed pr-6">
                      {log.message_line}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION CONTROLS --- */}
        {!loading && entries.length > itemsPerPage && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
            {/* Left side: Range Info */}
            <div className="text-sm text-slate-500 font-medium">
              Showing <span className="text-slate-700 font-bold">{indexOfFirstItem + 1}</span> to <span className="text-slate-700 font-bold">{Math.min(indexOfLastItem, entries.length)}</span> of <span className="text-slate-700 font-bold">{entries.length}</span> logs
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

              {/* Page Display */}
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