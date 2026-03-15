import React, { useState, useEffect } from 'react';
import { Assignment, User, Class, Submission, SubmittedFile } from '../types';
import { api } from '../service';

interface ClassworkTabProps {
    classData: Class;
    user: User;
    filter?: string; // New prop for initial filter
}

const ClassworkTab: React.FC<ClassworkTabProps> = ({ classData, user, filter = 'all' }) => {
    const [items, setItems] = useState<Assignment[]>([]);
    const [selectedItem, setSelectedItem] = useState<Assignment | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    // Filter State
    const [activeFilter, setActiveFilter] = useState(filter);

    // Derived state for filtered items - we need to fetch submissions to filter accurately client-side
    // OR we can trust the summary logic. But for list view, we need submission status for each item.
    // For simplicity, let's fetch all and filter in render (requires fetching submissions for all? No, just render what we know).
    // Actually, "Missing" logic requires checking due date.

    // We'll store all items, and a derived filteredItems.
    // But wait, 'items' is just assignments. We don't have submission status joined here yet.
    // We need to fetch 'my work' status for the list to filter effectively.
    // Let's assume we can filter 'Upcoming' easily (DueDate).
    // For 'Missing'/'Submitted', we need submission status.
    // Refactor: Fetch assignments AND my status.

    // Let's add a state for 'mySubmissions' map?
    const [submissionMap, setSubmissionMap] = useState<Map<string, any>>(new Map());

    // Create Form State
    const [title, setTitle] = useState('');
    const [instructions, setInstructions] = useState('');
    const [topic, setTopic] = useState('');
    const [points, setPoints] = useState(100);
    const [dueDate, setDueDate] = useState('');
    const [type, setType] = useState<'ASSIGNMENT' | 'NOTE'>('ASSIGNMENT');
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Main Tab State
    const [mainTab, setMainTab] = useState<'assignments' | 'notes'>('assignments');

    const handleCreate = async () => {
        if (!title.trim()) return alert('Title is required');
        try {
            await api.post(`/classes/${classData.id}/assignments`, {
                title,
                instructions,
                topic,
                points: type === 'ASSIGNMENT' ? points : 0,
                date: type === 'ASSIGNMENT' ? dueDate : null,
                createdBy: user.id,
                attachments: attachments,
                type: type
            });
            setShowCreate(false);
            setTitle('');
            setInstructions('');
            setTopic('');
            setPoints(100);
            setDueDate('');
            setType('ASSIGNMENT');
            setAttachments([]);
            fetchClasswork();
        } catch (err) {
            import('../utils/logger').then(m => m.logger.error('Failed to create assignment:', err)).catch(() => { });
            alert('Failed to create assignment');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        setIsUploading(true);
        try {
            const res = await api.uploadFile(e.target.files[0]);
            setAttachments(prev => [...prev, res]);
        } catch (err) {
            alert("Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        fetchClasswork();
    }, [classData.id]);

    useEffect(() => {
        setActiveFilter(filter);
    }, [filter]);

    const fetchClasswork = async () => {
        try {
            // If student, pass studentId to get myStatus
            const url = user.role === 'STUDENT'
                ? `/classes/${classData.id}/work?studentId=${user.id}`
                : `/classes/${classData.id}/work`;

            const data = await api.get(url);
            setItems(data);
        } catch (err) {
            import('../utils/logger').then(m => m.logger.error('Failed to fetch classwork:', err)).catch(() => { });
        }
    };

    if (selectedItem) {
        return (
            <AssignmentDetailView
                assignment={selectedItem}
                user={user}
                onBack={() => { setSelectedItem(null); fetchClasswork(); }}
                onDelete={async (id) => {
                    try {
                        await api.delete(`/assignments/${id}?userId=${user.id}`);
                        setSelectedItem(null);
                        fetchClasswork();
                        // Simple toast/alert on success
                        alert("Assignment deleted successfully");
                    } catch (err) {
                        alert("Failed to delete assignment. You might not have permission.");
                    }
                }}
            />
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Teacher Controls */}
            {user.role === 'STAFF' && (
                <div className="mb-6">
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-full font-medium hover:bg-gray-800 shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Create
                    </button>

                    {showCreate && (
                        <div className="mt-4 p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
                            <div className="flex justify-between items-center mb-6 border-b pb-4">
                                <h3 className="text-xl font-medium">Create {type === 'ASSIGNMENT' ? 'Assignment' : 'Note'}</h3>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button 
                                        onClick={() => setType('ASSIGNMENT')}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${type === 'ASSIGNMENT' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Assignment
                                    </button>
                                    <button 
                                        onClick={() => setType('NOTE')}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${type === 'NOTE' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Note
                                    </button>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <input className="w-full border p-2.5 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
                                <textarea className="w-full border p-2.5 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Instructions / Content" rows={4} value={instructions} onChange={e => setInstructions(e.target.value)} />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input className="w-full border p-2.5 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Topic (optional)" value={topic} onChange={e => setTopic(e.target.value)} />
                                    {type === 'ASSIGNMENT' && (
                                        <div className="flex gap-4">
                                            <input type="number" className="w-24 border p-2.5 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Points" value={points} onChange={e => setPoints(parseInt(e.target.value) || 0)} />
                                            <input type="date" className="flex-1 border p-2.5 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                                        </div>
                                    )}
                                </div>
                                
                                {attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 py-2">
                                        {attachments.map((att, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                                <div className="w-5 h-5 flex items-center justify-center">
                                                    {att.type?.includes('pdf') ? '📄' : att.type?.includes('video') ? '🎥' : '📎'}
                                                </div>
                                                <span className="text-xs font-medium text-gray-600 truncate max-w-[150px]">{att.name}</span>
                                                <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 ml-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-4 border-t">
                                    <div className="flex gap-2">
                                        <label className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                            PDF/Notes
                                            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.doc,.docx" />
                                        </label>
                                        <label className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            Video
                                            <input type="file" className="hidden" onChange={handleFileUpload} accept="video/*" />
                                        </label>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setShowCreate(false); setAttachments([]); }} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                                        <button 
                                            onClick={handleCreate} 
                                            disabled={isUploading} 
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                                        >
                                            {isUploading ? 'Uploading...' : (type === 'ASSIGNMENT' ? 'Assign' : 'Share')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Main Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setMainTab('assignments')}
                    className={`px-8 py-3 text-sm font-medium transition-all relative ${mainTab === 'assignments' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Assignments
                    {mainTab === 'assignments' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
                </button>
                <button
                    onClick={() => setMainTab('notes')}
                    className={`px-8 py-3 text-sm font-medium transition-all relative ${mainTab === 'notes' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Notes
                    {mainTab === 'notes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
                </button>
            </div>

            {/* Filter Tabs - Only for Assignments */}
            {mainTab === 'assignments' && (
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {['all', 'upcoming', 'missing', 'submitted', 'graded'].map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap capitalize transition-colors ${activeFilter === f
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            )}

            {/* Topics & Lists */}
            <div className="space-y-6">
                {items.filter(item => {
                    // 1. Filter by Main Tab (Type)
                    const itemType = (item as any).type || 'ASSIGNMENT';
                    if (mainTab === 'assignments' && itemType !== 'ASSIGNMENT') return false;
                    if (mainTab === 'notes' && itemType !== 'NOTE') return false;

                    // 2. Filter by Status (Only for Assignments)
                    if (mainTab === 'assignments') {
                        const status = (item as any).myStatus; 

                        if (activeFilter === 'all') return true;

                        const now = new Date();
                        const dueDate = item.dueDate ? new Date(item.dueDate) : null;

                        if (activeFilter === 'upcoming') {
                            return (!status || status === 'Assigned') && (!dueDate || dueDate > now);
                        }
                        if (activeFilter === 'missing') {
                            return (!status || status === 'Assigned') && (dueDate && dueDate < now);
                        }
                        if (activeFilter === 'submitted') {
                            return status === 'TurnedIn';
                        }
                        if (activeFilter === 'graded') {
                            return status === 'Returned';
                        }
                        return true;
                    }
                    
                    return true;
                }).map((item) => (
                    <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="group flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md hover:bg-gray-50 cursor-pointer transition-all"
                    >
                        <div className={`p-3 rounded-full transition-colors ${
                            mainTab === 'assignments' 
                                ? 'bg-gray-100 group-hover:bg-blue-100 text-gray-500 group-hover:text-blue-600' 
                                : 'bg-gray-100 group-hover:bg-green-100 text-gray-500 group-hover:text-green-600'
                        }`}>
                            {mainTab === 'assignments' ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="font-medium text-gray-800 mb-0.5">{item.title}</div>
                            <div className="text-xs text-gray-500">
                                Posted {new Date(item.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                        {item.dueDate && (
                            <div className="text-xs text-gray-500">
                                Due {item.dueDate}
                            </div>
                        )}
                    </div>
                ))}

                {items.filter(item => {
                    const itemType = (item as any).type || 'ASSIGNMENT';
                    return mainTab === 'assignments' ? itemType === 'ASSIGNMENT' : itemType === 'NOTE';
                }).length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="text-4xl mb-4">
                            {mainTab === 'assignments' ? '📝' : '📚'}
                        </div>
                        <div className="text-gray-500 font-medium">
                            {mainTab === 'assignments' 
                                ? "This is where you'll see classwork assignments." 
                                : "No notes shared yet."}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Sub-components for Detail View ---

const AssignmentDetailView: React.FC<{ assignment: Assignment, user: User, onBack: () => void, onDelete: (id: string) => void }> = ({ assignment, user, onBack, onDelete }) => {
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Check if user is Admin or the Teacher who created it
    const canDelete = user.role === 'ADMIN' || (user.role === 'STAFF' && assignment.createdBy === user.id);
    return (
        <div className="max-w-5xl mx-auto">
            <button onClick={onBack} className="mb-4 text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to list
            </button>

            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Assignment</h3>
                        <p className="text-gray-500 mb-6">Are you sure you want to delete this assignment?<br />This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium transition-colors">Cancel</button>
                            <button onClick={() => { setShowConfirmModal(false); onDelete(assignment.id); }} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded font-medium transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-6">
                {/* Assignment Info (Left) */}
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-100 rounded-full text-blue-600 shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-medium mb-1" style={{ color: (assignment as any).type === 'NOTE' ? '#10b981' : '#2563eb' }}>{assignment.title}</h1>
                                <p className="text-sm text-gray-500">
                                    {(assignment as any).type === 'NOTE' ? 'Shared Note' : (
                                        <>
                                            {assignment.points ? `${assignment.points} points` : 'Ungraded'}
                                            <span className="mx-2">•</span>
                                            Due {assignment.dueDate || 'No due date'}
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                        {canDelete && (
                            <button onClick={() => setShowConfirmModal(true)} className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors">
                                Delete
                            </button>
                        )}
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap mb-6">{assignment.instructions || 'No instructions provided.'}</p>
                        
                        {/* Assignment Attachments */}
                        {(assignment as any).attachments?.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(assignment as any).attachments.map((att: any, i: number) => (
                                    <a 
                                        key={i} 
                                        href={att.url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all border-l-4 border-l-blue-500"
                                    >
                                        <div className={`p-2 rounded-lg ${
                                            att.type?.includes('pdf') ? 'bg-red-50 text-red-600' : 
                                            att.type?.includes('video') ? 'bg-blue-50 text-blue-600' : 
                                            'bg-gray-50 text-gray-600'
                                        }`}>
                                            {att.type?.includes('pdf') ? (
                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z"/></svg>
                                            ) : att.type?.includes('video') ? (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            ) : (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">{att.name}</div>
                                            <div className="text-[10px] text-gray-500 uppercase font-bold">{att.type?.split('/')[1] || 'FILE'}</div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar (Right) - Only for Assignments */}
                {(assignment as any).type !== 'NOTE' && (
                    <div className="w-full md:w-80">
                        {user.role === 'STUDENT' ? (
                            <StudentWorkPanel assignment={assignment} user={user} />
                        ) : (
                            <TeacherGradingPanel assignment={assignment} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const StudentWorkPanel: React.FC<{ assignment: Assignment, user: User }> = ({ assignment, user }) => {
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        // Fetch specific submission for this student
        api.get(`/assignments/${assignment.id}/mysubmission/${user.id}`)
            .then(data => setSubmission(data))
            .catch(err => import('../utils/logger').then(m => m.logger.error('Failed to fetch submission:', err)).catch(() => { }));
    }, [assignment.id, user.id]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !submission) return;
        setIsUploading(true);
        const file = e.target.files[0];

        try {
            // 1. Upload file to server
            const uploadRes = await api.uploadFile(file);

            // 2. Attach metadata to submission
            await api.post('/attachments', {
                parentId: submission.id,
                parentType: 'SUBMISSION',
                file: uploadRes
            });

            // 3. Refresh submission
            const updated = await api.get(`/assignments/${assignment.id}/mysubmission/${user.id}`);
            setSubmission(updated);

        } catch (err) {
            import('../utils/logger').then(m => m.logger.error('Failed to upload file:', err)).catch(() => { });
            alert("Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    const handleTurnIn = async () => {
        if (!submission) return;
        try {
            await api.post(`/submissions/${submission.id}/turnin`, {});
            setSubmission({ ...submission, status: 'TurnedIn', submittedAt: new Date().toISOString() });
        } catch (err) {
            import('../utils/logger').then(m => m.logger.error('Failed to turn in assignment:', err)).catch(() => { });
        }
    };

    if (!submission) return <div>Loading work...</div>;

    const isTurnedIn = submission.status === 'TurnedIn' || submission.status === 'Returned';

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-normal text-gray-800">Your work</h2>
                <span className={`text-sm font-medium ${isTurnedIn ? 'text-green-600' : 'text-gray-500'}`}>
                    {submission.status === 'Assigned' ? 'Assigned' : (submission.status === 'Returned' ? 'Returned' : 'Turned in')}
                </span>
            </div>

            {/* File List */}
            <div className="space-y-2 mb-6">
                {submission.submittedFiles?.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 border border-gray-200 rounded hover:bg-gray-50">
                        <div className="w-8 h-8 bg-red-100 text-red-600 flex items-center justify-center rounded text-xs font-bold">PDF</div>
                        <a href={f.url} target="_blank" rel="noreferrer" className="text-sm truncate flex-1 hover:underline text-blue-600">{f.name}</a>
                    </div>
                ))}
                {submission.submittedFiles?.length === 0 && (
                    <div className="text-sm text-gray-400 italic">No attachments yet</div>
                )}
            </div>

            {/* Actions */}
            {!isTurnedIn && (
                <div className="space-y-3">
                    <label className={`flex justify-center items-center gap-2 w-full py-2 border border-gray-300 rounded text-blue-600 font-medium cursor-pointer hover:bg-blue-50 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <span className="text-lg">+</span> Add or create
                        <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                    <button
                        onClick={handleTurnIn}
                        disabled={!submission.submittedFiles?.length}
                        className="w-full py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        Turn in
                    </button>
                </div>
            )}

            {isTurnedIn && (
                <button disabled className="w-full py-2 bg-gray-100 text-gray-500 rounded font-medium cursor-default">
                    Unsubmit (Disabled)
                </button>
            )}

            {/* Grade Display */}
            {submission.status === 'Returned' && submission.grade !== undefined && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="text-sm text-gray-500">Grade</div>
                    <div className="text-3xl font-medium text-gray-800">{submission.grade}<span className="text-lg text-gray-400">/100</span></div>
                </div>
            )}
        </div>
    );
};

const TeacherGradingPanel: React.FC<{ assignment: Assignment }> = ({ assignment }) => {
    const [submissions, setSubmissions] = useState<any[]>([]);

    useEffect(() => {
        api.get(`/assignments/${assignment.id}/submissions`)
            .then(data => setSubmissions(data))
            .catch(err => import('../utils/logger').then(m => m.logger.error('Failed to fetch submissions:', err)).catch(() => { }));
    }, [assignment.id]);

    const handleGrade = async (subId: string, grade: number) => {
        try {
            await api.post(`/submissions/${subId}/grade`, { grade });
            // Optimistic update
            setSubmissions(prev => prev.map(s => s.id === subId ? { ...s, grade, status: 'Returned' } : s));
        } catch (err) {
            import('../utils/logger').then(m => m.logger.error('Failed to grade submission:', err)).catch(() => { });
            alert("Failed to save grade");
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-medium text-gray-700">Student submissions</h2>
                <div className="flex gap-4 text-sm mt-2">
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-gray-800">{submissions.filter(s => s.status === 'TurnedIn').length}</div>
                        <div className="text-gray-500 text-xs">Turned in</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-gray-800">{submissions.filter(s => s.status === 'Assigned').length}</div>
                        <div className="text-gray-500 text-xs">Assigned</div>
                    </div>
                </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
                {submissions.map(sub => (
                    <div key={sub.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                        <div className="flex items-center gap-3 mb-2">
                            {sub.studentPhoto ? (
                                <img src={sub.studentPhoto} className="w-8 h-8 rounded-full" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                                    {sub.studentName?.charAt(0)}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">{sub.studentName}</div>
                                <div className={`text-xs ${sub.status === 'TurnedIn' ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                                    {sub.status}
                                </div>
                            </div>
                        </div>

                        {/* Files */}
                        {sub.submittedFiles?.length > 0 && (
                            <div className="mb-2 space-y-1">
                                {sub.submittedFiles.map((f: any) => (
                                    <a key={f.id} href={f.url} target="_blank" className="block text-xs text-blue-600 hover:underline truncate">
                                        📎 {f.name}
                                    </a>
                                ))}
                            </div>
                        )}

                        {/* Grade Input */}
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="number"
                                placeholder={sub.grade ?? "100"}
                                className="w-16 border rounded px-2 py-1 text-sm bg-white"
                                onBlur={(e) => handleGrade(sub.id, parseInt(e.target.value))}
                            />
                            <span className="text-xs text-gray-400">/ 100</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClassworkTab;
