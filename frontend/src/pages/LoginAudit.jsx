import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  ShieldCheck, ShieldAlert, Clock, Loader2, 
  History as HistoryIcon, User as UserIcon, ChevronLeft, ChevronRight 
} from 'lucide-react';

export default function LoginAudit() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchGlobalHistory();
  }, []);

  const fetchGlobalHistory = async () => {
    try {
      // Ensure this endpoint exists in your backend auth_routes.py
      const res = await api.get('/auth/login-history/all');
      setHistory(res.data.items || []);
    } catch (err) {
      console.error("Failed to fetch global login history");
    } finally {
      setLoading(false);
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(history.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = history.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Login Audits</h1>
          <p className="text-sm text-slate-500 font-medium">Global overview of all user access attempts</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                <th className="p-4">ID</th>
                <th className="p-4">User</th>
                <th className="p-4">Time</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-indigo-600" size={32} />
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-slate-400 italic">No login records found.</td>
                </tr>
              ) : (
                currentItems.map((log) => ( // 🔥 Note: We use 'log' as the variable name
                  <tr key={log.login_id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-mono text-xs text-slate-400">#{log.login_id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
                          <UserIcon size={14} />
                        </div>
                        <span className="font-bold text-slate-700">{log.username}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        {new Date(log.login_time).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${
                        log.status 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {log.status ? "Success" : "Failed"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-xs italic">
                      {log.status ? "Authorized Session" : "Authentication Denied"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && history.length > itemsPerPage && (
          <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, history.length)} of {history.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-1.5 rounded-lg border bg-white hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-bold text-slate-600 px-2">{currentPage} / {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-1.5 rounded-lg border bg-white hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}