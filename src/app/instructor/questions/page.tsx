"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function QuestionBankMaintenance() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [filterChapter, setFilterChapter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  
  // 狀態區分：題目表單與章節表單
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [newChapterName, setNewChapterName] = useState('');

  const [formData, setFormData] = useState({ 
    id: null as number | null, question: '', opt0: '', opt1: '', opt2: '', 
    correct: 0, chapter: '', image_url: '', audio_url: '' 
  });

  // 讀取資料
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. 讀取題目 (移除嚴格排序以確保資料能產出)
      const { data: qz, error: qzError } = await supabase.from('quizzes').select('*');
      if (qzError) throw qzError;

      // 2. 讀取章節清單
      const { data: ch, error: chError } = await supabase.from('chapters').select('*').order('name');
      if (chError) throw chError;

      console.log("DB Quizzes:", qz); // 教官可按 F12 檢查此行
      setQuizzes(qz || []);
      setChapters(ch || []);
    } catch (error: any) {
      console.error("Critical Sync Error:", error.message);
      alert("同步失敗，請檢查資料庫 RLS 權限或欄位名稱");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // --- 章節管理邏輯 ---
  const handleAddChapter = async () => {
    if (!newChapterName) return;
    const { error } = await supabase.from('chapters').insert([{ name: newChapterName.trim() }]);
    if (error) {
      alert("章節建立失敗：" + error.message);
    } else {
      setNewChapterName('');
      setShowChapterForm(false);
      await loadData();
    }
  };

  // --- 題目管理邏輯 ---
  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.chapter) return alert("請先選擇所屬章節");

    const payload = {
      question: formData.question, 
      options: [formData.opt0, formData.opt1, formData.opt2],
      correct_answer: formData.correct, 
      chapter: formData.chapter,
      image_url: formData.image_url || null, 
      audio_url: formData.audio_url || null
    };

    let error;
    if (formData.id) {
      const { error: updateError } = await supabase.from('quizzes').update(payload).eq('id', formData.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('quizzes').insert([payload]);
      error = insertError;
    }

    if (error) {
      alert("儲存失敗：" + error.message);
    } else {
      setFilterChapter('ALL'); // 儲存後切換到顯示全部，確保能看到新題目
      resetQuizForm();
      await loadData();
    }
  };

  const resetQuizForm = () => {
    setFormData({ id: null, question: '', opt0: '', opt1: '', opt2: '', correct: 0, chapter: '', image_url: '', audio_url: '' });
    setShowQuizForm(false);
  };

  // 過濾邏輯
  const filteredQuizzes = filterChapter === 'ALL' ? quizzes : quizzes.filter(q => q.chapter === filterChapter);

  if (loading) return <div className="min-h-screen bg-[#0f1115] text-[#d4af37] flex items-center justify-center font-mono italic">SYNCING AVIONICS...</div>;

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#e5e7eb] flex flex-col font-sans">
      <header className="p-6 bg-[#1a1d23] border-b border-white/5 flex justify-between items-center">
        <Link href="/instructor" className="text-[#d4af37] font-black italic tracking-tighter hover:text-white transition-all text-sm">← RETURN TO BASE</Link>
        <h2 className="text-xl font-black tracking-[0.3em] uppercase italic text-center flex-1">Curriculum Asset Manager</h2>
        <div className="w-24"></div> 
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 左側列表區 */}
        <div className="w-[400px] border-r border-white/5 bg-[#14161b] flex flex-col">
          <div className="p-6 space-y-4 border-b border-white/5">
            <button onClick={() => { setShowChapterForm(true); setShowQuizForm(false); }} className="w-full py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all text-sm italic">
              ✚ 建立新訓練章節
            </button>
            <button onClick={() => { setShowQuizForm(true); setShowChapterForm(false); setFormData({ id: null, question: '', opt0: '', opt1: '', opt2: '', correct: 0, chapter: '', image_url: '', audio_url: '' }); }} className="w-full py-4 bg-[#d4af37] text-black font-black rounded-xl text-sm shadow-lg shadow-[#d4af37]/10 hover:scale-[1.02] transition-all">
              ✚ 部署新測驗題目
            </button>
          </div>

          <div className="p-4 border-b border-white/5">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 block px-1">章節過濾器</label>
            <select value={filterChapter} onChange={(e) => setFilterChapter(e.target.value)} className="w-full bg-black border border-white/10 p-3 rounded-xl text-xs font-bold text-[#d4af37] outline-none">
              <option value="ALL">顯示所有題目 ({quizzes.length})</option>
              {chapters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {filteredQuizzes.length === 0 ? (
              <div className="text-center py-10 text-white/10 italic text-sm">此分類下尚無資料</div>
            ) : (
              filteredQuizzes.map(q => (
                <div key={q.id} onClick={() => { setFormData({ id: q.id, question: q.question, opt0: q.options[0], opt1: q.options[1], opt2: q.options[2], correct: q.correct_answer, chapter: q.chapter, image_url: q.image_url || '', audio_url: q.audio_url || '' }); setShowQuizForm(true); setShowChapterForm(false); }}
                  className={`p-5 rounded-3xl border cursor-pointer transition-all ${formData.id === q.id ? 'border-[#d4af37] bg-[#d4af37]/5' : 'border-white/5 bg-[#1a1d23]/50 hover:bg-white/5'}`}>
                  <span className="text-[9px] font-black text-[#d4af37] uppercase tracking-widest block mb-2">{q.chapter}</span>
                  <p className="text-sm font-bold leading-relaxed">{q.question}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右側操作區 */}
        <div className="flex-1 p-16 overflow-y-auto bg-gradient-to-br from-[#0f1115] to-[#16191f]">
          {showChapterForm && (
            <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-top-4">
              <h3 className="text-3xl font-black italic text-white mb-8 tracking-tighter uppercase">New Chapter Assignment</h3>
              <div className="bg-[#1a1d23] p-8 rounded-[32px] border border-white/10 space-y-6 shadow-2xl">
                <div>
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 block">章節名稱</label>
                  <input className="w-full bg-black border border-white/10 p-5 rounded-2xl outline-none focus:border-[#d4af37] text-white font-bold" value={newChapterName} onChange={e=>setNewChapterName(e.target.value)} placeholder="例如: B737 系統操作..." />
                </div>
                <button onClick={handleAddChapter} className="w-full bg-[#d4af37] text-black font-black py-5 rounded-2xl hover:brightness-110 transition-all">確認同步至雲端</button>
              </div>
            </div>
          )}

          {showQuizForm && (
            <form onSubmit={handleSaveQuiz} className="max-w-4xl mx-auto space-y-12 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center border-b border-white/5 pb-8">
                <h3 className="text-4xl font-black italic text-[#d4af37] tracking-tighter uppercase">{formData.id ? 'Modify Strategic Asset' : 'New Flight Mission'}</h3>
                {formData.id && (
                  <button type="button" onClick={async () => { if(confirm("確定刪除？")) { await supabase.from('quizzes').delete().eq('id', formData.id); await loadData(); resetQuizForm(); } }} className="text-red-500 text-xs font-bold hover:underline">DELETE MISSION</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">歸屬章節</label>
                  <select className="w-full bg-[#1a1d23] border border-white/10 p-5 rounded-2xl outline-none text-white font-bold" value={formData.chapter} onChange={e=>setFormData({...formData, chapter: e.target.value})} required>
                    <option value="">請選擇章節...</option>
                    {chapters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">正確指令 (Correct Answer)</label>
                  <select className="w-full bg-[#1a1d23] border border-white/10 p-5 rounded-2xl outline-none text-[#d4af37] font-black" value={formData.correct} onChange={e=>setFormData({...formData, correct: Number(e.target.value)})}>
                    <option value={0}>ALPHA (A)</option><option value={1}>BRAVO (B)</option><option value={2}>CHARLIE (C)</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-3">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">測驗題目本文</label>
                  <textarea className="w-full bg-[#1a1d23] border border-white/10 p-6 rounded-[32px] outline-none focus:border-[#d4af37] h-40 text-lg font-bold" value={formData.question} onChange={e=>setFormData({...formData, question: e.target.value})} required />
                </div>
                <div className="col-span-2 grid grid-cols-3 gap-4">
                  <input className="bg-[#1a1d23] p-4 rounded-xl border border-white/5 outline-none focus:border-[#d4af37]" placeholder="選項 A" value={formData.opt0} onChange={e=>setFormData({...formData, opt0: e.target.value})} required />
                  <input className="bg-[#1a1d23] p-4 rounded-xl border border-white/5 outline-none focus:border-[#d4af37]" placeholder="選項 B" value={formData.opt1} onChange={e=>setFormData({...formData, opt1: e.target.value})} required />
                  <input className="bg-[#1a1d23] p-4 rounded-xl border border-white/5 outline-none focus:border-[#d4af37]" placeholder="選項 C" value={formData.opt2} onChange={e=>setFormData({...formData, opt2: e.target.value})} required />
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-4 opacity-70">
                  <input className="bg-black p-4 rounded-xl border border-white/5 text-xs" placeholder="圖片路徑 (選填 URL)" value={formData.image_url} onChange={e=>setFormData({...formData, image_url: e.target.value})} />
                  <input className="bg-black p-4 rounded-xl border border-white/5 text-xs" placeholder="音訊路徑 (選填 URL)" value={formData.audio_url} onChange={e=>setFormData({...formData, audio_url: e.target.value})} />
                </div>
                <button type="submit" className="col-span-2 bg-[#d4af37] text-black font-black py-6 rounded-[32px] text-xl shadow-xl hover:brightness-110 active:scale-95 transition-all">UPLOAD TO AVIONICS DATABASE</button>
              </div>
            </form>
          )}

          {!showQuizForm && !showChapterForm && (
            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20">
              <div className="text-8xl italic font-black text-white tracking-tighter">VSJX AIR</div>
              <div className="text-xs font-bold tracking-[1em] uppercase">Ready for Command</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}