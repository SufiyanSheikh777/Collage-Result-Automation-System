import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  Building2, 
  CheckCircle2, 
  Zap, 
  Users, 
  Trophy, 
  FileText, 
  BarChart3, 
  ArrowRight, 
  ShieldCheck, 
  Download, 
  Sparkles,
  ChevronRight,
  School
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* Top Floating Announcement Bar */}
      <div className="bg-primary/95 text-primary-foreground text-xs sm:text-sm py-2 px-3 sm:px-4 text-center font-medium border-b border-primary/20 backdrop-blur flex items-center justify-center gap-2 animate-fade-in">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-secondary text-secondary-foreground shadow-sm shrink-0">
          NEW
        </span>
        <span className="hidden sm:inline">Multi-College MSBTE Diploma Result Automation Platform — Available for All Maharashtra Polytechnics!</span>
        <span className="sm:hidden text-[11px] truncate">MSBTE Diploma Result Automation Platform</span>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md animate-fade-in">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0" onClick={() => navigate('/')}>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl gradient-primary flex items-center justify-center shadow-md shadow-primary/25 shrink-0 transition-transform hover:scale-105">
              <GraduationCap className="w-4 h-4 sm:w-7 sm:h-7 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-heading font-extrabold text-xs sm:text-xl tracking-tight text-foreground truncate block">
                  MSBTE Results
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-primary/10 text-primary border border-primary/20">
                  v2.0 Multi-Tenant
                </span>
              </div>
              <p className="text-xs text-muted-foreground hidden md:block">Maharashtra Polytechnic Automated Academic Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {isAuthenticated ? (
              <Button 
                onClick={() => {
                  if (user?.role === 'college_admin') navigate('/admin/dashboard');
                  else if (user?.role === 'teacher' || user?.role === 'hod') navigate('/teacher/dashboard');
                  else navigate('/student/dashboard');
                }}
                className="gradient-primary text-primary-foreground shadow-md hover:opacity-95 font-semibold text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4"
              >
                Dashboard
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/auth')}
                  className="font-semibold text-foreground hover:text-primary hover:bg-muted text-xs sm:text-sm h-8 sm:h-10 px-2.5 sm:px-4"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate('/register-college')}
                  className="gradient-secondary text-secondary-foreground font-bold shadow-md hover:brightness-105 text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-5"
                >
                  <Building2 className="w-3.5 h-3.5 mr-1 sm:mr-2 shrink-0" />
                  <span className="hidden sm:inline">Register College</span>
                  <span className="sm:hidden">Register</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28">
        {/* Ambient Gradient Glows with motion */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[650px] h-[380px] bg-secondary/20 blur-[130px] rounded-full pointer-events-none -z-10 animate-pulse-slow" />
        <div className="absolute top-36 right-10 w-[420px] h-[420px] bg-primary/15 blur-[140px] rounded-full pointer-events-none -z-10 animate-float" />

        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Tag Badge */}
            <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-secondary/15 text-secondary-foreground border border-secondary/35 shadow-sm">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span>Dedicated Platform for All MSBTE Polytechnic Colleges</span>
            </div>

            {/* Headline */}
            <h1 className="animate-fade-up delay-100 text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight text-foreground leading-[1.15]">
              Automate Diploma Results for{' '}
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Your Entire College
              </span>
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-up delay-200 text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              No manual captcha solving. No entering hundreds of enrollment numbers. 
              Register your MSBTE institute to get custom college branding, instant HOD & teacher governance, 
              live toppers ranking, and 1-click official marksheets.
            </p>

            {/* Hero CTA Buttons - Enlarged & High Impact */}
            <div className="animate-fade-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-6">
              <Button 
                size="lg" 
                onClick={() => navigate('/register-college')}
                className="w-full sm:w-auto h-16 px-10 sm:px-12 text-lg sm:text-xl font-bold gradient-secondary text-secondary-foreground rounded-2xl shadow-xl shadow-secondary/30 hover:shadow-2xl hover:shadow-secondary/40 hover:-translate-y-1 active:translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer"
              >
                <Building2 className="w-6 h-6" />
                Register Your College
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/auth')}
                className="w-full sm:w-auto h-16 px-10 sm:px-12 text-lg sm:text-xl font-bold border-2 border-border/80 bg-card/90 text-foreground hover:bg-muted/80 hover:border-primary/40 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                Sign In to Portal
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>

            {/* Trust points */}
            <div className="animate-fade-up delay-400 pt-6 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Zero Captcha Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Dynamic [College Name] Branding</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>HOD & Teacher Management</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>All MSBTE Regions Supported</span>
              </div>
            </div>
          </div>

          {/* Interactive Live Demo Web Showcase */}
          <div className="animate-fade-up delay-500 mt-14 sm:mt-18 max-w-5xl mx-auto rounded-3xl border border-border/90 bg-card/95 shadow-2xl p-5 sm:p-7 backdrop-blur-md transition-all duration-300 hover:shadow-glow/20">
            {/* Demo Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-5 mb-6 gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-primary/20">
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-heading font-extrabold text-foreground text-base sm:text-lg">
                      Demo Polytechnic Institute
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-secondary/20 text-secondary-foreground border border-secondary/30">
                      MSBTE Code: DEMO-0000
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Live Demo Web
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Interactive Preview: See how your registered college portal automates all departments & merit lists
                  </p>
                </div>
              </div>
              
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/5 text-primary border border-primary/20 self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Winter & Summer Ready
              </span>
            </div>

            {/* Quick Metrics Grid (Pure Demo Data) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="bg-background rounded-2xl p-4 border border-border shadow-sm hover:border-primary/30 transition-colors">
                <p className="text-xs text-muted-foreground font-medium">Institute Pass Rate</p>
                <p className="text-2xl sm:text-3xl font-extrabold font-heading text-emerald-600 mt-1">96.8%</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">+4.8% vs last sem</p>
              </div>
              <div className="bg-background rounded-2xl p-4 border border-border shadow-sm hover:border-primary/30 transition-colors">
                <p className="text-xs text-muted-foreground font-medium">Total Students</p>
                <p className="text-2xl sm:text-3xl font-extrabold font-heading text-foreground mt-1">650+</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Across 6 branches</p>
              </div>
              <div className="bg-background rounded-2xl p-4 border border-border shadow-sm hover:border-primary/30 transition-colors">
                <p className="text-xs text-muted-foreground font-medium">Faculty & HODs</p>
                <p className="text-2xl sm:text-3xl font-extrabold font-heading text-foreground mt-1">36</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Assigned by Dept</p>
              </div>
              <div className="bg-background rounded-2xl p-4 border border-border shadow-sm hover:border-primary/30 transition-colors">
                <p className="text-xs text-muted-foreground font-medium">Result Sync Time</p>
                <p className="text-2xl sm:text-3xl font-extrabold font-heading text-secondary mt-1">&lt; 2.5 Sec</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Automated OCR & cache</p>
              </div>
            </div>

            {/* Mini preview table (Pure Demo Data) */}
            <div className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
              <div className="p-3.5 bg-muted/50 border-b border-border flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span className="tracking-wide">DEMO MERIT LIST (SEMESTER 4 - COMPUTER ENGINEERING)</span>
                <span 
                  className="text-primary font-bold cursor-pointer hover:underline flex items-center gap-1"
                  onClick={() => navigate('/auth')}
                >
                  Try Live Portal &rarr;
                </span>
              </div>
              <div className="divide-y divide-border text-xs sm:text-sm">
                <div className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 font-extrabold flex items-center justify-center text-xs shadow-sm">
                      1
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">Aarav Sharma (Demo Student)</p>
                      <p className="text-xs text-muted-foreground">Enroll: 24DEMO001 • Seat: 145801</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 text-sm sm:text-base">91.60%</span>
                    <p className="text-xs text-muted-foreground font-medium">Rank 1 (Distinction)</p>
                  </div>
                </div>
                <div className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-700 text-foreground font-extrabold flex items-center justify-center text-xs shadow-sm">
                      2
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">Neha Patel (Demo Student)</p>
                      <p className="text-xs text-muted-foreground">Enroll: 24DEMO002 • Seat: 145802</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 text-sm sm:text-base">88.40%</span>
                    <p className="text-xs text-muted-foreground font-medium">Rank 2 (Distinction)</p>
                  </div>
                </div>
                <div className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-amber-700/20 text-amber-700 dark:text-amber-400 font-extrabold flex items-center justify-center text-xs shadow-sm">
                      3
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">Rohan Kulkarni (Demo Student)</p>
                      <p className="text-xs text-muted-foreground">Enroll: 24DEMO003 • Seat: 145803</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 text-sm sm:text-base">86.20%</span>
                    <p className="text-xs text-muted-foreground font-medium">Rank 3 (Distinction)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-20 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase font-bold tracking-wider text-secondary">
              Engineered For Polytechnic Colleges
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground">
              Everything Your College Needs to Manage Results
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Built specifically to eliminate the tedious hours teachers and administrators spend checking MSBTE results one by one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/40 space-y-4">
              <div className="w-12 h-12 rounded-xl gradient-secondary flex items-center justify-center shadow-md">
                <Zap className="w-6 h-6 text-secondary-foreground" />
              </div>
              <h3 className="font-heading font-bold text-lg text-foreground">Zero-Captcha Automation</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Our background scraper solves MSBTE image captchas with high accuracy. Upload a whole class enrollment list and let the bot fetch all marksheets in the background.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/40 space-y-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-heading font-bold text-lg text-foreground">Dynamic College Branding</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Register with your MSBTE 4-digit code. Dashboards, reports, and student marksheets automatically transform into <strong>[Your College Name] Result Automation System</strong>.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/40 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-foreground">Department & HOD Controls</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Assign Head of Departments (HODs), add and remove teachers, and give faculty access to their respective departments (Computer, Mechanical, Civil, Electrical, etc.).
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/40 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-foreground">Instant Toppers & Rankings</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Automatically computes college-wide and branch-wise rankers. View Rank 1, 2, 3 merit lists formatted and ready for college notice boards and social media.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/40 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-foreground">Official Marksheet Generation</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Students and teachers can generate clean, official statement of marks with full subject theory (FA-TH, SA-TH) and practical breakdown, with 1-click PDF download.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/40 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-foreground">Excel Export for Audits</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Export complete college and department result data directly to MS-Excel (.xlsx) formatted for MSBTE committee meetings, accreditation, and archival.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Onboarding Process */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase font-bold tracking-wider text-secondary">Simple 4-Step Setup</span>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground">
              How Your College Can Get Started in 2 Minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                step: '01',
                title: 'Register College',
                desc: 'Provide your 4-digit MSBTE institute code and college name to generate your custom portal.'
              },
              {
                step: '02',
                title: 'Setup Departments',
                desc: 'Select your active branches (CO, IF, ME, CE, EE) and appoint your Department HODs.'
              },
              {
                step: '03',
                title: 'Sync Enrollment List',
                desc: 'Upload a text file of student enrollment numbers. The automation system handles the rest.'
              },
              {
                step: '04',
                title: 'Instant Access',
                desc: 'Students and teachers can now view marksheets, analytics, and topper lists from anywhere.'
              }
            ].map((item, idx) => (
              <div key={idx} className="relative bg-card rounded-2xl border border-border p-6 space-y-3">
                <span className="text-3xl font-extrabold font-heading text-primary/20">{item.step}</span>
                <h3 className="font-heading font-bold text-lg text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/register-college')}
              className="gradient-secondary text-secondary-foreground font-bold px-10 h-15 text-lg rounded-2xl shadow-xl shadow-secondary/25 hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              <Building2 className="w-5 h-5 mr-2.5" />
              Register College Now
            </Button>
          </div>
        </div>
      </section>

      {/* MSBTE Board Support Showcase */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container mx-auto px-4 max-w-5xl text-center space-y-8">
          <div>
            <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
              Supporting All MSBTE Regional Boards Across Maharashtra
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Fully aligned with MSBTE Scheme Curriculum (I-Scheme, K-Scheme) and official result portal protocols.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {['Mumbai Region', 'Pune Region', 'Nagpur Region', 'Chh. Sambhajinagar'].map((region, i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-background flex flex-col items-center justify-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" />
                <span className="font-medium text-sm text-foreground">{region}</span>
                <span className="text-[11px] text-muted-foreground">Polytechnic Institutes</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 bg-background border-t border-border">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground">MSBTE Result Automation System</span>
            <span>• Developed by Sufiyan Sirajuddin Sheikh</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/auth')} className="hover:text-foreground transition-colors">
              Sign In
            </button>
            <button onClick={() => navigate('/register-college')} className="hover:text-foreground transition-colors">
              Register College
            </button>
            <span>MSBTE Board Maharashtra</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;