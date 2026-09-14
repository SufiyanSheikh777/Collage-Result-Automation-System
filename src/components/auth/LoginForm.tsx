import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { User, Mail, Loader2, Lock, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; 
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth(); 

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim() || !forgotPassword) {
      toast.error('Please fill in all fields.');
      return;
    }
    if (forgotPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (forgotPassword !== forgotConfirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: forgotIdentifier.trim(),
          newPassword: forgotPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Password reset successfully!');
        setShowForgotModal(false);
        setForgotIdentifier('');
        setForgotPassword('');
        setForgotConfirmPassword('');
      } else {
        toast.error(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      toast.error('Could not connect to server.');
    } finally {
      setIsResetting(false);
    }
  }; 

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  const url = activeTab === 'student'
    ? "/login/student" 
    : "/login";

  const body = activeTab === 'student'
    ? { enrollmentNumber }
    : { email, password };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    // Check if the response is actually JSON before parsing
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server did not return JSON");
    }

    const data = await res.json();

    if (res.ok) {
      // 1. Extract Role (Teacher/Admin uses data.role, Student might use data.user.role)
      const userRole = data.role || data.user?.role || (activeTab === 'admin' ? 'college_admin' : 'student');
      
      // 2. Extract Name (Teacher/Admin uses data.name, Student uses data.user.name or data.name)
      const userName = data.name || data.user?.name || data.user?.full_name || (activeTab === 'admin' ? "College Admin" : "User");

      // 3. Prepare User Object for AuthContext
      const userData = {
        ...data.user,
        name: userName,
        role: userRole,
        enrollment: data.user?.enrollment || enrollmentNumber 
      };

      // 4. Save to Context and Notify
      await login(userRole, userData); 
      toast.success(`Welcome, ${userName}!`);

      // 5. Navigate based on role
      if (userRole === 'college_admin') {
        navigate('/admin/dashboard');
      } else if (userRole === 'teacher' || userRole === 'hod') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } else {
      toast.error(data.error || "Login failed");
    }
  } catch (err) {
    console.error("Fetch Error:", err);
    toast.error("Server error. Please check backend terminal.");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-heading font-bold text-foreground">Welcome Back</h2>
        <p className="text-muted-foreground mt-1 text-sm">Sign in to your college account</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/60 p-1">
          <TabsTrigger value="student" className="text-xs sm:text-sm font-medium">Student</TabsTrigger>
          <TabsTrigger value="teacher" className="text-xs sm:text-sm font-medium">Teacher</TabsTrigger>
          <TabsTrigger value="admin" className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 data-[state=active]:text-primary">
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TabsContent value="student" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label htmlFor="enrollment">Enrollment Number</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="enrollment"
                  placeholder="e.g. 2023COMP001"
                  value={enrollmentNumber}
                  onChange={(e) => setEnrollmentNumber(e.target.value)}
                  className="pl-10 h-11"
                  required={activeTab === 'student'}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">Enter your 10-digit MSBTE enrollment number</p>
            </div>
          </TabsContent>

          <TabsContent value="teacher" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label htmlFor="teacher-email">Faculty Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="teacher-email"
                  type="email"
                  placeholder="faculty@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required={activeTab === 'teacher'}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="teacher-password">Password</Label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotIdentifier(email);
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="teacher-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  required={activeTab === 'teacher'}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-4 mt-0">
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-2.5 text-xs text-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-primary" />
              <span>Institute Admin Portal. Use registered college admin credentials.</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Admin Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required={activeTab === 'admin'}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="admin-password">Admin Password</Label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotIdentifier(email);
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Enter administrator password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  required={activeTab === 'admin'}
                />
              </div>
            </div>
          </TabsContent>

          <Button type="submit" variant="default" size="lg" className="w-full h-11 font-semibold" disabled={isLoading}>
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Signing in...</>
            ) : activeTab === 'admin' ? (
              'Sign In as Admin'
            ) : activeTab === 'teacher' ? (
              'Sign In as Faculty'
            ) : (
              'Sign In as Student'
            )}
          </Button>
        </form>
      </Tabs>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{' '}
          <button onClick={onSwitchToRegister} className="text-primary font-medium hover:underline">
            Register here
          </button>
        </p>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotModal} onOpenChange={setShowForgotModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Enter your registered email address or enrollment number and choose a new password.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="forgot-identifier">Registered Email or Enrollment No.</Label>
              <Input
                id="forgot-identifier"
                placeholder="e.g. faculty@college.edu or 2023COMP001"
                value={forgotIdentifier}
                onChange={(e) => setForgotIdentifier(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="forgot-new-pass">New Password</Label>
              <Input
                id="forgot-new-pass"
                type="password"
                placeholder="At least 6 characters"
                value={forgotPassword}
                onChange={(e) => setForgotPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="forgot-confirm-pass">Confirm New Password</Label>
              <Input
                id="forgot-confirm-pass"
                type="password"
                placeholder="Re-enter new password"
                value={forgotConfirmPassword}
                onChange={(e) => setForgotConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setShowForgotModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isResetting} className="gradient-primary text-primary-foreground font-semibold">
                {isResetting ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Resetting...</>
                ) : (
                  'Update Password'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};