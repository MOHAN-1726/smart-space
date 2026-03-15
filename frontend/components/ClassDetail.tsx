import React, { useState } from 'react';
import { User, Class } from '../types';
import StreamTab from './StreamTab';
import ClassworkTab from './ClassworkTab';
import PeopleTab from './PeopleTab';
import AttendanceTab from './attendance/AttendanceTab';

import StaffLeaveDashboard from './StaffLeaveDashboard';

interface ClassDetailProps {
    classData: Class;
    user: User;
    onBack: () => void;
}

type Tab = 'stream' | 'classwork' | 'people' | 'attendance' | 'requests';

const ClassDetail: React.FC<ClassDetailProps> = ({ classData, user, onBack }) => {
    const [activeTab, setActiveTab] = useState<Tab>('stream');
    const [initialFilter, setInitialFilter] = useState<string | undefined>(undefined);
    const isStaff = user.role === 'STAFF';
    const canDeleteClass =
        user.role === 'ADMIN' || (user.role === 'STAFF' && classData.ownerId === user.id);

    const handleNavigate = (tab: 'classwork', filter?: string) => {
        setActiveTab('classwork'); // Fix: string literal type matches
        if (filter) setInitialFilter(filter);
    };

    return (
        <div>
            {/* Header with actions */}
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={onBack}
                    className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                    </svg>
                    Back to classes
                </button>

                {canDeleteClass && (
                    <button
                        onClick={async () => {
                            if (!window.confirm('Delete this class and its assignments?')) return;
                            try {
                                await import('../service').then(m =>
                                    m.api.delete(`/classes/${classData.id}`)
                                );
                                alert('Class deleted successfully');
                                onBack();
                            } catch (err) {
                                alert('Failed to delete class. You might not have permission.');
                            }
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors"
                    >
                        Delete class
                    </button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6 bg-white sticky top-16 z-10 -mx-6 px-6 pt-2">
                <div className="max-w-4xl mx-auto flex gap-8 align-bottom overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('stream')}
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'stream' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        Stream
                    </button>
                    <button
                        onClick={() => setActiveTab('classwork')}
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'classwork' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        Classwork
                    </button>
                    <button
                        onClick={() => setActiveTab('people')}
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'people' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        People
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'attendance' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        Attendance
                    </button>
                    {isStaff && (
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'requests' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                            Requests
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[50vh]">
                {activeTab === 'stream' && <StreamTab classData={classData} user={user} onNavigate={handleNavigate} />}
                {activeTab === 'classwork' && <ClassworkTab classData={classData} user={user} filter={initialFilter} />}
                {activeTab === 'people' && <PeopleTab classData={classData} user={user} />}
                {activeTab === 'attendance' && <AttendanceTab classData={classData} user={user} />}
                {activeTab === 'requests' && isStaff && <StaffLeaveDashboard classId={classData.id} userId={user.id} />}
            </div>
        </div>
    );
};

export default ClassDetail;
