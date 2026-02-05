import React, { useEffect, useState } from 'react';
import api from '../api/axios';
// Added Chevron icons for pagination
import { History as HistoryIcon, User as UserIcon, Clock, ShieldAlert, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/audit');
      setLogs(res.data.items);
    } catch (err) {
      console.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  // Pagination Calculations
  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = logs.slice(indexOfFirstItem, indexOfLastItem);

  const getActionColor = (action) => {
    const act = action.toUpperCase();
    if (act.includes('INSERT')) return 'text-green-600 bg-green-50 border-green-200';
    if (act.includes('DELETE')) return 'text-red-600 bg-red-50 border-red-200';
    if (act.includes('UPDATE') || act.includes('ARCHIVE')) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md">
          <HistoryIcon size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit Trails</h1>
          <p className="text-sm text-slate-500 font-medium">Track all administrative and system-level actions</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Actor (User)</th>
                <th className="p-4">Action Performed</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-indigo-600" size={32} />
                      <span className="text-slate-400 font-medium">Fetching Audit Data...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400 italic">
                      <ShieldAlert size={40} className="opacity-20" />
                      <p>No audit logs recorded yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((log) => (
                  <tr key={log.action_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-slate-500 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        {new Date(log.action_time).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-100 rounded-full text-slate-600">
                          <UserIcon size={14} />
                        </div>
                        <span className="font-semibold text-slate-700">
                          {log.username || 'System / Guest'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${getActionColor(log.action_type)}`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        Verified Log
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
         {!loading && logs.length > itemsPerPage && (
          <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, logs.length)} of {logs.length} events
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-1.5 rounded-lg border bg-white hover:bg-slate-100 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronLeft size={18} className="text-slate-600" />
              </button>
              
              {/* Page indicator text */}
              <span className="text-sm font-bold text-slate-600 px-4">
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-1.5 rounded-lg border bg-white hover:bg-slate-100 disabled:opacity-30 transition-all shadow-sm"
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