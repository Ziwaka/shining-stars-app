"use client";
import { useState } from 'react';

export default function LeaveEntryForm({ userRole, staffName }) {
  const [formData, setFormData] = useState({
    studentId: '',
    leaveType: 'Sick Leave',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting Leave Record:", { ...formData, recordedBy: staffName });
    alert("Leave Record Saved Successfully!");
    // ဒီနေရာမှာ နောက်ပိုင်း Google Sheet API နဲ့ ချိတ်ပါမယ်
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-2xl">📝</div>
        <div>
          <h3 className="text-xl font-black text-slate-800">New Leave Record</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Entry by: {staffName} ({userRole})</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student ID */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase ml-2">Student ID</label>
          <input 
            type="text" 
            placeholder="e.g. SS-001" 
            required
            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 transition"
            onChange={(e) => setFormData({...formData, studentId: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Leave Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-2">Leave Type</label>
            <select 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 transition appearance-none"
              onChange={(e) => setFormData({...formData, leaveType: e.target.value})}
            >
              <option>Sick Leave</option>
              <option>Funeral (နာရေး)</option>
              <option>Personal Affair (ကိစ္စရှိ၍)</option>
              <option>Home Visit (အိမ်ပြန်)</option>
            </select>
          </div>

          {/* Dates */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-2">Duration (Days)</label>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                required
                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm"
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              />
              <span className="text-slate-300">to</span>
              <input 
                type="date" 
                required
                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm"
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase ml-2">Reason / Remark</label>
          <textarea 
            rows="3" 
            placeholder="Enter detailed reason here..."
            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 transition"
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
          ></textarea>
        </div>

        <button 
          type="submit"
          className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black shadow-lg hover:bg-rose-600 active:scale-95 transition"
        >
          SAVE RECORD
        </button>
      </form>
    </div>
  );
}