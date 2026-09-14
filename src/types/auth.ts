export type UserRole = 'student' | 'teacher' | 'hod' | 'college_admin' | null;

export interface CollegeInfo {
  id: number;
  name: string;
  shortName: string;
  msbteCode: string;
  region?: string;
  instituteType?: string;
}

export interface User {
  id?: string | number;
  email?: string;
  role: UserRole;
  name: string;
  enrollmentNumber?: string;
  enrollment?: string;
  department?: string;
  branch?: string;
  college?: CollegeInfo;
  isHod?: boolean;
}

export interface Student extends User {
  role: 'student';
  enrollmentNumber: string;
  semester: number;
  branch: string;
}

export interface Teacher extends User {
  role: 'teacher' | 'hod' | 'college_admin';
  department: string;
  subjects?: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  college: CollegeInfo | null;
}
