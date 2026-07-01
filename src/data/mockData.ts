import { Result, RankingEntry, AnalyticsData } from '@/types/result';

export const BRANCHES = [
  'Computer Science and Engineering',
  'Mechanical Engineering',
  'Electronics & Tele-Communication Engineering',
  'Electrical Engineering',
  'Civil Engineering',
  'Mining & Mine Surveying',
] as const;

export const SEMESTERS = [1, 2, 3, 4, 5, 6] as const;

export const mockResults: Result[] = [
  {
    id: '1',
    studentId: 's1',
    studentName: 'Rahul Sharma',
    enrollmentNumber: '2021001',
    semester: 4,
    branch: 'Computer Science and Engineering',
    examType: 'regular',
    examDate: '2024-05-15',
    subjects: [
      { code: 'CS401', name: 'Data Structures', maxMarks: 100, obtainedMarks: 85, grade: 'A', credits: 4 },
      { code: 'CS402', name: 'Operating Systems', maxMarks: 100, obtainedMarks: 78, grade: 'B+', credits: 4 },
      { code: 'CS403', name: 'Database Management', maxMarks: 100, obtainedMarks: 92, grade: 'A+', credits: 4 },
      { code: 'CS404', name: 'Computer Networks', maxMarks: 100, obtainedMarks: 88, grade: 'A', credits: 3 },
      { code: 'CS405', name: 'Web Development', maxMarks: 100, obtainedMarks: 95, grade: 'A+', credits: 3 },
    ],
    totalMarks: 500,
    obtainedMarks: 438,
    percentage: 87.6,
    cgpa: 8.76,
    result: 'Pass',
    rank: 1,
  },
  {
    id: '2',
    studentId: 's2',
    studentName: 'Priya Patel',
    enrollmentNumber: '2021002',
    semester: 4,
    branch: 'Computer Science and Engineering',
    examType: 'regular',
    examDate: '2024-05-15',
    subjects: [
      { code: 'CS401', name: 'Data Structures', maxMarks: 100, obtainedMarks: 82, grade: 'A', credits: 4 },
      { code: 'CS402', name: 'Operating Systems', maxMarks: 100, obtainedMarks: 75, grade: 'B+', credits: 4 },
      { code: 'CS403', name: 'Database Management', maxMarks: 100, obtainedMarks: 88, grade: 'A', credits: 4 },
      { code: 'CS404', name: 'Computer Networks', maxMarks: 100, obtainedMarks: 79, grade: 'B+', credits: 3 },
      { code: 'CS405', name: 'Web Development', maxMarks: 100, obtainedMarks: 91, grade: 'A+', credits: 3 },
    ],
    totalMarks: 500,
    obtainedMarks: 415,
    percentage: 83.0,
    cgpa: 8.30,
    result: 'Pass',
    rank: 2,
  },
  {
    id: '3',
    studentId: 's3',
    studentName: 'Amit Kumar',
    enrollmentNumber: '2021003',
    semester: 4,
    branch: 'Mechanical Engineering',
    examType: 'regular',
    examDate: '2024-05-15',
    subjects: [
      { code: 'ME401', name: 'Thermodynamics', maxMarks: 100, obtainedMarks: 72, grade: 'B', credits: 4 },
      { code: 'ME402', name: 'Fluid Mechanics', maxMarks: 100, obtainedMarks: 68, grade: 'B', credits: 4 },
      { code: 'ME403', name: 'Machine Design', maxMarks: 100, obtainedMarks: 75, grade: 'B+', credits: 4 },
      { code: 'ME404', name: 'Manufacturing', maxMarks: 100, obtainedMarks: 80, grade: 'A', credits: 3 },
      { code: 'ME405', name: 'CAD/CAM', maxMarks: 100, obtainedMarks: 85, grade: 'A', credits: 3 },
    ],
    totalMarks: 500,
    obtainedMarks: 380,
    percentage: 76.0,
    cgpa: 7.60,
    result: 'Pass',
    rank: 5,
  },
  {
    id: '4',
    studentId: 's4',
    studentName: 'Sneha Desai',
    enrollmentNumber: '2021008',
    semester: 4,
    branch: 'Electronics Engineering',
    examType: 'regular',
    examDate: '2024-05-15',
    subjects: [
      { code: 'EC401', name: 'Digital Electronics', maxMarks: 100, obtainedMarks: 80, grade: 'A', credits: 4 },
      { code: 'EC402', name: 'Microprocessors', maxMarks: 100, obtainedMarks: 82, grade: 'A', credits: 4 },
      { code: 'EC403', name: 'Signal Processing', maxMarks: 100, obtainedMarks: 78, grade: 'B+', credits: 4 },
      { code: 'EC404', name: 'Communication Systems', maxMarks: 100, obtainedMarks: 85, grade: 'A', credits: 3 },
      { code: 'EC405', name: 'VLSI Design', maxMarks: 100, obtainedMarks: 81, grade: 'A', credits: 3 },
    ],
    totalMarks: 500,
    obtainedMarks: 406,
    percentage: 81.2,
    cgpa: 8.12,
    result: 'Pass',
    rank: 3,
  },
  {
    id: '5',
    studentId: 's5',
    studentName: 'Vikram Singh',
    enrollmentNumber: '2021005',
    semester: 4,
    branch: 'Civil Engineering',
    examType: 'regular',
    examDate: '2024-05-15',
    subjects: [
      { code: 'CE401', name: 'Structural Analysis', maxMarks: 100, obtainedMarks: 76, grade: 'B+', credits: 4 },
      { code: 'CE402', name: 'Geotechnical Engineering', maxMarks: 100, obtainedMarks: 80, grade: 'A', credits: 4 },
      { code: 'CE403', name: 'Transportation Engineering', maxMarks: 100, obtainedMarks: 78, grade: 'B+', credits: 4 },
      { code: 'CE404', name: 'Environmental Engineering', maxMarks: 100, obtainedMarks: 82, grade: 'A', credits: 3 },
      { code: 'CE405', name: 'Surveying', maxMarks: 100, obtainedMarks: 76, grade: 'B+', credits: 3 },
    ],
    totalMarks: 500,
    obtainedMarks: 392,
    percentage: 78.4,
    cgpa: 7.84,
    result: 'Pass',
    rank: 4,
  },
  {
    id: '6',
    studentId: 's6',
    studentName: 'Raj Malhotra',
    enrollmentNumber: '2021025',
    semester: 3,
    branch: 'Electrical Engineering',
    examType: 'regular',
    examDate: '2024-05-15',
    subjects: [
      { code: 'EE301', name: 'Power Systems', maxMarks: 100, obtainedMarks: 74, grade: 'B+', credits: 4 },
      { code: 'EE302', name: 'Control Systems', maxMarks: 100, obtainedMarks: 70, grade: 'B', credits: 4 },
      { code: 'EE303', name: 'Electrical Machines', maxMarks: 100, obtainedMarks: 68, grade: 'B', credits: 4 },
      { code: 'EE304', name: 'Instrumentation', maxMarks: 100, obtainedMarks: 72, grade: 'B', credits: 3 },
      { code: 'EE305', name: 'Power Electronics', maxMarks: 100, obtainedMarks: 75, grade: 'B+', credits: 3 },
    ],
    totalMarks: 500,
    obtainedMarks: 359,
    percentage: 71.8,
    cgpa: 7.18,
    result: 'Pass',
    rank: 6,
  },
  {
    id: '7',
    studentId: 's7',
    studentName: 'Deepak Yadav',
    enrollmentNumber: '2021030',
    semester: 5,
    branch: 'Mining Engineering',
    examType: 'regular',
    examDate: '2024-05-15',
    subjects: [
      { code: 'MN501', name: 'Mine Planning', maxMarks: 100, obtainedMarks: 72, grade: 'B', credits: 4 },
      { code: 'MN502', name: 'Rock Mechanics', maxMarks: 100, obtainedMarks: 68, grade: 'B', credits: 4 },
      { code: 'MN503', name: 'Mine Ventilation', maxMarks: 100, obtainedMarks: 70, grade: 'B', credits: 4 },
      { code: 'MN504', name: 'Mineral Processing', maxMarks: 100, obtainedMarks: 74, grade: 'B+', credits: 3 },
      { code: 'MN505', name: 'Mine Safety', maxMarks: 100, obtainedMarks: 76, grade: 'B+', credits: 3 },
    ],
    totalMarks: 500,
    obtainedMarks: 360,
    percentage: 72.0,
    cgpa: 7.20,
    result: 'Pass',
    rank: 7,
  },
];

