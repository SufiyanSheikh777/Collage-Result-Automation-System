import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Award,
  BarChart3,
  Loader2
} from 'lucide-react';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899'];

const TeacherAnalytics: React.FC = () => {
  const { user, activeCollege } = useAuth();
  const collegeId = activeCollege?.id || 1;
  const branch = user?.branch && user.role !== 'college_admin' ? user.branch : '';

  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    passPercentage: 0,
    averagePercentage: 0,
    topperPercentage: 0,
    totalStudents: 0,
    passedStudents: 0,
    failedStudents: 0,
    gradeDistribution: [] as any[],
    branchWisePerformance: [] as any[]
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const url = new URL("/get_results", window.location.origin);
        if (collegeId) url.searchParams.append("college_id", String(collegeId));
        if (branch) url.searchParams.append("branch", branch);

        const response = await fetch(url.toString());
        const results = await response.json();

        if (results && results.length > 0) {
          const total = results.length;
          const passed = results.filter((r: any) => r.status.toLowerCase() === 'pass').length;
          const percentages = results.map((r: any) => r.percentage);
          
          const topper = Math.max(...percentages);
          const avg = percentages.reduce((a: number, b: number) => a + b, 0) / total;

          // 1. Fixed Grade Distribution (A+, A, B, C, F)
          const gradeCounts: Record<string, number> = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'F': 0 };
          results.forEach((r: any) => {
            const p = r.percentage;
            if (p >= 80) gradeCounts['A+']++;
            else if (p >= 70) gradeCounts['A']++;
            else if (p >= 55) gradeCounts['B']++;
            else if (p >= 40) gradeCounts['C']++;
            else gradeCounts['F']++;
          });
          
          const gradeData = Object.entries(gradeCounts).map(([grade, count]) => ({ 
            grade, 
            count 
          }));

          // 2. Branch Performance (Horizontal Bars for available data)
          const branchMap: Record<string, { total: number, passed: number }> = {};
          results.forEach((r: any) => {
            if (!branchMap[r.branch]) branchMap[r.branch] = { total: 0, passed: 0 };
            branchMap[r.branch].total++;
            if (r.status.toLowerCase() === 'pass') branchMap[r.branch].passed++;
          });

          const branchData = Object.keys(branchMap).map(branch => ({
            branch,
            passPercentage: Math.round((branchMap[branch].passed / branchMap[branch].total) * 100)
          })).sort((a, b) => b.passPercentage - a.passPercentage);

          setAnalytics({
            passPercentage: Math.round((passed / total) * 100),
            averagePercentage: Math.round(avg),
            topperPercentage: topper,
            totalStudents: total,
            passedStudents: passed,
            failedStudents: total - passed,
            gradeDistribution: gradeData,
            branchWisePerformance: branchData
          });
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [collegeId, branch]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-muted-foreground font-medium">Loading Real Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Comprehensive performance analysis and insights</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-success/10"><TrendingUp className="w-5 h-5 text-success" /></div>
            <span className="text-sm font-medium text-muted-foreground">Pass Rate</span>
          </div>
          <p className="text-3xl font-heading font-bold text-foreground">{analytics.passPercentage}%</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10"><BarChart3 className="w-5 h-5 text-primary" /></div>
            <span className="text-sm font-medium text-muted-foreground">Average Score</span>
          </div>
          <p className="text-3xl font-heading font-bold text-foreground">{analytics.averagePercentage}%</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-warning/10"><Award className="w-5 h-5 text-warning" /></div>
            <span className="text-sm font-medium text-muted-foreground">Top Score</span>
          </div>
          <p className="text-3xl font-heading font-bold text-foreground">{analytics.topperPercentage}%</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-info/10"><Users className="w-5 h-5 text-info" /></div>
            <span className="text-sm font-medium text-muted-foreground">Total Students</span>
          </div>
          <p className="text-3xl font-heading font-bold text-foreground">{analytics.totalStudents}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-6">Grade Distribution</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.gradeDistribution}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5}
                  dataKey="count" nameKey="grade"
                  label={({ grade, count }) => `${grade}: ${count}`}
                >
                  {analytics.gradeDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branch-wise Pass Percentage */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-6">Branch-wise Pass Percentage</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.branchWisePerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                <YAxis 
                  type="category" dataKey="branch" width={140} 
                  stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }}
                />
                <Tooltip 
                   contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar 
                  dataKey="passPercentage" fill="hsl(var(--primary))" 
                  radius={[0, 4, 4, 0]} name="Pass %" barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pass/Fail Summary - REMOVED TOTAL STUDENTS COLUMN */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card">
        <h2 className="text-lg font-heading font-semibold text-foreground mb-6">Pass/Fail Distribution</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="text-center p-6 bg-success/5 rounded-xl border border-success/20">
            <p className="text-4xl font-heading font-bold text-success">{analytics.passedStudents}</p>
            <p className="text-muted-foreground mt-1">Students Passed</p>
          </div>
          <div className="text-center p-6 bg-destructive/5 rounded-xl border border-destructive/20">
            <p className="text-4xl font-heading font-bold text-destructive">{analytics.failedStudents}</p>
            <p className="text-muted-foreground mt-1">Students Failed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAnalytics;