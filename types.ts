
export interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  classes: string[];
  email: string;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  wasAbsentLastHour?: boolean;
}

export interface AttendanceRecord {
  studentId: string;
  isPresent: boolean;
  hasBillet: boolean;
  isVerified: boolean;
}

export enum AppScreen {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  ATTENDANCE = 'ATTENDANCE',
  CONFIRMATION = 'CONFIRMATION',
  SETTINGS = 'SETTINGS'
}
