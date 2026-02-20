"use client";
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function InstructorDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'students'>('overview');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  
  const reportRef = useRef<HTMLDivElement>(null);

  // 1. 強化的數據讀取邏輯 (保留原始邏輯)
  const loadData = async () => {
    setLoading(true);
    try {
      console.log("開始同步航電數據...");
      const { data: qz, error: qzErr } = await supabase.from('quizzes').select('*');
      const { data: sb, error: sbErr } = await supabase.from('submissions').select('*').order('created_at', { ascending: false });
      
      if (qzErr) throw qzErr;
      if (sbErr) throw sbErr;

      setQuizzes(qz || []);
      setSubmissions(sb || []);
      console.log("同步完成，取得題目：", qz?.length, " 取得成績：", sb?.length);
    } catch (err: any) {
      console.error("數據提取失敗:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // 2. 數據計算安全化 (保留原始邏輯)
  const safeSubmissions = submissions || [];
  const safeQuizzes = quizzes || [];

  const stats = {
    avgScore: safeSubmissions.length 
      ? (safeSubmissions.reduce((a, b) => a + (Number(b.score) || 0), 0) / safeSubmissions.length).toFixed(1) 
      : "0",
    totalStudents: new Set(safeSubmissions.map(s => s.student_name).filter(Boolean)).size,
    passRate: safeSubmissions.length 
      ? ((safeSubmissions.filter(s => (Number(s.score) || 0) >= 70).length / safeSubmissions.length) * 100).toFixed(0) 
      : "0"
  };

  // 3. 徹底解決 oklab 報錯的 PDF 匯出邏輯
  const exportPDF = async () => {
    if (!reportRef.current) return;
    
    const btn = document.activeElement as HTMLButtonElement;
    const originalText = btn ? btn.innerText : "";
    if (btn) btn.innerText = "PREPARING ENGINE...";

    try {
      const canvas = await html2canvas(reportRef.current, { 
        scale: 2, 
        backgroundColor: '#0f1115', 
        useCORS: true,
        logging: false,
        // 核心解決方案：克隆 DOM 並清洗所有不支援的色彩函數
        onclone: (clonedDoc) => {
          const allElements = clonedDoc.getElementsByTagName("*");
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            const computedStyle = window.getComputedStyle(el);
            
            // 檢查文字顏色與背景色是否包含 oklab / oklch
            ['color', 'backgroundColor', 'borderColor', 'outlineColor'].forEach((prop) => {
              const value = (computedStyle as any)[prop];
              if (value && (value.includes('oklab') || value.includes('oklch'))) {
                // 如果是 oklab 則強制轉為安全色 (白色或透明)
                // 這是最保險的做法，避免引擎在解析 CSS 時崩潰
                if (prop === 'color') el.style.color = '#ffffff';
                if (prop === 'backgroundColor') el.style.backgroundColor = 'transparent';
                if (prop === 'borderColor') el.style.borderColor = '#333333';
              }
            });
          }
        },
        ignoreElements: (el) => el.classList.contains('no-export')
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`VSJX_DEBRIEF_${selectedStudent}_${new Date().toISOString().slice(0,10)}.pdf`);
      
      if (btn) btn.innerText = "REPORT GENERATED";
      setTimeout(() => { if (btn) btn.innerText = originalText; }, 2000);

    } catch (err: any) {
      console.error("PDF Engine Crash:", err);
      alert(`報表引擎故障: ${err.message}\n請再次嘗試，若持續失敗請重整網頁。`);
      if (btn) btn.innerText = "ENGINE ERROR";
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f1115] text-[#d4af37] flex flex-col items-center justify-center font-mono italic">
      <div className="text-2xl animate-pulse mb-4">LOADING FLIGHT DATA...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#e5e7eb] flex font-sans selection:bg-[#d4af37] selection:text-black">
      {/* 側邊導航 (保留) */}
      <aside className="w-72 bg-[#1a1d23] border-r border-white/5 p-8 flex flex-col">
        <div className="mb-12">
          <h1 className="text-[#d4af37] text-2xl font-black italic tracking-tighter uppercase">VSJX <span className="text-white font-light">AIR</span></h1>
          <p className="text-[9px] text-white/20 tracking-[0.5em] uppercase mt-1 font-bold font-mono">Operations Control</p>
        </div>
        <nav className="space-y-2 flex-1">
          <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-6 py-4 rounded-2xl font-black transition-all text-xs tracking-widest ${activeTab === 'overview' ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>OVERVIEW</button>
          <button onClick={() => setActiveTab('students')} className={`w-full text-left px-6 py-4 rounded-2xl font-black transition-all text-xs tracking-widest ${activeTab === 'students' ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>STUDENT LOGS</button>
          <div className="pt-8 mt-8 border-t border-white/5">
            <Link href="/instructor/questions" className="block text-center py-4 rounded-xl border border-[#d4af37]/30 text-[#d4af37] text-[10px] font-black tracking-widest hover:bg-[#d4af37] hover:text-black transition-all uppercase italic">Asset Management</Link>
          </div>
        </nav>
      </aside>

      <main className="flex-1 p-12 overflow-y-auto">
        {activeTab === 'overview' ? (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-black mb-12 italic tracking-tighter uppercase">Operational <span className="text-[#d4af37]">Metrics</span></h2>
            {/* 這裡維持你原本的 Stats Grid */}
            <div className="grid grid-cols-3 gap-8 mb-12">
              <div className="bg-[#1a1d23] p-10 rounded-[40px] border border-white/5">
                <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Avg Performance</p>
                <div className="text-6xl font-black text-[#d4af37] italic">{stats.avgScore}%</div>
              </div>
              <div className="bg-[#1a1d23] p-10 rounded-[40px] border border-white/5">
                <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Success Rate</p>
                <div className="text-6xl font-black text-green-500 italic">{stats.passRate}%</div>
              </div>
              <div className="bg-[#1a1d23] p-10 rounded-[40px] border border-white/5">
                <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Trainees</p>
                <div className="text-6xl font-black text-white italic">{stats.totalStudents}</div>
              </div>
            </div>
            {/* Curriculum Index ... */}
            <div className="bg-[#1a1d23] p-12 rounded-[48px] border border-white/5">
              <h4 className="text-xs font-black text-[#d4af37] uppercase tracking-[0.4em] mb-10 italic">Curriculum Proficiency Index</h4>
              <div className="space-y-10">
                {Array.from(new Set(safeQuizzes.map(q => q.chapter).filter(Boolean))).map(ch => {
                  const chapterSubmissions = safeSubmissions.filter(s => s.analysis === ch);
                  const avg = chapterSubmissions.length ? (chapterSubmissions.reduce((a,b) => a + (Number(b.score) || 0), 0) / chapterSubmissions.length).toFixed(0) : "0";
                  return (
                    <div key={ch as string}>
                      <div className="flex justify-between items-end mb-4">
                        <span className="text-sm font-black uppercase tracking-widest text-white/80">{ch as string}</span>
                        <span className="text-xs font-mono text-[#d4af37]">{avg}%</span>
                      </div>
                      <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-[#d4af37]" style={{ width: `${avg}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-10 max-w-7xl mx-auto">
            <div className="col-span-4 space-y-3">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-6 px-2">Personnel Database</p>
              {Array.from(new Set(safeSubmissions.map(s => s.student_name).filter(Boolean))).map(name => (
                <button key={name} onClick={() => setSelectedStudent(name)} className={`w-full p-6 rounded-[28px] text-left border transition-all ${selectedStudent === name ? 'bg-[#d4af37] border-[#d4af37] text-black shadow-2xl' : 'bg-[#1a1d23] border-white/5'}`}>
                  <div className="font-black text-lg italic uppercase">{name}</div>
                  <div className="text-[9px] uppercase mt-1 font-mono opacity-50">Flight Record: Active</div>
                </button>
              ))}
            </div>

            <div className="col-span-8">
              {selectedStudent ? (
                <div className="space-y-6">
                  <div className="flex justify-end no-export">
                    <button onClick={exportPDF} className="bg-white text-black text-[10px] font-black px-8 py-3 rounded-full hover:bg-[#d4af37] transition-all tracking-[0.2em] uppercase italic">
                      Generate PDF Debriefing
                    </button>
                  </div>

                  {/* 重新設計過的 PDF 報表視覺（更像專業飛行報告） */}
                  <div ref={reportRef} className="bg-[#111318] p-12 border border-white/10 rounded-sm" style={{ width: '800px' }}>
                    <div className="border-b-4 border-[#d4af37] pb-8 mb-10 flex justify-between items-end">
                      <div>
                        <h2 className="text-5xl font-black italic tracking-tighter uppercase text-white mb-2">{selectedStudent}</h2>
                        <div className="text-[#d4af37] font-mono text-xs tracking-widest font-bold">DEBRIEFING REPORT // INTERNAL AUDIT</div>
                      </div>
                      <div className="text-right text-white/20 font-mono text-[10px] uppercase leading-relaxed">
                        DATE: {new Date().toLocaleDateString()}<br/>
                        VSJX ACADEMY OPERATIONS
                      </div>
                    </div>

                    <div className="space-y-12">
                      {safeSubmissions.filter(s => s.student_name === selectedStudent).map((sub, idx) => {
                        const subQuizzes = safeQuizzes.filter(q => q.chapter?.trim() === sub.analysis?.trim());
                        return (
                          <div key={idx} className="border border-white/5 bg-white/[0.02] p-8 rounded-xl">
                            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                              <div>
                                <span className="bg-[#d4af37] text-black text-[10px] font-black px-3 py-1 uppercase italic mr-3">MISSION</span>
                                <span className="text-xl font-black italic text-white uppercase">{sub.analysis}</span>
                              </div>
                              <div className={`text-5xl font-black italic ${sub.score >= 70 ? 'text-green-500' : 'text-red-500'}`}>{sub.score}%</div>
                            </div>

                            <div className="space-y-4">
                              {subQuizzes.map((q, qIdx) => {
                                const ansIdx = sub.raw_results?.[qIdx];
                                const isCorrect = ansIdx === q.correct_answer;
                                return (
                                  <div key={qIdx} className="grid grid-cols-12 gap-4 py-3 border-b border-white/5 items-center">
                                    <div className="col-span-1 text-[10px] font-mono opacity-30">#{qIdx+1}</div>
                                    <div className="col-span-7 text-xs font-bold text-white/80">{q.question}</div>
                                    <div className="col-span-4 text-right">
                                      <div className={`text-[10px] font-mono ${isCorrect ? 'text-green-500' : 'text-red-400 font-bold'}`}>
                                        {String.fromCharCode(65+ansIdx)}: {q.options?.[ansIdx]}
                                      </div>
                                      {!isCorrect && (
                                        <div className="text-[#d4af37] text-[10px] font-mono mt-1 font-bold">
                                          TRUE: {String.fromCharCode(65+q.correct_answer)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-20 pt-10 border-t border-dashed border-white/10 flex justify-between items-center">
                      <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest italic">Authenticity verified by VSJX System Log</div>
                      <div className="w-32 h-px bg-[#d4af37]/30"></div>
                      <div className="text-[#d4af37] font-black italic text-sm">FLIGHT COMMAND</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full border-2 border-dashed border-white/5 rounded-[48px] flex flex-col items-center justify-center text-white/5">
                  <div className="text-8xl font-black italic uppercase">VSJX</div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}