import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  Building2, 
  FileText, 
  Trophy, 
  Upload, 
  RotateCw, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  School,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { activeCollege } = useAuth();
  
  const [stats, setStats] = useState({
    totalStudents: 73,
    passed: 64,
    failed: 9,
    avgPercentage: 78.4,
    topPerformers: [] as any[],
    branchPerformance: [] as any[]
  });

  const [departments, setDepartments] = useState<any[]>([]);
  const [staffCount, setStaffCount] = useState<number>(0);
  const [isFetching, setIsFetching] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const collegeId = activeCollege?.id || 1;

  const loadData = async () => {
    try {
      // 1. Fetch Analytics
      const resAnalytics = await fetch('/get_analytics');
      if (resAnalytics.ok) {
        const data = await resAnalytics.json();
        setStats({
          totalStudents: data.overall?.total || 0,
          passed: data.overall?.passed || 0,
          failed: data.overall?.failed || 0,
          avgPercentage: data.overall?.average || 0,
          topPerformers: data.top_performers || [],
          branchPerformance: data.branch_performance || []
        });
      }

      // 2. Fetch Departments
      const resDepts = await fetch(`/api/college/${collegeId}/departments`);
      if (resDepts.ok) {
        const dData = await resDepts.json();
        setDepartments(dData);
      }

      // 3. Fetch Staff
      const resStaff = await fetch(`/api/college/${collegeId}/staff`);
      if (resStaff.ok) {
        const sData = await resStaff.json();
        setStaffCount(sData.length);
      }
    } catch (e) {
      console.warn('Dashboard data fetch error:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [collegeId]);

  const handleFetchResults = async () => {
    setIsFetching(true);
    toast.info('Connecting to MSBTE portal & solving captchas... Please wait.');
    try {
      const res = await fetch(`/fetch_results?college_id=${collegeId}`);
      if (res.ok) {
        toast.success('MSBTE results fetched and synced successfully!');
        loadData();
      } else {
        toast.error('Scraping completed with errors. Check backend terminal.');
      }
    } catch (e) {
      toast.error('Could not reach backend scraper.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleUploadEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile) {
      toast.error('Please select an enrollment list (.txt) file.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const res = await fetch('/upload_list', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        toast.success('Enrollment list uploaded successfully!');
        setShowUploadModal(false);
        setUploadedFile(null);
      } else {
        toast.error('Upload failed. Please ensure file is in .txt format.');
      }
    } catch (e) {
      toast.error('Server connection error during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const passRate = stats.totalStudents > 0 
    ? ((stats.passed / stats.totalStudents) * 100).toFixed(1) 
    : '0';

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* College Admin Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl gradient-hero text-primary-foreground p-4 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur border border-white/20">
              <School className="w-3.5 h-3.5" />
              <span>MSBTE Institute Code: {activeCollege?.msbteCode || '0540'}</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-heading font-extrabold tracking-tight">
              {activeCollege?.name || 'Somaiya Polytechnic'}
            </h2>
            <p className="text-xs sm:text-sm text-primary-foreground/80 leading-relaxed">
              Welcome to the central administrator control portal. Manage departments, appoint HODs, monitor pass percentages, and trigger automated MSBTE result syncing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <Button
              onClick={() => setShowUploadModal(true)}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-primary-foreground border-white/20 backdrop-blur font-medium text-xs sm:text-sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Enrollments
            </Button>
            <Button
              onClick={handleFetchResults}
              disabled={isFetching}
              className="gradient-secondary text-secondary-foreground font-bold shadow-md hover:brightness-105 text-xs sm:text-sm"
            >
              <RotateCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching ? 'Syncing MSBTE...' : 'Sync MSBTE Results'}
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Total Students */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground shadow-sm shrink-0">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Total Students</p>
            <p className="text-xl sm:text-2xl font-bold font-heading text-foreground mt-0.5">{stats.totalStudents}</p>
            <p className="text-[11px] text-muted-foreground truncate">Enrolled & Cached</p>
          </div>
        </div>

        {/* Passing Rate */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shadow-sm shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Pass Percentage</p>
            <p className="text-xl sm:text-2xl font-bold font-heading text-emerald-600 mt-0.5">{passRate}%</p>
            <p className="text-[11px] text-muted-foreground truncate">{stats.passed} Passed / {stats.failed} Failed</p>
          </div>
        </div>

        {/* Active Departments */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center shadow-sm shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Departments</p>
            <p className="text-xl sm:text-2xl font-bold font-heading text-foreground mt-0.5">{departments.length}</p>
            <p className="text-[11px] text-muted-foreground truncate">Active MSBTE Branches</p>
          </div>
        </div>

        {/* Faculty & HODs */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl gradient-secondary flex items-center justify-center text-secondary-foreground shadow-sm shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Faculty & HODs</p>
            <p className="text-xl sm:text-2xl font-bold font-heading text-foreground mt-0.5">{staffCount}</p>
            <p className="text-[11px] text-muted-foreground truncate">Registered Staff</p>
          </div>
        </div>
      </div>

      {/* Two Column Section: Department Governance & Toppers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Department List & HOD status */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-heading font-bold text-foreground">Departments & Head of Departments</h3>
              <p className="text-xs text-muted-foreground">Assigned branches and faculty leadership</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/admin/staff')}
              className="text-xs font-semibold"
            >
              Manage Staff
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <div className="divide-y divide-border">
            {departments.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">No departments found. Add departments to get started.</p>
            ) : (
              departments.map((dept) => (
                <div key={dept.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 shrink-0 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center font-mono">
                      {dept.code || 'ENG'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{dept.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        HOD: <span className="font-medium text-foreground">{dept.hodName || 'Not Assigned'}</span>
                        {dept.hodEmail ? <span className="hidden sm:inline"> ({dept.hodEmail})</span> : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pl-12 sm:pl-0">
                    <span className="text-xs px-2.5 py-0.5 sm:py-1 rounded-full bg-muted font-medium text-muted-foreground whitespace-nowrap">
                      {dept.staffCount || 0} Faculty
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate('/admin/staff')}
                      className="text-xs h-7 sm:h-8 px-2.5 font-medium shrink-0"
                    >
                      Assign
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Top Performers (Merit List) */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Institute Toppers
              </h3>
              <p className="text-xs text-muted-foreground">Top rankers across all branches</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/admin/results')}
              className="text-xs text-primary hover:underline"
            >
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {stats.topPerformers.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No toppers calculated yet. Sync results to populate merit list.
              </div>
            ) : (
              stats.topPerformers.slice(0, 5).map((student, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs ${
                      idx === 0 ? 'bg-amber-500/20 text-amber-600' :
                      idx === 1 ? 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300' :
                      idx === 2 ? 'bg-amber-700/20 text-amber-800' : 'bg-muted text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{student.name}</p>
                      <p className="text-[11px] text-muted-foreground">{student.branch}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-600">{student.percentage}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upload Enrollment Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Enrollment Number List</DialogTitle>
            <DialogDescription>
              Upload a plain text file (.txt) with one student enrollment number per line to queue automated MSBTE marksheet extraction.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadEnrollment} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="fileUpload">Select .txt File</Label>
              <Input
                id="fileUpload"
                type="file"
                accept=".txt"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setUploadedFile(e.target.files[0]);
                  }
                }}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading} className="gradient-primary text-primary-foreground font-semibold">
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload List
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;