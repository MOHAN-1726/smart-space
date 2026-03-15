import React, { useState } from 'react';
import { api } from '../service';
import { Class, User } from '../types';

interface LeaveRequestFormProps {
    user: User;
    classes: Class[];
    onSuccess: () => void;
}

const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({ user, classes, onSuccess }) => {
    const [formData, setFormData] = useState({
        classId: classes.length > 0 ? classes[0].id : '',
        subject: '',
        fromDate: '',
        toDate: '',
        type: 'OD',
        reason: '',
    });
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let documentUrl = '';
            if (file) {
                const uploadRes = await api.uploadFile(file);
                documentUrl = uploadRes.url;
            }

            await api.createLeaveRequest({
                studentId: user.id,
                ...formData,
                documentUrl,
            });

            onSuccess();
            setFormData({
                classId: classes.length > 0 ? classes[0].id : '',
                subject: '',
                fromDate: '',
                toDate: '',
                type: 'OD',
                reason: '',
            });
            setFile(null);
        } catch (err: any) {
            setError(err.message || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">New Request (OD / Leave)</h2>
            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Class</label>
                    <select
                        name="classId"
                        value={formData.classId}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                        required
                    >
                        <option value="">Select a Class</option>
                        {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                                {cls.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Request Type</label>
                    <div className="mt-2 space-x-4">
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                name="type"
                                value="OD"
                                checked={formData.type === 'OD'}
                                onChange={handleChange}
                                className="form-radio text-indigo-600"
                            />
                            <span className="ml-2">On-Duty (OD)</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                name="type"
                                value="LEAVE"
                                checked={formData.type === 'LEAVE'}
                                onChange={handleChange}
                                className="form-radio text-red-600"
                            />
                            <span className="ml-2">Leave</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                name="type"
                                value="STUDY"
                                checked={formData.type === 'STUDY'}
                                onChange={handleChange}
                                className="form-radio text-purple-600"
                            />
                            <span className="ml-2">Study</span>
                        </label>
                    </div>
                </div>

                {formData.type === 'STUDY' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Study Type</label>
                        <select
                            name="studyType"
                            value={(formData as any).studyType || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                            required
                        >
                            <option value="">Select Study Type</option>
                            <option value="Library">Library</option>
                            <option value="Project Work">Project Work</option>
                            <option value="Exam Prep">Exam Prep</option>
                            <option value="Research">Research</option>
                        </select>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">From Date</label>
                        <input
                            type="date"
                            name="fromDate"
                            value={formData.fromDate}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">To Date</label>
                        <input
                            type="date"
                            name="toDate"
                            value={formData.toDate}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Subject (Optional)</label>
                    <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                        placeholder="E.g., Math, Science (if specific)"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Reason</label>
                    <textarea
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                        required
                        placeholder="Brief reason for the request..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Supporting Document (Optional)</label>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                    >
                        {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LeaveRequestForm;
