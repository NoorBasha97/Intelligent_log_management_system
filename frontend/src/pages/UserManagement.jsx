import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { UserPlus, Trash2, X, Loader2, CheckCircle2, AlertCircle, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import UpdateUserModal from '../components/modals/UserUpdateModal';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false); // Used for both fetching and adding
  const [status, setStatus] = useState({ type: "", message: "" });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 7;

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "", 
    phone_no: "",
    email: "",
    username: "",
    gender: "",
    password: ""
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true); //Start loader
    try {
      const res = await api.get('/users/all');
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false); //Stop loader
    }
  };

  // Pagination Logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setIsUpdateModalOpen(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      await api.post("/users/register", formData);
      setStatus({ type: "success", message: "User added successfully!" });

      setTimeout(() => {
        setIsModalOpen(false);
        setFormData({ first_name: "", last_name: "", phone_no: "", email: "", username: "", gender: "", password: "" });
        setStatus({ type: "", message: "" });
        fetchUsers();
      }, 1500);

    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Failed to add user.";
      setStatus({ type: "error", message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (err) {
        alert("Failed to delete user");
      }
    }
  };

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm";
  const labelClass = "block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-md"
        >
          <UserPlus size={18} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">User Details</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Role</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="p-4 text-center text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/*  LOADER LOGIC  */}
            {loading ? (
              <tr>
                <td colSpan="4" className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="animate-spin text-indigo-600" size={40} />
                    <span className="text-slate-500 font-medium text-xs tracking-widest">
                      Loading Users...
                    </span>
                  </div>
                </td>
              </tr>
            ) : currentUsers.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-20 text-center text-slate-400 italic">
                  No users found in the system.
                </td>
              </tr>
            ) : (
              currentUsers.map(u => (
                <tr key={u.user_id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4">
                    <p className="font-semibold text-slate-700">{u.first_name} {u.last_name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium uppercase">
                      {u.user_role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    <button
                      onClick={() => handleEditClick(u)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deleteUser(u.user_id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {!loading && users.length > usersPerPage && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
            <div className="text-sm text-slate-500 font-medium">
              Showing <span className="text-slate-700 font-bold">{indexOfFirstUser + 1}</span> to <span className="text-slate-700 font-bold">{Math.min(indexOfLastUser, users.length)}</span> of <span className="text-slate-700 font-bold">{users.length}</span> users
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>

              <span className="text-sm font-bold text-slate-600 px-4 tabular-nums">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <UpdateUserModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        user={selectedUser}
        onUpdateSuccess={fetchUsers}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-slate-800">Add New User</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              {status.message && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {status.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  {status.message}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>First Name</label>
                  <input name="first_name" className={inputClass} onChange={handleChange} required />
                </div>
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input name="last_name" className={inputClass} onChange={handleChange} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Email</label>
                  <input name="email" type="email" className={inputClass} onChange={handleChange} required />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input name="phone_no" className={inputClass} onChange={handleChange} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Username</label>
                  <input name="username" className={inputClass} onChange={handleChange} required />
                </div>
                <div>
                  <label className={labelClass}>Gender</label>
                  <select name="gender" className={inputClass} onChange={handleChange} required>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input name="password" type="password" className={inputClass} onChange={handleChange} required />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition font-semibold">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-semibold flex items-center justify-center gap-2">{loading ? <Loader2 className="animate-spin" size={18} /> : "Create User"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}