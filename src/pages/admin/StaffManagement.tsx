import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  Building2, 
  Mail, 
  Phone, 
  Search, 
  CheckCircle, 
  AlertTriangle,
  Award,
  Loader2,
  Filter,
  UserCheck,
  UserX,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';

interface StaffMember {
  id: number;
  fullName: string;
  email: string;
  branch: string;
  role: string;
  isHod: boolean;
  phone?: string;
  status?: string;
}

export const StaffManagement: React.FC = () => {
  const { activeCollege } = useAuth();
  const collegeId = activeCollege?.id || 1;

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaffForDelete, setSelectedStaffForDelete] = useState<StaffMember | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedStaffForTransfer, setSelectedStaffForTransfer] = useState<StaffMember | null>(null);
  const [demotePrevious, setDemotePrevious] = useState(true);

  // Add Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [branch, setBranch] = useState('');
  const [phone, setPhone] = useState('');
  const [isHod, setIsHod] = useState(false);
  const [password, setPassword] = useState('Welcome@123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPendingTeachers = async () => {
    try {
      const res = await fetch(`/api/college/${collegeId}/pending-teachers`);
      if (res.ok) {
        const data = await res.json();
        setPendingTeachers(data);
      }
    } catch (e) {
      console.error('Error fetching pending teachers:', e);
    }
  };

  const handleApprovePending = async (teacherId: number, name: string) => {
    setActionLoading(teacherId);
    try {
      const res = await fetch(`/api/teachers/${teacherId}/approve`, {
        method: 'POST'
      });
      if (res.ok) {
        toast.success(`Approved faculty member ${name}!`);
        fetchStaffAndDepts();
      } else {
        toast.error('Approval failed.');
      }
    } catch (e) {
      toast.error('Server error.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectPending = async (teacherId: number, name: string) => {
    if (!confirm(`Decline registration request for ${name}?`)) return;
    setActionLoading(teacherId);
    try {
      const res = await fetch(`/api/teachers/${teacherId}/reject`, {
        method: 'POST'
      });
      if (res.ok) {
        toast.info(`Registration declined for ${name}.`);
        fetchStaffAndDepts();
      } else {
        toast.error('Rejection failed.');
      }
    } catch (e) {
      toast.error('Server error.');
    } finally {
      setActionLoading(null);
    }
  };

  const fetchStaffAndDepts = async () => {
    setLoading(true);
    try {
      // 1. Fetch Staff
      const resStaff = await fetch(`/api/college/${collegeId}/staff`);
      if (resStaff.ok) {
        const data = await resStaff.json();
        setStaffList(data);
      }

      // 2. Fetch Departments
      const resDepts = await fetch(`/api/college/${collegeId}/departments`);
      if (resDepts.ok) {
        const dData = await resDepts.json();
        setDepartments(dData);
        if (dData.length > 0 && !branch) {
          setBranch(dData[0].name);
        }
      }

      // 3. Fetch Pending Registrations
      await fetchPendingTeachers();
    } catch (e) {
      toast.error('Error fetching staff list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffAndDepts();
  }, [collegeId]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !branch) {
      toast.error('Please fill in Name, Email, and Department.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/college/${collegeId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          branch,
          role: isHod ? 'hod' : 'teacher',
          isHod,
          phone: phone.trim(),
          password
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Staff member added successfully!');
        setShowAddModal(false);
        setFullName('');
        setEmail('');
        setPhone('');
        setIsHod(false);
        fetchStaffAndDepts();
      } else {
        toast.error(data.error || 'Failed to add staff member.');
      }
    } catch (e) {
      toast.error('Could not connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedStaffForDelete) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/college/${collegeId}/staff/${selectedStaffForDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Staff member removed successfully.');
        setShowDeleteModal(false);
        setSelectedStaffForDelete(null);
        fetchStaffAndDepts();
      } else {
        toast.error(data.error || 'Failed to delete staff member.');
      }
    } catch (e) {
      toast.error('Error removing staff member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleHod = async (staff: StaffMember) => {
    const newIsHod = !staff.isHod;
    try {
      const res = await fetch(`/api/college/${collegeId}/staff/${staff.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isHod: newIsHod,
          role: newIsHod ? 'hod' : 'teacher'
        })
      });
      if (res.ok) {
        toast.success(newIsHod ? `Promoted ${staff.fullName} to HOD!` : `Removed HOD status for ${staff.fullName}`);
        fetchStaffAndDepts();
      } else {
        toast.error('Failed to update role.');
      }
    } catch (e) {
      toast.error('Server error updating role.');
    }
  };

  const handleTransferAdmin = async () => {
    if (!selectedStaffForTransfer) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/college/${collegeId}/staff/${selectedStaffForTransfer.id}/transfer-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demotePrevious })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'College Administrator role transferred successfully!');
        setShowTransferModal(false);
        setSelectedStaffForTransfer(null);
        fetchStaffAndDepts();
      } else {
        toast.error(data.error || 'Failed to transfer administrator role.');
      }
    } catch (e) {
      toast.error('Server error transferring admin role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.branch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter === 'all' || s.branch === departmentFilter;
    // Exclude pending teachers — they appear in the "Pending Approvals" card instead
    return matchesSearch && matchesDept && s.status !== 'pending';
  });

  const hodCount = staffList.filter(s => s.isHod).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">
            Faculty & Department Leadership Directory
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage Head of Departments (HODs), approve pending faculty, and oversee branch staffing.
          </p>
        </div>

        <Button 
          onClick={() => setShowAddModal(true)} 
          className="gradient-primary text-primary-foreground font-semibold shadow-md"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Faculty / HOD
        </Button>
      </div>

      {/* Quick Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Staff</p>
            <p className="text-xl font-heading font-bold text-foreground">{staffList.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Department HODs</p>
            <p className="text-xl font-heading font-bold text-purple-600">{hodCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active Departments</p>
            <p className="text-xl font-heading font-bold text-emerald-600">{departments.length}</p>
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          pendingTeachers.length > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-card border-border'
        }`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            pendingTeachers.length > 0 ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'
          }`}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pending Requests</p>
            <p className={`text-xl font-heading font-bold ${
              pendingTeachers.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
            }`}>
              {pendingTeachers.length}
            </p>
          </div>
        </div>
      </div>

      {/* Pending Faculty Registrations Section */}
      {pendingTeachers.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-foreground">
                  Pending Faculty Approvals ({pendingTeachers.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  These self-registered teachers require approval before they can access their department portal.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingTeachers.map((t) => (
              <div key={t.id} className="bg-background rounded-xl border border-border p-4 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-sm text-foreground">{t.fullName}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-amber-500/15 text-amber-600">Pending</span>
                  </div>
                  <p className="text-xs text-primary font-medium mt-0.5">{t.branch}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">{t.email}</p>
                  {t.phone && <p className="text-xs text-muted-foreground mt-0.5">{t.phone}</p>}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button
                    size="sm"
                    onClick={() => handleApprovePending(t.id, t.fullName)}
                    disabled={actionLoading === t.id}
                    className="flex-1 gradient-primary text-primary-foreground text-xs h-8 font-semibold"
                  >
                    <UserCheck className="w-3.5 h-3.5 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectPending(t.id, t.fullName)}
                    disabled={actionLoading === t.id}
                    className="text-xs h-8 text-destructive hover:bg-destructive/10 border-destructive/30"
                  >
                    <UserX className="w-3.5 h-3.5 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search faculty by name, email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-56 bg-background">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments ({staffList.length})</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.name}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Staff List Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Loading staff members...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground space-y-3">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <p className="text-sm font-medium">No staff members found matching your search.</p>
            <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add First Faculty Member
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                <tr>
                  <th className="py-3.5 px-4">Faculty Member</th>
                  <th className="py-3.5 px-4">Department / Branch</th>
                  <th className="py-3.5 px-4">Designation & Role</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-foreground">{staff.fullName}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {staff.email}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium text-foreground">{staff.branch}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {staff.role === 'college_admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                            <ShieldCheck className="w-3 h-3" />
                            Admin
                          </span>
                        ) : staff.isHod ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            <Award className="w-3 h-3" />
                            HOD (Head of Dept)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            Teacher / Faculty
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      {staff.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {staff.phone}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      {staff.role === 'college_admin' ? (
                        <span className="text-xs text-muted-foreground italic mr-2">
                          Current Administrator
                        </span>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleHod(staff)}
                            className="h-8 text-xs font-medium"
                          >
                            {staff.isHod ? 'Remove HOD' : 'Make HOD'}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStaffForTransfer(staff);
                              setShowTransferModal(true);
                            }}
                            className="h-8 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border-amber-500/30"
                            title="Transfer College Administrator Rights"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                            Make Admin
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStaffForDelete(staff);
                              setShowDeleteModal(true);
                            }}
                            className="h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                            title="Remove Teacher"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Remove
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD FACULTY MODAL */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-bold">Add New Faculty / HOD</DialogTitle>
            <DialogDescription>
              Register a teacher or department head for your institution.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddStaff} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="staffName">Full Name <span className="text-destructive">*</span></Label>
              <Input
                id="staffName"
                placeholder="e.g. Prof. Rajesh V. Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staffEmail">Email Address <span className="text-destructive">*</span></Label>
                <Input
                  id="staffEmail"
                  type="email"
                  placeholder="r.sharma@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staffPhone">Contact Phone</Label>
                <Input
                  id="staffPhone"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deptSelect">Department / Branch <span className="text-destructive">*</span></Label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger id="deptSelect">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.name}>
                      {d.name} {d.code ? `(${d.code})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initPassword">Initial Password</Label>
              <Input
                id="initPassword"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">The faculty member can use this to sign in.</p>
            </div>

            {/* Designate as HOD Checkbox */}
            <div className="p-3.5 rounded-xl border border-border bg-muted/40 flex items-start gap-3">
              <input
                type="checkbox"
                id="isHodCheck"
                checked={isHod}
                onChange={(e) => setIsHod(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-border text-primary cursor-pointer"
              />
              <label htmlFor="isHodCheck" className="text-xs cursor-pointer">
                <span className="font-semibold text-foreground block">Designate as Head of Department (HOD)</span>
                <span className="text-muted-foreground">
                  Gives administrative authority to view and download overall performance reports for this department.
                </span>
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gradient-primary text-primary-foreground font-semibold">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Faculty Member'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* REMOVE TEACHER CONFIRMATION MODAL */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-destructive/15 text-destructive flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-heading font-bold text-foreground">
              Remove Faculty Member?
            </DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to remove <strong>{selectedStaffForDelete?.fullName}</strong> ({selectedStaffForDelete?.branch})?
              <br /><br />
              This faculty member will immediately lose access to the college result portal. If they are an HOD, their department HOD appointment will be revoked.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete} 
              disabled={isSubmitting}
              className="font-semibold"
            >
              {isSubmitting ? (
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

      {/* TRANSFER COLLEGE ADMINISTRATOR CONFIRMATION MODAL */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-heading font-bold text-foreground">
              Transfer College Administrator Role
            </DialogTitle>
            <DialogDescription className="text-sm space-y-3 pt-2 text-muted-foreground text-left">
              <div>
                Are you sure you want to promote <strong className="text-foreground">{selectedStaffForTransfer?.fullName}</strong> ({selectedStaffForTransfer?.email}) to <strong>College Administrator</strong>?
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>Institutional Continuity:</strong> This user will receive full administrator control over this college portal, including faculty approvals, department management, and institutional settings. You do not need to re-register the college.
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="demotePrevCheck"
                  checked={demotePrevious}
                  onChange={(e) => setDemotePrevious(e.target.checked)}
                  className="rounded border-border text-primary cursor-pointer w-4 h-4"
                />
                <label htmlFor="demotePrevCheck" className="text-xs text-foreground cursor-pointer select-none">
                  Demote previous Administrator to Faculty role
                </label>
              </div>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button variant="outline" onClick={() => setShowTransferModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleTransferAdmin} 
              disabled={isSubmitting}
              className="font-semibold bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Transferring...
                </>
              ) : (
                'Confirm & Make Admin'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagement;