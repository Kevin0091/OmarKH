import { Teacher } from '../types';
import { Language } from '../translations';

const STORAGE_KEYS = {
  TEACHERS: 'smartattend_teachers',
  CURRENT_TEACHER: 'smartattend_session',
  THEME: 'smartattend_theme',
  LANG: 'smartattend_lang',
  LAST_SUMMARY: 'smartattend_last_summary',
  GLOBAL_ABSENCES: 'smartattend_global_absences',
  CLASS_SESSIONS: 'smartattend_class_sessions'
};

export interface LastAttendanceSummary {
  classId: string;
  absentCount: number;
  time: string;
}

export interface GlobalAbsenceRecord {
  classId: string;
  studentId: string;
  timestamp: number; 
}

export interface ClassSessionMarker {
  classId: string;
  timestamp: number;
}

export const storage = {
  getTeachers: (): Teacher[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    return data ? JSON.parse(data) : [];
  },
  saveTeacher: (teacher: Teacher) => {
    const teachers = storage.getTeachers();
    teachers.push(teacher);
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  },
  updateTeacher: (updatedTeacher: Teacher) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_TEACHER, JSON.stringify(updatedTeacher));
    const teachers = storage.getTeachers();
    const index = teachers.findIndex(t => t.id === updatedTeacher.id);
    if (index !== -1) {
      teachers[index] = updatedTeacher;
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
    }
  },
  setCurrentTeacher: (teacher: Teacher | null) => {
    if (teacher) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_TEACHER, JSON.stringify(teacher));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_TEACHER);
    }
  },
  getCurrentTeacher: (): Teacher | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER);
    return data ? JSON.parse(data) : null;
  },
  setTheme: (isDark: boolean) => {
    localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
  },
  getTheme: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.THEME) === 'dark';
  },
  setLang: (lang: Language) => {
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
  },
  getLang: (): Language => {
    return (localStorage.getItem(STORAGE_KEYS.LANG) as Language) || 'fr';
  },
  saveLastSummary: (summary: LastAttendanceSummary) => {
    localStorage.setItem(STORAGE_KEYS.LAST_SUMMARY, JSON.stringify(summary));
  },
  getLastSummary: (): LastAttendanceSummary | null => {
    const data = localStorage.getItem(STORAGE_KEYS.LAST_SUMMARY);
    return data ? JSON.parse(data) : null;
  },
  
  recordGlobalAbsences: async (classId: string, absentStudentIds: string[]): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const now = Date.now();
        
        // 1. Update Global Absences Registry
        const existingAbsences: GlobalAbsenceRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.GLOBAL_ABSENCES) || '[]');
        const newAbsenceRecords: GlobalAbsenceRecord[] = absentStudentIds.map(id => ({
          classId,
          studentId: id,
          timestamp: now
        }));
        
        // Keep 24h history for the registry
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        const filteredAbsences = existingAbsences.filter(r => r.timestamp > oneDayAgo);
        localStorage.setItem(STORAGE_KEYS.GLOBAL_ABSENCES, JSON.stringify([...filteredAbsences, ...newAbsenceRecords]));

        // 2. Record this specific session marker
        const existingSessions: ClassSessionMarker[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASS_SESSIONS) || '[]');
        const newSession: ClassSessionMarker = { classId, timestamp: now };
        const filteredSessions = existingSessions.filter(s => s.timestamp > oneDayAgo);
        localStorage.setItem(STORAGE_KEYS.CLASS_SESSIONS, JSON.stringify([...filteredSessions, newSession]));

        resolve();
      }, 1000); 
    });
  },
  
  getPreviousSessionTime: (classId: string): number => {
    const sessions: ClassSessionMarker[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASS_SESSIONS) || '[]');
    const classSessions = sessions
      .filter(s => s.classId === classId)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    // Returns the timestamp of the most recent confirmation for this class
    return classSessions[0]?.timestamp || 0;
  },

  getAbsenteesByTimestamp: (classId: string, timestamp: number): string[] => {
    const records: GlobalAbsenceRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.GLOBAL_ABSENCES) || '[]');
    return records
      .filter(r => r.classId === classId && r.timestamp === timestamp)
      .map(r => r.studentId);
  },

  getAllGlobalAbsences: (): GlobalAbsenceRecord[] => {
    const data = localStorage.getItem(STORAGE_KEYS.GLOBAL_ABSENCES);
    return data ? JSON.parse(data) : [];
  }
};

