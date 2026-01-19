import React, { useState } from 'react';
import { Teacher } from '../types';
import { storage } from '../services/storage';
import { LEVELS, SECTIONS, NUMBERS, SUBJECTS } from '../constants';
import { Language, translations } from '../translations';

interface AuthProps {
  onAuthSuccess: (teacher: Teacher) => void;
  language: Language;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess, language }) => {
  const t = translations[language];
  const [isLogin, setIsLogin] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subjects: [] as string[],
    classes: [] as string[]
  });

  // State for class selection builder
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedNumber, setSelectedNumber] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      const teachers = storage.getTeachers();
      const teacher = teachers.find(item => item.name.toLowerCase() === formData.name.toLowerCase());
      if (teacher) {
        storage.setCurrentTeacher(teacher);
        onAuthSuccess(teacher);
      } else {
        setShowErrorModal(true);
      }
    } else {
      const newTeacher: Teacher = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData
      };
      storage.saveTeacher(newTeacher);
      storage.setCurrentTeacher(newTeacher);
      onAuthSuccess(newTeacher);
    }
  };

  const toggleSelection = (list: string[], item: string) => {
    return list.includes(item) 
      ? list.filter(i => i !== item)
      : [...list, item];
  };

  const handleAddClass = () => {
    if (!selectedLevel || !selectedNumber) return;
    if (selectedLevel !== '1ére' && !selectedSection) return;

    let classLabel = '';
    if (selectedLevel === '1ére') {
      classLabel = `1ére s${selectedNumber}`;
    } else {
      classLabel = `${selectedLevel} ${selectedSection} ${selectedNumber}`;
    }

    if (!formData.classes.includes(classLabel)) {
      setFormData({ ...formData, classes: [...formData.classes, classLabel] });
    }
    
    // Reset selection after adding
    resetBuilder();
  };

  const resetBuilder = () => {
    setSelectedLevel('');
    setSelectedSection('');
    setSelectedNumber('');
  };

  const handleRemoveClass = (c: string) => {
    setFormData({ ...formData, classes: formData.classes.filter(item => item !== c) });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-6 sm:p-8 space-y-6 border border-slate-100 dark:border-slate-800">
        <div className="text-center">
          <h1 className="text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">SmartAttend</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {isLogin ? t.welcome : t.regTitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">{t.name}</label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="votre@email.com"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">{t.subjects}</label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({ ...formData, subjects: toggleSelection(formData.subjects, s) })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        formData.subjects.includes(s) 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20' 
                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center">
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.myClasses}</h3>
                   {selectedLevel && (
                      <button type="button" onClick={resetBuilder} className="text-[10px] font-black text-red-500 uppercase">Clear</button>
                   )}
                </div>
                
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{t.selectLevel}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {LEVELS.map(l => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => { setSelectedLevel(l); setSelectedSection(''); }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                          selectedLevel === l 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
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
                          type="button"
                          onClick={() => setSelectedSection(s)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                            selectedSection === s 
                            ? 'bg-indigo-600 text-white border-indigo-600' 
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
                          type="button"
                          onClick={() => setSelectedNumber(n)}
                          className={`py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                            selectedNumber === n 
                            ? 'bg-indigo-600 text-white border-indigo-600' 
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
                  type="button"
                  onClick={handleAddClass}
                  disabled={!selectedLevel || !selectedNumber || (selectedLevel !== '1ére' && !selectedSection)}
                  className="w-full py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl disabled:opacity-30 transition-all active:scale-95"
                >
                  {t.addClass}
                </button>

                {formData.classes.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.addedClasses}</p>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                      {formData.classes.map(c => (
                        <div key={c} className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2.5 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800 animate-in zoom-in duration-200">
                          <span className="text-[10px] font-black">{c}</span>
                          <button type="button" onClick={() => handleRemoveClass(c)} className="hover:text-red-500 transition-colors">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all transform active:scale-95 mt-4"
          >
            {isLogin ? t.signIn : t.createAccount}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
          >
            {isLogin ? (language === 'fr' ? 'Nouveau? Créer un compte' : 'New here? Create account') : (language === 'fr' ? 'Déjà un compte? Connexion' : 'Already have an account? Sign in')}
          </button>
        </div>
      </div>

      {showErrorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] max-w-xs w-full text-center space-y-6 shadow-2xl border dark:border-slate-800 animate-in zoom-in duration-200">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none uppercase">Profil Introuvable</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Nous n'avons pas trouvé de professeur avec ce nom.
              </p>
            </div>
            <button 
              onClick={() => {
                setShowErrorModal(false);
                setIsLogin(false);
              }} 
              className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-widest"
            >
              CRÉER COMPTE
            </button>
            <button 
              onClick={() => setShowErrorModal(false)} 
              className="w-full text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest"
            >
              ANNULER
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
