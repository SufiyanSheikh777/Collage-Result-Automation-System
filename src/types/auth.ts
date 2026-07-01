export type UserRole = 'student' | 'teacher';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  enrollmentNumber?: string;
  department?: string;
}

export interface Student extends User {
  role: 'student';
  enrollmentNumber: string;
  semester: number;
  branch: string;
}

export interface Teacher extends User {
  role: 'teacher';
  department: string;
  subjects: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
