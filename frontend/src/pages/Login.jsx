import { useState } from "react";
import api from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, Loader2, AlertCircle, ShieldCheck } from "lucide-react";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", formData);
      localStorage.setItem("token", response.data?.access_token);
      console.log(response)
      if(response.status==200){
        if(response.data.role == 'ADMIN'){

          navigate("/admin/dashboard");
        }
        else if(response.data.role == 'USER'){
          navigate("/user/dashboard")
        }
      }
      // Redirect to the dashboard
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Invalid email or password";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-slate-700 placeholder:text-slate-400";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        
        {/* Logo/Icon Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 mb-4">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">Welcome Back</h2>
          <p className="text-slate-500 mt-2">Sign in to manage your logs</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg flex items-center gap-3 text-sm animate-shake">
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className={labelClass}>Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                name="email"
                type="email"
                placeholder="name@company.com"
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className={labelClass}>Password</label>
              <a href="#" className="text-xs text-indigo-600 hover:underline">Forgot?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Remember Me Toggle (Optional UI) */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-slate-600 cursor-pointer">
              Remember this device
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center pt-6 border-t border-slate-50">
          <p className="text-sm text-slate-500">
            New to LogMaster?{" "}
            <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;