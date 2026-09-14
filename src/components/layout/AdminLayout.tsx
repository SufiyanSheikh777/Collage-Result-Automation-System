import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText, 
  LogOut, 
  GraduationCap, 
  Menu, 
  X, 
  ShieldCheck,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/staff', icon: Users, label: 'Faculty & HODs' },
  { to: '/admin/departments', icon: Building2, label: 'Departments' },
  { to: '/admin/results', icon: FileText, label: 'Student Results' },
];

export const AdminLayout: React.FC = () => {
  const { user, activeCollege, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const collegeDisplay = activeCollege?.shortName || activeCollege?.name || 'Somaiya Polytechnic';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header with Dynamic Branding */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/85 backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <div className="flex h-14 sm:h-20 items-center justify-between gap-2">
            {/* Dynamic College Brand */}
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0" onClick={() => navigate('/admin/dashboard')}>
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl gradient-secondary flex items-center justify-center shadow-md text-secondary-foreground shrink-0">
                <Building className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="font-heading font-extrabold text-foreground text-xs sm:text-base md:text-lg tracking-tight truncate max-w-[170px] sm:max-w-none">
                    Result Automation
                  </h1>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-primary text-primary-foreground shrink-0">
                    <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    ADMIN
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground hidden sm:flex items-center gap-1.5 truncate">
                  <span>Central Administration Portal</span>
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* User Profile & Actions */}
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-foreground leading-tight">{user?.name || 'Administrator'}</p>
                <p className="text-xs text-secondary font-medium">Principal / Exam Controller</p>
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout} 
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 sm:h-10 sm:w-10"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-foreground" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card p-4 space-y-2 animate-fade-in">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-muted'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Main Outlet Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8 flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;