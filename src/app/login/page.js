"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

/**
 * Shining Stars - Ma Thwe Unified Login (v4.8 Final Path Fix)
 * FIX: Redirect to /management/mgt-dashboard for Management role [cite: 2026-02-25]
 * STYLE: 100% Identity Preserved from image_22af95.png [cite: 2023-02-23]
 */
export default function UnifiedLoginPage() {
  const [role, setRole] = useState('STUDENT');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // AUTH CHECK: Auto-redirect if already logged in [cite: 2026-02-25]
  useEffect(() => {
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        // NEW PATH LOGIC [cite: 2026-02-25]
        const target = user.userRole === 'management' ? '/management/mgt-dashboard' : (user.userRole === 'staff' ? '/staff' : '/student');
        router.push(target);
      } catch (e) { 
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
      }
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
          action: 'login', 
          role: role.toLowerCase(), 
          username: username.trim(), 
          password: password.trim() 
        }),
      });

      const result = await res.json();

      if (result.success) {
        const userData = JSON.stringify({ ...result.user, userRole: role.toLowerCase() });
        localStorage.setItem('user', userData); 
        
        // FINAL PATH REDIRECTION [cite: 2026-02-25]
        const path = role === 'MANAGEMENT' ? '/management/mgt-dashboard' : (role === 'STAFF' ? '/staff' : '/student');
        router.push(path);
      } else {
        const backendMsg = result.message || "";
        if (backendMsg.toLowerCase().includes("user") || backendMsg.toLowerCase().includes("name") || backendMsg.includes("မရှိပါ")) {
          setError("Incorrect User Name. Try Again");
        } else if (backendMsg.toLowerCase().includes("password") || backendMsg.includes("မှားယွင်းနေ")) {
          setError("Incorrect Password. Try Again");
        } else {
          setError(`${backendMsg || "Authentication Failed"}. Try Again`);
        }
      }
    } catch (err) {
      setError('Network Failure. Try Again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#4c1d95] flex flex-col font-sans selection:bg-[#fbbf24] font-black text-slate-950">
      <div className="w-full p-8 flex justify-between items-center text-white relative">
        <button onClick={() => router.push('/')} className="flex items-center gap-3 group">
          <div className="bg-white p-2.5 rounded-2xl shadow-xl border border-white/20"><span className="text-2xl">🏠</span></div>
          <span className="font-black text-[10px] uppercase tracking-[0.3em] text-[#fbbf24]">Home</span>
        </button>
        <div className="text-center absolute left-1/2 -translate-x-1/2">
          <h2 className="font-serif font-black text-2xl uppercase italic text-white leading-none">Shining Stars - Ma Thwe</h2>
          <p className="text-[10px] font-black tracking-[0.4em] text-purple-200 mt-2 uppercase italic">Authentication Registry</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-12 md:p-16 rounded-[4.5rem] shadow-2xl flex flex-col items-center border border-slate-100">
          <div className="text-center mb-10">
              <h2 className="text-5xl font-black text-slate-950 uppercase italic tracking-tighter leading-none">Sign In</h2>
              <p className="text-slate-400 font-black text-[10px] uppercase mt-4 italic">Authorized Only</p>
          </div>

          <div className="flex w-full p-1.5 bg-slate-100 rounded-[2.5rem] mb-12 border border-slate-200 font-black">
            {['STUDENT', 'STAFF', 'MANAGEMENT'].map((r) => (
              <button key={r} type="button" onClick={() => { setRole(r); setError(''); }} 
                className={`flex-1 py-4 rounded-[2rem] font-black text-[9px] uppercase tracking-widest transition-all ${role === r ? 'bg-[#4c1d95] text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-10 font-black">
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-950 uppercase tracking-[0.4em] ml-4 italic">User Name</label>
              <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-50 rounded-[2.5rem] font-black text-slate-950 outline-none focus:border-[#4c1d95] italic shadow-inner" placeholder="Registry Name" />
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-950 uppercase tracking-[0.4em] ml-4 italic">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-50 rounded-[2.5rem] font-black text-slate-950 outline-none focus:border-[#4c1d95] pr-24 italic shadow-inner" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-[9px] uppercase text-[#4c1d95] hover:text-purple-800 transition-colors">{showPassword ? "Hide" : "Show"}</button>
              </div>
            </div>

            {error && (
              <div className="w-full p-6 bg-red-50 text-red-600 text-[11px] font-black uppercase text-center rounded-[2.5rem] border-l-[10px] border-red-600 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}
            
            <button type="submit" disabled={loading} className="w-full py-8 bg-slate-950 text-white rounded-[4rem] font-black uppercase tracking-[0.5em] shadow-xl active:scale-95 border-b-[10px] border-[#fbbf24] transition-all hover:bg-black group">
              {loading ? "Verifying Archive..." : (
                <span className="flex items-center justify-center gap-4">
                   Authorize Portal Entry <span className="text-xl group-hover:translate-x-2 transition-transform">★</span>
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
      <div className="p-8 text-center text-white/30 font-black uppercase italic text-[9px] tracking-[1em]">Institutional Interface • Shining Stars Registry</div>
    </div>
  );
}