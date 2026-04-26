import React, { useState, useEffect } from 'react';
import { api } from '../service';
import { User } from '../types';

interface Homework {
    id: string;
    title: string;
    instructions: string;
    dueDate: string;
    status: string;
    submissionStatus?: string;
    grade?: number;
    feedback?: string;
}

interface HomeworkSystemProps {
    user: User;
    studentId?: string; // For parent view
}

const HomeworkSystem: React.FC<HomeworkSystemProps> = ({ user, studentId }) => {
    const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);

    const targetId = studentId || user.id;

    const fetchHomework = async () => {
        try {
            setLoading(true);
            const endpoint = user.role === 'PARENT' 
                ? `/parent/student/${studentId}/homework` 
                : `/student/assignments?userId=${user.id}`; // Assuming this exists or I'll add it
            const data = await api.get(endpoint);
            setHomeworkList(data);
        } catch (err) {
            console.error('Failed to fetch homework:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHomework();
    }, [targetId]);

    const handleFileUpload = async (hwId: string, file: File) => {
        try {
            setUploading(hwId);
            const formData = new FormData();
            formData.append('file', file);
            const uploadRes = await api.post('/upload', formData);
            
            await api.post(`/submissions/${hwId}/turnin`, {
                studentId: user.id,
                content: uploadRes.url, // Store file URL
                status: 'SUBMITTED'
            });
            
            fetchHomework();
            alert('Homework submitted successfully!');
        } catch (err) {
            alert('Failed to submit homework');
        } finally {
            setUploading(null);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading homework...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">
                    {user.role === 'PARENT' ? "Child's Homework" : "My Homework"}
                </h2>
                <div className="text-sm text-slate-500">
                    {homeworkList.length} items found
                </div>
            </div>

            <div className="grid gap-4">
                {homeworkList.map((hw) => (
                    <div key={hw.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900">{hw.title}</h3>
                                <p className="text-slate-500 text-sm mt-1">{hw.instructions}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                hw.submissionStatus === 'SUBMITTED' ? 'bg-emerald-100 text-emerald-700' : 
                                new Date(hw.dueDate) < new Date() ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                                {hw.submissionStatus || (new Date(hw.dueDate) < new Date() ? 'LATE' : 'PENDING')}
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    Due: {new Date(hw.dueDate).toLocaleDateString()}
                                </span>
                                {hw.grade !== undefined && (
                                    <span className="font-bold text-indigo-600">Grade: {hw.grade}</span>
                                )}
                            </div>

                            {user.role === 'STUDENT' && !hw.submissionStatus && (
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                        onChange={(e) => e.target.files && handleFileUpload(hw.id, e.target.files[0])}
                                        disabled={!!uploading}
                                    />
                                    <button className={`px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 ${uploading === hw.id ? 'opacity-50' : ''}`}>
                                        {uploading === hw.id ? 'Uploading...' : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                Submit
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {hw.feedback && (
                            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 italic">
                                "Feedback: {hw.feedback}"
                            </div>
                        )}
                    </div>
                ))}

                {homeworkList.length === 0 && (
                    <div className="py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-400">No homework found for this period.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomeworkSystem;