export const mockRankings: RankingEntry[] = [
  { rank: 1, studentName: 'Rahul Sharma', enrollmentNumber: '2021001', branch: 'Computer Science and Engineering', semester: 4, percentage: 87.6, cgpa: 8.76 },
  { rank: 2, studentName: 'Priya Patel', enrollmentNumber: '2021002', branch: 'Computer Science and Engineering', semester: 4, percentage: 83.0, cgpa: 8.30 },
  { rank: 3, studentName: 'Sneha Desai', enrollmentNumber: '2021008', branch: 'Electronics Engineering', semester: 4, percentage: 81.2, cgpa: 8.12 },
  { rank: 4, studentName: 'Vikram Singh', enrollmentNumber: '2021005', branch: 'Civil Engineering', semester: 4, percentage: 78.4, cgpa: 7.84 },
  { rank: 5, studentName: 'Amit Kumar', enrollmentNumber: '2021003', branch: 'Mechanical Engineering', semester: 4, percentage: 76.0, cgpa: 7.60 },
  { rank: 6, studentName: 'Neha Joshi', enrollmentNumber: '2021010', branch: 'Computer Science and Engineering', semester: 4, percentage: 74.8, cgpa: 7.48 },
  { rank: 7, studentName: 'Rohan Mehta', enrollmentNumber: '2021012', branch: 'Electronics Engineering', semester: 4, percentage: 72.6, cgpa: 7.26 },
  { rank: 8, studentName: 'Anita Verma', enrollmentNumber: '2021015', branch: 'Mechanical Engineering', semester: 3, percentage: 70.2, cgpa: 7.02 },
  { rank: 9, studentName: 'Karan Gupta', enrollmentNumber: '2021018', branch: 'Civil Engineering', semester: 3, percentage: 68.4, cgpa: 6.84 },
  { rank: 10, studentName: 'Pooja Shah', enrollmentNumber: '2021020', branch: 'Electrical Engineering', semester: 5, percentage: 66.0, cgpa: 6.60 },
  { rank: 11, studentName: 'Raj Malhotra', enrollmentNumber: '2021025', branch: 'Electrical Engineering', semester: 3, percentage: 71.8, cgpa: 7.18 },
  { rank: 12, studentName: 'Deepak Yadav', enrollmentNumber: '2021030', branch: 'Mining Engineering', semester: 5, percentage: 72.0, cgpa: 7.20 },
];

