import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { User, Mail, Hash, Loader2, Lock, Building } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BRANCHES } from '@/data/mockData';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create the payload based on whether it's a student or teacher
      const payload = activeTab === 'teacher' 
        ? { 
            fullName: name, 
            email: email, 
            password: password, 
            branch: branch 
          } 
        : { 
            fullName: name, 
            enrollmentNumber: enrollmentNumber,
            branch: branch // Adding branch for students too as your DB supports it
          };

      const response = await fetch("http://127.0.0.1:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Registration successful! You can now sign in.");
        onSuccess();
        onSwitchToLogin();
      } else {
        toast.error(data.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Could not connect to the server. Make sure your Flask app is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-card rounded-xl border shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Create Account</h2>
        <p className="text-muted-foreground mt-2">Join the Academic Performance Portal</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'student' | 'teacher')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="student">Student</TabsTrigger>
          <TabsTrigger value="teacher">Teacher</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reg-name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="reg-name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-branch">Department / Branch</Label>
            <Select value={branch} onValueChange={setBranch} required>
              <SelectTrigger id="reg-branch" className="pl-10 relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Select your branch" />
              </SelectTrigger>
              <SelectContent>
                {BRANCHES.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="student" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label htmlFor="reg-enrollment">Enrollment Number</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reg-enrollment"
                  placeholder="Enter your enrollment number"
                  value={enrollmentNumber}
                  onChange={(e) => setEnrollmentNumber(e.target.value)}
                  className="pl-10"
                  required={activeTab === 'student'}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="teacher" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label htmlFor="reg-teacher-email">Official Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reg-teacher-email"
                  type="email"
                  placeholder="name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required={activeTab === 'teacher'}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-teacher-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reg-teacher-password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required={activeTab === 'teacher'}
                  minLength={6}
                />
              </div>
            </div>
          </TabsContent>

          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating account...</> : 'Create Account'}
          </Button>
        </form>
      </Tabs>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="text-primary font-medium hover:underline">
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
};