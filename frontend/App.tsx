import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ClassDetail from './components/ClassDetail';
import Chat from './components/Chat';
import Layout from './components/Layout';
import { User, Role, Class } from './types';
import { api } from './service';

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const navigate = useNavigate();

  useEffect(() => {
    const verifySession = async () => {
      try {
        const user = await api.get('/me');
        setCurrentUser(user);
      } catch (err) {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    verifySession();
  }, []);

  const fetchClasses = useCallback(async () => {
    if (currentUser) {
      try {
        const data = await api.get(`/users/${currentUser.id}/classes`);
        setClasses(data);
      } catch (err) {
        console.error('Failed to fetch classes', err);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleLogout = useCallback(async () => {
    try {
      await api.post('/logout', {});
      setCurrentUser(null);
      setClasses([]);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={currentUser ? <Navigate to={`/${currentUser.role === Role.STAFF ? 'teacher' : currentUser.role.toLowerCase()}`} replace /> : <Login onLoginSuccess={setCurrentUser} />} 
      />
      
      {currentUser ? (
        <Route path="/" element={<Layout user={currentUser} onLogout={handleLogout} title="Classroom" classes={classes} />}>
          <Route path="admin" element={currentUser.role === Role.ADMIN ? <Dashboard user={currentUser} onLogout={handleLogout} theme={theme} toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} updateUser={setCurrentUser} onClassSelect={(id) => navigate(`/class/${id}`)} classes={classes} refreshClasses={fetchClasses} /> : <Navigate to="/login" />} />
          <Route path="teacher" element={currentUser.role === Role.STAFF ? <Dashboard user={currentUser} onLogout={handleLogout} theme={theme} toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} updateUser={setCurrentUser} onClassSelect={(id) => navigate(`/class/${id}`)} classes={classes} refreshClasses={fetchClasses} /> : <Navigate to="/login" />} />
          <Route path="student" element={currentUser.role === Role.STUDENT ? <Dashboard user={currentUser} onLogout={handleLogout} theme={theme} toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} updateUser={setCurrentUser} onClassSelect={(id) => navigate(`/class/${id}`)} classes={classes} refreshClasses={fetchClasses} /> : <Navigate to="/login" />} />
          <Route path="parent" element={currentUser.role === Role.PARENT ? <Dashboard user={currentUser} onLogout={handleLogout} theme={theme} toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} updateUser={setCurrentUser} onClassSelect={(id) => navigate(`/class/${id}`)} classes={classes} refreshClasses={fetchClasses} /> : <Navigate to="/login" />} />
          <Route path="chat" element={<Chat user={currentUser} />} />
          <Route path="class/:classId" element={<ClassDetail user={currentUser} classes={classes} onBack={() => window.history.back()} />} />
          <Route index element={<Navigate to={`/${currentUser.role === Role.STAFF ? 'teacher' : currentUser.role.toLowerCase()}`} replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;