export const mockAnalytics: AnalyticsData = {
  passPercentage: 82.5,
  averagePercentage: 71.3,
  topperPercentage: 87.6,
  totalStudents: 320,
  passedStudents: 264,
  failedStudents: 56,
  gradeDistribution: [
    { grade: 'A+', count: 28 },
    { grade: 'A', count: 52 },
    { grade: 'B+', count: 78 },
    { grade: 'B', count: 64 },
    { grade: 'C', count: 42 },
    { grade: 'F', count: 56 },
  ],
  branchWisePerformance: [
    { branch: 'Computer Science and Engineering', passPercentage: 88.5, averageMarks: 74.2 },
    { branch: 'Mechanical Engineering', passPercentage: 81.2, averageMarks: 68.5 },
    { branch: 'Electronics Engineering', passPercentage: 84.0, averageMarks: 71.8 },
    { branch: 'Electrical Engineering', passPercentage: 79.5, averageMarks: 67.2 },
    { branch: 'Civil Engineering', passPercentage: 76.8, averageMarks: 65.3 },
    { branch: 'Mining Engineering', passPercentage: 74.2, averageMarks: 63.8 },
  ],
  semesterTrend: [
    { semester: 1, averagePercentage: 68.5 },
    { semester: 2, averagePercentage: 70.2 },
    { semester: 3, averagePercentage: 69.8 },
    { semester: 4, averagePercentage: 71.3 },
    { semester: 5, averagePercentage: 72.1 },
    { semester: 6, averagePercentage: 73.5 },
  ],
};

