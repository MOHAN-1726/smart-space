import React, { useState, useEffect } from 'react';
import { CalendarEvent, User } from '../types';
import { api } from '../service';

interface CalendarWidgetProps {
    user: User;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ user }) => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'week' | 'day'>('month');
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [classFilter, setClassFilter] = useState<string>('all');
    const [classes, setClasses] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchEvents();
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const data = await api.get('/classes');
            setClasses(data);
        } catch (err) {
            console.error('Failed to fetch classes:', err);
        }
    };

    const fetchEvents = async () => {
        try {
            const data = await api.get('/calendar');
            setEvents(data);
        } catch (err) {
            console.error('Failed to fetch calendar events:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
        if (user.role !== 'STAFF' && user.role !== 'ADMIN') return;
        e.dataTransfer.setData('eventId', event.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (user.role !== 'STAFF' && user.role !== 'ADMIN') return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetData: string) => {
        if (user.role !== 'STAFF' && user.role !== 'ADMIN') return;
        e.preventDefault();
        const eventId = e.dataTransfer.getData('eventId');
        const event = events.find(ev => ev.id === eventId);
        
        if (event && event.date !== targetData) {
            try {
                // Optimistic update
                setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, date: targetData } : ev));
                
                await api.put(`/calendar/events/${eventId}/reschedule`, { newDate: targetData });
            } catch (err) {
                console.error('Failed to reschedule event:', err);
                fetchEvents(); // Re-fetch on failure
            }
        }
    };

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const renderHeader = () => {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return (
            <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button onClick={() => setView('month')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${view === 'month' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Month</button>
                        <button onClick={() => setView('week')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${view === 'week' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Week</button>
                        <button onClick={() => setView('day')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${view === 'day' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Day</button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-100 transition-colors">Today</button>
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>
        );
    };

    const getEventColor = (event: CalendarEvent) => {
        if ((event as any).color) return (event as any).color;

        if (event.type === 'Assignment Due') {
            const dueDate = new Date(event.date);
            const today = new Date();
            today.setHours(0,0,0,0);
            dueDate.setHours(0,0,0,0);
            
            if (event.status === 'TurnedIn' || event.status === 'Returned' || event.status === 'Submitted') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            if (dueDate.getTime() === today.getTime()) return 'bg-rose-100 text-rose-700 border-rose-200';
            if (dueDate.getTime() > today.getTime() && dueDate.getTime() <= today.getTime() + 86400000 * 2) return 'bg-orange-100 text-orange-700 border-orange-200';
            return 'bg-blue-100 text-blue-700 border-blue-200';
        }
        if (event.type === 'Exam') return 'bg-rose-100 text-rose-700 border-rose-200';
        if (event.type === 'Holiday') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (event.type === 'School Event') return 'bg-blue-100 text-blue-700 border-blue-200';
        if (event.type === 'Class Activity') return 'bg-purple-100 text-purple-700 border-purple-200';
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    const renderMonthView = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const days = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);
        const calendarCells = [];

        // Padding for previous month
        for (let i = 0; i < startDay; i++) {
            calendarCells.push(<div key={`prev-${i}`} className="h-32 bg-gray-50/50 border border-gray-100 p-2 opacity-30"></div>);
        }

        // Active days
        for (let d = 1; d <= days; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayEvents = events.filter(e => {
                const matchesDate = e.date?.startsWith(dateStr);
                const matchesType = filter === 'all' || e.type === filter;
                const matchesClass = classFilter === 'all' || e.targetClassId === classFilter || e.classId === classFilter;
                const matchesSearch = searchTerm === '' || e.title.toLowerCase().includes(searchTerm.toLowerCase());
                return matchesDate && matchesType && matchesClass && matchesSearch;
            });
            const isToday = new Date().toISOString().startsWith(dateStr);

            calendarCells.push(
                <div 
                    key={d} 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, dateStr)}
                    className={`h-32 bg-white border border-gray-100 p-2 hover:bg-gray-50 transition-colors group relative ${isToday ? 'ring-2 ring-indigo-500 ring-inset z-10' : ''}`}
                >
                    <span className={`text-sm font-semibold ${isToday ? 'bg-indigo-600 text-white w-7 h-7 flex items-center justify-center rounded-full' : 'text-gray-500'}`}>{d}</span>
                    <div className="mt-2 space-y-1 overflow-hidden">
                        {dayEvents.slice(0, 3).map((e, idx) => (
                            <div 
                                key={idx} 
                                draggable={user.role === 'STAFF' || user.role === 'ADMIN'}
                                onDragStart={(dragEv) => handleDragStart(dragEv, e)}
                                className={`text-[10px] px-2 py-0.5 rounded border leading-tight truncate cursor-pointer transition-transform hover:scale-[1.02] ${getEventColor(e)}`}
                            >
                                {e.title}
                            </div>
                        ))}
                        {dayEvents.length > 3 && (
                            <div className="text-[9px] text-gray-400 font-medium pl-1">
                                + {dayEvents.length - 3} more
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-7 border-l border-t border-gray-100 rounded-xl overflow-hidden shadow-sm">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="bg-gray-50 border-r border-b border-gray-100 p-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">{d}</div>
                ))}
                {calendarCells}
            </div>
        );
    };

    if (loading) return <div className="p-20 text-center animate-pulse text-indigo-600 font-medium">Loading interactive calendar...</div>;

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">School Calendar</h1>
                    <p className="text-gray-500 mt-1">Track assignments, exams, and school events</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select 
                            value={classFilter} 
                            onChange={(e) => setClassFilter(e.target.value)}
                            className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
                        >
                            <option value="all">All Classes</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                    <div className="relative">
                        <select 
                            value={filter} 
                            onChange={(e) => setFilter(e.target.value)}
                            className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
                        >
                            <option value="all">All Types</option>
                            <option value="Assignment Due">Assignments</option>
                            <option value="Exam">Exams</option>
                            <option value="Holiday">Holidays</option>
                            <option value="School Event">Events</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                    <div className="relative group">
                        <input 
                            type="text" 
                            placeholder="Search events..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border border-gray-200 py-2 pl-10 pr-4 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none w-48 shadow-sm transition-all group-focus-within:w-64"
                        />
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
            </div>

            {renderHeader()}
            
            <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/20 p-2 border border-indigo-50/50">
                {view === 'month' && renderMonthView()}
                {view !== 'month' && (
                    <div className="h-96 flex items-center justify-center text-gray-400 border border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                        <div className="text-center">
                            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="font-medium">{view.charAt(0).toUpperCase() + view.slice(1)} view coming soon</p>
                            <button onClick={() => setView('month')} className="text-indigo-600 text-sm font-semibold mt-2 hover:underline">Back to Month View</button>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h3 className="font-bold text-rose-900">Priority Items</h3>
                    </div>
                    <div className="space-y-3">
                        {events.filter(e => {
                            const d = new Date(e.date);
                            const t = new Date();
                            return e.type === 'Assignment Due' && d.toDateString() === t.toDateString();
                        }).length > 0 ? (
                            events.filter(e => {
                                const d = new Date(e.date);
                                const t = new Date();
                                return e.type === 'Assignment Due' && d.toDateString() === t.toDateString();
                            }).map((e, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-rose-100 flex justify-between items-center animate-pulse">
                                    <span className="text-xs font-bold text-rose-700">{e.title}</span>
                                    <span className="text-[10px] bg-rose-100 px-2 py-0.5 rounded-full text-rose-600 font-bold uppercase">Due Today</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-rose-400 italic">No critical deadlines for today</p>
                        )}
                    </div>
                </div>

                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <h3 className="font-bold text-indigo-900">Upcoming Events</h3>
                    </div>
                    <div className="space-y-3">
                        {events.filter(e => e.type !== 'Assignment Due').slice(0, 3).map((e, idx) => {
                            const date = new Date(e.date);
                            const now = new Date();
                            const diffTime = date.getTime() - now.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                            return (
                                <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-indigo-100">
                                    <div className="flex justify-between items-start">
                                        <div className="text-[10px] font-bold text-indigo-400 uppercase mb-1">{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                                        {diffTime > 0 && e.type === 'Exam' && (
                                            <div className="text-[10px] font-bold text-amber-600 animate-pulse">
                                                {diffDays}d {diffHours}h left
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-sm font-bold text-indigo-700">{e.title}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="font-bold text-emerald-900">Recently Completed</h3>
                    </div>
                    <div className="space-y-3">
                        {events.filter(e => e.status === 'TurnedIn' || e.status === 'Returned').slice(0, 2).map((e, idx) => (
                             <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-emerald-100 flex items-center gap-3">
                                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <span className="text-sm font-medium text-emerald-700 truncate">{e.title}</span>
                             </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarWidget;
