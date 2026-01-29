import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  ShieldCheck, ShieldAlert, Clock, Loader2, History, 
  ChevronLeft, ChevronRight // Added for pagination
} from 'lucide-react';

export default function LoginHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/auth/login-history/me');
      setHistory(res.data.items);
    } catch (err) {
      console.error("Failed to fetch login history");
    } finally {
      setLoading(false);
    }
  };

  // Pagination Calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = history.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(history.length / itemsPerPage);

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-600 rounded-lg text-white">
          <History size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Security & Login History</h1>
          <p className="text-sm text-slate-500 font-medium">Monitor your account access and login attempts</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                <th className="p-4">Login ID</th>
                <th className="p-4">Attempt Time</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-indigo-600" size={32} />
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center text-slate-400 italic">No login history found.</td>
                </tr>
              ) : (
                currentItems.map((item) => ( // Changed from history.map to currentItems.map
                  <tr key={item.login_id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-mono text-xs text-slate-400">#{item.login_id}</td>
                    <td className="p-4 text-slate-700 font-medium">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        {new Date(item.login_time).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        item.status 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {item.status ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                        {item.status ? "SUCCESSFUL" : "FAILED"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {item.status 
                        ? "Authorization granted via token" 
                        : "Attempt denied: Invalid credentials or locked account"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && history.length > itemsPerPage && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
            <div className="text-sm text-slate-500 font-medium">
              Showing <span className="text-slate-700">{indexOfFirstItem + 1}</span> to <span className="text-slate-700">{Math.min(indexOfLastItem, history.length)}</span> of <span className="text-slate-700">{history.length}</span> attempts
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronLeft size={18} className="text-slate-600" />
              </button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-9 h-9 rounded-lg border text-xs font-bold transition-all ${
                      currentPage === i + 1 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                        : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
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