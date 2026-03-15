import React, { useEffect, useState } from 'react';
import { api } from '../service';
import { LeaveRequest, User } from '../types';

interface LeaveRequestListProps {
    user: User;
}

const LeaveRequestList: React.FC<LeaveRequestListProps> = ({ user }) => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState<any>(null);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const [reqs, summary] = await Promise.all([
                api.getStudentLeaveRequests(user.id),
                api.getRequestSummary(user.id)
            ]);
            setRequests(reqs);
            setStats(summary);
        } catch (err) {
            import('../utils/logger').then(m => m.logger.error('Failed to update leave request:', err)).catch(() => {});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [user.id]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    if (loading) return <div>Loading history...</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
            <h2 className="text-xl font-bold mb-4">My Request History</h2>

            {stats && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 text-center">
                        <div className="text-2xl font-bold text-indigo-600">{stats.totalOD}</div>
                        <div className="text-xs text-indigo-800 uppercase font-semibold">OD Approved</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 text-center">
                        <div className="text-2xl font-bold text-purple-600">{stats.totalStudy}</div>
                        <div className="text-xs text-purple-800 uppercase font-semibold">Study Approved</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
                        <div className="text-2xl font-bold text-red-600">{stats.totalLeave}</div>
                        <div className="text-xs text-red-800 uppercase font-semibold">Leave Approved</div>
                    </div>
                </div>
            )}

            {requests.length === 0 ? (
                <p className="text-gray-500">No requests found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.map((req) => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{req.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {req.fromDate} {req.fromDate !== req.toDate && ` - ${req.toDate}`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{req.className}</td>
                                    <td className="px-6 py-4">{req.reason}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(req.status)}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{req.staffRemarks || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default LeaveRequestList;
