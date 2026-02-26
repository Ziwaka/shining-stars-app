import Link from 'next/link';

export default function Announcements() {
  return (
    <main className="min-h-screen bg-amber-50 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-amber-900">📢 ကျောင်းကြေညာချက်များ</h1>
          <Link href="/public-zone" className="px-4 py-2 bg-white text-amber-800 font-bold rounded-lg shadow">◀ Back</Link>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border-l-8 border-amber-500">
            <span className="text-sm text-gray-400">၂၁ ဖေဖော်ဝါရီ ၂၀၂၆</span>
            <h3 className="text-xl font-bold text-gray-800 mt-2">ကျောင်းအပ်လက်ခံခြင်း</h3>
            <p className="text-gray-600 mt-2">လာမည့် စာသင်နှစ်အတွက် တောင်ကြီးမြို့ရှိ Shining Stars - မသွယ် ကျောင်းတွင် စတင်အပ်နှံနိုင်ပါပြီ။</p>
          </div>
          {/* ထပ်တိုး ကြေညာချက်များကို ဒီနေရာမှာ ထည့်နိုင်သည် */}
        </div>
      </div>
    </main>
  );
}