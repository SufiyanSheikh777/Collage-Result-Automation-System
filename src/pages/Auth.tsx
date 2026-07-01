import React, { useState, useEffect } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { GraduationCap, BookOpen, Award, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  // Handle auto-login on refresh
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const role = localStorage.getItem('userRole');
    if (isLoggedIn === 'true' && role) {
      navigate(role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-secondary blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-primary-foreground/20 blur-3xl animate-float" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-primary-foreground">
                Somayya Polytechnic
              </h1>
              <p className="text-primary-foreground/70 text-sm">Excellence in Technical Education</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-4xl xl:text-5xl font-heading font-bold text-primary-foreground leading-tight">
                Result Automation
                <br />
                <span className="text-secondary">System</span>
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80 max-w-md">
                Access MSBTE results instantly without manual searching. 
                View rankings, generate marksheets, and analyze performance.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: BookOpen, label: 'Instant Results', desc: 'No captcha needed' },
                { icon: Award, label: 'Rankings', desc: 'Topper lists' },
                { icon: BarChart, label: 'Analytics', desc: 'Performance insights' },
                { icon: GraduationCap, label: 'Marksheets', desc: 'PDF generation' },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="glass rounded-xl p-4 transition-transform hover:scale-105"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <feature.icon className="w-6 h-6 text-secondary mb-2" />
                  <p className="font-medium text-primary-foreground">{feature.label}</p>
                  <p className="text-sm text-primary-foreground/60">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-primary-foreground/50">
            © 2024 Somayya Polytechnic. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-foreground">Somayya Polytechnic</h1>
              <p className="text-xs text-muted-foreground">Result Automation System</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-card animate-scale-in">
            {isLogin ? (
              <LoginForm 
                onSwitchToRegister={() => setIsLogin(false)} 
                onSuccess={() => {}} // Logic handled inside LoginForm for better control
              />
            ) : (
              <RegisterForm 
                onSwitchToLogin={() => setIsLogin(true)} 
                onSuccess={() => setIsLogin(true)} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;