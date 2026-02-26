"use client";
import { useState } from 'react';

export default function PointAdjustmentForm({ originalRecord }) {
  // originalRecord ထဲမှာ { id, studentName, oldPoints, reason } စတာတွေ ပါလာပါမယ်
  const [newPoints, setNewPoints] = useState(originalRecord.oldPoints);
  const [adjustmentReason, setAdjustmentReason] = useState("");

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border-2 border-indigo-600 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl">⚖️</div>
        <h3 className="text-xl font-black text-slate-900">Management Adjustment</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-slate-50 rounded-2xl border border-dashed">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Original Points</p>
          <p className="text-2xl font-black text-slate-400 line-through">{originalRecord.oldPoints}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-indigo-600 uppercase">New Points (Adjusted)</p>
          <p className="text-2xl font-black text-indigo-600">{newPoints}</p>
        </div>
      </div>

      <form className="space-y-6">
        {/* Point Input (တိုးခြင်း/လျှော့ခြင်း နှစ်မျိုးလုံးရသည်) */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 uppercase ml-2">Adjust Points (+ or -)</label>
          <input 
            type="number" 
            value={newPoints}
            onChange={(e) => setNewPoints(e.target.value)}
            className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-xl font-bold focus:border-indigo-600 outline-none"
            placeholder="e.g. -10 for penalty"
          />
          <p className="text-[10px] text-slate-400 ml-2 italic">* အမှတ်လျှော့ချင်ပါက ( - ) သင်္ကေတ ထည့်ရိုက်ပါ (ဥပမာ - -5)</p>
        </div>

        {/* Reason for Change */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 uppercase ml-2">Reason for Adjustment / Penalty</label>
          <textarea 
            rows="3" 
            placeholder="Why are you changing these points? (e.g. Disciplinary action / Typing error)"
            className="w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none"
            onChange={(e) => setAdjustmentReason(e.target.value)}
          ></textarea>
        </div>

        <button className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">
          CONFIRM ADJUSTMENT
        </button>
      </form>
    </div>
  );
}