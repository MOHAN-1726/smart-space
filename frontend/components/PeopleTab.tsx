import React, { useState, useEffect } from 'react';
import { User, Class } from '../types';
import { api } from '../service';

interface PeopleTabProps {
    classData: Class;
    user: User;
}

const PeopleTab: React.FC<PeopleTabProps> = ({ classData }) => {
    const [teachers, setTeachers] = useState<User[]>([]);
    const [students, setStudents] = useState<User[]>([]);

    useEffect(() => {
        fetchPeople();
    }, [classData.id]);

    const fetchPeople = async () => {
        try {
            const members: any[] = await api.get(`/classes/${classData.id}/people`);
            setTeachers(members.filter(m => m.role === 'STAFF'));
            setStudents(members.filter(m => m.role === 'STUDENT'));
        } catch (err) {
            import('../utils/logger').then(m => m.logger.error('Failed to fetch people:', err)).catch(() => {});
        }
    };

    const PersonRow = ({ person }: { person: User }) => (
        <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded">
            {person.photoUrl ? (
                <img src={person.photoUrl} alt={person.name} className="w-9 h-9 rounded-full" />
            ) : (
                <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-medium">
                    {person.name.charAt(0)}
                </div>
            )}
            <div className="font-medium text-sm text-gray-800">{person.name}</div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            {/* Teachers */}
            <div>
                <div className="flex justify-between items-center border-b border-blue-600 pb-2 mb-4">
                    <h2 className="text-3xl text-blue-600 font-normal">Teachers</h2>
                    <div className="text-blue-600 font-medium text-sm">{teachers.length} teachers</div>
                </div>
                <div className="space-y-1">
                    {teachers.map(t => <PersonRow key={t.id} person={t} />)}
                </div>
            </div>

            {/* Students */}
            <div>
                <div className="flex justify-between items-center border-b border-blue-600 pb-2 mb-4">
                    <h2 className="text-3xl text-blue-600 font-normal">Students</h2>
                    <div className="text-blue-600 font-medium text-sm">{students.length} students</div>
                </div>
                <div className="space-y-1">
                    {students.map(s => <PersonRow key={s.id} person={s} />)}
                </div>
            </div>
        </div>
    );
};

export default PeopleTab;
