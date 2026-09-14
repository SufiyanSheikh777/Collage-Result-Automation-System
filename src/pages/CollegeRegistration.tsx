import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  GraduationCap, 
  Check, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  Plus, 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface DepartmentItem {
  name: string;
  code: string;
}

const DEFAULT_DEPARTMENTS: DepartmentItem[] = [
  { name: 'Computer Engineering', code: 'CW' },
  { name: 'Information Technology', code: 'IF' },
  { name: 'Mechanical Engineering', code: 'ME' },
  { name: 'Civil Engineering', code: 'CE' },
  { name: 'Electrical Engineering', code: 'EE' },
  { name: 'Electronics & Telecommunication', code: 'EJ' },
  { name: 'Automobile Engineering', code: 'AE' },
  { name: 'Chemical Engineering', code: 'CH' },
];

export const CollegeRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [msbteCode, setMsbteCode] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [shortName, setShortName] = useState('');
  const [region, setRegion] = useState('Mumbai');
  const [instituteType, setInstituteType] = useState('Unaided / Private');
  
  // Departments State (with branch codes)
  const [selectedDepartments, setSelectedDepartments] = useState<DepartmentItem[]>([
    { name: 'Computer Engineering', code: 'CW' },
    { name: 'Mechanical Engineering', code: 'ME' },
    { name: 'Civil Engineering', code: 'CE' }
  ]);
  const [customDeptName, setCustomDeptName] = useState('');
  const [customDeptCode, setCustomDeptCode] = useState('');

  // Admin Credentials
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const toggleDepartment = (dept: DepartmentItem) => {
    const exists = selectedDepartments.some(d => d.name.toLowerCase() === dept.name.toLowerCase());
    if (exists) {
      if (selectedDepartments.length <= 1) {
        toast.error('At least one department is required.');
        return;
      }
      setSelectedDepartments(selectedDepartments.filter(d => d.name.toLowerCase() !== dept.name.toLowerCase()));
    } else {
      setSelectedDepartments([...selectedDepartments, { name: dept.name, code: dept.code }]);
    }
  };

  const updateDepartmentCode = (index: number, newCode: string) => {
    const updated = [...selectedDepartments];
    updated[index] = { ...updated[index], code: newCode.toUpperCase().slice(0, 4) };
    setSelectedDepartments(updated);
  };

  const addCustomDepartment = () => {
    const nameTrimmed = customDeptName.trim();
    if (!nameTrimmed) return;
    const codeTrimmed = customDeptCode.trim().toUpperCase() || nameTrimmed.slice(0, 2).toUpperCase();
    if (selectedDepartments.some(d => d.name.toLowerCase() === nameTrimmed.toLowerCase())) {
      toast.info('Department already added.');
      return;
    }
    setSelectedDepartments([...selectedDepartments, { name: nameTrimmed, code: codeTrimmed }]);
    setCustomDeptName('');
    setCustomDeptCode('');
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msbteCode.trim() || !collegeName.trim()) {
      toast.error('Please fill all required institute details.');
      return;
    }
    if (msbteCode.trim().length < 3) {
      toast.error('MSBTE Institute code should normally be 4 digits.');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (selectedDepartments.length === 0) {
      toast.error('Please select at least one department.');
      return;
    }
    setStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim() || !adminEmail.trim() || !password) {
      toast.error('Please fill in all admin fields.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    const payload = {
      msbteCode: msbteCode.trim(),
      collegeName: collegeName.trim(),
      shortName: (shortName.trim() || collegeName.trim()),
      region,
      instituteType,
      departments: selectedDepartments,
      adminName: adminName.trim(),
      adminEmail: adminEmail.trim(),
      adminPhone: adminPhone.trim(),
      password
    };

    try {
      const res = await fetch('/api/college/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Registered ${data.college?.name || collegeName} successfully!`);
        // Log in as college_admin immediately
        if (data.user) {
          await login('college_admin', data.user);
        }
        navigate('/admin/dashboard');
      } else {
        toast.error(data.error || 'Registration failed.');
      }
    } catch (error) {
      console.error('Registration fetch error:', error);
      toast.error('Could not reach backend server. Please verify backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Preview brand name
  const displayBrand = shortName.trim() || collegeName.trim() || 'Your College';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-foreground text-sm sm:text-base">
                MSBTE Result Automation
              </h1>
              <p className="text-xs text-muted-foreground">College Onboarding Portal</p>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="text-sm">
            Already registered? Sign in
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="container mx-auto px-4 py-8 sm:py-12 flex-1 max-w-4xl">
        {/* Progress Bar & Steps */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between max-w-lg mx-auto relative mb-4">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 -z-10" />
            
            {/* Step 1 Indicator */}
            <div className="flex flex-col items-center gap-1.5 bg-background px-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step >= 1 ? 'gradient-primary text-primary-foreground shadow-md' : 'border border-border text-muted-foreground'
              }`}>
                {step > 1 ? <Check className="w-5 h-5" /> : '1'}
              </div>
              <span className="text-xs font-medium text-foreground">Institute</span>
            </div>

            {/* Step 2 Indicator */}
            <div className="flex flex-col items-center gap-1.5 bg-background px-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step >= 2 ? 'gradient-primary text-primary-foreground shadow-md' : 'border border-border text-muted-foreground'
              }`}>
                {step > 2 ? <Check className="w-5 h-5" /> : '2'}
              </div>
              <span className="text-xs font-medium text-foreground">Departments</span>
            </div>

            {/* Step 3 Indicator */}
            <div className="flex flex-col items-center gap-1.5 bg-background px-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step >= 3 ? 'gradient-primary text-primary-foreground shadow-md' : 'border border-border text-muted-foreground'
              }`}>
                3
              </div>
              <span className="text-xs font-medium text-foreground">Admin Account</span>
            </div>
          </div>
        </div>

        {/* Live Dynamic Branding Preview Card */}
        <div className="mb-8 p-4 rounded-2xl border border-border bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-secondary flex items-center justify-center text-secondary-foreground shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Live Portal Title Preview</p>
              <h3 className="text-base sm:text-lg font-heading font-bold text-foreground">
                [{displayBrand}] Result Automation System
              </h3>
            </div>
          </div>
          {msbteCode && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              MSBTE Code: {msbteCode}
            </span>
          )}
        </div>

        {/* Wizard Card */}
        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-card animate-fade-in">
          {/* STEP 1: Institute Details */}
          {step === 1 && (
            <form onSubmit={handleNextStep1} className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-2xl font-heading font-bold text-foreground">1. College & MSBTE Identity</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your official MSBTE institute details to configure tenant isolation and automated result fetching.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="msbteCode" className="font-medium">
                    MSBTE Institute Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="msbteCode"
                    placeholder="e.g. 0540, 0018, 1152"
                    maxLength={6}
                    value={msbteCode}
                    onChange={(e) => setMsbteCode(e.target.value.toUpperCase())}
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    4-digit code provided on your MSBTE affiliation certificate and student enrollment numbers.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortName" className="font-medium">
                    College Short / Brand Name
                  </Label>
                  <Input
                    id="shortName"
                    placeholder="e.g. Somaiya Polytechnic, GP Pune"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Used dynamically on dashboards: "[Short Name] Result Automation System"
                  </p>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="collegeName" className="font-medium">
                    College Official Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="collegeName"
                    placeholder="e.g. K. J. Somaiya Polytechnic, Mumbai"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region" className="font-medium">MSBTE Regional Board</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger id="region">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mumbai">Mumbai Region (RBTE Mumbai)</SelectItem>
                      <SelectItem value="Pune">Pune Region (RBTE Pune)</SelectItem>
                      <SelectItem value="Nagpur">Nagpur Region (RBTE Nagpur)</SelectItem>
                      <SelectItem value="Chhatrapati Sambhajinagar">Chhatrapati Sambhajinagar (Aurangabad)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instituteType" className="font-medium">Institute Type</Label>
                  <Select value={instituteType} onValueChange={setInstituteType}>
                    <SelectTrigger id="instituteType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Government">Government Polytechnic</SelectItem>
                      <SelectItem value="Government-Aided">Government-Aided Polytechnic</SelectItem>
                      <SelectItem value="Unaided / Private">Unaided / Private Polytechnic</SelectItem>
                      <SelectItem value="Autonomous">Autonomous Polytechnic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button type="submit" className="gradient-primary text-primary-foreground font-semibold px-6">
                  Next: Academic Departments
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2: Departments Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-2xl font-heading font-bold text-foreground">2. Select Active Departments</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose which engineering departments are offered at your polytechnic. You can assign HODs and faculty to each department in your admin portal.
                </p>
              </div>

              {/* Quick Select Pill Buttons */}
              <div className="space-y-3">
                <Label className="font-medium">Common MSBTE Diploma Branches (Click to toggle)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DEFAULT_DEPARTMENTS.map((dept) => {
                    const isSelected = selectedDepartments.some(d => d.name.toLowerCase() === dept.name.toLowerCase());
                    return (
                      <div
                        key={dept.name}
                        onClick={() => toggleDepartment(dept)}
                        className={`cursor-pointer rounded-xl border p-3 flex items-center justify-between transition-all select-none ${
                          isSelected 
                            ? 'bg-primary/10 border-primary text-primary font-semibold shadow-sm' 
                            : 'border-border text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground'
                          }`}>
                            {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                          </div>
                          <span className="text-sm">{dept.name}</span>
                        </div>
                        <span className="text-xs px-2.5 py-0.5 rounded bg-muted font-mono font-bold text-muted-foreground border border-border">
                          {dept.code}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Custom Department */}
              <div className="p-4 rounded-xl border border-dashed border-border bg-card/50 space-y-3">
                <Label className="font-medium text-xs text-foreground flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  Add Custom Department with MSBTE Branch Code:
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <Input
                      placeholder="Department Name (e.g. Mining & Mine Surveying)"
                      value={customDeptName}
                      onChange={(e) => setCustomDeptName(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Code (e.g. MA)"
                      value={customDeptCode}
                      onChange={(e) => setCustomDeptCode(e.target.value.toUpperCase())}
                      className="font-mono uppercase w-24"
                      maxLength={4}
                    />
                    <Button type="button" variant="secondary" onClick={addCustomDepartment} className="flex-1">
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* Currently Selected Summary with Editable Codes */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Configured Departments & MSBTE Branch Codes ({selectedDepartments.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedDepartments.map((dept, idx) => (
                    <div 
                      key={dept.name} 
                      className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border shadow-xs text-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden mr-2">
                        <span className="font-medium text-foreground truncate">{dept.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-muted-foreground">Code:</span>
                        <input
                          type="text"
                          value={dept.code}
                          onChange={(e) => updateDepartmentCode(idx, e.target.value)}
                          className="w-12 h-6 text-center font-mono font-bold text-xs uppercase bg-muted border border-border rounded px-1 text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          title="Click to edit MSBTE Branch Code"
                          maxLength={4}
                        />
                        <button
                          type="button"
                          onClick={() => toggleDepartment(dept)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors ml-0.5"
                          title="Remove department"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button type="button" onClick={handleNextStep2} className="gradient-primary text-primary-foreground font-semibold px-6">
                  Next: Admin Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Admin Account */}
          {step === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-2xl font-heading font-bold text-foreground">3. College Administrator Account</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Create the primary administrator account (Principal, Exam In-Charge, or System Admin) to manage faculty, HODs, and student marks.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="adminName" className="font-medium">
                    Admin Full Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="adminName"
                      placeholder="e.g. Dr. S. K. Patil (Principal / Exam In-Charge)"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail" className="font-medium">
                    Official College Email <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="principal@polytechnic.edu"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Will be used for admin sign in.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPhone" className="font-medium">
                    Contact Mobile Number
                  </Label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="adminPhone"
                      placeholder="e.g. 9876543210"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-medium">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-medium">
                    Confirm Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Security notice */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3 text-xs text-muted-foreground">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>
                  Your college data, faculty accounts, and student marksheets are encrypted and isolated under your unique MSBTE institute tenant ID.
                </span>
              </div>

              <div className="flex justify-between pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="gradient-secondary text-secondary-foreground font-bold px-8 shadow-md"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registering College...
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4 mr-2" />
                      Complete College Registration
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default CollegeRegistration;