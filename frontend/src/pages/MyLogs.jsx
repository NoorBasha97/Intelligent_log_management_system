import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { User, Users, Loader2, FileText, Upload, HardDrive, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MyLogs() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState('me');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userTeams, setUserTeams] = useState([]);
  const [uploading, setUploading] = useState(false);

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const [environments, setEnvironments] = useState([]);
  const [uploadForm, setUploadForm] = useState({
    team_id: '',
    environment_id: '',
    file: null
  });

  useEffect(() => {
    fetchFiles();
    setCurrentPage(1);
  }, [scope]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/files/me', { params: { scope } });
      setFiles(res.data?.items || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // --- Pagination Logic ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFiles = files.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(files.length / itemsPerPage);

  const handleOpenUploadModal = async () => {
    try {
      const teamsRes = await api.get('/teams/my-joined-teams');
      const envRes = await api.get('/environments'); 
      setUserTeams(teamsRes.data);
      setEnvironments(envRes.data); 
      setIsModalOpen(true);
    } catch (err) {
      alert("Failed to fetch requirements.");
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!uploadForm.team_id || !uploadForm.file || !uploadForm.environment_id) {
        alert("Please select a team, an environment, and a file before uploading.");
        return;
    }

    const file = uploadForm.file;
    const ext = file.name.split('.').pop().toLowerCase();

    let formatId = 1; 
    if (ext === 'json') formatId = 3;
    else if (ext === 'csv') formatId = 4;
    else if (ext === 'xml') formatId = 5;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);

    try {
        await api.post(
            `/files/upload?team_id=${uploadForm.team_id}&format_id=${formatId}&environment_id=${uploadForm.environment_id}`, 
            formData, 
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        alert("✅ File uploaded and parsed successfully!");
        setIsModalOpen(false);
        setUploadForm({ team_id: '', environment_id: '', file: null });
        fetchFiles();
    } catch (err) {
        const errorDetail = err.response?.data?.detail || "An unexpected server error occurred.";
        alert("❌ Upload failed: " + errorDetail);
    } finally {
        setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this file permanently?")) {
      try {
        await api.delete(`/files/${id}`);
        fetchFiles();
      } catch (err) {
        alert("Delete failed.");
      }
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen text-slate-900 font-sans">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
            <HardDrive size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">My Log Files</h1>
            <p className="text-sm text-slate-500 font-medium">
              {scope === 'me' ? 'Managing your personal uploads' : 'Viewing team uploads'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenUploadModal}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Upload size={18} /> Upload
          </button>

          <div className="inline-flex p-1 bg-slate-200 rounded-xl shadow-inner">
            <button
              onClick={() => setScope('me')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${scope === 'me' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
            >
              <User size={16} /> Personal
            </button>
            <button
              onClick={() => setScope('team')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${scope === 'team' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
            >
              <Users size={16} /> Team
            </button>
          </div>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-slate-500 text-[11px] uppercase font-black tracking-widest">
              <tr>
                <th className="p-5">File Details</th>
                <th className="p-5">Size</th>
                <th className="p-5">Uploaded Date</th>
                <th className="p-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {loading ? (
                <tr><td colSpan="4" className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" size={32} /></td></tr>
              ) : files.length === 0 ? (
                <tr><td colSpan="4" className="py-24 text-center text-slate-400 italic">No files found in this scope.</td></tr>
              ) : (
                currentFiles.map(file => (
                  <tr key={file.file_id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-700">{file.original_name}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">ID: #{file.file_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-slate-600 font-semibold italic">
                      {(file.file_size_bytes / 1024).toFixed(2)} KB
                    </td>
                    <td className="p-5 text-slate-500 font-medium">
                      {new Date(file.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="p-5 text-center">
                      <button 
                        onClick={() => handleDelete(file.file_id)}
                        className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION FOOTER --- */}
        {!loading && files.length > itemsPerPage && (
          <div className="bg-slate-50/50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, files.length)} of {files.length} Files
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-bold text-slate-600 px-4 tabular-nums">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- UPLOAD MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8 space-y-6 animate-in zoom-in duration-300 border-none">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">New Log Upload</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full"><X size={20} /></button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Target Team Context</label>
                <select 
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer" 
                  value={uploadForm.team_id} 
                  onChange={(e) => setUploadForm({...uploadForm, team_id: e.target.value})}
                  required
                >
                  <option value="">Select a team...</option>
                  {userTeams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Environment</label>
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
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Select Source File</label>
                <input 
                  type="file" 
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })} 
                  className="text-sm block w-full text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-none file:text-xs file:font-black file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 file:cursor-pointer"
                  required 
                />
              </div>

              <div className="pt-4">
                <button type="submit" disabled={uploading} className="w-full py-3.5 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                  {uploading ? <Loader2 className="animate-spin" size={20}/> : <Upload size={18}/>}
                  UPLOAD NOW
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}