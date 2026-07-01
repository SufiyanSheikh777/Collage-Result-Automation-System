import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { User, Mail, Loader2, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; 

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); 

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  const url = activeTab === 'teacher' 
    ? "http://127.0.0.1:5000/login" 
    : "http://127.0.0.1:5000/login/student";

  const body = activeTab === 'teacher' 
    ? { email, password } 
    : { enrollmentNumber };

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
  // 1. Extract Role (Teacher uses data.role, Student might use data.user.role)
  const userRole = data.role || data.user?.role;
  
  // 2. Extract Name (Teacher uses data.name, Student uses data.user.name or data.name)
  const userName = data.name || data.user?.name || data.user?.full_name || "User";

  // 3. Prepare User Object for AuthContext
  // We ensure it has 'name', 'role', and 'enrollment' (if student)
  const userData = {
    ...data.user,
    name: userName,
    role: userRole,
    // Ensure enrollment is mapped if it exists in data.user
    enrollment: data.user?.enrollment || enrollmentNumber 
  };

  // 4. Save to Context and Notify
  await login(userRole, userData); 
  toast.success(`Welcome, ${userName}!`);

  // 5. Navigate
  if (userRole === 'teacher') {
    navigate('/teacher/dashboard');
  } else {
    navigate('/student/dashboard');
  }
}else {
      toast.error(data.error || "Login failed");
    }
  } catch (err) {
    console.error("Fetch Error:", err);
    toast.error("Server error. Please check backend terminal.");
  } finally {
    setIsLoading(false); // This stops the loading spinner
  }
};
// 70 lines
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-heading font-bold text-foreground">Welcome Back</h2>
        <p className="text-muted-foreground mt-1">Sign in to your account</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="student">Student</TabsTrigger>
          <TabsTrigger value="teacher">Teacher</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TabsContent value="student" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label htmlFor="enrollment">Enrollment Number</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="enrollment"
                  placeholder="Enter enrollment no."
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
              <Label htmlFor="teacher-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="teacher-email"
                  type="email"
                  placeholder="name@somayya.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required={activeTab === 'teacher'}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="teacher-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required={activeTab === 'teacher'}
                />
              </div>
            </div>
          </TabsContent>

          <Button type="submit" variant="default" size="lg" className="w-full" disabled={isLoading}>
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Signing in...</> : 'Sign In'}
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
    </div>
  );
};