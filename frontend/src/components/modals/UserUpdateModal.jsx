import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import api from '../../api/axios';

export default function UpdateUserModal({ isOpen, onClose, user, onUpdateSuccess }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [teams, setTeams] = useState([]); // State to store teams from DB
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_no: "",
    username: "",
    gender: "",
    user_role: "",
    team_id : "",
    is_active: true
  });

   // 1. Fetch available teams from backend when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchTeams = async () => {
        try {
          const res = await api.get('/teams'); // Ensure this route exists
          setTeams(res.data);
        } catch (err) {
          console.error("Failed to load teams", err);
        }
      };
      fetchTeams();
    }
  }, [isOpen]);

  // Load user data into form when modal opens or user changes
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone_no: user.phone_no || "",
        username: user.username || "",
        gender: user.gender || "",
        user_role : user.user_role || "",
        team_id : user.team_id || "",
        is_active: user.is_active
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      await api.put(`/users/update/${user.user_id}`, formData);
      setStatus({ type: "success", message: "User updated successfully!" });
      
      setTimeout(() => {
        onUpdateSuccess();
        onClose();
        setStatus({ type: "", message: "" });
      }, 1500);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Failed to update user.";
      setStatus({ type: "error", message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white disabled:bg-slate-50 disabled:text-slate-400";
  const labelClass = "block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Update User Profile</h2>
            <p className="text-xs text-slate-500">Editing: {user?.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {status.message && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
              status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}>
              {status.type === "success" ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
              {status.message}
            </div>
          )}

          {/* Email - READ ONLY */}
          <div>
            <label className={labelClass}>Email Address (Account ID)</label>
            <input 
              type="email" 
              value={user?.email || ""} 
              disabled 
              className={inputClass} 
              title="Email cannot be changed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name</label>
              <input name="first_name" className={inputClass} value={formData.first_name} onChange={handleChange} required />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input name="last_name" className={inputClass} value={formData.last_name} onChange={handleChange} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Username</label>
              <input name="username" className={inputClass} value={formData.username} onChange={handleChange} required />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input name="phone_no" className={inputClass} value={formData.phone_no} onChange={handleChange} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Gender</label>
              <select name="gender" className={inputClass} value={formData.gender} onChange={handleChange} required>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Update Role:</label>
              <select name="user_role" className={inputClass} value={formData.user_role} onChange={handleChange} required>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            </div>
              <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className={labelClass}>Assign Team</label>
              <select 
                name="team_id" 
                className={inputClass} 
                value={formData.team_id} 
                onChange={handleChange}
                required
              >
                <option value="">Select a team...</option>
                {teams.map((team) => (
                  <option key={team.team_id} value={team.team_id}>
                    {team.team_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center cursor-pointer gap-3">
                <input 
                  type="checkbox" 
                  name="is_active" 
                  checked={formData.is_active} 
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-semibold text-slate-700">Account Active</span>
              </label>
            </div>
          </div>

          <div className="pt-6 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition font-semibold"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
            >
              {loading ? <Loader2 className="animate-spin" size={18}/> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}