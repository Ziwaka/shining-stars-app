"use client";
import { useState } from 'react';
import { formatDateDisplay } from './DateHelpers';

export default function GradeBreakdown({ data, title, onPrint, onViewDetails }) {
  const [modalGrade, setModalGrade] = useState(null);
  const [modalUsers, setModalUsers] = useState([]);

  const openModal = (grade, users) => {
    setModalGrade(grade);
    setModalUsers(users);
  };

  const closeModal = () => {
    setModalGrade(null);
    setModalUsers([]);
  };

  return (
    <>
      {/* Main breakdown cards */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <button 
            onClick={onPrint}
            className="bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 transition-all"
          >
            🖨️ Print
          </button>
        </div>
        <div className="space-y-4">
          {Object.entries(data).map(([grade, users]) => {
            const displayUsers = users.slice(0, 5);
            const remaining = users.length - 5;
            return (
              <div key={grade} className="border-b border-slate-100 pb-3 last:border-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-amber-600">
                    {grade === 'Unknown' ? 'အတန်းမသတ်မှတ်ရသေး' : `Grade ${grade}`}
                  </span>
                  <span className="text-sm bg-slate-100 px-3 py-1 rounded-full font-black">
                    {users.length} ဦး
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {displayUsers.map((u, i) => (
                    <div 
                      key={i} 
                      className="text-xs bg-slate-50 p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-all"
                      onClick={() => onViewDetails && onViewDetails(u)}
                    >
                      <p className="font-black truncate">{u.name}</p>
                      <p className="text-[8px] text-slate-400">{u.totalDays || 0} days</p>
                      {u.reason && u.reason !== '-' && (
                        <p className="text-[10px] text-slate-600 line-clamp-1">"{u.reason}"</p>
                      )}
                      {u.remark && u.remark !== '-' && u.remark !== '' && (
                        <p className="text-amber-600 text-[8px] font-bold mt-1 flex items-start gap-1">
                          <span>✏️</span><span className="truncate">{u.remark}</span>
                        </p>
                      )}
                    </div>
                  ))}
                  {remaining > 0 && (
                    <button
                      onClick={() => openModal(grade, users)}
                      className="text-xs bg-slate-100 p-2 rounded-lg hover:bg-slate-200 transition-all flex items-center justify-center font-black text-slate-500"
                    >
                      +{remaining} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for full list */}
      {modalGrade && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b border-slate-200 shrink-0">
              <h4 className="text-lg font-black text-slate-900">
                {modalGrade === 'Unknown' ? 'အတန်းမသတ်မှတ်ရသေး' : `Grade ${modalGrade}`}
                <span className="ml-2 text-sm font-normal text-slate-500">({modalUsers.length} ဦး)</span>
              </h4>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {modalUsers.map((u, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 p-3 rounded-xl hover:bg-slate-100 cursor-pointer transition-all"
                  onClick={() => {
                    onViewDetails && onViewDetails(u);
                    closeModal(); // close the modal after opening user detail
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-slate-900">{u.name}</p>
                      <p className="text-[10px] text-slate-500">ID: {u.id || '-'}</p>
                    </div>
                    <span className="text-sm font-black text-amber-600">{u.totalDays || 0}d</span>
                  </div>
                  {u.reason && u.reason !== '-' && (
                    <p className="text-[11px] text-slate-600 mt-1 italic line-clamp-2">"{u.reason}"</p>
                  )}
                  {u.remark && u.remark !== '-' && u.remark !== '' && (
                    <p className="text-amber-600 text-[10px] font-bold mt-1 flex items-start gap-1">
                      <span>✏️</span><span>{u.remark}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}