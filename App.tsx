import React, { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { User } from './types';
import { RootState } from './src/store';
import { logout } from './src/store/authSlice';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);
  
  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {theme === 'dark' && <div className="aurora-bg" />}
      {isAuthenticated && user ? (
        <Dashboard 
          user={user as User}
          onLogout={handleLogout} 
          theme={theme} 
          toggleTheme={toggleTheme} 
        />
      ) : (
        <Login />
      )}
    </div>
  );
};

export default App;
