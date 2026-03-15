
import React, { useState, useCallback, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ClassDetail from './components/ClassDetail';
import Layout from './components/Layout';
import { User, Role, Class } from './types';
import { api, checkTokenStatus } from './service';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>('light');

  // View State
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [currentClass, setCurrentClass] = useState<Class | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    // Check for saved theme in localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme(prefersDark ? 'dark' : 'light');
    }

    // Simulate checking for a logged-in user session (persisted client-side)
    const storedUser = localStorage.getItem('currentUser');
    // use logger for quieter production — load async inside effect
    (async () => {
      try {
        const mod = await import('./utils/logger');
        const logger = mod.logger;
        logger.debug('[APP] Checking for stored user...');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          logger.debug('[APP] User found:', { email: user.email, role: user.role });
          setCurrentUser(user);
          // Verify token status
          import('./service').then(m => m.checkTokenStatus()).catch(() => {});
        } else {
          logger.debug('[APP] No user stored in localStorage');
        }
      } catch (e) {
        // fallback to console
        console.log('[APP] Checking for stored user (fallback)');
      }
    })();
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

  // Fetch class details when selected
  useEffect(() => {
    const fetchClassDetails = async () => {
      if (selectedClassId && currentUser) {
        try {
          const data = await api.get(`/classes/${selectedClassId}?userId=${currentUser.id}`);
          setCurrentClass(data);
        } catch (err) {
          import('./utils/logger').then(m => m.logger.error('Failed to fetch class', err)).catch(() => {});
          setCurrentClass(null);
          setSelectedClassId(null);
        }
      } else {
        setCurrentClass(null);
      }
    };
    fetchClassDetails();
  }, [selectedClassId, currentUser]);

  // Fetch all classes for the user
  const fetchClasses = useCallback(async () => {
    if (currentUser) {
      try {
        const data = await api.get(`/users/${currentUser.id}/classes`);
        setClasses(data);
      } catch (err) {
        import('./utils/logger').then(m => m.logger.error('Failed to fetch classes', err)).catch(() => {});
      }
    }
  }, [currentUser]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleLogin = useCallback(async (email: string, password?: string): Promise<boolean> => {
    try {
      const response = await api.post('/login', { email, password });
      const userObj = { ...response, token: response.accessToken };
      setCurrentUser(userObj);
      localStorage.setItem('currentUser', JSON.stringify(userObj));
      return true;
    } catch (error) {
      import('./utils/logger').then(m => m.logger.error('Login failed:', error)).catch(() => {});
      return false;
    }
  }, []);

  const handleRegister = useCallback(async (name: string, email: string, role: Role, password?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await api.post('/register', { name, email, role, password });

      if (result.success && result.user) {
        const userObj = { ...result.user, token: result.accessToken };
        setCurrentUser(userObj);
        localStorage.setItem('currentUser', JSON.stringify(userObj));
      }

      return result;
    } catch (error: any) {
      import('./utils/logger').then(m => m.logger.error('Registration failed:', error)).catch(() => {});
      return { success: false, message: error.message || 'Registration failed' };
    }
  }, []);


  const handleLogout = useCallback(async () => {
    try {
      await api.logout();
    } catch (e) { }
    setCurrentUser(null);
    setSelectedClassId(null);
    setCurrentClass(null);
    localStorage.removeItem('currentUser');
  }, []);

  const handleUpdateUser = useCallback(async (updatedUser: User) => {
    try {
      const result = await api.put(`/users/${updatedUser.id}`, updatedUser);
      setCurrentUser(result);
      localStorage.setItem('currentUser', JSON.stringify(result));
    } catch (error) {
      import('./utils/logger').then(m => m.logger.error('Failed to update user:', error)).catch(() => {});
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-medium text-gray-500">Loading...</div>
      </div>
    );
  }

  // If not logged in, show Login
  if (!currentUser) {
    return <Login onLogin={handleLogin} onRegister={handleRegister} />;
  }

  // If logged in, show Layout with either Dashboard or ClassDetail
  return (
    <Layout
      user={currentUser}
      onLogout={handleLogout}
      title={currentClass ? currentClass.name : "Classroom"}
      classes={classes}
    >
      {selectedClassId && currentClass ? (
        <ClassDetail
          classData={currentClass}
          user={currentUser}
          onBack={() => setSelectedClassId(null)}
        />
      ) : (
        <Dashboard
          user={currentUser}
          onLogout={handleLogout}
          theme={theme}
          toggleTheme={toggleTheme}
          updateUser={handleUpdateUser}
          onClassSelect={setSelectedClassId}
          classes={classes}
          refreshClasses={fetchClasses}
        />
      )}
    </Layout>
  );
};

export default App;