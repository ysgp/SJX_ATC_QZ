"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function StudentTerminal() {
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [currentQuestions, setCurrentQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [studentName, setStudentName] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState('');
  const [chapters, setChapters] = useState<string[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('quizzes').select('*');
      if (data) {
        setAllQuestions(data);
        const uniqueChapters = Array.from(new Set(data.map((q: any) => q.chapter)));
        setChapters(uniqueChapters as string[]);
        if (uniqueChapters.length) setSelectedChapter(uniqueChapters[0]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleAnswer = async (idx: number) => {
    const newAnswers = [...answers, idx];
    setAnswers(newAnswers);
    if (currentIdx + 1 < currentQuestions.length) setCurrentIdx(currentIdx + 1);
    else {
      const score = Math.round((newAnswers.filter((a, i) => a === currentQuestions[i].correct_answer).length / currentQuestions.length) * 100);
      await supabase.from('submissions').insert([{ student_name: studentName, score, raw_results: newAnswers, analysis: selectedChapter }]);
      setFinished(true);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0f1115] text-[#d4af37] flex items-center justify-center font-mono animate-pulse uppercase tracking-[0.5em]">Linking...</div>;

  if (!isStarted && !finished && !showHistory) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#1a1d23] border-t-4 border-[#d4af37] p-12 rounded-[50px] shadow-2xl">
          <div className="text-center mb-10">
            <h1 className="text-[#d4af37] text-4xl font-black italic tracking-tighter">VSJX <span className="text-white">AIR</span></h1>
            <p className="text-[10px] text-white/20 tracking-[0.5em] mt-3 font-bold uppercase">Aviation Terminal</p>
          </div>
          <div className="space-y-6">
            <input className="w-full bg-black border border-white/5 p-5 rounded-2xl text-white outline-none focus:border-[#d4af37] transition-all font-mono" placeholder="PILOT CALLSIGN" value={studentName} onChange={e=>setStudentName(e.target.value)} />
            <select className="w-full bg-black border border-white/5 p-5 rounded-2xl text-white outline-none focus:border-[#d4af37] transition-all font-bold" value={selectedChapter} onChange={e=>setSelectedChapter(e.target.value)}>
              {chapters.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => { if(!studentName) return alert("CALLSIGN REQUIRED"); setCurrentQuestions(allQuestions.filter(q => q.chapter === selectedChapter)); setIsStarted(true); }} className="w-full bg-[#d4af37] text-black font-black py-5 rounded-2xl shadow-[0_15px_30px_rgba(212,175,55,0.2)] hover:scale-[1.02] transition-all">INITIATE MISSION</button>
            <button onClick={async () => { if(!studentName) return alert("CALLSIGN REQUIRED"); const {data} = await supabase.from('submissions').select('*').eq('student_name', studentName).order('created_at', {ascending: false}); setHistory(data || []); setShowHistory(true); }} className="w-full text-[10px] text-white/20 font-black uppercase tracking-[0.4em] hover:text-[#d4af37] transition-all">Retrieve Records</button>
          </div>
        </div>
      </div>
    );
  }

  if (isStarted && !finished) {
    const q = currentQuestions[currentIdx];
    return (
      <div className="min-h-screen bg-[#0f1115] text-white p-12 flex items-center">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
          <div className="animate-in fade-in slide-in-from-left-10 duration-700">
            <div className="text-[#d4af37] text-xs font-black tracking-[0.3em] mb-6 uppercase italic opacity-50">Task Sequence: {currentIdx + 1} / {currentQuestions.length}</div>
            <h2 className="text-4xl font-bold leading-tight mb-12 italic uppercase tracking-tighter">{q.question}</h2>
            <div className="space-y-5">
              {q.options.map((opt: string, i: number) => (
                <button key={i} onClick={() => handleAnswer(i)} className="w-full bg-[#1a1d23] border border-white/5 p-7 rounded-[24px] text-left hover:bg-[#d4af37] hover:text-black transition-all font-black group flex items-center text-lg">
                  <span className="w-10 h-10 rounded-full border border-white/10 group-hover:border-black/20 flex items-center justify-center mr-6 font-mono">{String.fromCharCode(65+i)}</span>{opt}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-black/60 rounded-[60px] border border-white/5 p-10 h-[600px] flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            {q.image_url ? <img src={q.image_url} className="max-w-full max-h-[85%] rounded-3xl shadow-2xl object-contain border border-white/5" alt="avionics" /> : <div className="text-white/5 font-black text-8xl italic tracking-tighter select-none">VSJX</div>}
            {q.audio_url && (
              <div className="absolute bottom-10 left-10 right-10 bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-[#d4af37]/20">
                <audio controls src={q.audio_url} className="w-full h-8" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const displayList = showHistory ? history : [{ analysis: selectedChapter, score: Math.round((answers.filter((a, i) => a === currentQuestions[i].correct_answer).length / currentQuestions.length) * 100), created_at: new Date(), raw_results: answers }];
  return (
    <div className="min-h-screen bg-[#0f1115] text-white p-12 font-sans flex justify-center overflow-y-auto">
      <div className="max-w-4xl w-full">
        <header className="flex justify-between items-center border-b border-white/5 pb-10 mb-12">
          <div>
            <h2 className="text-5xl font-black italic tracking-tighter uppercase">{showHistory ? "Flight History" : "Mission Debriefing"}</h2>
            <p className="text-[#d4af37] text-[10px] tracking-[0.6em] font-black uppercase mt-3 italic opacity-60">System ID: {studentName} // Archive</p>
          </div>
          <button onClick={() => window.location.reload()} className="bg-white/5 hover:bg-[#d4af37] hover:text-black px-10 py-3 rounded-full text-xs font-black transition-all uppercase tracking-widest">Back</button>
        </header>

        <div className="space-y-8">
          {displayList.map((h, i) => (
            <div key={i} className="bg-[#1a1d23] rounded-[40px] border border-white/5 overflow-hidden transition-all hover:border-[#d4af37]/20">
              <div className="p-10 flex justify-between items-center cursor-pointer" onClick={() => setExpandedHistoryId(expandedHistoryId === (h.id || 'current') ? null : (h.id || 'current'))}>
                <div>
                  <span className="text-[10px] text-[#d4af37] font-black block mb-2 tracking-[0.3em] uppercase opacity-60">{h.analysis}</span>
                  <span className="text-white font-black text-2xl italic uppercase tracking-tighter">{new Date(h.created_at).toLocaleDateString()} Operation Report</span>
                </div>
                <div className="text-right">
                  <div className={`text-6xl font-black italic ${h.score >= 70 ? 'text-[#d4af37]' : 'text-red-600'}`}>{h.score}%</div>
                </div>
              </div>

              {expandedHistoryId === (h.id || 'current') && (
                <div className="bg-black/40 p-10 space-y-8 border-t border-white/5 animate-in slide-in-from-top-4">
                  {allQuestions.filter(q => q.chapter === h.analysis).map((q, qIdx) => {
                    const ans = h.raw_results?.[qIdx];
                    const isWrong = ans !== q.correct_answer;
                    return (
                      <div key={qIdx} className={`p-8 rounded-[32px] border ${isWrong ? 'border-red-950 bg-red-900/5' : 'border-green-950 bg-green-900/5'}`}>
                        <p className="font-bold text-lg mb-6 uppercase tracking-tight leading-relaxed italic">{qIdx + 1}. {q.question}</p>
                        {q.image_url && <img src={q.image_url} className="max-h-64 mb-8 rounded-2xl border border-white/10" />}
                        <div className="grid grid-cols-2 gap-10">
                          <div>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3">Trainee Output</p>
                            <span className={`font-black text-xl italic ${isWrong ? 'text-red-500' : 'text-green-500'}`}>[{String.fromCharCode(65+(ans||0))}] {q.options[ans] || 'NO DATA'}</span>
                          </div>
                          {isWrong && (
                            <div>
                              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3">Standard Command</p>
                              <span className="text-[#d4af37] font-black text-xl italic">[{String.fromCharCode(65+q.correct_answer)}] {q.options[q.correct_answer]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}