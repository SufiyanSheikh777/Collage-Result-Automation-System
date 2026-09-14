import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import CollegeRegistration from "./pages/CollegeRegistration";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { TeacherLayout } from "./components/layout/TeacherLayout";
import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherResults from "./pages/teacher/Results";
import TeacherRanking from "./pages/teacher/Ranking";
import TeacherAnalytics from "./pages/teacher/Analytics";
import { HodApprovals } from "./pages/teacher/HodApprovals";
import StudentDashboard from "./pages/student/Dashboard";
import { AdminLayout } from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import StaffManagement from "./pages/admin/StaffManagement";
import Departments from "./pages/admin/Departments";
import ResultsOverview from "./pages/admin/ResultsOverview";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: ('student' | 'teacher' | 'hod' | 'college_admin')[] 
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role as any)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/register-college" element={<CollegeRegistration />} />
      <Route path="/auth" element={<Auth />} />
      
      {/* College Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['college_admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="departments" element={<Departments />} />
        <Route path="results" element={<ResultsOverview />} />
      </Route>

      {/* Grouping all teacher / HOD routes under "/teacher" */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'hod', 'college_admin']}>
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/teacher/dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="results" element={<TeacherResults />} />
        <Route path="ranking" element={<TeacherRanking />} />
        <Route path="analytics" element={<TeacherAnalytics />} />
        <Route path="approvals" element={<HodApprovals />} />
      </Route>

      {/* Student Route */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student', 'college_admin']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
