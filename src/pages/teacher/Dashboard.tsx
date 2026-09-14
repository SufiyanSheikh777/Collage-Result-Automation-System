import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/dashboard/StatCard';
// Keep mock data only as a fallback if DB is empty
import { mockAnalytics, mockRankings } from '@/data/mockData';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Trophy,
  ArrowRight,
  Download,
  Upload,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, activeCollege } = useAuth();
  const collegeId = activeCollege?.id || 1;
  const userBranch = user?.branch && user.role !== 'college_admin' ? user.branch : '';

  const [isFetching, setIsFetching] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // --- REAL DATA STATE ---
  const [stats, setStats] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    average: 0,
    topPerformers: [],
    branchPerformance: []
  });

  const fetchStats = async () => {
    try {
      const url = new URL("/get_analytics", window.location.origin);
      if (collegeId) url.searchParams.append("college_id", String(collegeId));
      if (userBranch) url.searchParams.append("branch", userBranch);

      const response = await fetch(url.toString());
      const data = await response.json();
      setStats({
        total: data?.overall?.total || 0,
        passed: data?.overall?.passed || 0,
        failed: data?.overall?.failed || 0,
        average: data?.overall?.average || 0,
        topPerformers: data?.top_performers || [],
        branchPerformance: data?.branch_performance || []
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [collegeId, userBranch]);

  const handleFetchResults = async () => {
    setIsFetching(true);
    toast.info("Fetching results... Please wait.");
    try {
      const response = await fetch(`/fetch_results?college_id=${collegeId}`);
      if (response.ok) {
        toast.success("Results fetched successfully!");
        fetchStats(); // Refresh dashboard numbers
      }
    } catch (err) {
      toast.error("Server error");
    }
    setIsFetching(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setUploadedFile(e.target.files[0]);
  };

  const handleUploadEnrollmentList = async () => {
    if (!uploadedFile) return;
    setShowUploadDialog(false);
    const formData = new FormData();
    formData.append("file", uploadedFile);
    try {
      const response = await fetch("/upload_list", { method: "POST", body: formData });
      if (response.ok) toast.success("Uploaded successfully!");
    } catch (error) {
      toast.error("Upload failed");
    }
  };

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      const response = await fetch("/reset_data", { method: "POST" });
      if (response.ok) {
        toast.success("Database results reset successfully!");
        setShowResetDialog(false);
        fetchStats(); // Update dashboard counters to 0
      } else {
        toast.error("Failed to reset data");
      }
    } catch (error) {
      toast.error("Network error while resetting data");
    } finally {
      setIsResetting(false);
    }
  };

  // Calculate pass percentage for display
  const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Overview of student performance and results</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={() => setShowResetDialog(true)} 
            className="flex-1 sm:flex-initial text-xs sm:text-sm h-9 sm:h-10 px-3 gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Reset Data</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowUploadDialog(true)} 
            className="flex-1 sm:flex-initial text-xs sm:text-sm h-9 sm:h-10 px-3 gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Upload List</span>
          </Button>
          <Button 
            variant="hero" 
            onClick={handleFetchResults} 
            disabled={isFetching} 
            className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10 px-4 gap-1.5 shrink-0"
          >
            {isFetching ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            {isFetching ? 'Fetching Results...' : 'Fetch Results'}
          </Button>
        </div>
      </div>

      {/* Stats Grid - NOW USING REAL DATA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Total Students"
          value={stats.total.toString()}
          subtitle="All Records"
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Passed"
          value={stats.passed.toString()}
          subtitle={`${passRate}% pass rate`}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Failed"
          value={stats.failed.toString()}
          subtitle="Need attention"
          icon={XCircle}
          variant="warning"
        />
        <StatCard
          title="Average %"
          value={`${stats.average}%`}
          subtitle="All branches"
          icon={TrendingUp}
        />
      </div>

      {/* Two Column Layout - EXACTLY SAME DESIGN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Performers - Mapped from DB */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-card">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 rounded-lg bg-warning/10"><Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-warning" /></div>
              <h2 className="text-base sm:text-lg font-heading font-semibold text-foreground">Top Performers</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/teacher/ranking')} className="text-xs sm:text-sm">
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {stats.topPerformers.length > 0 ? stats.topPerformers.map((student: any, index: number) => (
              <div key={index} className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold bg-muted text-muted-foreground shrink-0`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs sm:text-sm text-foreground truncate">{student.name}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{student.branch}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-xs sm:text-sm text-foreground">{student.percentage}%</p>
                </div>
              </div>
            )) : <p className="text-center text-muted-foreground py-10 text-xs sm:text-sm">No records yet</p>}
          </div>
        </div>

        {/* Branch Performance - Mapped from DB */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-card">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /></div>
            <h2 className="text-base sm:text-lg font-heading font-semibold text-foreground">Branch Performance</h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {stats.branchPerformance.length > 0 ? stats.branchPerformance.map((branch: any) => (
              <div key={branch.name} className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium text-foreground truncate pr-2">{branch.name}</span>
                  <span className="text-muted-foreground shrink-0">{branch.avg}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${branch.avg}%` }}
                  />
                </div>
              </div>
            )) : <p className="text-center text-muted-foreground py-10 text-xs sm:text-sm">No data available</p>}
          </div>
        </div>
      </div>

      {/* Quick Actions - EXACTLY SAME DESIGN */}
      <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-card">
        <h2 className="text-base sm:text-lg font-heading font-semibold text-foreground mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Button variant="outline" className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1.5 sm:gap-2 text-xs sm:text-sm" onClick={() => navigate('/teacher/results')}>
            <span className="text-2xl">📊</span><span>View Results</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => navigate('/teacher/ranking')}>
            <span className="text-2xl">🏆</span><span>Check Rankings</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => navigate('/teacher/analytics')}>
            <span className="text-2xl">📈</span><span>View Analytics</span>
          </Button>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Enrollment List</DialogTitle>
            <DialogDescription>Upload a CSV or Excel file containing student enrollment numbers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="enrollment-file">Select File</Label>
              <Input id="enrollment-file" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
              <Button onClick={handleUploadEnrollmentList}><Upload className="w-4 h-4 mr-2" />Upload</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <RotateCcw className="w-5 h-5" /> Reset All Result Data?
            </DialogTitle>
            <DialogDescription className="pt-2 text-foreground/80">
              Are you sure you want to reset all stored results? This will clear all student marks and records from the database. You will need to re-fetch results.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowResetDialog(false)} disabled={isResetting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleResetData} disabled={isResetting} className="gap-2">
              {isResetting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isResetting ? 'Resetting...' : 'Yes, Reset Data'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherDashboard;