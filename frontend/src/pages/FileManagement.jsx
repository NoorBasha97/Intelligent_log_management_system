import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import {
  Upload, FileText, Trash2, Search, Calendar,
  Filter, Loader2, RotateCcw, Users as TeamIcon,
  Archive as ArchiveIcon, CheckCircle, ChevronLeft, ChevronRight // Added Chevron icons
} from 'lucide-react';

export default function FileManagement() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [teams, setTeams] = useState([]);
  const fileInputRef = useRef(null);
  const [currentUserTeamId, setCurrentUserTeamId] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const initialFilters = {
    search: '', start_date: '', severity: '',
    environment: '', category: '', team_id: ''
  };

  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    fetchTeams();
    fetchFiles();
    fetchMyTeam();
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [filters]);

  const fetchMyTeam = async () => {
    try {
      const res = await api.get('/teams/my-team-id');
      setCurrentUserTeamId(res.data.team_id);
    } catch (err) {
      console.error("Failed to fetch user team info");
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams');
      setTeams(res.data);
    } catch (err) { console.error("Could not fetch teams"); }
  };

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const cleanedParams = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== "")
      );
      const res = await api.get('/files/get-all-files', { params: cleanedParams });
      setFiles(res.data?.items || []);
    } catch (err) { console.error("API Error", err); }
    setLoading(false);
  };

  // Pagination Calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFiles = files.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(files.length / itemsPerPage);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    let formatId = 1;
    if (ext === 'json') formatId = 3;
    if (ext === 'csv') formatId = 4;
    if (ext === 'xml') formatId = 5;

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      await api.post(`/files/upload?team_id=${currentUserTeamId}&format_id=${formatId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("File uploaded and parsed successfully!");
      fetchFiles();
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.detail || "Server Error"));
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const clearFilters = () => { setFilters(initialFilters); };

  const deleteFile = async (id) => {
    if (window.confirm("Permanent Delete: Remove file and all related logs?")) {
      try {
        await api.delete(`/files/${id}`);
        fetchFiles();
      } catch (err) {
        alert("Delete failed: " + (err.response?.data?.detail || "Error"));
      }
    }
  };

  const archiveFile = async (id) => {
    if (window.confirm("Manual Archive: Are you sure you want to archive this file now?")) {
      try {
        await api.patch(`/files/${id}/archive`);
        alert("File successfully moved to archives.");
        fetchFiles();
      } catch (err) {
        alert("Archive failed: " + (err.response?.data?.detail || "Error"));
      }
    }
  };

  const inputClass = "bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all";

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".log,.txt,.json,.csv,.xml"
      />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">File Repository Management</h1>
        <button
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-md disabled:opacity-50"
        >
          {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
          {uploading ? "Uploading..." : "New Log Upload"}
        </button>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 items-end">
          <div className="relative lg:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Filename Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                placeholder="Search..."
                className={`${inputClass} w-full pl-10`}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Date Uploaded</label>
            <input
              type="date"
              className={`${inputClass} w-33`}
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Environment</label>
            <select className={`${inputClass} w-full`} value={filters.environment} onChange={(e) => setFilters({ ...filters, environment: e.target.value })}>
              <option value="">All</option>
              <option value="DEV">DEV</option>
              <option value="PROD">PROD</option>
              <option value="STAGING">STAGING</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Severity</label>
            <select className={`${inputClass} w-full`} value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })}>
              <option value="">All</option>
              <option value="ERROR">ERROR</option>
              <option value="WARN">WARN</option>
              <option value="INFO">INFO</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Team</label>
            <select className={`${inputClass} w-full`} value={filters.team_id} onChange={(e) => setFilters({ ...filters, team_id: e.target.value })}>
              <option value="">All Teams</option>
              {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
            </select>
          </div>
          <button
            onClick={clearFilters}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">File Name</th>
                <th className="p-4">Uploader</th>
                <th className="p-4">Team</th>
                <th className="p-4">Size</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-20"><Loader2 className="animate-spin mx-auto text-indigo-500" size={32} /></td></tr>
              ) : (files.length === 0) ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <h1 className="text-xl font-bold text-red-500">File not found.......</h1>
                      <p className="text-slate-400 text-sm">Try adjusting your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (currentFiles.map(f => ( // Use currentFiles here
                <tr key={f.file_id} className={`hover:bg-slate-50/50 transition ${f.is_archived ? 'bg-slate-50 opacity-75' : ''}`}>
                  <td className="p-4 font-mono text-xs text-slate-400">#{f.file_id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{f.original_name}</span>
                      {f.is_archived && <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Archived</span>}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">
                    {f.uploader_name ? f.uploader_name : <span className="text-slate-400 italic">Deleted User</span>}
                  </td>
                  <td className="p-4 font-bold text-indigo-600 text-xs">{f.team_name || 'Global'}</td>
                  <td className="p-4 text-slate-500">{(f.file_size_bytes / 1024).toFixed(1)} KB</td>
                  <td className="p-4 flex items-center justify-center gap-3">
                    {!f.is_archived ? (
                      <button onClick={() => archiveFile(f.file_id)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Archive Now">
                        <ArchiveIcon size={16} />
                      </button>
                    ) : (
                      <div className="p-2 text-green-500" title="Archived"><CheckCircle size={16} /></div>
                    )}
                    <button onClick={() => deleteFile(f.file_id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete Permanently">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {files.length > itemsPerPage && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
            <div className="text-sm text-slate-500 font-medium">
              Showing <span className="text-slate-700">{indexOfFirstItem + 1}</span> to <span className="text-slate-700">{Math.min(indexOfLastItem, files.length)}</span> of <span className="text-slate-700">{files.length}</span> files
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3.5 py-1 rounded-lg border text-sm font-bold transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}