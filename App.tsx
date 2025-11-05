

import React, { useState, useCallback, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { User, Role } from './types';
import { MOCK_USERS } from './constants';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Check for saved theme in localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    // Check for system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme(prefersDark ? 'dark' : 'light');
    }

    // Simulate checking for a logged-in user session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
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

  const handleLogin = useCallback((email: string): boolean => {
    const user = users.find(u => u.email === email);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  }, [users]);
  
  const handleRegister = useCallback((name: string, email: string, role: Role): { success: boolean; message: string } => {
    if (users.some(u => u.email === email)) {
        return { success: false, message: 'An account with this email already exists.' };
    }

    const newUser: User = {
        id: `U${Date.now()}`,
        name,
        email,
        role,
        classIds: [],
        ...(role === Role.STUDENT && { rollNo: `S${String(Date.now()).slice(-4)}`, department: 'Unassigned', year: 1 }),
        ...(role === Role.STAFF && { staffId: `T${String(Date.now()).slice(-4)}`, designation: 'Instructor' }),
        ...(role === Role.PARENT && { studentId: undefined }), // Cannot link on registration yet
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));

    return { success: true, message: 'Registration successful!' };
  }, [users]);


  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  }, []);
  
  const handleUpdateUser = useCallback((updatedUser: User) => {
    setCurrentUser(updatedUser);
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
        <div className="text-xl font-semibold text-slate-700 dark:text-slate-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      {currentUser ? (
        <Dashboard user={currentUser} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} updateUser={handleUpdateUser} />
      ) : (
        <Login onLogin={handleLogin} onRegister={handleRegister} />
      )}
    </div>
  );
};

export default App;