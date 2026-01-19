
import React, { useState, useMemo } from 'react';
import { Teacher } from '../types';
import { Language, translations } from '../translations';
import { storage } from '../services/storage';
import { GoogleGenAI } from "@google/genai";

interface DashboardProps {
  teacher: Teacher;
  language: Language;
  onSelectClass: (classId: string) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  isSyncing: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ teacher, language, onSelectClass, onLogout, onOpenSettings, isSyncing }) => {
  const t = translations[language];
  const lastSummary = storage.getLastSummary();
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Calculate total absents across all classes the teacher teaches based on the most recent sessions
  const totalTeacherAbsents = useMemo(() => {
    let total = 0;
    teacher.classes.forEach(classId => {
      const lastSessionTime = storage.getPreviousSessionTime(classId);
      if (lastSessionTime) {
        const absents = storage.getAbsenteesByTimestamp(classId, lastSessionTime);
        total += absents.length;
      }
    });
    return total;
  }, [teacher.classes, isSyncing]);

  const hasAbsenteesInRegistry = (classId: string) => {
    const lastSessionTime = storage.getPreviousSessionTime(classId);
    if (!lastSessionTime) return false;
    const globalAbsences = storage.getAbsenteesByTimestamp(classId, lastSessionTime);
    return globalAbsences.length > 0;
  };

  const getAiBriefing = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const globalData = storage.getAllGlobalAbsences();
      
      const prompt = `Based on ${totalTeacherAbsents} absents in Professor ${teacher.name}'s classes, give a 1-sentence supportive advice (max 8 words) in ${language === 'en' ? 'English' : language === 'ar' ? 'Arabic' : 'French'}. No fluff.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAiInsight(response.text?.trim() || "All systems nominal.");
    } catch (error) {
      console.error("AI Insight Error:", error);
      setAiInsight("AI unavailable.");
    } finally {
      setIsAiLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <header className="flex justify-between items-start mb-6 max-w-4xl mx-auto">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {t.hello}, <span className="text-indigo-600 dark:text-indigo-400">{t.professor} {teacher.name.split(' ')[0]}</span>
            </h1>
            {isSyncing ? (
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-900/40">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">{t.syncing}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full border border-green-100 dark:border-green-900/40">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="text-[8px] font-black text-green-600 uppercase tracking-tighter">{t.upToDate}</span>
              </div>
            )}
          </div>
          <p className="text-slate-400 dark:text-slate-500 font-medium text-sm">{t.selectClass}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenSettings}
            className="p-3 bg-white dark:bg-slate-900 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:scale-110 active:scale-90"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto space-y-6">
        {/* AI Insight Section - Redesigned to be smaller and focused on numbers */}
        <section className="bg-indigo-600 rounded-[2.5rem] p-6 shadow-xl shadow-indigo-500/30 text-white relative overflow-hidden group border-2 border-white/10 transition-all active:scale-[0.98]">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
          
          <div className="relative z-10 flex flex-col items-center sm:items-start text-center sm:text-left gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <svg className="w-5 h-5 text-indigo-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="font-black uppercase tracking-[0.15em] text-xs">{t.aiMonitor}</h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 w-full">
              <div className="flex flex-col">
                <span className="text-4xl font-black tracking-tighter drop-shadow-lg">{totalTeacherAbsents}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">{t.absents} {language === 'en' ? 'Today' : language === 'ar' ? 'اليوم' : 'Aujourd\'hui'}</span>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                {aiInsight ? (
                  <div className="animate-in fade-in slide-in-from-left-2 duration-500">
                    <p className="text-sm font-bold text-white leading-tight">
                      {aiInsight}
                    </p>
                    <button 
                      onClick={() => setAiInsight(null)}
                      className="text-[9px] font-black uppercase tracking-widest text-white/40 mt-1 hover:text-white"
                    >
                      {language === 'en' ? 'Refresh' : language === 'ar' ? 'تحديث' : 'Rafraîchir'}
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={getAiBriefing}
                    disabled={isAiLoading}
                    className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isAiLoading ? t.aiThinking : t.getAiBriefing}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Last Attendance Summary Card */}
        {lastSummary && (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t.lastSessionSummary}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-lg font-black text-slate-900 dark:text-white leading-none">
                    {lastSummary.classId}
                  </p>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full uppercase">
                    {lastSummary.time}
                  </span>
                </div>
                <p className="text-sm font-bold text-red-500 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  {lastSummary.absentCount} {t.absents}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
          {teacher.classes.map(c => {
            const showAlert = hasAbsenteesInRegistry(c);
            return (
              <button
                key={c}
                onClick={() => onSelectClass(c)}
                className="group relative p-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm hover:shadow-indigo-200/50 dark:hover:shadow-indigo-500/10 transition-all border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center space-y-4 hover:border-indigo-400 hover:-translate-y-1 active:scale-95"
              >
                {showAlert && (
                  <div className="absolute top-4 right-4 flex items-center justify-center">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white dark:border-slate-900"></span>
                    </span>
                  </div>
                )}
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-inner">
                  <span className="text-xl font-black">{c.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-tight line-clamp-2">
                    {c}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                     {t.class}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
