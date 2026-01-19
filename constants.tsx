
import { Student } from './types';

export const LEVELS = ['1ére', '2éme', '3éme', 'bac'];
export const SECTIONS = ['Sc.Informatique', 'Mathématiques', 'Lettres', 'Science.Exp', 'Eco + gestion'];
export const NUMBERS = Array.from({ length: 10 }, (_, i) => (i + 1).toString());

export const SUBJECTS = ['Mathematics', 'Physics', 'Biology', 'Literature', 'History', 'Philosophy', 'Chemistry', 'Arts', 'Computer Science'];

export const getStudentsForClass = (classId: string): Student[] => {
  // We generate a deterministic list of students for each class
  // In a real app, this would fetch from a database.
  return Array.from({ length: 35 }, (_, i) => ({
    id: `${classId}-pupil-${i + 1}`,
    name: `Élève ${i + 1}`,
    classId: classId,
    // Note: wasAbsentLastHour is now determined dynamically in the component
  }));
};

export const MOCK_STUDENTS: Student[] = [];
