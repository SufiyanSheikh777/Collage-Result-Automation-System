import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UserCheck, 
  UserX, 
  Clock, 
  Users, 
  Mail, 
  Phone, 
  Building2, 
  CheckCircle2, 
  Loader2,
  ShieldAlert,
  Search,
  Award,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface FacultyMember {
  id: number;
  fullName: string;
  email: string;
  branch: string;
  role: string;
  isHod: boolean;
  phone: string;
  status: string;
}

interface PendingTeacher {
  id: number;
  fullName: string;
  email: string;
  branch: string;
  phone: string;
  status: string;
}

export const HodApprovals: React.FC = () => {
  const { user, activeCollege } = useAuth();
  const collegeId = activeCollege?.id || 1;
  const userBranch = user?.branch || '';

  const [activeTab, setActiveTab] = useState<'faculty' | 'pending'>('faculty');
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<PendingTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Delete Faculty Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMemberForDelete, setSelectedMemberForDelete] = useState<FacultyMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch pending faculty
      const pendingUrl = new URL(`/api/college/${collegeId}/pending-teachers`, window.location.origin);
      if (userBranch && user?.role !== 'college_admin') {
        pendingUrl.searchParams.append('branch', userBranch);
      }
      const pendingRes = await fetch(pendingUrl.toString());
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingTeachers(pendingData);
      }

      // 2. Fetch approved department faculty
      const staffUrl = new URL(`/api/college/${collegeId}/staff`, window.location.origin);
      if (userBranch && user?.role !== 'college_admin') {
        staffUrl.searchParams.append('branch', userBranch);
      }
      const staffRes = await fetch(staffUrl.toString());
      if (staffRes.ok) {
        const staffData: FacultyMember[] = await staffRes.json();
        setFacultyList(staffData);
      }
    } catch (e) {
      toast.error('Could not fetch faculty data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [collegeId, userBranch]);

  const handleApprove = async (teacher: PendingTeacher) => {
    setActionLoading(teacher.id);
    try {
      const res = await fetch(`/api/teachers/${teacher.id}/approve`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Approved ${teacher.fullName} for ${teacher.branch}!`);
        fetchAllData();
      } else {
        toast.error(data.error || 'Approval failed.');
      }
    } catch (e) {
      toast.error('Server error.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (teacher: PendingTeacher) => {
    if (!confirm(`Are you sure you want to decline ${teacher.fullName}'s registration?`)) return;

    setActionLoading(teacher.id);
    try {
      const res = await fetch(`/api/teachers/${teacher.id}/reject`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        toast.info(`Registration declined for ${teacher.fullName}.`);
        fetchAllData();
      } else {
        toast.error(data.error || 'Rejection failed.');
      }
    } catch (e) {
      toast.error('Server error.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedMemberForDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/college/${collegeId}/staff/${selectedMemberForDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Removed ${selectedMemberForDelete.fullName} successfully.`);
        setShowDeleteModal(false);
        setSelectedMemberForDelete(null);
        fetchAllData();
      } else {
        toast.error(data.error || 'Failed to remove faculty member.');
      }
    } catch (e) {
      toast.error('Error removing faculty member.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered faculty list based on search term
  const filteredFaculty = facultyList.filter(f => {
    const q = searchTerm.toLowerCase();
    return (
      f.fullName.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q) ||
      (f.phone && f.phone.includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-heading font-bold text-foreground">
              Department Faculty & Approvals
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {userBranch || 'Department Overview'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            View active faculty members and review pending faculty registrations in your department.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchAllData} disabled={loading} className="shrink-0">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'faculty' | 'pending')} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <TabsList className="grid grid-cols-2 w-full sm:w-auto h-11 p-1 bg-muted/60 border border-border">
            <TabsTrigger value="faculty" className="gap-2 px-4 py-2 text-xs sm:text-sm font-medium">
              <Users className="w-4 h-4" />
              Department Faculty
              <span className="ml-1 px-2 py-0.2 rounded-full text-[11px] bg-primary/15 text-primary font-semibold">
                {facultyList.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2 px-4 py-2 text-xs sm:text-sm font-medium">
              <UserCheck className="w-4 h-4" />
              Pending Approvals
              {pendingTeachers.length > 0 ? (
                <span className="ml-1 px-2 py-0.2 rounded-full text-[11px] bg-amber-500 text-white font-bold animate-pulse">
                  {pendingTeachers.length}
                </span>
              ) : (
                <span className="ml-1 px-2 py-0.2 rounded-full text-[11px] bg-muted text-muted-foreground font-medium">
                  0
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {activeTab === 'faculty' && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search faculty by name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-xs bg-card"
              />
            </div>
          )}
        </div>

        {/* TAB 1: Department Faculty Directory */}
        <TabsContent value="faculty" className="space-y-4 mt-0">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading department faculty...</p>
            </div>
          ) : filteredFaculty.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground space-y-3 bg-card rounded-2xl border border-border p-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/60" />
              <h3 className="font-heading font-bold text-lg text-foreground">
                {searchTerm ? 'No Matching Faculty Found' : 'No Faculty Registered Yet'}
              </h3>
              <p className="text-sm max-w-md mx-auto">
                {searchTerm 
                  ? `No faculty members matched "${searchTerm}". Try a different keyword.`
                  : `There are currently no active faculty members listed under ${userBranch || 'this department'}. Approved faculty registrations will appear here.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFaculty.map((member) => (
                <div
                  key={member.id}
                  className="bg-card rounded-2xl border border-border p-5 shadow-xs hover:shadow-md transition-all space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 shadow-xs">
                          {member.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-heading font-bold text-base text-foreground leading-snug truncate">
                            {member.fullName}
                          </h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                            <Building2 className="w-3.5 h-3.5 shrink-0" />
                            {member.branch}
                          </p>
                        </div>
                      </div>

                      {member.role === 'college_admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary text-primary-foreground shrink-0">
                          <ShieldCheck className="w-3 h-3" />
                          Admin
                        </span>
                      ) : member.isHod ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 shrink-0">
                          <Award className="w-3 h-3" />
                          HOD
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5 text-foreground shrink-0" />
                        <a 
                          href={`mailto:${member.email}`} 
                          className="text-foreground hover:underline font-mono truncate"
                        >
                          {member.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 text-foreground shrink-0" />
                        <span>{member.phone && member.phone !== 'N/A' ? member.phone : 'No phone provided'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-muted-foreground">
                      Status: <strong className="text-emerald-600 dark:text-emerald-400 capitalize">{member.status || 'Verified'}</strong>
                    </div>
                    {member.id !== user?.id && member.role !== 'college_admin' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMemberForDelete(member);
                          setShowDeleteModal(true);
                        }}
                        className="h-7 px-2.5 text-xs text-destructive hover:bg-destructive/10 border-destructive/30 gap-1 font-medium"
                        title="Remove faculty member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </Button>
                    ) : member.id === user?.id ? (
                      <span className="text-[11px] text-primary font-medium px-2 py-0.5 rounded-full bg-primary/10">
                        Your Account
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: Pending Approvals */}
        <TabsContent value="pending" className="space-y-4 mt-0">
          {/* Info Banner */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-foreground">HOD Verification for New Faculty</p>
              <p className="text-muted-foreground leading-relaxed">
                Self-registered faculty members cannot access student marksheets or performance data until approved by their Department HOD or College Administrator.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Checking pending registrations...</p>
            </div>
          ) : pendingTeachers.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground space-y-3 bg-card rounded-2xl border border-border p-8">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500/80" />
              <h3 className="font-heading font-bold text-lg text-foreground">No Pending Requests</h3>
              <p className="text-sm max-w-md mx-auto">
                All faculty registration requests for <span className="text-foreground font-medium">{userBranch || 'your department'}</span> have been processed. New registrations will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingTeachers.map((teacher) => (
                <div 
                  key={teacher.id} 
                  className="bg-card rounded-2xl border border-border p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm">
                          {teacher.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-heading font-bold text-base text-foreground leading-snug">
                            {teacher.fullName}
                          </h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Building2 className="w-3.5 h-3.5" />
                            {teacher.branch}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        Pending
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5 text-foreground" />
                        <span className="text-foreground font-mono">{teacher.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 text-foreground" />
                        <span>{teacher.phone || 'No phone provided'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center gap-2">
                    <Button
                      onClick={() => handleApprove(teacher)}
                      disabled={actionLoading === teacher.id}
                      className="flex-1 gradient-primary text-primary-foreground font-semibold h-9 text-xs shadow-xs"
                    >
                      {actionLoading === teacher.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Approve Faculty
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReject(teacher)}
                      disabled={actionLoading === teacher.id}
                      className="text-xs h-9 text-destructive hover:bg-destructive/10 border-destructive/30"
                    >
                      <UserX className="w-3.5 h-3.5 mr-1.5" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* REMOVE FACULTY CONFIRMATION MODAL */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-destructive/15 text-destructive flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-heading font-bold text-foreground">
              Remove Faculty Member?
            </DialogTitle>
            <DialogDescription className="text-sm space-y-2 pt-1 text-muted-foreground text-left">
              <div>
                Are you sure you want to remove <strong className="text-foreground">{selectedMemberForDelete?.fullName}</strong> ({selectedMemberForDelete?.branch})?
              </div>
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive leading-relaxed">
                This faculty member will immediately lose access to the college result automation portal and will no longer be able to log in.
              </div>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete} 
              disabled={isDeleting}
              className="font-semibold"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Yes, Remove Faculty Member'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

