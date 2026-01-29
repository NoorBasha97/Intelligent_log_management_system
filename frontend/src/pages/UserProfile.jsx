import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { User, Phone, Tag, Mail, Shield, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UserProfile() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_no: "",
    username: "",
    gender: ""
  });

  const [systemInfo, setSystemInfo] = useState({
    email: "",
    role: "",
    joined: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/me');
      const u = res.data;
      setFormData({
        first_name: u.first_name || "",
        last_name: u.last_name || "",
        phone_no: u.phone_no || "",
        username: u.username || "",
        gender: u.gender || ""
      });
      setSystemInfo({
        email: u.email,
        role: u.user_role,
        joined: u.created_at
      });
    } catch (err) {
      console.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setStatus({ type: "", message: "" });

    try {
      await api.put('/users/me', formData);
      setStatus({ type: "success", message: "Profile updated successfully!" });
      fetchProfile(); // Refresh data
    } catch (error) {
      setStatus({ type: "error", message: error.response?.data?.detail || "Update failed" });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  const inputClass = "w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm";
  const labelClass = "block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1";
  const readOnlyClass = "w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm cursor-not-allowed";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <User size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Profile</h1>
          <p className="text-slate-500 font-medium">Manage your personal information and account settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: System Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Shield size={18} className="text-indigo-600" /> Account Identity
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input type="text" value={systemInfo.email} readOnly className={readOnlyClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>System Role</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input type="text" value={systemInfo.role} readOnly className={readOnlyClass} />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Member Since</p>
                <p className="text-sm font-semibold text-slate-600">{new Date(systemInfo.joined).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Editable Fields */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            
            {status.message && (
              <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in zoom-in duration-300 ${
                status.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
              }`}>
                {status.type === "success" ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
                {status.message}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input name="first_name" value={formData.first_name} onChange={handleChange} className={inputClass} required />
                </div>
              </div>
              <div>
                <label className={labelClass}>Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input name="last_name" value={formData.last_name} onChange={handleChange} className={inputClass} required />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Username</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input name="username" value={formData.username} onChange={handleChange} className={inputClass} required />
                </div>
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input name="phone_no" value={formData.phone_no} onChange={handleChange} className={inputClass} required />
                </div>
              </div>
            </div>

            <div className="w-1/2">
              <label className={labelClass}>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass} required>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="pt-6 border-t border-slate-50 flex justify-end">
              <button 
                type="submit" 
                disabled={updating}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
              >
                {updating ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                Update Profile
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}