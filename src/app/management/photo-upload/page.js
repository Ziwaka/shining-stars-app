"use client";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const CLOUD_NAME = 'dg9m3ktno';
const PRESET     = 'shining-stars';
const FOLDERS    = { students: 'shining-stars/students', staff: 'shining-stars/staff' };

export default function PhotoUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [tab, setTab]       = useState('students');
  const [queue, setQueue]   = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]  = useState({ done: 0, total: 0, errors: 0 });
  const [log, setLog]       = useState([]);
  const logRef = useRef(null);

  const addLog = (type, msg) => {
    const time = new Date().toLocaleTimeString('en-GB');
    setLog(prev => [...prev, { type, msg, time }]);
    setTimeout(() => logRef.current?.scrollTo(0, logRef.current.scrollHeight), 50);
  };

  const addFiles = (files) => {
    const newItems = Array.from(files).map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      status: 'waiting',
      preview: URL.createObjectURL(file),
      publicId: file.name.replace(/\.[^/.]+$/, '').trim(),
    }));
    setQueue(prev => [...prev, ...newItems]);
  };

  const removeFile = (id) => setQueue(prev => prev.filter(f => f.id !== id));
  const clearAll   = () => { setQueue([]); setProgress({ done:0, total:0, errors:0 }); setLog([]); };

  const updateStatus = (id, status) =>
    setQueue(prev => prev.map(f => f.id === id ? { ...f, status } : f));

  const startUpload = async () => {
    const pending = queue.filter(f => f.status !== 'done');
    if (!pending.length || uploading) return;
    setUploading(true);
    setProgress({ done: 0, total: pending.length, errors: 0 });

    let done = 0, errors = 0;
    addLog('info', `📤 ${pending.length} files → ${FOLDERS[tab]}`);

    for (const item of pending) {
      updateStatus(item.id, 'uploading');
      const fd = new FormData();
      fd.append('file', item.file);
      fd.append('upload_preset', PRESET);
      fd.append('folder', FOLDERS[tab]);
      fd.append('public_id', item.publicId);

      try {
        const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
        const data = await res.json();
        if (data.secure_url) {
          updateStatus(item.id, 'done');
          addLog('ok', `✅ ${item.file.name} → ${data.public_id}`);
          done++;
        } else {
          updateStatus(item.id, 'error');
          addLog('err', `❌ ${item.file.name}: ${data.error?.message || 'Failed'}`);
          errors++;
        }
      } catch(e) {
        updateStatus(item.id, 'error');
        addLog('err', `❌ ${item.file.name}: ${e.message}`);
        errors++;
      }
      setProgress({ done: done + errors, total: pending.length, errors });
    }

    addLog('info', `🏁 Complete — ✅ ${done} success · ❌ ${errors} errors`);
    setUploading(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="min-h-screen p-4 md:p-10 font-black" style={{ background: '#0f0720', color: '#fff' }}>
      <div className="mx-auto space-y-6" style={{ maxWidth: '1000px' }}>

        {/* HEADER */}
        <div className="flex items-center gap-4 p-6 rounded-[2rem]" style={{ background: '#1e1b4b', border: '4px solid #fbbf24' }}>
          <button
            onClick={() => router.push('/management/mgt-dashboard')}
            className="text-2xl p-3 rounded-xl active:scale-90 transition-all"
            style={{ background: '#fbbf24', color: '#000' }}
          >🔙</button>
          <div>
            <h1 className="text-2xl md:text-4xl uppercase italic tracking-tighter" style={{ color: '#fbbf24' }}>
              📸 Photo Upload
            </h1>
            <p className="text-xs uppercase tracking-widest mt-1" style={{ color: '#7c3aed' }}>
              Cloudinary · shining-stars preset
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-3">
          {['students','staff'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-6 py-3 rounded-full uppercase text-sm transition-all"
              style={{
                background: tab === t ? '#fbbf24' : '#1e1b4b',
                color:      tab === t ? '#000'    : '#94a3b8',
                fontWeight: 900,
              }}
            >
              {t === 'students' ? '👨‍🎓 Students' : '👥 Staff'}
            </button>
          ))}
        </div>

        {/* RULE NOTE */}
        <div className="p-4 rounded-2xl text-sm" style={{ background: '#1e1b4b', borderLeft: '4px solid #fbbf24' }}>
          <span style={{ color: '#fbbf24' }}>File naming: </span>
          <span style={{ color: '#94a3b8' }}>
            {tab === 'students'
              ? '/ ဖယ်ပြီး Enrollment No. — e.g. 26G12001.jpg'
              : 'Staff ID အတိုင်း — e.g. S001.jpg'}
          </span>
        </div>

        {/* DROP ZONE */}
        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-[2rem] p-10 text-center cursor-pointer transition-all"
          style={{ border: '3px dashed #4c1d95', background: '#1e1b4b' }}
        >
          <input
            ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
            onChange={e => addFiles(e.target.files)}
          />
          <div className="text-5xl mb-3">📁</div>
          <p style={{ color: '#94a3b8' }}>
            <span style={{ color: '#fbbf24', fontWeight: 900 }}>Click or Drag & Drop</span> — JPG, PNG, WEBP
          </p>
          <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Photo အများကြီး တစ်ချိန်တည်း ထည့်နိုင်သည်</p>
        </div>

        {/* QUEUE GRID */}
        {queue.length > 0 && (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
            {queue.map(item => (
              <div key={item.id} className="relative rounded-2xl p-3 text-center" style={{ background: '#1e1b4b', opacity: item.status === 'done' ? 0.5 : 1 }}>
                <button
                  onClick={() => removeFile(item.id)}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full text-xs flex items-center justify-center"
                  style={{ background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}
                >✕</button>
                <img src={item.preview} alt="" className="w-full rounded-xl mb-2" style={{ height: '80px', objectFit: 'cover' }} />
                <div className="text-xs truncate" style={{ color: '#fbbf24' }}>{item.file.name}</div>
                <div className="text-xs mt-1" style={{
                  color: { waiting: '#94a3b8', uploading: '#60a5fa', done: '#10b981', error: '#ef4444' }[item.status]
                }}>
                  {{ waiting:'⏳', uploading:'⬆', done:'✅', error:'❌' }[item.status]}
                  {' '}{item.status}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CONTROLS */}
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={startUpload}
            disabled={queue.length === 0 || uploading}
            className="px-8 py-4 rounded-full uppercase text-sm transition-all"
            style={{
              background: queue.length > 0 && !uploading ? '#fbbf24' : '#374151',
              color:      queue.length > 0 && !uploading ? '#000'    : '#6b7280',
              cursor:     queue.length > 0 && !uploading ? 'pointer' : 'not-allowed',
              fontWeight: 900,
            }}
          >
            {uploading ? `⬆ Uploading... ${pct}%` : `▶ Upload All (${queue.filter(f=>f.status!=='done').length})`}
          </button>
          <button
            onClick={clearAll}
            disabled={uploading}
            className="px-6 py-4 rounded-full uppercase text-sm transition-all"
            style={{ background: '#1e1b4b', color: '#94a3b8', border: '2px solid #374151', fontWeight: 900, cursor: 'pointer' }}
          >🗑 Clear</button>
          {progress.total > 0 && (
            <span className="text-sm" style={{ color: '#fbbf24' }}>
              {progress.done}/{progress.total} · {progress.errors} errors
            </span>
          )}
        </div>

        {/* PROGRESS BAR */}
        {progress.total > 0 && (
          <div className="rounded-full overflow-hidden" style={{ background: '#1e1b4b', height: '10px' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, background: 'linear-gradient(to right, #7c3aed, #fbbf24)' }}
            />
          </div>
        )}

        {/* LOG */}
        {log.length > 0 && (
          <div
            ref={logRef}
            className="rounded-2xl p-4 font-mono text-xs space-y-1 overflow-y-auto"
            style={{ background: '#050310', maxHeight: '200px' }}
          >
            {log.map((l, i) => (
              <div key={i} style={{ color: { ok:'#10b981', err:'#ef4444', info:'#60a5fa' }[l.type] }}>
                [{l.time}] {l.msg}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
