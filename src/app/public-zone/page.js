import Link from 'next/link';

export default function PublicZoneMenu() {
  return (
    <main className="min-h-screen bg-blue-50 p-6 flex items-center justify-center">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-3xl font-bold text-blue-900 mb-8">🌐 Public Information Zone</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Announcement Link */}
          <Link href="/public-zone/announcements" className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2 border-b-8 border-amber-500 text-center group">
            <div className="text-6xl mb-4 group-hover:scale-110 transition">📢</div>
            <h2 className="text-2xl font-bold text-gray-800">ကျောင်းကြေညာချက်များ</h2>
            <p className="text-gray-500 mt-2">နောက်ဆုံးရသတင်းများနှင့် အသိပေးချက်များ</p>
          </Link>

          {/* Shoutbox Link */}
          <Link href="/public-zone/shoutbox" className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2 border-b-8 border-green-500 text-center group">
            <div className="text-6xl mb-4 group-hover:scale-110 transition">💬</div>
            <h2 className="text-2xl font-bold text-gray-800">Public Shoutbox</h2>
            <p className="text-gray-500 mt-2">သိလိုသည်များကို တိုက်ရိုက်မေးမြန်းရန်</p>
          </Link>
        </div>

        <div className="mt-12">
          <Link href="/" className="text-blue-600 font-semibold hover:underline">◀ ပင်မစာမျက်နှာသို့ ပြန်သွားရန်</Link>
        </div>
      </div>
    </main>
  );
}