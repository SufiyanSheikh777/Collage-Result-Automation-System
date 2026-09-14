import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Trophy, 
  BarChart3, 
  LogOut,
  GraduationCap,
  Menu,
  X,
  UserCheck,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const baseNavItems = [
  { to: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/teacher/results', icon: FileText, label: 'Results' },
  { to: '/teacher/ranking', icon: Trophy, label: 'Ranking' },
  { to: '/teacher/analytics', icon: BarChart3, label: 'Analytics' },
];

export const TeacherLayout: React.FC = () => {
  const { user, activeCollege, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHod = user?.role === 'hod' || (user as any)?.isHod;
  const navItems = isHod 
    ? [...baseNavItems, { to: '/teacher/approvals', icon: Users, label: 'Department Faculty' }]
    : baseNavItems;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0" onClick={() => navigate('/')}>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md shrink-0">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="font-heading font-bold text-foreground text-xs sm:text-base tracking-tight truncate max-w-[170px] sm:max-w-none">
                  Result Automation
                </h1>
                <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
                  Faculty & Department Portal {user?.branch ? `• ${user.branch}` : ''}
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}

              {user?.role === 'college_admin' && (
                <NavLink
                  to="/admin/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-secondary-foreground shadow-xs hover:brightness-105 ml-2"
                >
                  Admin Portal
                </NavLink>
              )}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role === 'hod' ? 'Head of Dept (HOD)' : user?.role === 'college_admin' ? 'College Admin' : 'Faculty'}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                <LogOut className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card animate-fade-in">
            <nav className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};
