import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import {
  Upload, FileText, Trash2, Search, Calendar,
  Filter, Loader2, RotateCcw, Users as TeamIcon,
  Archive as ArchiveIcon, CheckCircle, ChevronLeft, ChevronRight, X, Files
} from 'lucide-react';

export default function FileManagement() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [userTeams, setUserTeams] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Upload Modal States 
  const [uploadForm, setUploadForm] = useState({
    team_id: '',
    environment_id: '',
    files: [] //Changed from 'file' to 'files' array
  });

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
    setCurrentPage(1); // Reset pagination when filters change
  }, [filters]);

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

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFiles = files.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(files.length / itemsPerPage);

  const handleOpenUploadModal = async () => {
    try {
      // Fetch only the teams the Admin is actually a member of for uploading
      const teamsRes = await api.get('/teams/my-joined-teams');
      const envRes = await api.get('/environments');

      setUserTeams(teamsRes.data);
      setEnvironments(envRes.data);

      if (teamsRes.data.length === 1) {
        setUploadForm(prev => ({ ...prev, team_id: teamsRes.data[0].team_id }));
      }

      setIsModalOpen(true);
    } catch (err) {
      alert("Failed to load upload requirements.");
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.team_id || !uploadForm.environment_id || uploadForm.files.length === 0) {
      alert("Please select a team, an environment, and at least one file.");
      return;
    }

    const formData = new FormData();
    // Append all files to the same key 'files' for the backend List[UploadFile]
    uploadForm.files.forEach((file) => {
      formData.append('files', file);
    });

    setUploading(true);

    try {
      // Backend now detects format_id per file, so we only pass team and env
      await api.post(
        `/files/upload?team_id=${uploadForm.team_id}&environment_id=${uploadForm.environment_id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      alert(`✅ Successfully uploaded and parsed ${uploadForm.files.length} file(s)!`);
      setIsModalOpen(false);
      setUploadForm({ team_id: '', environment_id: '', files: [] });
      fetchFiles();
    } catch (err) {
      const errorDetail = err.response?.data?.detail || "Batch upload failed.";
      alert("❌ " + errorDetail);
    } finally {
      setUploading(false);
    }
  };

  const clearFilters = () => { setFilters(initialFilters); };

  const deleteFile = async (id) => {
    if (window.confirm("Permanent Delete: Remove file and all related logs?")) {
      try {
        await api.delete(`/files/${id}`);
        fetchFiles();
      } catch (err) { alert("Delete failed."); }
    }
  };

  const archiveFile = async (id) => {
    if (window.confirm("Manual Archive: Are you sure?")) {
      try {
        await api.patch(`/files/${id}/archive`);
        alert("File successfully moved to archives.");
        fetchFiles();
      } catch (err) { alert("Archive failed."); }
    }
  };

  const inputClass = "bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all";

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen text-slate-900 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">File Repository Management</h1>
        <button
          onClick={handleOpenUploadModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-200"
        >
          <Upload size={18} /> New Log Upload
        </button>
      </div>

      {/* --- Filter Bar --- */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 items-end">
          <div className="relative lg:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Filename Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input placeholder="Search..." className={`${inputClass} w-full pl-10`} value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Date Uploaded</label>
            <input type="date" className={`${inputClass} w-full`} value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Environment</label>
            <select className={`${inputClass} w-full`} value={filters.environment} onChange={(e) => setFilters({ ...filters, environment: e.target.value })}>
              <option value="">All</option>
              <option value="DEV">DEV</option>
              <option value="QA">QA</option>
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
          <button onClick={clearFilters} className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200">
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      {/* --- Data Table --- */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-slate-500 text-[11px] uppercase font-black tracking-widest">
              <tr>
                <th className="p-5">ID</th>
                <th className="p-5">File Name</th>
                <th className="p-5">Uploader</th>
                <th className="p-5">Team</th>
                <th className="p-5">Size</th>
                <th className="p-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-20"><Loader2 className="animate-spin mx-auto text-indigo-500" size={32} /></td></tr>
              ) : files.length === 0 ? (
                <tr><td colSpan="6" className="py-20 text-center text-slate-400 italic">No files found.......</td></tr>
              ) : (currentFiles.map(f => (
                <tr key={f.file_id} className={`hover:bg-slate-50/50 transition ${f.is_archived ? 'bg-slate-50 opacity-75' : ''}`}>
                  <td className="p-5 font-mono text-xs text-slate-400">#{f.file_id}</td>
                  <td className="p-5 font-bold text-slate-700">{f.original_name}</td>
                  <td className="p-5 text-slate-600">{f.uploader_name || <span className="text-slate-400 italic">Deleted User</span>}</td>
                  <td className="p-5 font-bold text-indigo-600 text-xs">{f.team_name || 'Global'}</td>
                  <td className="p-5 text-slate-500 font-medium italic">{(f.file_size_bytes / 1024).toFixed(1)} KB</td>
                  <td className="p-5 flex items-center justify-center gap-3">
                    {!f.is_archived ? (
                      <button onClick={() => archiveFile(f.file_id)} className="p-2 text-slate-300 hover:text-amber-600 transition" title="Archive Now">
                        <ArchiveIcon size={16} />
                      </button>
                    ) : (
                      <div className="p-2 text-green-500" title="Archived"><CheckCircle size={16} /></div>
                    )}
                    <button onClick={() => deleteFile(f.file_id)} className="p-2 text-slate-300 hover:text-red-600 transition" title="Delete Permanently">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && files.length > itemsPerPage && (
          <div className="bg-slate-50/50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, files.length)} of {files.length} Files
            </p>
            <div className="flex items-center gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-30 transition-all shadow-sm"><ChevronLeft size={18} /></button>
              <span className="text-sm font-bold text-slate-600 px-4 tabular-nums">{currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-30 transition-all shadow-sm"><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </div>

      {/* --- MULTI-FILE UPLOAD MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8 space-y-6 animate-in zoom-in duration-300 border-none">
            <div className="flex justify-between items-center text-slate-800">
              <h2 className="text-2xl font-black tracking-tight">Batch Log Upload</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full"><X size={20} /></button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Assign to Team</label>
                <select 
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer" 
                  value={uploadForm.team_id} 
                  onChange={(e) => setUploadForm({...uploadForm, team_id: e.target.value})}
                  required
                >
                  <option value="">Select your team context...</option>
                  {userTeams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Target Environment</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                  value={uploadForm.environment_id}
                  onChange={(e) => setUploadForm({ ...uploadForm, environment_id: e.target.value })}
                  required
                >
                  <option value="">Select Environment...</option>
                  {environments.map(env => <option key={env.environment_id} value={env.environment_id}>{env.environment_code}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Select Files (Multi)</label>
                <div className="relative border-2 border-dashed border-slate-200 rounded-3xl p-6 hover:bg-slate-50 transition-colors group">
                   <input 
                    type="file" 
                    multiple // ALLOWS MULTIPLE FILES
                    onChange={(e) => setUploadForm({ ...uploadForm, files: Array.from(e.target.files) })} 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    required 
                  />
                  <div className="text-center">
                    <Files className="mx-auto text-slate-300 group-hover:text-indigo-400 transition-colors mb-2" size={32} />
                    <p className="text-sm font-bold text-slate-600">
                      {uploadForm.files.length > 0 
                        ? `${uploadForm.files.length} files selected` 
                        : "Click to select multiple log files"}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase mt-1">.log, .txt, .json, .csv, .xml</p>
                  </div>
                </div>
                {/* List selected filenames */}
                <div className="mt-2 max-h-24 overflow-y-auto space-y-1">
                   {uploadForm.files.map((f, i) => (
                     <div key={i} className="text-[10px] text-slate-500 flex items-center gap-1 font-medium bg-slate-50 px-2 py-1 rounded">
                       <FileText size={10} className="text-indigo-500" /> {f.name}
                     </div>
                   ))}
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={uploading || userTeams.length === 0} className="w-full py-3.5 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50 uppercase tracking-widest">
                  {uploading ? <Loader2 className="animate-spin" size={20}/> : <Upload size={18}/>}
                  {uploading ? "Processing Batch..." : "Confirm Batch Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}