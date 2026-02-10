import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Terminal, ShieldCheck, Activity, Search, 
  Layers, Zap, Mail, Github, Twitter, Menu, X, ArrowRight,
  CheckCircle // Fixed: Added CheckCircle to imports
} from 'lucide-react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      title: "Intelligent Ingestion",
      desc: "Automatically parse and classify logs from TXT, JSON, CSV, and XML files with built-in regex engines.",
      icon: <Terminal className="text-indigo-600" size={24} />,
    },
    {
      title: "Secure Multi-Tenancy",
      desc: "Robust team-based isolation ensuring users only access logs belonging to their authorized team.",
      icon: <ShieldCheck className="text-indigo-600" size={24} />,
    },
    {
      title: "Real-time Metrics",
      desc: "Live dashboard with visual trends, error distribution, and system health monitoring.",
      icon: <Activity className="text-indigo-600" size={24} />,
    },
    {
      title: "Advanced Filtering",
      desc: "Powerful search capability by severity, environment, date ranges, and message keywords.",
      icon: <Search className="text-indigo-600" size={24} />,
    },
    {
      title: "Automated Archiving",
      desc: "Keep your database lean with automated 90-day archiving and manual archive overrides.",
      icon: <Layers className="text-indigo-600" size={24} />,
    },
    {
      title: "Full Audit Trails",
      desc: "Every action is tracked. Detailed history of uploads, deletions, and administrative changes.",
      icon: <Zap className="text-indigo-600" size={24} />,
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <Activity size={20} />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">Log<span className="text-indigo-600">Master</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">About</a>
            <a href="#services" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Services</a>
            <a href="#contact" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Contact</a>
            <div className="h-6 w-px bg-slate-200"></div>
            <Link to="/login" className="text-sm font-bold text-slate-900 hover:text-indigo-600">Login</Link>
            <Link to="/register" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">
              Get Started
            </Link>
          </div>

          <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 p-6 space-y-4 flex flex-col animate-in slide-in-from-top-2">
            <a href="#about" onClick={() => setIsMenuOpen(false)} className="font-bold text-slate-600">About</a>
            <a href="#services" onClick={() => setIsMenuOpen(false)} className="font-bold text-slate-600">Services</a>
            <a href="#contact" onClick={() => setIsMenuOpen(false)} className="font-bold text-slate-600">Contact</a>
            <hr />
            <Link to="/login" className="font-bold text-indigo-600">Login</Link>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="pt-40 pb-20 px-6 text-center">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100">
            <Zap size={14} fill="currentColor" /> Enterprise Log Intelligence
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
            Master Your System <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Data Streams.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-slate-500 text-lg md:text-xl font-medium leading-relaxed">
            A secure, multi-tenant log platform. Transform messy logs into actionable insights with professional audit trails.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group">
              Start Building <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-900 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
              Live Demo
            </Link>
          </div>
        </div>
      </header>

      {/* --- SERVICES SECTION --- */}
      <section id="services" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Powerful Features for Modern Teams</h2>
            <p className="text-slate-500 font-medium">Everything you need to manage distributed log systems at scale.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group hover:-translate-y-1">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:transition-colors duration-300">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* --- ENHANCED ENTERPRISE FOOTER --- */}
      <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            
            {/* Column 1: Brand & Status */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                  <Activity size={18} />
                </div>
                <span className="text-lg font-black tracking-tighter uppercase">LogMaster</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Advanced log orchestration and security auditing for distributed systems. 
                Built for teams that value visibility and data integrity.
              </p>
            
            </div>

            {/* Column 2: Platform */}
            <div>
              <h4 className="text-slate-900 font-bold mb-6 uppercase text-xs tracking-[0.2em]">Platform</h4>
              <ul className="space-y-4">
                <li><Link to="/login" className="text-slate-600 hover:text-indigo-600 text-sm transition-colors font-medium">Dashboard</Link></li>
                <li><Link to="/user/view-logs" className="text-slate-600 hover:text-indigo-600 text-sm transition-colors font-medium">Log Explorer</Link></li>
                <li><Link to="/admin/audit" className="text-slate-600 hover:text-indigo-600 text-sm transition-colors font-medium">Security Audits</Link></li>
                <li><Link to="/register" className="text-slate-600 hover:text-indigo-600 text-sm transition-colors font-medium">Team Management</Link></li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div>
              <h4 className="text-slate-900 font-bold mb-6 uppercase text-xs tracking-[0.2em]">Resources</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-600 hover:text-indigo-600 text-sm transition-colors font-medium">API Documentation</a></li>
                <li><a href="#" className="text-slate-600 hover:text-indigo-600 text-sm transition-colors font-medium">Regex Guide</a></li>
                <li><a href="#" className="text-slate-600 hover:text-indigo-600 text-sm transition-colors font-medium">Integration Webhooks</a></li>
                <li><a href="#" className="text-slate-600 hover:text-indigo-600 text-sm transition-colors font-medium">Privacy Policy</a></li>
              </ul>
            </div>

            {/* Column 4: Newsletter/Connect */}
            <div>
              <h4 className="text-slate-900 font-bold mb-6 uppercase text-xs tracking-[0.2em]">Connect</h4>
              <p className="text-slate-500 text-sm mb-4">Stay updated with our latest security patches and features.</p>
              <div className="flex gap-4">
                <a href="#" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                  <Github size={18} />
                </a>
                <a href="#" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                  <Twitter size={18} />
                </a>
                <a href="#" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                  <Mail size={18} />
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-indigo-600 text-xs font-medium">
              © 2026 All rights reserved @LogMaster .
            </p>
            <div className="flex gap-8">
              <a href="#" className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-widest">Terms</a>
              <a href="#" className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-widest">Privacy</a>
              <a href="#" className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-widest">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}