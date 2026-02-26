import Link from 'next/link';

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* အပေါ်ပိုင်း - App Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs italic">SS</div>
          <span className="font-bold text-blue-900">Shining Stars App</span>
        </div>
        <Link href="/" className="text-sm text-gray-400 font-medium">Exit</Link>
      </header>

      {/* အလယ်ပိုင်း - Content (ဒီနေရာမှာ Announcements နဲ့ Shoutbox ပေါ်မှာပါ) */}
      <main className="mt-16 flex-1 overflow-y-auto">
        {children}
      </main>

      {/* အောက်ခြေ - Mobile Navigation Bar (Classic App Feel ✨) */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t flex items-center justify-around px-2 z-50 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        
        <Link href="/public-zone/announcements" className="flex flex-col items-center flex-1">
          <span className="text-2xl">📢</span>
          <span className="text-[10px] mt-1 font-bold text-gray-500 uppercase tracking-tighter">News</span>
        </Link>

        {/* Home Button လေးကို အလယ်မှာ အကြီးကြီး ထားမယ် */}
        <Link href="/public-zone" className="flex flex-col items-center -mt-10">
          <div className="bg-blue-600 p-4 rounded-full shadow-lg border-[6px] border-gray-50 transition transform active:scale-90">
            <span className="text-2xl">🏠</span>
          </div>
        </Link>

        <Link href="/public-zone/shoutbox" className="flex flex-col items-center flex-1">
          <span className="text-2xl">💬</span>
          <span className="text-[10px] mt-1 font-bold text-gray-500 uppercase tracking-tighter">Chat</span>
        </Link>

      </nav>
    </div>
  );
}