export interface SubjectMarks {
  subjectName: string;
  theory: {
    faTh: { max: number | null; obt: number | null };
    saTh: { max: number | null; obt: number | null };
    total: { max: number | null; obt: number | null };
  };
  practicals: {
    faPr: { max: number | null; obt: number | null };
    saPr: { max: number | null; obt: number | null };
  };
  sla: { max: number | null; obt: number | null };
  credits: number;
}

export interface StudentResult {
  studentName: string;
  enrollmentNumber: string;
  semester: number;
  branch: string;
  examType: string;
  subjects: SubjectMarks[];
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  cgpa: number;
  rank: number;
  result: 'Pass' | 'Fail';
}

export const mockStudentResult: StudentResult = {
  studentName: 'Sufiyan Sirajuddin Sheikh',
  enrollmentNumber: '2023COMP001',
  semester: 4,
  branch: 'Computer Science and Engineering',
  examType: 'Regular',
  subjects: [
    {
      subjectName: 'OPERATING SYSTEM',
      theory: {
        faTh: { max: 30, obt: 25 },
        saTh: { max: 70, obt: 37 },
        total: { max: 100, obt: 62 },
      },
      practicals: {
        faPr: { max: 25, obt: 23 },
        saPr: { max: 25, obt: 23 },
      },
      sla: { max: 25, obt: 23 },
      credits: 3,
    },
    {
      subjectName: 'SOFTWARE ENGINEERING',
      theory: {
        faTh: { max: 30, obt: 25 },
        saTh: { max: 70, obt: 37 },
        total: { max: 100, obt: 62 },
      },
      practicals: {
        faPr: { max: 25, obt: 23 },
        saPr: { max: 25, obt: 23 },
      },
      sla: { max: 25, obt: 23 },
      credits: 3,
    },
    {
      subjectName: 'ENTREPRENEURSHIP DEVELOPMENT AND STARTUPS',
      theory: {
        faTh: { max: null, obt: null },
        saTh: { max: null, obt: null },
        total: { max: null, obt: null },
      },
      practicals: {
        faPr: { max: 50, obt: 46 },
        saPr: { max: 25, obt: 23 },
      },
      sla: { max: null, obt: null },
      credits: 1,
    },
    {
      subjectName: 'SEMINAR AND PROJECT INITIATION COURSE',
      theory: {
        faTh: { max: null, obt: null },
        saTh: { max: null, obt: null },
        total: { max: null, obt: null },
      },
      practicals: {
        faPr: { max: 25, obt: 23 },
        saPr: { max: 25, obt: 23 },
      },
      sla: { max: 25, obt: 23 },
      credits: 1,
    },
    {
      subjectName: 'INTERNSHIP (12 WEEKS)',
      theory: {
        faTh: { max: null, obt: null },
        saTh: { max: null, obt: null },
        total: { max: null, obt: null },
      },
      practicals: {
        faPr: { max: 100, obt: 75 },
        saPr: { max: 100, obt: 75 },
      },
      sla: { max: null, obt: null },
      credits: 10,
    },
    {
      subjectName: 'ADVANCE COMPUTER NETWORK',
      theory: {
        faTh: { max: 30, obt: 25 },
        saTh: { max: 70, obt: 40 },
        total: { max: 100, obt: 65 },
      },
      practicals: {
        faPr: { max: 25, obt: 23 },
        saPr: { max: 25, obt: 23 },
      },
      sla: { max: null, obt: null },
      credits: 2,
    },
  ],
  totalMarks: 1000,
  obtainedMarks: 876,
  percentage: 87.6,
  cgpa: 8.76,
  rank: 1,
  result: 'Pass',
};
