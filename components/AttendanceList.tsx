
import React, { useState, useEffect } from 'react';
import { Student, AttendanceRecord, Teacher } from '../types';
import { getStudentsForClass } from '../constants';
import { Language, translations } from '../translations';
import { storage } from '../services/storage';

interface AttendanceListProps {
  teacher: Teacher;
  classId: string;
  language: Language;
  onBack: () => void;
  onConfirm: (records: AttendanceRecord[], classTime: string) => void;
}

const AttendanceList: React.FC<AttendanceListProps> = ({ teacher, classId, language, onBack, onConfirm }) => {
  const t = translations[language];
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [showVerifiedToast, setShowVerifiedToast] = useState(false);

  useEffect(() => {
    const classStudents = getStudentsForClass(classId);
    
    // 1. Identify the LATEST session timestamp for this specific class
    const lastSessionTime = storage.getPreviousSessionTime(classId);
    
    // 2. Identify the specific student IDs from that session that were absent
    const absentIds = lastSessionTime 
      ? storage.getAbsenteesByTimestamp(classId, lastSessionTime)
      : [];
    
    const studentsWithAbsenceStatus = classStudents.map(s => ({
      ...s,
      wasAbsentLastHour: absentIds.includes(s.id)
    }));

    setStudents(studentsWithAbsenceStatus);
    
    // Initialize or load current records
    const saved = localStorage.getItem(`attendance_draft_${classId}`);
    if (saved) {
      setRecords(JSON.parse(saved));
    } else {
      const initial: Record<string, AttendanceRecord> = {};
      studentsWithAbsenceStatus.forEach(s => {
        initial[s.id] = {
          studentId: s.id,
          isPresent: false,
          hasBillet: false,
          isVerified: false
        };
      });
      setRecords(initial);
    }
  }, [classId]);

  // Persist draft to local storage
  useEffect(() => {
    if (Object.keys(records).length > 0) {
      localStorage.setItem(`attendance_draft_${classId}`, JSON.stringify(records));
    }
  }, [records, classId]);

  const handleCheck = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    const record = records[studentId];

    // BLOCKER: Prevent marking present if student was absent last hour AND hasn't been verified
    if (!record.isPresent && student?.wasAbsentLastHour && !record.isVerified) {
      setAlertMessage(student.name);
      return;
    }

    setRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], isPresent: !prev[studentId].isPresent }
    }));
  };

  const handleVerify = (studentId: string) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], isVerified: true, isPresent: true }
    }));
    
    setShowVerifiedToast(true);
    const timer = setTimeout(() => {
      setShowVerifiedToast(false);
    }, 2000);
    return () => clearTimeout(timer);
  };

  const handleVerifyAll = () => {
    const updatedRecords = { ...records };
    let changed = false;

    students.forEach(student => {
      if (student.wasAbsentLastHour && !records[student.id].isVerified) {
        updatedRecords[student.id] = {
          ...updatedRecords[student.id],
          isVerified: true,
          isPresent: true
        };
        changed = true;
      }
    });

    if (changed) {
      setRecords(updatedRecords);
      setShowVerifiedToast(true);
      setTimeout(() => setShowVerifiedToast(false), 2000);
    }
  };

  const handleMarkAllPresent = () => {
    const updatedRecords = { ...records };
    students.forEach(student => {
      const record = updatedRecords[student.id];
      // Rule: Mark present only if they don't need a billet OR are already verified
      if (!student.wasAbsentLastHour || record.isVerified) {
        updatedRecords[student.id] = { ...record, isPresent: true };
      }
    });
    setRecords(updatedRecords);
  };

  const handleConfirm = () => {
    const classTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    // Clear draft upon confirmation
    localStorage.removeItem(`attendance_draft_${classId}`);
    onConfirm(Object.values(records) as AttendanceRecord[], classTime);
  };

  const presentCount = (Object.values(records) as AttendanceRecord[]).filter(r => r.isPresent).length;
  const teacherSubject = (teacher.subjects && teacher.subjects.length > 0) ? teacher.subjects[0] : "General";
  
  const needsVerificationCount = students.filter(s => s.wasAbsentLastHour && !records[s.id]?.isVerified).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl dark:text-slate-300 transition-colors active:scale-90">
            <svg className={`w-6 h-6 ${language === 'ar' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{classId}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {presentCount} / {students.length} {t.presents}
              </span>
              <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                {teacherSubject}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-3 pb-32">
        {/* Bulk Action Buttons Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 animate-in slide-in-from-top duration-500">
          {/* Verify All Billets (Conditional) */}
          {needsVerificationCount > 0 && (
            <button
              onClick={handleVerifyAll}
              className="flex items-center justify-between p-4 bg-red-500 hover:bg-red-600 text-white rounded-[1.5rem] shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-black uppercase tracking-widest text-[10px] leading-none">{t.verifyAll}</p>
                  <p className="text-[8px] opacity-80 mt-1">{needsVerificationCount} {t.absents}</p>
                </div>
              </div>
            </button>
          )}

          {/* Mark All Present */}
          <button
            onClick={handleMarkAllPresent}
            className="flex items-center justify-between p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7m-14 0l4 4L19 7" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-black uppercase tracking-widest text-[10px] leading-none">{t.markAllPresent}</p>
                <p className="text-[8px] opacity-80 mt-1">{students.length - needsVerificationCount} {t.presents}</p>
              </div>
            </div>
          </button>
        </div>

        {students.map(student => {
          const record = records[student.id];
          if (!record) return null;

          return (
            <div 
              key={student.id} 
              className={`p-4 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-sm border transition-all duration-300 flex items-center justify-between ${
                record.isPresent 
                ? 'border-green-500 bg-green-50/50 dark:bg-green-500/5' 
                : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200'
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex items-center gap-3">
                  <div className="relative w-8 h-8">
                    <input
                      type="checkbox"
                      checked={record.isPresent}
                      onChange={() => handleCheck(student.id)}
                      className="peer absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                    />
                    <div className={`absolute inset-0 rounded-xl border-2 flex items-center justify-center transition-all ${
                      record.isPresent 
                      ? 'bg-indigo-600 border-indigo-600' 
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}>
                      {record.isPresent && (
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  
                  {student.wasAbsentLastHour && (
                    <button
                      onClick={() => handleVerify(student.id)}
                      disabled={record.isVerified}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm ${
                        record.isVerified 
                        ? 'bg-green-500 text-white cursor-default scale-95' 
                        : 'bg-red-500 text-white hover:bg-red-600 active:scale-95'
                      }`}
                    >
                      {record.isVerified ? t.verified : t.verify}
                    </button>
                  )}
                </div>
                <div>
                  <h3 className={`font-bold transition-colors ${record.isPresent ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                    {student.name}
                  </h3>
                  {student.wasAbsentLastHour && !record.isVerified && (
                    <p className="text-[10px] text-red-500 font-black uppercase tracking-tighter flex items-center gap-1 mt-0.5">
                      <span className="w-1 h-1 bg-red-500 rounded-full animate-ping"></span>
                      {t.absentLast}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* Verification Toast */}
      {showVerifiedToast && (
        <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div className="bg-green-500 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex flex-col items-center gap-2 border-4 border-white/20">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-black text-lg uppercase tracking-widest">{t.verified}</span>
          </div>
        </div>
      )}

      {/* Modal Alert for missing billet */}
      {alertMessage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] max-w-xs w-full text-center space-y-6 shadow-2xl border dark:border-slate-800 animate-in zoom-in duration-200">
            <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase leading-none">{alertMessage}</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {t.billetNeeded}
              </p>
            </div>
            <button 
              onClick={() => setAlertMessage(null)} 
              className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg uppercase tracking-widest active:scale-95 transition-all"
            >
              {t.understand}
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button for Confirming */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800">
        <button 
          onClick={handleConfirm} 
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
        >
          {t.confirm}
        </button>
      </div>
    </div>
  );
};

export default AttendanceList;
