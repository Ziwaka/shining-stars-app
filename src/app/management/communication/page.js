"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

export default function CommunicationPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F0F9FF] flex flex-col items-center justify-center p-6 font-black text-slate-950">
      <div className="bg-white p-14 rounded-[4rem] shadow-2xl border-b-[15px] border-slate-950 text-center space-y-8">
        <div className="text-8xl">📡</div>
        <h1 className="text-4xl italic uppercase tracking-tighter">Communication Hub</h1>
        <p className="text-slate-400 text-xs uppercase tracking-widest">Module under construction by GM Authority</p>
        <button 
          onClick={() => router.back()}
          className="px-10 py-4 bg-slate-950 text-white rounded-3xl text-sm uppercase italic hover:scale-105 transition-all shadow-xl"
        >
          Go Back ⬅️
        </button>
      </div>
    </div>
  );
}
