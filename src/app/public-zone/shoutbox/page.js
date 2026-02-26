import Link from 'next/link';

export default function Shoutbox() {
  return (
    <main className="min-h-screen bg-green-50 p-4 flex flex-col items-center">
      <div className="max-w-2xl w-full flex flex-col h-[90vh]">
        <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-xl shadow-sm">
          <h1 className="text-2xl font-bold text-green-800">💬 Public Shoutbox</h1>
          <Link href="/public-zone" className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg">◀ Back</Link>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-lg p-6 overflow-y-auto mb-4 border border-green-100 space-y-4">
           {/* Chat messages would go here */}
           <div className="bg-gray-100 p-3 rounded-xl rounded-tl-none self-start max-w-[80%]">
             <p className="text-sm">မင်္ဂလာပါရှင်၊ ကျောင်းအပ်ခလေး သိချင်ပါတယ်ရှင်။</p>
           </div>
        </div>

        <div className="flex gap-2">
          <input type="text" placeholder="စာရိုက်ပါ..." className="flex-1 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-400 outline-none" />
          <button className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold">ပို့မည်</button>
        </div>
      </div>
    </main>
  );
}