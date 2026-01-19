
import React, { useState, useEffect } from 'react';
import { AppScreen, Teacher, AttendanceRecord } from './types';
import { storage } from './services/storage';
import { Language } from './translations';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AttendanceList from './components/AttendanceList';
import Confirmation from './components/Confirmation';
import Settings from './components/Settings';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.AUTH);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [currentRecords, setCurrentRecords] = useState<AttendanceRecord[]>([]);
  const [currentClassTime, setCurrentClassTime] = useState<string>('');
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('fr');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const savedLang = storage.getLang();
    setLanguage(savedLang);
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = savedLang;

    const isDark = storage.getTheme();
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const savedTeacher = storage.getCurrentTeacher();
    if (savedTeacher) {
      setTeacher(savedTeacher);
      setScreen(AppScreen.DASHBOARD);
    }

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleAuthSuccess = (t: Teacher) => {
    setTeacher(t);
    storage.setCurrentTeacher(t);
    setScreen(AppScreen.DASHBOARD);
  };

  const handleLogout = () => {
    storage.setCurrentTeacher(null);
    setTeacher(null);
    setScreen(AppScreen.AUTH);
  };

  const handleSelectClass = (classId: string) => {
    setSelectedClass(classId);
    setScreen(AppScreen.ATTENDANCE);
  };

  const handleConfirmAttendance = async (records: AttendanceRecord[], time: string) => {
    setCurrentRecords(records);
    setCurrentClassTime(time);
    setIsSyncing(true);
    
    // 1. Save last session summary to local storage
    const absentRecords = records.filter(r => !r.isPresent);
    const absentCount = absentRecords.length;
    storage.saveLastSummary({
      classId: selectedClass,
      absentCount,
      time
    });

    // 2. Save absentees to GLOBAL registry with simulated network delay
    const absentStudentIds = absentRecords.map(r => r.studentId);
    await storage.recordGlobalAbsences(selectedClass, absentStudentIds);
    
    setIsSyncing(false);
    setScreen(AppScreen.CONFIRMATION);
  };

  const handleToggleDarkMode = (isDark: boolean) => {
    setDarkMode(isDark);
    storage.setTheme(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    storage.setLang(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const handleUpdateTeacher = (updated: Teacher) => {
    setTeacher(updated);
    storage.updateTeacher(updated);
  };

  const renderScreen = () => {
    if (!teacher && screen !== AppScreen.AUTH) {
      return <Auth onAuthSuccess={handleAuthSuccess} language={language} />;
    }

    switch (screen) {
      case AppScreen.AUTH:
        return <Auth onAuthSuccess={handleAuthSuccess} language={language} />;
      case AppScreen.DASHBOARD:
        return (
          <Dashboard 
            teacher={teacher!} 
            language={language}
            onSelectClass={handleSelectClass} 
            onLogout={handleLogout} 
            onOpenSettings={() => setScreen(AppScreen.SETTINGS)}
            isSyncing={isSyncing}
          />
        );
      case AppScreen.ATTENDANCE:
        return (
          <AttendanceList 
            teacher={teacher!} 
            classId={selectedClass} 
            language={language}
            onBack={() => setScreen(AppScreen.DASHBOARD)} 
            onConfirm={handleConfirmAttendance}
          />
        );
      case AppScreen.CONFIRMATION:
        return (
          <Confirmation 
            teacher={teacher!} 
            classId={selectedClass} 
            records={currentRecords} 
            classTime={currentClassTime} 
            language={language}
            onDone={() => setScreen(AppScreen.DASHBOARD)}
          />
        );
      case AppScreen.SETTINGS:
        return (
          <Settings 
            teacher={teacher!}
            darkMode={darkMode}
            language={language}
            onUpdateTeacher={handleUpdateTeacher}
            onToggleDarkMode={handleToggleDarkMode}
            onSetLanguage={handleSetLanguage}
            onBack={() => setScreen(AppScreen.DASHBOARD)}
            onLogout={handleLogout}
          />
        );
      default:
        return <Auth onAuthSuccess={handleAuthSuccess} language={language} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
      {showSplash && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-indigo-600 transition-opacity duration-1000">
          <div className="text-center space-y-6 animate-pulse">
            <h1 className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl">SmartAttend</h1>
            <p className="text-indigo-100 font-bold text-xl tracking-widest uppercase opacity-80">Par Omar Kh</p>
          </div>
          <div className="absolute bottom-20 flex flex-col items-center gap-4">
             <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
             <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Chargement...</span>
          </div>
        </div>
      )}

      <div className={`transition-opacity duration-700 ${showSplash ? 'opacity-0' : 'opacity-100'}`}>
        {renderScreen()}
      </div>
    </div>
  );
};

export default App;
