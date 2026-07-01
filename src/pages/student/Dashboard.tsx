import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext'; 
import { useNavigate } from 'react-router-dom'; 
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  FileText, 
  Award, 
  Download,
  LogOut,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import MarksheetTable from '@/components/MarksheetTable';
import StatCard from '@/components/StatCard';

interface User {
  id: number;
  full_name: string;
  enrollment: string;
  role: string;
}

const StudentDashboard: React.FC = () => {
  const { user, logout } = (useAuth() as unknown) as { 
    user: User | null; 
    logout: () => void 
  };
  
  const navigate = useNavigate(); 
  const [studentResult, setStudentResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Helper function for Letter Grades (A, B, C, D, F) - KEPT EXACTLY SAME
const getLetterGrade = (pct: string) => {
  const p = parseFloat(pct);
  if (p >= 80) return "A+";
  if (p >= 70) return "A";
  if (p >= 60) return "B";
  if (p >= 50) return "C";
  if (p >= 40) return "D";
  return "F";
};

useEffect(() => {
  const fetchRealData = async () => {
    if (!user?.enrollment) return;
    try {
      const response = await fetch(`http://127.0.0.1:5000/get_student_marks?enroll=${user.enrollment}`);
      const data = await response.json();
      
      if (response.ok) {
        // NEW INTERNAL HELPER: To fix "00-" problem without changing logic
        const fv = (v: any) => {
          const s = String(v || "").trim();
          return (s === "00-" || s === "0-" || s === "00" || s === "0" || s === "") ? "-" : v;
        };

        // MAP SUBJECTS: Apply cleaning to the marks table data
        const cleanedSubjects = data.subjects.map((s: any) => ({
          ...s,
          theory: {
            faTh: { max: fv(s.theory?.faTh?.max), obt: fv(s.theory?.faTh?.obt) },
            saTh: { max: fv(s.theory?.saTh?.max), obt: fv(s.theory?.saTh?.obt) },
            total: { max: fv(s.theory?.total?.max), obt: fv(s.theory?.total?.obt) }
          },
          practicals: {
            faPr: { max: fv(s.practicals?.faPr?.max), obt: fv(s.practicals?.faPr?.obt) },
            saPr: { max: fv(s.practicals?.saPr?.max), obt: fv(s.practicals?.saPr?.obt) }
          },
          sla: { max: fv(s.sla?.max), obt: fv(s.sla?.obt) }
        }));

        setStudentResult({
          studentName: data.student_name,
          enrollment: data.enroll,
          seatNumber: fv(data.seat_no || data.seat), // Updated with fv()
          course: data.course,
          semester: data.semester,
          percentage: data.percentage,
          result: data.status,
          obtainedMarks: fv(data.total_marks_obtained), // Updated with fv()
          totalMarks: fv(data.total_max_marks),         // Updated with fv()
          subjects: cleanedSubjects,                    // Using cleaned array
          cgpa: (parseFloat(data.percentage) / 9.5).toFixed(2),
          grade: getLetterGrade(data.percentage)
        });
      }
    } catch (err) {
      console.error("Failed to fetch marks:", err);
    } finally {
      setLoading(false);
    }
  };
  fetchRealData();
}, [user]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleDownload = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Syncing your marksheet...</p>
      </div>
    );
  }

  if (!studentResult) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-4 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <p className="text-lg font-medium text-foreground">No result data found</p>
        <Button onClick={() => window.location.reload()} variant="outline">Try Refreshing</Button>
      </div>
    );
  }

  // NAME LOGIC: Takes the 2nd word (e.g., "Sheikh Sufiyan" -> "Sufiyan")
  const nameParts = studentResult.studentName.trim().split(/\s+/);
  const displayName = nameParts.length > 1 ? nameParts[1] : nameParts[0];

  return (
    <div className="min-h-screen bg-background">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 10mm; }
          body { zoom: 75%; -moz-transform: scale(0.75); -moz-transform-origin: 0 0; }
          header, .no-print, button { display: none !important; }
          .container { width: 100% !important; max-width: none !important; padding: 0 !important; margin: 0 !important; }
          .print-header {
            display: block !important;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e2e8f0;
          }
        }
        .print-header { display: none; }
      `}} />

      {/* Screen Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-lg no-print">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-foreground">Somayya Polytechnic</h1>
              <p className="text-xs text-muted-foreground">Student Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{studentResult.studentName}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
        
        {/* PRINT HEADER - Full Name, Enroll, Seat */}
        <div className="print-header">
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
             <div>
               <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>OFFICIAL STATEMENT OF MARKS</h1>
               <p style={{ fontSize: '14px' }}>Somayya Polytechnic Academic Portal</p>
             </div>
             <div style={{ textAlign: 'right', fontSize: '14px' }}>
               <p><strong>Full Name:</strong> {studentResult.studentName}</p>
               <p><strong>Enrollment No:</strong> {studentResult.enrollment}</p>
               <p><strong>Seat No:</strong> {studentResult.seatNumber}</p>
             </div>
           </div>
        </div>

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/30 rounded-2xl p-8 border border-primary/20 no-print">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">
                Welcome back, {displayName}!
              </h1>
              <p className="text-muted-foreground mt-2">View your academic results and performance</p>
            </div>
            <Button onClick={handleDownload} className="gradient-primary text-primary-foreground">
              <Download className="w-4 h-4 mr-2" /> Download Marksheet
            </Button>
          </div>
        </div>

        {/* Stats Cards - Percentage, CGPA, Grade (A,B,C,D) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 no-print">
          <StatCard 
            icon={FileText} 
            label="Percentage" 
            value={`${studentResult.percentage}%`} 
            iconBgClass="bg-primary/10"
            iconColorClass="text-primary"
          />
          <StatCard 
            icon={GraduationCap} 
            label="CGPA" 
            value={studentResult.cgpa} 
            iconBgClass="bg-accent"
            iconColorClass="text-accent-foreground"
          />
          <StatCard 
            icon={Award} 
            label="Grade" 
            value={studentResult.grade} 
            iconBgClass="bg-warning/10"
            iconColorClass="text-warning"
          />
        </div>

        {/* Result Table Container */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-heading font-semibold text-foreground">
                  Semester {studentResult.semester} Results
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{studentResult.course}</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-full w-fit">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{studentResult.result}</span>
              </div>
            </div>
          </div>

          <MarksheetTable subjects={studentResult.subjects} />

          {/* Summary Footer */}
          <div className="p-6 bg-muted/30 border-t border-border">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              <div><p className="text-sm text-muted-foreground">Total Marks</p><p className="text-xl font-bold">{studentResult.obtainedMarks}/{studentResult.totalMarks}</p></div>
              <div><p className="text-sm text-muted-foreground">Percentage</p><p className="text-xl font-bold">{studentResult.percentage}%</p></div>
              <div><p className="text-sm text-muted-foreground">CGPA</p><p className="text-xl font-bold">{studentResult.cgpa}</p></div>
              <div><p className="text-sm text-muted-foreground">Result</p><p className="text-xl font-bold text-success">{studentResult.result}</p></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;