
import React, { useState } from 'react';
import { Teacher } from '../types';
import { LEVELS, SECTIONS, NUMBERS } from '../constants';
import { Language, translations } from '../translations';

interface SettingsProps {
  teacher: Teacher;
  darkMode: boolean;
  language: Language;
  onUpdateTeacher: (teacher: Teacher) => void;
  onToggleDarkMode: (isDark: boolean) => void;
  onSetLanguage: (lang: Language) => void;
  onBack: () => void;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  teacher, 
  darkMode, 
  language, 
  onUpdateTeacher, 
  onToggleDarkMode, 
  onSetLanguage, 
  onBack,
  onLogout
}) => {
  const t = translations[language];
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(teacher.name);

  // Builder state
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedNumber, setSelectedNumber] = useState<string>('');

  const handleAddClass = () => {
    if (!selectedLevel || !selectedNumber) return;
    if (selectedLevel !== '1ére' && !selectedSection) return;

    let classLabel = '';
    if (selectedLevel === '1ére') {
      classLabel = `1ére s${selectedNumber}`;
    } else {
      classLabel = `${selectedLevel} ${selectedSection} ${selectedNumber}`;
    }

    if (!teacher.classes.includes(classLabel)) {
      onUpdateTeacher({ ...teacher, classes: [...teacher.classes, classLabel] });
    }
    
    resetBuilder();
  };

  const resetBuilder = () => {
    setSelectedLevel('');
    setSelectedSection('');
    setSelectedNumber('');
  };

  const handleRemoveClass = (c: string) => {
    onUpdateTeacher({ ...teacher, classes: teacher.classes.filter(item => item !== c) });
  };

  const handleSaveName = () => {
    if (newName.trim()) {
      onUpdateTeacher({ ...teacher, name: newName.trim() });
      setIsEditingName(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <header className="flex items-center gap-4 mb-8 max-w-2xl mx-auto">
        <button 
          onClick={onBack}
          className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <svg className={`w-6 h-6 ${language === 'ar' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t.settings}</h1>
      </header>

      <main className="max-w-2xl mx-auto space-y-6 pb-32">
        {/* Profile Section */}
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t.profileInfo}</h2>
            {!isEditingName && (
              <button 
                onClick={() => setIsEditingName(true)}
                className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                {language === 'fr' ? 'Modifier' : 'Edit'}
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {isEditingName ? (
              <div className="space-y-3 animate-in slide-in-from-top-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.name}</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  autoFocus
                />
                <div className="flex gap-2 pt-2">
                  <button onClick={handleSaveName} className="flex-1 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-all">OK</button>
                  <button onClick={() => { setIsEditingName(false); setNewName(teacher.name); }} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-widest rounded-xl active:scale-95 transition-all">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-black text-xl">
                  {teacher.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">{t.name}</p>
                  <p className="text-slate-900 dark:text-white font-black text-lg leading-none">{teacher.name}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Advanced Class Builder Section */}
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{t.myClasses}</h2>
            {selectedLevel && (
              <button onClick={resetBuilder} className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                Clear
              </button>
            )}
          </div>
          
          <div className="space-y-4 mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase">{t.selectLevel}</p>
              <div className="flex flex-wrap gap-1.5">
                {LEVELS.map(l => (
                  <button
                    key={l}
                    onClick={() => { setSelectedLevel(l); setSelectedSection(''); }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                      selectedLevel === l 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                      : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {selectedLevel && selectedLevel !== '1ére' && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase">{t.selectSection}</p>
                <div className="flex flex-wrap gap-1.5">
                  {SECTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSection(s)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                        selectedSection === s 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedLevel && (selectedLevel === '1ére' || selectedSection) && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase">{t.selectNumber}</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {NUMBERS.map(n => (
                    <button
                      key={n}
                      onClick={() => setSelectedNumber(n)}
                      className={`py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                        selectedNumber === n 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleAddClass}
              disabled={!selectedLevel || !selectedNumber || (selectedLevel !== '1ére' && !selectedSection)}
              className="w-full py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl disabled:opacity-30 transition-all active:scale-95 shadow-lg"
            >
              {t.addClass}
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.addedClasses}</p>
            <div className="flex flex-wrap gap-2">
              {teacher.classes.map(c => (
                <div key={c} className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-3 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm animate-in zoom-in duration-200">
                  <span className="text-[10px] font-black">{c}</span>
                  <button onClick={() => handleRemoveClass(c)} className="hover:text-red-500 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Language Section */}
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{t.language}</h2>
          <div className="grid grid-cols-3 gap-3">
            {(['en', 'fr', 'ar'] as Language[]).map(lang => (
              <button
                key={lang}
                onClick={() => onSetLanguage(lang)}
                className={`py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                  language === lang
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'العربية'}
              </button>
            ))}
          </div>
        </section>

        {/* Theme Preferences */}
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{t.appPrefs}</h2>
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center text-indigo-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
              <p className="text-slate-900 dark:text-white font-bold uppercase tracking-widest text-xs">{t.darkMode}</p>
            </div>
            <button
              onClick={() => onToggleDarkMode(!darkMode)}
              className={`w-14 h-7 rounded-full relative transition-all duration-300 ${darkMode ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all transform ${darkMode ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>
        </section>

        <section className="pt-4">
           <button onClick={onLogout} className="w-full py-5 bg-red-50 dark:bg-red-900/10 text-red-500 font-black uppercase tracking-widest rounded-2xl border-2 border-red-100 dark:border-red-900/20 active:scale-95 transition-all">
             {t.logout}
           </button>
        </section>
      </main>
    </div>
  );
};

export default Settings;
