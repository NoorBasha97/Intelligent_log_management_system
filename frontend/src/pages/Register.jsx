import { useState } from "react";
import api from "../services/api";
import { UserPlus, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

function Register() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_no: "",
    email: "",
    username: "",
    gender: "",
    password: ""
  });

  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      await api.post("/users/register", formData);
      setStatus({ type: "success", message: "Registration successful! You can now login." });
      // Optional: Clear form
      setFormData({
        first_name: "", last_name: "", phone_no: "",
        email: "", username: "", gender: "", password: ""
      });
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "An error occurred during registration.";
      setStatus({ type: "error", message: errorMsg });
      console.error("Registration Error:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-slate-700 placeholder:text-slate-400";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full mb-4">
            <UserPlus size={24} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">Create Account</h2>
          <p className="text-slate-500 mt-2">Join LogMaster to manage your system logs</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Status Messages */}
          {status.message && (
            <div className={`p-4 rounded-lg flex items-center gap-3 text-sm ${
              status.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {status.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {status.message}
            </div>
          )}

          {/* Grid for Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name</label>
              <input
                name="first_name"
                type="text"
                placeholder="first name"
                className={inputClass}
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input
                name="last_name"
                type="text"
                placeholder="last name"
                className={inputClass}
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Email & Phone Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="example@gmail.com"
                className={inputClass}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Phone Number</label>
              <input
                name="phone_no"
                type="text"
                placeholder="+1 234 567 890"
                className={inputClass}
                value={formData.phone_no}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Username & Gender Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Username</label>
              <input
                name="username"
                type="text"
                placeholder="username"
                className={inputClass}
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <select
                name="gender"
                className={inputClass}
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className={labelClass}>Password</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              className={inputClass}
              value={formData.password}
              onChange={handleChange}
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">Must be at least 6 characters long</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{" "}
            <a href="/login" className="text-indigo-600 font-semibold hover:underline">
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;