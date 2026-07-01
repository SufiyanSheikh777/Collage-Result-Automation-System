import React, { useState, useEffect } from 'react';
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
  Loader2
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
  const [isFetching, setIsFetching] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
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
      const response = await fetch("http://127.0.0.1:5000/get_analytics");
      const data = await response.json();
      setStats({
        total: data.overall.total,
        passed: data.overall.passed,
        failed: data.overall.failed,
        average: data.overall.average,
        topPerformers: data.top_performers || [],
        branchPerformance: data.branch_performance || []
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleFetchResults = async () => {
    setIsFetching(true);
    toast.info("Fetching results... Please wait.");
    try {
      const response = await fetch("http://127.0.0.1:5000/fetch_results");
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
      const response = await fetch("http://127.0.0.1:5000/upload_list", { method: "POST", body: formData });
      if (response.ok) toast.success("Uploaded successfully!");
    } catch (error) {
      toast.error("Upload failed");
    }
  };

  // Calculate pass percentage for display
  const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header - EXACTLY SAME DESIGN */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of student performance and results</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowUploadDialog(true)} className="gap-2">
            <Upload className="w-4 h-4" /> Upload Enrollment List
          </Button>
          <Button variant="hero" onClick={handleFetchResults} disabled={isFetching} className="gap-2">
            {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isFetching ? 'Fetching...' : 'Fetch Results'}
          </Button>
        </div>
      </div>

      {/* Stats Grid - NOW USING REAL DATA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers - Mapped from DB */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10"><Trophy className="w-5 h-5 text-warning" /></div>
              <h2 className="text-lg font-heading font-semibold text-foreground">Top Performers</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/teacher/ranking')}>
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-4">
            {stats.topPerformers.length > 0 ? stats.topPerformers.map((student: any, index: number) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-muted text-muted-foreground`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.branch}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{student.percentage}%</p>
                </div>
              </div>
            )) : <p className="text-center text-muted-foreground py-10">No records yet</p>}
          </div>
        </div>

        {/* Branch Performance - Mapped from DB */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="w-5 h-5 text-primary" /></div>
            <h2 className="text-lg font-heading font-semibold text-foreground">Branch Performance</h2>
          </div>
          <div className="space-y-4">
            {stats.branchPerformance.length > 0 ? stats.branchPerformance.map((branch: any) => (
              <div key={branch.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{branch.name}</span>
                  <span className="text-sm text-muted-foreground">{branch.avg}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${branch.avg}%` }}
                  />
                </div>
              </div>
            )) : <p className="text-center text-muted-foreground py-10">No data available</p>}
          </div>
        </div>
      </div>

      {/* Quick Actions - EXACTLY SAME DESIGN */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card">
        <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => navigate('/teacher/results')}>
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

      {/* Upload Dialog - EXACTLY SAME DESIGN */}
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
    </div>
  );
};

export default TeacherDashboard;