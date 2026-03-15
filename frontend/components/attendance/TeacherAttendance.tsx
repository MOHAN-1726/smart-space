import React, { useState, useEffect } from 'react';
import { api } from '../../service';
import { AttendanceSession, AttendanceRecord, Class } from '../../types';
import ExcelAttendance from './ExcelAttendance';

interface TeacherAttendanceProps {
    classData: Class;
}

const TeacherAttendance: React.FC<TeacherAttendanceProps> = ({ classData }) => {
    const [viewMode, setViewMode] = useState<'sessions' | 'excel'>('sessions');
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
    const [newSessionDesc, setNewSessionDesc] = useState('');

    useEffect(() => {
        fetchSessions();
    }, [classData.id]);

    const fetchSessions = async () => {
        try {
            const data = await api.get(`/classes/${classData.id}/sessions`);
            setSessions(data);
        } catch (err) {
            console.error('Failed to fetch sessions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewSession = async (session: AttendanceSession) => {
        try {
            const details = await api.get(`/sessions/${session.id}`);
            setSelectedSession(details);
        } catch (err) {
            console.error('Failed to fetch session details:', err);
        }
    };

    const handleCreateSession = async () => {
        if (!newSessionDesc.trim()) return;
        setCreating(true);
        try {
            await api.post(`/classes/${classData.id}/sessions`, { description: newSessionDesc });
            setNewSessionDesc('');
            fetchSessions();
        } catch (err) {
            console.error('Failed to create session:', err);
        } finally {
            setCreating(false);
        }
    };

    const handleEndSession = async (sessionId: string) => {
        try {
            await api.post(`/sessions/${sessionId}/end`, { classId: classData.id });
            if (selectedSession && selectedSession.id === sessionId) {
                handleViewSession(selectedSession);
            }
            fetchSessions();
        } catch (err) {
            console.error('Failed to end session:', err);
        }
    };

    const handleUpdateRecord = async (recordId: string, status: string, remarks: string) => {
        try {
            // Optimistic update
            if (selectedSession && selectedSession.records) {
                const updatedRecords = selectedSession.records.map(r => 
                    r.id === recordId ? { ...r, status: status as any, remarks } : r
                );
                setSelectedSession({ ...selectedSession, records: updatedRecords });
            }

            // In our simple backend, we can reuse the sheet update logic or add a specific record update
            // For now, let's assume we can POST the update to a hypothetical record endpoint
            // or just refresh the session if the backend doesn't support partial updates yet.
            // Based on my implementation in index.js, I should probably add a PUT /api/attendance/records/:id
            await api.put(`/attendance/records/${recordId}`, { status, remarks });
        } catch (err) {
            console.error('Failed to update record:', err);
            if (selectedSession) handleViewSession(selectedSession); // Rollback
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading attendance data...</div>;

    if (viewMode === 'excel') {
        return (
            <div className="space-y-4">
                <div className="flex justify-end px-6 pt-4">
                    <button
                        onClick={() => setViewMode('sessions')}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        ← Back to Sessions
                    </button>
                </div>
                <ExcelAttendance classData={classData} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Attendance Management</h2>
                        <p className="text-gray-500 text-sm">Create and manage daily attendance sessions</p>
                    </div>
                    <button
                        onClick={() => setViewMode('excel')}
                        className="text-sm bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl hover:bg-emerald-100 border border-emerald-100 font-bold transition-all shadow-sm"
                    >
                        📝 Daily Excel View
                    </button>
                </div>

                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={newSessionDesc}
                            onChange={(e) => setNewSessionDesc(e.target.value)}
                            placeholder="Session Description (e.g. Maths Lecture - Unit 2)"
                            className="w-full p-3 pl-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={handleCreateSession}
                        disabled={creating || !newSessionDesc.trim()}
                        className="bg-indigo-600 font-bold text-white px-8 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                    >
                        {creating ? 'Creating...' : 'Start Session'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Session List */}
                <div className="lg:col-span-4 space-y-4">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Recent Sessions
                    </h3>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                        {sessions.map(s => (
                            <div
                                key={s.id}
                                onClick={() => handleViewSession(s)}
                                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedSession?.id === s.id ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-100 bg-white hover:border-indigo-200 hover:bg-gray-50'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-lg font-extrabold ${s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {s.status}
                                    </span>
                                    <span className="text-xs font-bold text-gray-400">
                                        {new Date(s.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <h4 className="font-bold text-gray-800 truncate">{s.description}</h4>
                                <p className="text-xs font-medium text-gray-400 mt-1">
                                    {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        ))}
                        {sessions.length === 0 && (
                            <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <p className="text-sm text-gray-400 font-medium">No sessions found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Selected Session Detail */}
                <div className="lg:col-span-8">
                    {selectedSession ? (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800">{selectedSession.description}</h3>
                                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg w-fit">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <span>Started: {new Date(selectedSession.startTime).toLocaleString()}</span>
                                    </div>
                                </div>
                                {selectedSession.status === 'ACTIVE' && (
                                    <button
                                        onClick={() => handleEndSession(selectedSession.id)}
                                        className="bg-rose-50 text-rose-700 px-6 py-2 rounded-xl hover:bg-rose-100 text-sm font-bold border border-rose-100 transition-all active:scale-95"
                                    >
                                        End Session
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                                    <div className="text-2xl font-black text-emerald-700">
                                        {selectedSession.records?.filter(r => r.status === 'PRESENT').length || 0}
                                    </div>
                                    <div className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider">Present</div>
                                </div>
                                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                                    <div className="text-2xl font-black text-rose-700">
                                        {selectedSession.records?.filter(r => r.status === 'ABSENT').length || 0}
                                    </div>
                                    <div className="text-[10px] text-rose-600 font-extrabold uppercase tracking-wider">Absent</div>
                                </div>
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                                    <div className="text-2xl font-black text-amber-700">
                                        {selectedSession.records?.filter(r => r.status === 'ON_DUTY').length || 0}
                                    </div>
                                    <div className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">On Duty</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                                    <div className="text-2xl font-black text-gray-700">
                                        {selectedSession.records?.length || 0}
                                    </div>
                                    <div className="text-[10px] text-gray-600 font-extrabold uppercase tracking-wider">Total</div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-gray-100">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Remarks</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-50">
                                        {selectedSession.records?.map(record => (
                                            <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs uppercase overflow-hidden ring-2 ring-white">
                                                            {record.studentPhoto ? <img src={record.studentPhoto} alt="" className="w-full h-full object-cover" /> : record.studentName?.[0]}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-900">{record.studentName}</div>
                                                            <div className="text-[10px] font-medium text-gray-400">{record.studentEmail}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <select 
                                                        disabled={selectedSession.status === 'CLOSED'}
                                                        value={record.status}
                                                        onChange={(e) => handleUpdateRecord(record.id, e.target.value, record.remarks || '')}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-black outline-none border-2 transition-all cursor-pointer ${
                                                            record.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            record.status === 'ABSENT' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                            record.status === 'ON_DUTY' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                            record.status === 'LEAVE' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                                                            'bg-gray-50 text-gray-700 border-gray-100'
                                                        }`}
                                                    >
                                                        <option value="PRESENT">Present</option>
                                                        <option value="ABSENT">Absent</option>
                                                        <option value="ON_DUTY">On Duty</option>
                                                        <option value="LEAVE">Leave</option>
                                                        <option value="NO_DUE">No Due</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Add remark..."
                                                        disabled={selectedSession.status === 'CLOSED'}
                                                        defaultValue={record.remarks || ''}
                                                        onBlur={(e) => handleUpdateRecord(record.id, record.status, e.target.value)}
                                                        className="w-full text-xs p-2 bg-gray-50/50 border border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-white focus:outline-none rounded-lg transition-all"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-[10px] font-black text-gray-400">
                                                        {record.joinedAt ? new Date(record.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-gray-50 rounded-3xl border-4 border-dashed border-gray-100 text-center p-8">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg shadow-gray-200/50 mb-4 ring-8 ring-gray-50">
                                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">No Session Selected</h3>
                            <p className="text-gray-400 mt-2 max-w-xs">Select a session from the list on the left to view and manage student records</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherAttendance;
