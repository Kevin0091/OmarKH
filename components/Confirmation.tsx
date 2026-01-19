
import React, { useState } from 'react';
import { AttendanceRecord, Teacher } from '../types';
import { getStudentsForClass } from '../constants';
import { Language, translations } from '../translations';

interface ConfirmationProps {
  teacher: Teacher;
  classId: string;
  records: AttendanceRecord[];
  classTime: string;
  language: Language;
  onDone: () => void;
}

const Confirmation: React.FC<ConfirmationProps> = ({ teacher, classId, records, classTime, language, onDone }) => {
  const t = translations[language];
  const students = getStudentsForClass(classId);

  const presents = records.filter(r => r.isPresent).map(r => students.find(s => s.id === r.studentId)?.name || '');
  const absents = records.filter(r => !r.isPresent).map(r => students.find(s => s.id === r.studentId)?.name || '');
  const billetStudents = records.filter(r => r.isVerified).map(r => students.find(s => s.id === r.studentId)?.name || '');

  // Localized Labels
  const labelTime = language === 'fr' ? 'Heure' : language === 'ar' ? 'الوقت' : 'Time';
  const labelTeacher = language === 'fr' ? 'Enseignant' : language === 'ar' ? 'الأستاذ' : 'Teacher';
  const labelPresents = t.presents;
  const labelAbsents = t.absents;
  const labelBillet = language === 'fr' ? 'Billet' : language === 'ar' ? 'بطاقة' : 'Billet';

  // Format exactly as requested with newlines and double spacing
  const reportBody = `${labelTime} : ${classTime}
${labelTeacher} : ${teacher.name}

${labelPresents} : ${presents.join(', ') || 'None'}

${labelAbsents} : ${absents.join(', ') || 'None'}

${labelBillet} : ${billetStudents.join(', ') || 'None'}`;
  
  const mailToLink = `mailto:lifeaslot@hotmail.com?subject=Attendance Report - ${classId}&body=${encodeURIComponent(reportBody)}`;

  const handleSend = () => {
    window.location.href = mailToLink;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-lg w-full text-center space-y-8 shadow-2xl border dark:border-slate-800 animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t.doneTitle}</h2>
          <p className="text-slate-500 mt-2 font-medium">{t.doneSub}</p>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left ml-2">{t.reportPreview}</p>
          <div className="text-[11px] leading-relaxed text-left text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-5 rounded-3xl border dark:border-slate-800 font-mono shadow-inner whitespace-pre-wrap break-words border-dashed min-h-[150px]">
            {reportBody}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={handleSend} 
            className="w-full py-5 bg-indigo-600 text-white font-black rounded-[1.5rem] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all uppercase tracking-widest"
          >
            {t.sendAdmin}
          </button>
          <button 
            onClick={onDone} 
            className="w-full py-5 text-slate-500 dark:text-slate-400 font-black rounded-[1.5rem] border-2 border-slate-100 dark:border-slate-800 active:scale-95 transition-all uppercase tracking-widest"
          >
            {t.backDash}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
