import React, { useEffect, useState } from 'react';
import { api } from '../service';
import { LeaveRequest } from '../types';

interface StaffLeaveDashboardProps {
    classId: string;
    userId: string;
}

const StaffLeaveDashboard: React.FC<StaffLeaveDashboardProps> = ({ classId, userId }) => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED
    const [remarks, setRemarks] = useState<{ [key: string]: string }>({});

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await api.getClassLeaveRequests(classId);
            setRequests(data);
        } catch (err) {
            import('../utils/logger').then(m => m.logger.error('Failed to fetch leave requests:', err)).catch(() => {});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [classId]);

    const handleAction = async (id: string, status: string) => {
        try {
            await api.updateLeaveRequestStatus(id, status, remarks[id], userId);
            // Refresh
            fetchRequests();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const filteredRequests = requests.filter(req => filter === 'ALL' || req.status === filter);

    if (loading) return <div>Loading requests...</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Leave / OD Requests</h2>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="border rounded-md p-2"
                >
                    <option value="ALL">All Requests</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            <div className="space-y-4">
                {filteredRequests.map((req) => (
                    <div key={req.id} className="border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50">
                        <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                                <span className={`px-2 py-1 text-xs font-bold rounded ${req.type === 'OD' ? 'bg-indigo-100 text-indigo-800' :
                                        req.type === 'STUDY' ? 'bg-purple-100 text-purple-800' :
                                            'bg-red-100 text-red-800'
                                    }`}>
                                    {req.type} {req.studyType && `- ${req.studyType}`}
                                </span>
                                <span className="font-semibold">{req.studentName}</span>
                                <button
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        const stats = await api.getRequestSummary(req.studentId);
                                        alert(`Stats for ${req.studentName}:\nOD: ${stats.totalOD}\nStudy: ${stats.totalStudy}\nLeave: ${stats.totalLeave}\nPending: ${stats.totalPending}\nRejected: ${stats.totalRejected}`);
                                    }}
                                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded border"
                                >
                                    View Stats
                                </button>
                                <span className="text-sm text-gray-500">
                                    {req.fromDate} {req.fromDate !== req.toDate && `to ${req.toDate}`}
                                </span>
                            </div>
                            <p className="text-gray-700 mb-2">{req.reason}</p>
                            {req.documentUrl && (
                                <a href={req.documentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm block mb-2">
                                    View Document
                                </a>
                            )}
                            <div className="text-xs text-gray-500">Submitted: {new Date(req.createdAt).toLocaleDateString()}</div>

                            {req.status !== 'PENDING' && (
                                <div className="mt-2 text-sm">
                                    <span className="font-semibold">Status: </span>
                                    <span className={req.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'}>{req.status}</span>
                                    {req.staffRemarks && <span className="text-gray-600 ml-2">({req.staffRemarks})</span>}
                                </div>
                            )}
                        </div>

                        {req.status === 'PENDING' && (
                            <div className="mt-4 md:mt-0 md:ml-4 flex flex-col space-y-2 min-w-[200px]">
                                <textarea
                                    placeholder="Remarks (Optional)"
                                    className="w-full text-sm border rounded p-1"
                                    rows={2}
                                    value={remarks[req.id] || ''}
                                    onChange={(e) => setRemarks({ ...remarks, [req.id]: e.target.value })}
                                />
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleAction(req.id, 'APPROVED')}
                                        className="flex-1 bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleAction(req.id, 'REJECTED')}
                                        className="flex-1 bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {filteredRequests.length === 0 && (
                    <div className="text-center text-gray-500 py-8">No requests found.</div>
                )}
            </div>
        </div>
    );
};

export default StaffLeaveDashboard;
