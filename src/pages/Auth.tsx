import React, { useState, useEffect } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { GraduationCap, BookOpen, Award, BarChart, Building2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { activeCollege, user, isAuthenticated, logout } = useAuth();
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-secondary blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-primary-foreground/20 blur-3xl animate-float" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-14 h-14 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <GraduationCap className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-heading font-bold text-primary-foreground tracking-tight">
                  College Result Automation System
                </h1>
                <p className="text-primary-foreground/75 text-xs sm:text-sm">
                  Maharashtra Polytechnic Multi-College Portal
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="bg-white/10 hover:bg-white/20 text-primary-foreground border-white/20 backdrop-blur text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back to Home
            </Button>
          </div>

          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur mb-4 border border-white/20">
                <Building2 className="w-3.5 h-3.5 text-secondary" />
                <span>Multi-College MSBTE Portal</span>
              </div>
              <h2 className="text-4xl xl:text-5xl font-heading font-bold text-primary-foreground leading-tight">
                Diploma Result
                <br />
                <span className="text-secondary">Automation System</span>
              </h2>
              <p className="mt-4 text-base xl:text-lg text-primary-foreground/80 max-w-md leading-relaxed">
                Access MSBTE results instantly without manual captcha solving. 
                View rankings, generate official marksheets, and analyze institute performance.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: BookOpen, label: 'Instant Results', desc: 'Zero captchas needed' },
                { icon: Award, label: 'Rankings', desc: 'Branch topper lists' },
                { icon: BarChart, label: 'Analytics', desc: 'Department insights' },
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

          <div className="flex items-center justify-between text-sm text-primary-foreground/60 pt-4 border-t border-primary-foreground/10">
            <p>© {new Date().getFullYear()} College Result Automation System. All rights reserved.</p>
            <button 
              onClick={() => navigate('/register-college')}
              className="text-secondary hover:underline flex items-center gap-1 font-medium"
            >
              <Building2 className="w-4 h-4" />
              Register College
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-between gap-3 mb-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                <GraduationCap className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-foreground">College Result Automation</h1>
                <p className="text-xs text-muted-foreground">MSBTE Polytechnic Portal</p>
              </div>
            </div>
          </div>

          {/* Active Session Notice if already logged in */}
          {isAuthenticated && user && (
            <div className="mb-4 p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs animate-fade-in">
              <div>
                <span className="text-muted-foreground">Signed in as: </span>
                <span className="font-semibold text-foreground">{user.name}</span>
                <span className="ml-1 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted font-bold text-primary">
                  {user.role}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs font-semibold gradient-primary text-primary-foreground"
                  onClick={() => {
                    if (user.role === 'college_admin') navigate('/admin/dashboard');
                    else if (user.role === 'teacher' || user.role === 'hod') navigate('/teacher/dashboard');
                    else navigate('/student/dashboard');
                  }}
                >
                  Dashboard
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                  onClick={() => logout()}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border p-8 shadow-card animate-scale-in">
            {isLogin ? (
              <LoginForm 
                onSwitchToRegister={() => setIsLogin(false)} 
                onSuccess={() => {}}
              />
            ) : (
              <RegisterForm 
                onSwitchToLogin={() => setIsLogin(true)} 
                onSuccess={() => setIsLogin(true)} 
              />
            )}
          </div>

          {/* College Registration Banner on mobile & below card */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Want this system for your college?{' '}
              <button 
                onClick={() => navigate('/register-college')}
                className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
              >
                Register Your College
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;