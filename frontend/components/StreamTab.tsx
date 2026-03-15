import React, { useState, useEffect } from 'react';
import { Announcement, User, Class } from '../types';
import { api } from '../service';

interface StreamTabProps {
    classData: Class;
    user: User;
    onNavigate: (tab: 'classwork', filter?: string) => void;
}

const StreamTab: React.FC<StreamTabProps> = ({ classData, user, onNavigate }) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [stats, setStats] = useState<any>({ total: 0, upcoming: 0, missing: 0, submitted: 0, graded: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [newAnnouncement, setNewAnnouncement] = useState('');
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isPosting, setIsPosting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showInput, setShowInput] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

    useEffect(() => {
        fetchStream();
        fetchStats();
    }, [classData.id]);

    const fetchStats = async () => {
        try {
            const data = await api.getAssignmentSummary(classData.id, user.role === 'STUDENT' ? user.id : undefined);
            setStats(data);
        } catch (err) {
            import('../utils/logger').then(m => m.logger.error('Failed to fetch stats', err)).catch(() => {});
        }
    };

    const fetchStream = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.get(`/classes/${classData.id}/stream`);
            setAnnouncements(data);
        } catch (err: any) {
            import('../utils/logger').then(m => m.logger.error('Stream fetch error:', err)).catch(() => {});
            setError("Failed to load stream. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async () => {
        if (!newAnnouncement.trim() && attachments.length === 0) return;
        setIsPosting(true);
        try {
            await api.post(`/classes/${classData.id}/announce`, {
                authorId: user.id,
                content: newAnnouncement,
                attachments: attachments
            });
            setNewAnnouncement('');
            setAttachments([]);
            setShowInput(false);
            fetchStream();
        } catch (err) {
            import('../utils/logger').then(m => m.logger.error('Failed to post announcement:', err)).catch(() => {});
            alert("Failed to post announcement. Please try again.");
        } finally {
            setIsPosting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        setIsUploading(true);
        try {
            const res = await api.uploadFile(e.target.files[0]);
            setAttachments(prev => [...prev, res]);
        } catch (err) {
            alert("Failed to upload file");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteAnnouncement = async (id: string) => {
        try {
            await (api as any).deleteAnnouncement(id);
            setAnnouncements(prev => prev.filter(a => a.id !== id));
            setShowDeleteModal(null);
        } catch (err) {
            alert("Failed to delete announcement");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Banner */}
            <div className={`h-60 rounded-xl bg-blue-600 p-6 flex items-end text-white shadow-sm relative overflow-hidden ${classData.theme === 'theme-dark' ? 'bg-slate-800' : 'bg-blue-600'}`}>
                <div className="z-10">
                    <h1 className="text-4xl font-semibold mb-2">{classData.name}</h1>
                    <p className="text-xl font-medium opacity-90">{classData.section}</p>
                </div>
                {/* Theme Bubble Pattern Effect */}
                <div className="absolute top-0 right-0 p-4">
                    <div className="w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                </div>
            </div>

            {/* Assignment Overview (New) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                    onClick={() => onNavigate('classwork', 'all')}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                >
                    <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                    <div className="text-xs text-gray-500 font-medium uppercase">Total Assignments</div>
                </div>
                <div
                    onClick={() => onNavigate('classwork', 'upcoming')}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                >
                    <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
                    <div className="text-xs text-blue-800 font-medium uppercase">Upcoming</div>
                </div>
                {user.role === 'STUDENT' && (
                    <>
                        <div
                            onClick={() => onNavigate('classwork', 'missing')}
                            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                        >
                            <div className="text-2xl font-bold text-red-600">{stats.missing}</div>
                            <div className="text-xs text-red-800 font-medium uppercase">Missing</div>
                        </div>
                        <div
                            onClick={() => onNavigate('classwork', 'graded')}
                            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                        >
                            <div className="flex gap-2 items-baseline">
                                <span className="text-2xl font-bold text-green-600">{stats.graded}</span>
                                <span className="text-sm text-gray-400">/ {stats.submitted} done</span>
                            </div>
                            <div className="text-xs text-green-800 font-medium uppercase">Graded</div>
                        </div>
                    </>
                )}
            </div>

            <div className="flex gap-6">
                {/* Sidebar Info (Upcoming) */}
                <div className="hidden md:block w-48 space-y-4">
                    {classData.role === 'STAFF' && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-gray-700">Class code</span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(classData.enrollmentCode);
                                        // Optional: You could add a toast state here
                                    }}
                                    className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                                    title="Copy Class Code"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                </button>
                            </div>
                            <div className="text-blue-600 font-medium text-lg">{classData.enrollmentCode}</div>
                        </div>
                    )}

                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <h3 className="font-medium text-sm text-gray-700 mb-4">Upcoming</h3>
                        <p className="text-xs text-gray-500 mb-4">No work due soon</p>
                        <button className="text-right w-full text-xs font-medium text-gray-600 hover:underline">View all</button>
                    </div>
                </div>

                {/* Feed */}
                <div className="flex-1 space-y-4">
                    {/* Announcement Input */}
                {!showInput ? (
                    <div
                        className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                        onClick={() => setShowInput(true)}
                    >
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-medium">
                            {user.name.charAt(0)}
                        </div>
                        <div className="text-gray-500 text-sm">Announce something to your class</div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <textarea
                            className="w-full bg-gray-50 rounded-lg p-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                            rows={4}
                            placeholder="Announce something to your class"
                            value={newAnnouncement}
                            onChange={(e) => setNewAnnouncement(e.target.value)}
                        />
                        
                        {attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {attachments.map((att, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 group">
                                        <div className="w-5 h-5 flex items-center justify-center">
                                            {att.type?.includes('pdf') ? '📄' : att.type?.includes('video') ? '🎥' : '📎'}
                                        </div>
                                        <span className="text-xs font-medium text-gray-700 truncate max-w-[150px]">{att.name || att.filename}</span>
                                        <button 
                                            onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                            <div className="flex gap-1">
                                <label className="p-2 text-gray-500 hover:bg-gray-100 rounded-full cursor-pointer flex items-center gap-1 group relative">
                                    <svg className="w-5 h-5 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded whitespace-nowrap">PDF / Notes</span>
                                    <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.doc,.docx" />
                                </label>
                                <label className="p-2 text-gray-500 hover:bg-gray-100 rounded-full cursor-pointer flex items-center gap-1 group relative">
                                    <svg className="w-5 h-5 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded whitespace-nowrap">Video</span>
                                    <input type="file" className="hidden" onChange={handleFileUpload} accept="video/*" />
                                </label>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setShowInput(false); setAttachments([]); }}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePost}
                                    disabled={(!newAnnouncement.trim() && attachments.length === 0) || isPosting || isUploading}
                                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {(isPosting || isUploading) && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                    {isUploading ? 'Uploading...' : 'Post'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                    {/* Stream Content */}
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center border border-red-200">
                            {error}
                            <button onClick={fetchStream} className="block mx-auto mt-2 text-sm font-medium underline">Try Again</button>
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                            <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </div>
                            <h3 className="text-gray-900 font-medium text-lg">No announcements yet</h3>
                            <p className="text-gray-500 text-sm mt-1">Be the first to say hello to the class!</p>
                        </div>
                    ) : (
                        announcements.map((post) => (
                            <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-3">
                                        {post.authorPhoto ? (
                                            <img src={post.authorPhoto} alt={post.authorName} className="w-10 h-10 rounded-full" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-medium">
                                                {(post.authorName || 'User').charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-medium text-sm text-gray-900">{post.authorName}</h3>
                                            <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="relative group/menu">
                                        <button className="p-2 hover:bg-gray-100 rounded-full">
                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                        </button>
                                        <div className="hidden group-hover/menu:block absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-100 py-1 z-20">
                                            {(user.role === 'ADMIN' || (user.role === 'STAFF' && post.authorId === user.id)) && (
                                                <button 
                                                    onClick={() => setShowDeleteModal(post.id)}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Link</button>
                                        </div>
                                    </div>
                                </div>

                                {showDeleteModal === post.id && (
                                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                                        <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete post?</h3>
                                            <p className="text-gray-500 text-sm mb-6">Class comments will also be deleted. This action cannot be undone.</p>
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => setShowDeleteModal(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                                <button onClick={() => handleDeleteAnnouncement(post.id)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg">Delete</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="text-sm text-gray-800 whitespace-pre-wrap mb-4">{post.content}</div>
                                
                                {/* Attachments Display */}
                                {(post as any).attachments?.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                        {(post as any).attachments.map((att: any, i: number) => (
                                            <a 
                                                key={i} 
                                                href={att.url} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <div className={`p-2 rounded ${
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
                                                    <div className="text-[10px] text-gray-500 uppercase">{att.type?.split('/')[1] || 'FILE'}</div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {/* Comments Section */}
                                <div className="border-t border-gray-100 pt-2">
                                    <div className="space-y-3 mb-4">
                                        <div className={`text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-50 py-1 px-2 -mx-2 rounded inline-block ${(!post.comments || post.comments.length === 0) && 'hidden'}`}>
                                            {post.comments?.length || 0} class comments
                                        </div>
                                        {/* Collapsed comments view usually only shows top 1, skipping that complexity for now, showing all */}
                                        {post.comments?.map(comment => (
                                            <div key={comment.id} className="flex gap-3 items-start">
                                                {comment.authorPhoto ? (
                                                    <img src={comment.authorPhoto} className="w-8 h-8 rounded-full" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center text-xs font-bold">
                                                        {comment.authorName?.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold text-gray-900">{comment.authorName}</span>
                                                        <span className="text-[10px] text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-800">{comment.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 relative">
                                            <input
                                                className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                                placeholder="Add class comment..."
                                                onKeyDown={async (e) => {
                                                    if (e.key === 'Enter') {
                                                        const target = e.target as HTMLInputElement;
                                                        const val = target.value.trim();
                                                        if (!val) return;

                                                        try {
                                                            target.disabled = true;
                                                            await api.post('/comments', {
                                                                parentId: post.id,
                                                                authorId: user.id,
                                                                content: val
                                                            });
                                                            target.value = '';
                                                            fetchStream(); // Refresh to see new comment
                                                        } catch (err) {
                                                            import('../utils/logger').then(m => m.logger.error('Failed to post comment:', err)).catch(() => {});
                                                            alert("Failed to post comment");
                                                        } finally {
                                                            target.disabled = false;
                                                            target.focus();
                                                        }
                                                    }
                                                }}
                                            />
                                            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 rounded-full">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default StreamTab;
