import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Building2, 
  Plus, 
  Users, 
  Award, 
  BookOpen, 
  ArrowRight, 
  Loader2 
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
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Department {
  id: number;
  name: string;
  code: string;
  hodName: string;
  hodEmail: string;
  staffCount: number;
}

export const Departments: React.FC = () => {
  const { activeCollege } = useAuth();
  const collegeId = activeCollege?.id || 1;
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/college/${collegeId}/departments`);
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (e) {
      toast.error('Error fetching departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [collegeId]);

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) {
      toast.error('Please enter a department name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/college/${collegeId}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: deptName.trim(),
          code: deptCode.trim().toUpperCase()
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Department '${deptName}' added successfully!`);
        setShowAddModal(false);
        setDeptName('');
        setDeptCode('');
        fetchDepartments();
      } else {
        toast.error(data.error || 'Failed to add department.');
      }
    } catch (e) {
      toast.error('Could not connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">
            Academic Departments & Programs
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure MSBTE engineering branches, view HOD assignments, and check faculty allocations.
          </p>
        </div>

        <Button 
          onClick={() => setShowAddModal(true)} 
          className="gradient-primary text-primary-foreground font-semibold shadow-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Loading departments...</p>
        </div>
      ) : departments.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground space-y-3 bg-card rounded-2xl border border-border p-8">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50" />
          <p className="text-sm font-medium">No departments registered for this college yet.</p>
          <Button onClick={() => setShowAddModal(true)}>Add Your First Department</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <div key={dept.id} className="bg-card rounded-2xl border border-border p-5 shadow-xs hover:shadow-md transition-all hover:border-primary/40 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl gradient-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm shadow-xs font-mono">
                    {dept.code || 'ENG'}
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-muted font-medium text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {dept.staffCount} Faculty
                  </span>
                </div>

                <div>
                  <h3 className="font-heading font-bold text-base text-foreground leading-snug">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">MSBTE Branch Code: {dept.code || 'N/A'}</p>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1 text-xs">
                  <p className="text-muted-foreground font-medium flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-purple-600" />
                    Head of Department (HOD):
                  </p>
                  <p className="font-semibold text-foreground">
                    {dept.hodName && dept.hodName !== 'Not Assigned' ? dept.hodName : (
                      <span className="text-muted-foreground font-normal italic">No HOD designated</span>
                    )}
                  </p>
                  {dept.hodEmail && (
                    <p className="text-[11px] text-muted-foreground">{dept.hodEmail}</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/admin/staff')}
                  className="text-xs text-primary hover:underline px-0 h-auto"
                >
                  Manage Faculty &rarr;
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    const targetBranch = dept.code || dept.name;
                    navigate(`/admin/results?branch=${encodeURIComponent(targetBranch)}`);
                  }}
                  className="text-xs h-8 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  View Results
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD DEPARTMENT MODAL */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-bold">Add Academic Department</DialogTitle>
            <DialogDescription>
              Create a new engineering or technology branch for your institution.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddDept} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="newDeptName">Department Name <span className="text-destructive">*</span></Label>
              <Input
                id="newDeptName"
                placeholder="e.g. Artificial Intelligence & Machine Learning"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newDeptCode">MSBTE Branch Code</Label>
              <Input
                id="newDeptCode"
                placeholder="e.g. AI, CO, ME"
                maxLength={6}
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value.toUpperCase())}
              />
              <p className="text-[11px] text-muted-foreground">Standard 2-3 letter MSBTE branch abbreviation.</p>
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
                  'Add Department'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Departments;