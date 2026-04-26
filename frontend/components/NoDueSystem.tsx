import React, { useState, useEffect } from 'react';
import { api } from '../service';
import { NoDueRequest, User } from '../types';

interface NoDueSystemProps {
    user: User;
}

const NoDueSystem: React.FC<NoDueSystemProps> = ({ user }) => {
    const [requests, setRequests] = useState<NoDueRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [reason, setReason] = useState('');
    const [remarks, setRemarks] = useState<{ [key: string]: string }>({});

    const fetchRequests = async () => {
        try {
            setLoading(true);
            let data;
            if (user.role === 'STUDENT') {
                data = await api.get(`/users/${user.id}/no-due-requests`);
            } else {
                data = await api.get('/no-due-requests');
            }
            setRequests(data);
        } catch (err) {
            console.error('Failed to fetch no-due requests:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [user.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/no-due-requests', { reason });
            setReason('');
            fetchRequests();
        } catch (err) {
            alert('Failed to submit request');
        }
    };

    const handleReview = async (id: string, status: string) => {
        try {
            await api.put(`/no-due-requests/${id}/review`, { status, remarks: remarks[id] });
            fetchRequests();
        } catch (err) {
            alert('Failed to review request');
        }
    };

    const handleFinalize = async (id: string) => {
        try {
            await api.put(`/no-due-requests/${id}/finalize`, { remarks: remarks[id] });
            fetchRequests();
        } catch (err) {
            alert('Failed to finalize request');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 italic">Loading no-due requests...</div>;

    return (
        <div className="space-y-8 max-w-4xl mx-auto py-4">
            {user.role === 'STUDENT' && (
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-indigo-50">
                    <h3 className="text-2xl font-extrabold text-indigo-900 mb-6 flex items-center gap-2">
                        <span className="p-2 bg-indigo-100 rounded-lg text-indigo-600">📜</span>
                        Submit New No-Due Request
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1 ml-1">Reason (Optional)</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-indigo-500 focus:ring-0 outline-none transition-all resize-none"
                                rows={3}
                                placeholder="E.g., Completing semester, leaving institution..."
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-indigo-200 transition-all active:scale-[0.98]"
                        >
                            Submit No-Due Request
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-50">
                <h3 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                    <span className="p-2 bg-slate-100 rounded-lg text-slate-600">📋</span>
                    {user.role === 'STUDENT' ? 'Your Request Status' : 'Pending No-Due Reviews'}
                </h3>
                <div className="space-y-6">
                    {requests.map((req) => (
                        <div key={req.id} className="p-6 rounded-2xl border-2 border-slate-50 bg-slate-50/50 hover:bg-white hover:border-indigo-100 transition-all">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full tracking-wider ${
                                            req.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                            req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                            req.status === 'TEACHER_APPROVED' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {req.status.replace('_', ' ')}
                                        </span>
                                        {user.role !== 'STUDENT' && <span className="font-bold text-slate-900">{req.studentName}</span>}
                                    </div>
                                    <p className="text-slate-600 italic">"{req.reason || 'No reason provided'}"</p>
                                    <div className="text-xs text-slate-400 font-medium">Submitted: {new Date(req.createdAt).toLocaleDateString()}</div>
                                    
                                    {(req.teacherRemarks || req.adminRemarks) && (
                                        <div className="mt-3 p-3 bg-white rounded-lg border border-slate-100 text-sm">
                                            {req.teacherRemarks && <p><span className="font-bold text-indigo-600">Teacher:</span> {req.teacherRemarks}</p>}
                                            {req.adminRemarks && <p><span className="font-bold text-purple-600">Admin:</span> {req.adminRemarks}</p>}
                                        </div>
                                    )}
                                </div>

                                {(user.role === 'STAFF' || user.role === 'ADMIN') && req.status === 'PENDING' && (
                                    <div className="flex flex-col gap-2 min-w-[200px]">
                                        <input 
                                            placeholder="Review Remarks"
                                            className="text-sm border-2 border-slate-100 rounded-lg p-2 outline-none focus:border-indigo-500"
                                            value={remarks[req.id] || ''}
                                            onChange={(e) => setRemarks({...remarks, [req.id]: e.target.value})}
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={() => handleReview(req.id, 'TEACHER_APPROVED')} className="flex-1 bg-indigo-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-indigo-700">Approve</button>
                                            <button onClick={() => handleReview(req.id, 'REJECTED')} className="flex-1 bg-red-50 text-red-600 text-xs font-bold py-2 rounded-lg hover:bg-red-100">Reject</button>
                                        </div>
                                    </div>
                                )}

                                {user.role === 'ADMIN' && req.status === 'TEACHER_APPROVED' && (
                                    <div className="flex flex-col gap-2 min-w-[200px]">
                                        <input 
                                            placeholder="Admin Final Remarks"
                                            className="text-sm border-2 border-slate-100 rounded-lg p-2 outline-none focus:border-purple-500"
                                            value={remarks[req.id] || ''}
                                            onChange={(e) => setRemarks({...remarks, [req.id]: e.target.value})}
                                        />
                                        <button onClick={() => handleFinalize(req.id)} className="w-full bg-purple-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-purple-700">Final Approval</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {requests.length === 0 && (
                        <div className="text-center py-10">
                            <div className="text-4xl mb-4">📭</div>
                            <p className="text-slate-400 font-medium italic">No requests to display.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NoDueSystem;
