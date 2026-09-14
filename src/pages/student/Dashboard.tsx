import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext'; 
import { useNavigate } from 'react-router-dom'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { saveAs } from 'file-saver';
import { 
  GraduationCap, 
  FileText, 
  Award, 
  Download,
  LogOut,
  CheckCircle,
  Loader2,
  AlertCircle,
  Search,
  ArrowLeft,
  Eye
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
  const { user, activeCollege, logout } = useAuth();
  
  const navigate = useNavigate(); 
  const [studentResult, setStudentResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lookupEnroll, setLookupEnroll] = useState('');

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

  const currentEnrollment = (user?.enrollment || (user as any)?.enrollmentNumber || localStorage.getItem('userEnrollment') || '').trim();

  const fetchRealData = async (targetEnroll = currentEnrollment) => {
    if (!targetEnroll) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/get_student_marks?enroll=${encodeURIComponent(targetEnroll)}`);
      const data = await response.json();
      
      if (response.ok && data && (data.student_name || data.enroll)) {
        // Helper to fix "00-" or empty placeholders
        const fv = (v: any) => {
          const s = String(v || "").trim();
          return (s === "00-" || s === "0-" || s === "00" || s === "0" || s === "") ? "-" : v;
        };

        // MAP SUBJECTS: Apply cleaning to the marks table data
        const cleanedSubjects = (data.subjects || []).map((s: any) => ({
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

        const rawPct = data.percentage !== undefined && data.percentage !== null && data.percentage !== "N/A" ? String(data.percentage) : "0";

        setStudentResult({
          studentName: data.student_name || "Student",
          enrollment: data.enroll || targetEnroll,
          seatNumber: fv(data.seat_no || data.seat),
          course: data.course || "Diploma Engineering",
          semester: data.semester || 6,
          percentage: rawPct,
          result: data.status || "Pass",
          obtainedMarks: fv(data.total_marks_obtained),
          totalMarks: fv(data.total_max_marks),
          subjects: cleanedSubjects,
          cgpa: (parseFloat(rawPct) / 9.5).toFixed(2),
          grade: getLetterGrade(rawPct)
        });
      } else {
        setStudentResult(null);
      }
    } catch (err) {
      console.error("Failed to fetch marks:", err);
      setStudentResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/auth', { replace: true });
  };

  const handleDownload = async () => {
    const enrollForPdf = studentResult?.enrollment || currentEnrollment;
    if (enrollForPdf) {
      try {
        const response = await fetch(`/download_pdf/${enrollForPdf}`);
        if (response.ok) {
          const blob = await response.blob();
          saveAs(blob, `MSBTE_Marksheet_${enrollForPdf}.pdf`);
          return;
        }
      } catch (e) {
        console.warn("Direct PDF download error, using print:", e);
      }
    }
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 animate-fade-in">
        <div className="w-full max-w-md bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-card text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-heading font-bold text-foreground">Marksheet Not Loaded</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {currentEnrollment 
                ? `No MSBTE records found for enrollment "${currentEnrollment}".` 
                : 'No enrollment number is associated with this session.'}
            </p>
          </div>

          <div className="space-y-2 text-left pt-2 border-t border-border">
            <label className="text-xs font-semibold text-foreground">Lookup Enrollment Number</label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. 23314740173"
                value={lookupEnroll}
                onChange={(e) => setLookupEnroll(e.target.value)}
                className="font-mono text-xs sm:text-sm"
              />
              <Button 
                onClick={() => fetchRealData(lookupEnroll.trim())}
                disabled={!lookupEnroll.trim()}
                className="gradient-primary text-primary-foreground font-semibold shrink-0 text-xs sm:text-sm px-4"
              >
                Search
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            {currentEnrollment && (
              <Button onClick={() => fetchRealData(currentEnrollment)} variant="outline" size="sm" className="w-full text-xs">
                Retry Current Enrollment ({currentEnrollment})
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Button onClick={handleLogout} variant="secondary" size="sm" className="flex-1 text-xs">
                Switch Role / Sign Out
              </Button>
              <Button onClick={() => navigate('/')} variant="ghost" size="sm" className="flex-1 text-xs">
                Home
              </Button>
            </div>
          </div>
        </div>
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
              <h1 className="font-heading font-bold text-foreground">College Result Automation System</h1>
              <p className="text-xs text-muted-foreground">
                Student Result Portal
              </p>
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
               <p style={{ fontSize: '14px' }}>{activeCollege?.name || 'Result Automation System'} Academic Portal</p>
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
            <div className="flex flex-wrap items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => window.open(`/view_pdf/${studentResult.enrollment || currentEnrollment}`, '_blank')}
                className="bg-background/80 hover:bg-background shadow-xs text-xs sm:text-sm"
              >
                <Eye className="w-4 h-4 mr-2" /> View Official Marksheet
              </Button>
              <Button onClick={handleDownload} className="gradient-primary text-primary-foreground text-xs sm:text-sm shadow-xs">
                <Download className="w-4 h-4 mr-2" /> Download PDF Copy
              </Button>
            </div>
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