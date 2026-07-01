import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
    } else {
      navigate('/auth');
    }
  }, [isAuthenticated, user, navigate]);

  return null;
};

export default Index;
