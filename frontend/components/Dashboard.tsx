import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { User, Class } from '../types';
import ClassCard from './ClassCard';
import { api } from '../service';
import ChatPanel from './ChatPanel';
import LeaveRequestForm from './LeaveRequestForm';
import LeaveRequestList from './LeaveRequestList';
import CalendarWidget from './CalendarWidget';
import AdminEventManagement from './AdminEventManagement';
import NotificationPanel from './NotificationPanel';
import PerformanceDashboard from './PerformanceDashboard';
import ParentApprovalDashboard from './ParentApprovalDashboard';
import HomeworkSystem from './HomeworkSystem';
import NoDueSystem from './NoDueSystem';
import AdminAttendanceReport from './attendance/AdminAttendanceReport';
import AttendanceAnalytics from './attendance/AttendanceAnalytics';
import { 
  AttendanceSummaryCard, 
  AssignmentsDueWidget, 
  UpcomingExamsWidget, 
  AnnouncementsPanel, 
  PerformanceChart 
} from './analytics/AnalyticsWidgets';

interface DashboardProps {
    user: User;
    onLogout: () => void;
    theme: string;
    toggleTheme: () => void;
    updateUser: (user: User) => void;
    onClassSelect: (classId: string) => void;
    classes: Class[];
    refreshClasses: () => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onClassSelect, classes, refreshClasses }) => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [chatWith, setChatWith] = useState<User | null>(null);

    // Dashboard Tab State
    const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'requests' | 'calendar' | 'events' | 'performance' | 'homework' | 'attendance-reports' | 'nodue'>('overview');
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Analytics & Summary State
    const [summary, setSummary] = useState<any>(null);
    const [attendanceData, setAttendanceData] = useState<any>(null);
    const [performanceData, setPerformanceData] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Parent multi-child state
    const [linkedStudents, setLinkedStudents] = useState<any[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    // Create Class State
    const [newClassName, setNewClassName] = useState('');
    const [newSection, setNewSection] = useState('');
    const [newSubject, setNewSubject] = useState('');
    const [newRoom, setNewRoom] = useState('');

    // Join Class State
    const [joinCode, setJoinCode] = useState('');

    useEffect(() => {
        if (user.role === 'PARENT') {
            api.get('/parent/students').then(res => {
                setLinkedStudents(res);
                if (res.length > 0) setSelectedStudentId(res[0].id);
            });
        }
    }, [user.role]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (activeTab !== 'overview') return;
            try {
                setLoading(true);
                const targetId = user.role === 'PARENT' ? selectedStudentId : user.id;
                if (!targetId) {
                    setLoading(false);
                    return;
                }

                const [summaryRes, attendanceRes, performanceRes, notificationsRes] = await Promise.all([
                    api.get(`/dashboard/summary?userId=${targetId}`),
                    api.get(`/analytics/attendance/${targetId}`),
                    api.get(`/analytics/performance/${targetId}`),
                    api.get('/notifications')
                ]);
                setSummary(summaryRes);
                setAttendanceData(attendanceRes);
                setPerformanceData(performanceRes);
                setNotifications(notificationsRes);
            } catch (err) {
                console.error('Failed to fetch analytics data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [user.id, activeTab, selectedStudentId]);

    const handleMarkRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`, {});
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };


    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        const { logger } = await import('../utils/logger');
        logger.debug('[DEBUG] Create class submitted');
        logger.debug('[DEBUG] Form data:', { name: newClassName, section: newSection, subject: newSubject, room: newRoom, ownerId: user.id });
        
        try {
            logger.debug('[DEBUG] Sending POST request to /classes...');
            const response = await api.post('/classes', {
                name: newClassName,
                section: newSection,
                subject: newSubject,
                room: newRoom,
                ownerId: user.id
            });
            logger.debug('[DEBUG] Class created successfully:', response);
            
            // Clear form and close modal
            setNewClassName('');
            setNewSection('');
            setNewSubject('');
            setNewRoom('');
            setShowCreateModal(false);
            
            // Refresh classes list
            await refreshClasses();
            logger.debug('[DEBUG] Classes list refreshed');
        } catch (err) {
            logger.error('[DEBUG] Error creating class:', err);
            alert('Failed to create class: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const handleJoinClass = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/classes/join', {
                userId: user.id,
                enrollmentCode: joinCode
            });
            setShowJoinModal(false);
            await refreshClasses();
        } catch (err) {
            alert('Failed to join class. Check the code.');
        }
    };

    const handleDeleteClass = async (classId: string) => {
        if (!window.confirm('Are you sure you want to delete this class? This will also delete all assignments and records.')) {
            return;
        }

        try {
            const { logger } = await import('../utils/logger');
            logger.debug('[DEBUG] Deleting class:', classId);
            await api.delete(`/classes/${classId}`);
            logger.debug('[DEBUG] Class deleted successfully');
            await refreshClasses();
        } catch (err) {
            const { logger } = await import('../utils/logger');
            logger.error('[DEBUG] Failed to delete class', err);
            alert('Failed to delete class: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8 p-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white shadow-xl shadow-indigo-100 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold">Welcome, {user.name}</h2>
                    <p className="opacity-90 mt-1 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-bold uppercase tracking-wider">{user.role}</span>
                        <span>Manage your activities and stay updated.</span>
                    </p>
                </div>
                <div className="hidden sm:block">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                </div>
                
                {user.role === 'PARENT' && linkedStudents.length > 1 && (
                    <div className="flex items-center gap-3 bg-white/10 p-2 rounded-xl border border-white/20 backdrop-blur-sm">
                        <span className="text-sm font-medium ml-2">Switch Child:</span>
                        <select 
                            value={selectedStudentId || ''} 
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className="bg-indigo-700 text-white border-none rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-white/50 outline-none cursor-pointer"
                        >
                            {linkedStudents.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div className="flex space-x-6">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`text-lg font-medium pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('classes')}
                        className={`text-lg font-medium pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'classes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Classes
                    </button>
                    {(user.role === 'STUDENT' || user.role === 'PARENT') && (
                        <button
                            onClick={() => setActiveTab('performance')}
                            className={`text-lg font-medium pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'performance' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Performance
                        </button>
                    )}
                    {user.role === 'STUDENT' && (
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`text-lg font-medium pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'requests' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            My Requests
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={`text-lg font-medium pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'calendar' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Calendar
                    </button>
                    {user.role === 'ADMIN' && (
                        <button
                            onClick={() => setActiveTab('events')}
                            className={`text-lg font-medium pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'events' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Manage Events
                        </button>
                    )}
                    {user.role === 'ADMIN' && (
                        <button
                            onClick={() => setActiveTab('attendance-reports')}
                            className={`text-lg font-medium pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'attendance-reports' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Attendance Reports
                        </button>
                    )}
                    {(user.role === 'STUDENT' || user.role === 'PARENT') && (
                        <button
                            onClick={() => setActiveTab('homework')}
                            className={`text-lg font-medium pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'homework' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Homework
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('nodue')}
                        className={`text-lg font-medium pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'nodue' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        No-Due
                    </button>
                </div>

                <div className="flex gap-3 items-center">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {notifications.some(n => !n.isRead) && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                        )}
                    </button>

                    {activeTab === 'classes' || activeTab === 'overview' ? (
                        <>
                            <button
                                onClick={() => setShowJoinModal(true)}
                                className="text-gray-600 hover:bg-gray-100 px-4 py-2 rounded text-sm font-medium"
                            >
                                Join class
                            </button>
                            {user.role === 'STAFF' && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="text-gray-600 hover:bg-gray-100 px-4 py-2 rounded text-sm font-medium"
                                >
                                    Create class
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={() => setShowLeaveModal(true)}
                            className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded text-sm font-medium shadow"
                        >
                            New Request
                        </button>
                    )}
                </div>
            </div>

            {activeTab === 'overview' ? (
                loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {(user.role === 'STUDENT' || user.role === 'PARENT') && (
                            <AttendanceAnalytics studentId={user.role === 'PARENT' ? selectedStudentId || '' : user.id} />
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <AssignmentsDueWidget assignments={summary?.assignmentsDue || []} />
                            <UpcomingExamsWidget exams={summary?.upcomingExams || []} />
                        </div>
                        
                        {/* Attendance Alerts for Parents/Students */}
                        {attendanceData?.percentage < 75 && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-4 text-rose-800">
                                <div className="p-2 bg-rose-100 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <div>
                                    <p className="font-bold">Low Attendance Warning</p>
                                    <p className="text-sm opacity-90">Current attendance is {attendanceData.percentage.toFixed(1)}%. Please maintain at least 75%.</p>
                                </div>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <PerformanceChart data={performanceData} />
                            </div>
                            <div>
                                <AnnouncementsPanel announcements={summary?.latestAnnouncements || []} />
                            </div>
                        </div>
                    </div>
                )
            ) : activeTab === 'classes' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center sm:justify-items-start">
                    {classes.map((cls) => (
                        <div key={cls.id} className="relative group">
                            <ClassCard
                                classData={cls}
                                onClick={onClassSelect}
                                onDelete={user.role === 'STAFF' ? handleDeleteClass : undefined}
                                ownerName={cls['ownerName'] || 'Teacher'}
                                ownerPhoto={cls['ownerPhoto']}
                            />
                            {user.role === 'PARENT' && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setChatWith({ id: cls.ownerId, name: cls['ownerName'] || 'Teacher', role: 'STAFF', email: '' } as User);
                                    }}
                                    className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-600 hover:text-white"
                                    title="Message Teacher"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : activeTab === 'requests' ? (
                <div className="max-w-4xl mx-auto">
                    <LeaveRequestList user={user} />
                </div>
            ) : activeTab === 'calendar' ? (
                <CalendarWidget user={user} classes={classes} />
            ) : activeTab === 'performance' ? (
                <div className="space-y-6">
                    <PerformanceDashboard studentId={user.role === 'PARENT' ? selectedStudentId || '' : user.id} />
                    {user.role === 'PARENT' && <ParentApprovalDashboard parentId={user.id} />}
                </div>
            ) : activeTab === 'homework' ? (
                <HomeworkSystem user={user} studentId={user.role === 'PARENT' ? selectedStudentId || undefined : undefined} />
            ) : activeTab === 'attendance-reports' ? (
                <AdminAttendanceReport />
            ) : activeTab === 'nodue' ? (
                <NoDueSystem user={user} />
            ) : (
                <AdminEventManagement classes={classes} />
            )}

            {/* Create Class Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
                        <h3 className="text-xl font-medium mb-4">Create class</h3>
                        <form onSubmit={handleCreateClass} className="space-y-4">
                            <input className="w-full border p-3 rounded bg-gray-50 hover:bg-gray-100 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Class name (required)" required value={newClassName} onChange={e => setNewClassName(e.target.value)} />
                            <input className="w-full border p-3 rounded bg-gray-50 hover:bg-gray-100 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Section" value={newSection} onChange={e => setNewSection(e.target.value)} />
                            <input className="w-full border p-3 rounded bg-gray-50 hover:bg-gray-100 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Subject" value={newSubject} onChange={e => setNewSubject(e.target.value)} />
                            <input className="w-full border p-3 rounded bg-gray-50 hover:bg-gray-100 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Room" value={newRoom} onChange={e => setNewRoom(e.target.value)} />

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" disabled={!newClassName} className="px-6 py-2 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Join Class Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
                        <h3 className="text-xl font-medium mb-4">Join class</h3>
                        <p className="text-sm text-gray-500 mb-4">Ask your teacher for the class code, then enter it here.</p>
                        <form onSubmit={handleJoinClass} className="space-y-4">
                            <div className="border border-gray-300 rounded p-4">
                                <input
                                    className="w-full text-lg outline-none"
                                    placeholder="Class code"
                                    value={joinCode}
                                    onChange={e => setJoinCode(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setShowJoinModal(false)} className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" disabled={!joinCode} className="px-6 py-2 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50">Join</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Leave Request Form Modal */}
            {showLeaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto">
                    <div className="my-10 w-full max-w-3xl">
                        <div className="bg-white rounded-lg shadow-xl relative">
                            <button
                                onClick={() => setShowLeaveModal(false)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <div className="p-1">
                                <LeaveRequestForm
                                    user={user}
                                    classes={classes}
                                    onSuccess={() => {
                                        setShowLeaveModal(false);
                                        // Force refresh of list if needed, but List component fetches on mount. 
                                        // To be perfect, we should signal List to reload. 
                                        // But toggle tab will reload it for now.
                                        setActiveTab('requests'); // Ensure we are on requests tab
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {showNotifications && (
                    <NotificationPanel 
                        notifications={notifications}
                        onClose={() => setShowNotifications(false)}
                        onMarkRead={handleMarkRead}
                    />
                )}
            </AnimatePresence>
            {/* Chat Panel */}
            {chatWith && (
                <ChatPanel 
                    currentUser={user}
                    otherUser={chatWith}
                    onClose={() => setChatWith(null)}
                />
            )}
        </div>
    );
};

export default Dashboard;