"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

export default function LoginPage() {
  const [role, setRole] = useState('STUDENT');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        const target = u.userRole === 'management' ? '/management/mgt-dashboard' : u.userRole === 'staff' ? '/staff' : '/student';
        router.push(target);
      } catch { localStorage.removeItem('user'); sessionStorage.removeItem('user'); }
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action:'login', role:role.toLowerCase(), username:username.trim(), password:password.trim() }),
      });
      const result = await res.json();
      if (result.success) {
        localStorage.setItem('user', JSON.stringify({ ...result.user, userRole: role.toLowerCase() }));
        const path = role === 'MANAGEMENT' ? '/management/mgt-dashboard' : role === 'STAFF' ? '/staff' : '/student';
        router.push(path);
      } else {
        const msg = result.message || '';
        if (msg.includes('မရှိ') || msg.toLowerCase().includes('user')) setError('Username မှားနေတယ်');
        else if (msg.includes('မှားယွင်း') || msg.toLowerCase().includes('password')) setError('Password မှားနေတယ်');
        else setError(msg || 'Login မအောင်မြင်ဘူး');
      }
    } catch { setError('Network error — ပြန်ကြိုးစားပါ'); }
    finally { setLoading(false); }
  };

  const ROLES = [
    { id:'STUDENT', label:'Student', icon:'🎓' },
    { id:'STAFF',   label:'Staff',   icon:'👔' },
    { id:'MANAGEMENT', label:'Mgt', icon:'🏛️' },
  ];

  return (
    <div className="min-h-screen w-full bg-[#0f0a1e] flex flex-col font-black overflow-x-hidden">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#1a0a3e] via-[#0f0a1e] to-[#000]" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <button onClick={() => router.push('/')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
          <span className="text-base">←</span>
          <span className="text-[9px] uppercase tracking-widest">Home</span>
        </button>
        <div className="text-center">
          <p className="text-white font-black text-xs uppercase tracking-widest">Shining Stars</p>
          <p className="text-[#fbbf24] text-[8px] uppercase tracking-widest opacity-70">Ma Thwe</p>
        </div>
        <div className="w-14" />
      </div>

      {/* MAIN CARD */}
      <div className="flex-1 flex items-center justify-center px-5 py-6">
        <div className="w-full max-w-sm">

          {/* Title */}
          <div className="text-center mb-7">
            <h1 className="text-white text-3xl sm:text-4xl font-black uppercase tracking-tight">Sign In</h1>
            <p className="text-white/30 text-[9px] uppercase tracking-[0.3em] mt-2">Authorized Access Only</p>
          </div>

          {/* Role Selector */}
          <div className="flex bg-white/5 rounded-2xl p-1 mb-6 gap-1">
            {ROLES.map(r => (
              <button key={r.id} type="button"
                onClick={() => { setRole(r.id); setError(''); }}
                className={`flex-1 py-3 rounded-xl text-[9px] uppercase tracking-widest font-black transition-all flex flex-col items-center gap-1
                  ${role === r.id ? 'bg-[#4c1d95] text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}>
                <span className="text-base">{r.icon}</span>
                {r.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[9px] text-white/50 uppercase tracking-widest mb-2 ml-1">Username</label>
              <input
                type="text" required value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-white/8 border border-white/10 rounded-2xl px-5 py-4 text-white font-black text-sm outline-none focus:border-[#fbbf24] focus:bg-white/12 transition-all placeholder:text-white/20"
              />
            </div>
            <div>
              <label className="block text-[9px] text-white/50 uppercase tracking-widest mb-2 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/8 border border-white/10 rounded-2xl px-5 py-4 pr-16 text-white font-black text-sm outline-none focus:border-[#fbbf24] focus:bg-white/12 transition-all placeholder:text-white/20"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white text-[9px] uppercase tracking-widest transition-colors">
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl px-5 py-3 text-rose-400 text-xs font-black uppercase tracking-wide text-center">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all border-b-4 active:scale-95 active:border-b-0
                ${loading
                  ? 'bg-[#fbbf24]/50 text-slate-950/50 border-amber-600/30 cursor-not-allowed'
                  : 'bg-[#fbbf24] text-slate-950 border-amber-600 hover:bg-amber-400 shadow-xl'}`}>
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="inline-block w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"/>Verifying...</span>
                : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>

      <p className="text-white/15 text-[7px] uppercase tracking-[0.3em] pb-5 text-center font-black">
        Institutional Interface · Shining Stars
      </p>
    </div>
  );
}
