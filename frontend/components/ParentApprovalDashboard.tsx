import React, { useState, useEffect } from 'react';
import { api } from '../service';
import { LeaveRequest } from '../types';

interface ParentApprovalDashboardProps {
    parentId: string;
}

const ParentApprovalDashboard: React.FC<ParentApprovalDashboardProps> = ({ parentId }) => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await api.get(`/requests/parent/${parentId}`);
            setRequests(data);
        } catch (err) {
            console.error('Failed to fetch parent requests:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [parentId]);

    const handleApproval = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            await api.put(`/leave-requests/${id}/parent-approval`, { status });
            fetchRequests();
        } catch (err) {
            alert('Failed to update approval status');
        }
    };

    if (loading) return <div className="p-10 text-center">Loading requests...</div>;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold mb-6">Child's Leave Requests</h2>
            
            {requests.length === 0 ? (
                <p className="text-slate-500 italic">No pending requests for approval.</p>
            ) : (
                <div className="space-y-4">
                    {requests.map((req) => (
                        <div key={req.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-center">
                            <div>
                                <div className="font-bold text-slate-900">{req.studentName} - {req.type}</div>
                                <div className="text-sm text-slate-500">{req.fromDate} to {req.toDate}</div>
                                <div className="text-xs text-slate-400 mt-1 italic">"{req.reason}"</div>
                            </div>
                            
                            <div className="flex gap-2">
                                {req.parentApprovalStatus === 'PENDING' ? (
                                    <>
                                        <button 
                                            onClick={() => handleApproval(req.id, 'APPROVED')}
                                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors"
                                        >
                                            Approve
                                        </button>
                                        <button 
                                            onClick={() => handleApproval(req.id, 'REJECTED')}
                                            className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700 transition-colors"
                                        >
                                            Reject
                                        </button>
                                    </>
                                ) : (
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        req.parentApprovalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                    }`}>
                                        Parent: {req.parentApprovalStatus}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ParentApprovalDashboard;
