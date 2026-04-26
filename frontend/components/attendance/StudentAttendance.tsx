import React, { useState, useEffect } from 'react';
import { api } from '../../service';
import { AttendanceRecord, Class, AttendanceSession } from '../../types';
import AttendanceAnalytics from './AttendanceAnalytics';

interface StudentAttendanceProps {
    classData: Class;
    userId: string;
}

const StudentAttendance: React.FC<StudentAttendanceProps> = ({ classData, userId }) => {
    const [records, setRecords] = useState<(AttendanceRecord & { startTime: string; description: string })[]>([]);
    const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState<string | null>(null);
    const [totalSessions, setTotalSessions] = useState(0);

    useEffect(() => {
        fetchData();
        // Poll for active sessions
        const interval = setInterval(fetchActiveSessions, 10000);
        return () => clearInterval(interval);
    }, [classData.id, userId]);

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchHistory(), fetchActiveSessions()]);
        setLoading(false);
    };

    const fetchHistory = async () => {
        try {
            const data = await api.get(`/classes/${classData.id}/my-attendance?userId=${userId}`);
            setRecords(data.records);
            setTotalSessions(data.totalSessions);
        } catch (err) {
            import('../../utils/logger').then(m => m.logger.error('Failed to fetch attendance history:', err)).catch(() => {});
        }
    };

    const fetchActiveSessions = async () => {
        try {
            // We fetch all sessions and filter for ACTIVE
            // Ideally backend should provide a concise endpoint for active sessions
            const sessions: AttendanceSession[] = await api.get(`/classes/${classData.id}/sessions`);
            setActiveSessions(sessions.filter(s => s.status === 'ACTIVE'));
        } catch (err) {
            import('../../utils/logger').then(m => m.logger.error('Failed to fetch sessions:', err)).catch(() => {});
        }
    };

    const handleJoin = async (sessionId: string) => {
        setJoining(sessionId);
        try {
            await api.post(`/sessions/${sessionId}/join`, { studentId: userId });
            await fetchHistory(); // Refresh history
            // Optimistic update or refetch active sessions to hide button if we check history there?
            // Actually, if we joined, we will have a record.
        } catch (err: any) {
            alert(err.response?.data?.error || "Failed to join session");
        } finally {
            setJoining(null);
        }
    };

    // Calculate stats
    const presentCount = records.filter(r => ['PRESENT', 'OD', 'S'].includes(r.status)).length;
    const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;

    if (loading) return <div className="p-8 text-center text-gray-500">Loading attendance...</div>;

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-8">
            {/* Active Sessions Card */}
            {activeSessions.length > 0 && (
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                        </span>
                        Live Session Active!
                    </h2>
                    <div className="space-y-4">
                        {activeSessions.map(session => {
                            const alreadyJoined = records.some(r => r.sessionId === session.id);
                            if (alreadyJoined) return null; // Don't show if already joined.

                            return (
                                <div key={session.id} className="bg-white/10 backdrop-blur-sm p-4 rounded-lg flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">{session.description}</h3>
                                        <p className="text-sm text-blue-100">Started at {new Date(session.startTime).toLocaleTimeString()}</p>
                                    </div>
                                    <button
                                        onClick={() => handleJoin(session.id)}
                                        disabled={joining === session.id}
                                        className="bg-white text-blue-600 px-6 py-2 rounded-full font-bold hover:bg-blue-50 transition-colors disabled:opacity-75 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {joining === session.id ? 'Joining...' : 'Mark Present'}
                                    </button>
                                </div>
                            );
                        })}
                        {activeSessions.every(s => records.some(r => r.sessionId === s.id)) && (
                            <p className="text-blue-100 text-sm italic">You have marked attendance for all active sessions.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Stats */}
            <AttendanceAnalytics studentId={userId} />

            {/* History List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-800">Attendance History</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {records.map(record => (
                        <div key={record.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div>
                                <h4 className="font-medium text-gray-900">{record.description}</h4>
                                <p className="text-xs text-gray-500">
                                    {new Date(record.startTime).toLocaleDateString()} • {new Date(record.startTime).toLocaleTimeString()}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${record.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                                record.status === 'OD' ? 'bg-indigo-100 text-indigo-700' :
                                    record.status === 'S' ? 'bg-purple-100 text-purple-700' :
                                        record.status === 'ABSENT' || record.status === 'LEAVE' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                }`}>
                                {record.status === 'S' ? 'STUDY' : record.status}
                            </span>
                        </div>
                    ))}
                    {records.length === 0 && (
                        <div className="p-8 text-center text-gray-400">No attendance records found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentAttendance;
