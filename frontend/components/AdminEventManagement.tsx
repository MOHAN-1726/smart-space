import React, { useState, useEffect } from 'react';
import { api } from '../service';
import { SchoolEvent, Class } from '../types';

interface AdminEventManagementProps {
    classes: Class[];
}

const AdminEventManagement: React.FC<AdminEventManagementProps> = ({ classes }) => {
    const [events, setEvents] = useState<SchoolEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // New Event Form
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('School Event');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [targetClassId, setTargetClassId] = useState('');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const data = await api.get('/events');
            setEvents(data);
        } catch (err) {
            console.error('Failed to fetch events:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/events', {
                title,
                category,
                date,
                description,
                targetClassId: targetClassId || null
            });
            setShowModal(false);
            resetForm();
            fetchEvents();
        } catch (err) {
            alert('Failed to create event');
        }
    };

    const handleDeleteEvent = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;
        try {
            await api.delete(`/events/${id}`);
            fetchEvents();
        } catch (err) {
            alert('Failed to delete event');
        }
    };

    const resetForm = () => {
        setTitle('');
        setCategory('School Event');
        setDate('');
        setDescription('');
        setTargetClassId('');
    };

    if (loading) return <div className="p-10 text-center text-gray-400 font-medium animate-pulse">Loading events...</div>;

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Event Management</h2>
                    <p className="text-gray-500 mt-1 font-medium">Create and organize school-wide events and holidays</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 font-bold text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    New Event
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map(event => (
                    <div key={event.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-2 h-full ${
                            event.category === 'Holiday' ? 'bg-amber-400' : 
                            event.category === 'Exam' ? 'bg-indigo-500' : 
                            'bg-emerald-500'
                        }`}></div>
                        <div className="flex justify-between items-start pl-2">
                            <div>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg mb-2 inline-block ${
                                    event.category === 'Holiday' ? 'bg-amber-50 text-amber-700' : 
                                    event.category === 'Exam' ? 'bg-indigo-50 text-indigo-700' : 
                                    'bg-emerald-50 text-emerald-700'
                                }`}>
                                    {event.category}
                                </span>
                                <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{event.title}</h3>
                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 font-medium">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                </div>
                                {event.description && <p className="text-gray-400 mt-3 text-sm line-clamp-2 leading-relaxed">{event.description}</p>}
                            </div>
                            <button 
                                onClick={() => handleDeleteEvent(event.id)}
                                className="text-gray-300 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-xl transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                ))}
                {events.length === 0 && (
                    <div className="col-span-full py-20 bg-gray-50 rounded-3xl border-4 border-dashed border-gray-100 text-center">
                        <p className="text-gray-400 font-bold text-lg">No events created yet.</p>
                        <p className="text-gray-300">Click the 'New Event' button to get started.</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-2xl font-black text-gray-900 mb-6">Create New Event</h3>
                        <form onSubmit={handleCreateEvent} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Event Title</label>
                                <input className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-indigo-500 focus:outline-none transition-all font-bold placeholder:font-medium" placeholder="e.g. Annual Sports Meet 2024" required value={title} onChange={e => setTitle(e.target.value)} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Category</label>
                                    <select className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-indigo-500 focus:outline-none transition-all font-bold appearance-none bg-white" value={category} onChange={e => setCategory(e.target.value)}>
                                        <option value="School Event">School Event</option>
                                        <option value="Holiday">Holiday</option>
                                        <option value="Exam">Exam</option>
                                        <option value="Class Event">Class Event</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Date</label>
                                    <input type="date" className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-indigo-500 focus:outline-none transition-all font-bold" required value={date} onChange={e => setDate(e.target.value)} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Target Class (Optional)</label>
                                <select className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-indigo-500 focus:outline-none transition-all font-bold appearance-none bg-white" value={targetClassId} onChange={e => setTargetClassId(e.target.value)}>
                                    <option value="">All School</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Description</label>
                                <textarea className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-indigo-500 focus:outline-none transition-all font-bold placeholder:font-medium h-32" placeholder="Tell us more about the event..." value={description} onChange={e => setDescription(e.target.value)} />
                            </div>

                            <div className="flex justify-end gap-3 pt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
                                <button type="submit" className="px-10 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95">Save Event</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEventManagement;
