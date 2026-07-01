export interface Subject {
  code: string;
  name: string;
  maxMarks: number;
  obtainedMarks: number;
  grade: string;
  credits: number;
}

export interface Result {
  id: string;
  studentId: string;
  studentName: string;
  enrollmentNumber: string;
  semester: number;
  branch: string;
  examType: 'regular' | 'backlog';
  examDate: string;
  subjects: Subject[];
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  cgpa: number;
  result: 'Pass' | 'Fail';
  rank?: number;
}

export interface RankingEntry {
  rank: number;
  studentName: string;
  enrollmentNumber: string;
  branch: string;
  semester: number;
  percentage: number;
  cgpa: number;
}

export interface AnalyticsData {
  passPercentage: number;
  averagePercentage: number;
  topperPercentage: number;
  totalStudents: number;
  passedStudents: number;
  failedStudents: number;
  gradeDistribution: {
    grade: string;
    count: number;
  }[];
  branchWisePerformance: {
    branch: string;
    passPercentage: number;
    averageMarks: number;
  }[];
  semesterTrend: {
    semester: number;
    averagePercentage: number;
  }[];
}
