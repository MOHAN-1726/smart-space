import React from 'react';
import { User, Class, Role } from '../../types';
import TeacherAttendance from './TeacherAttendance';
import StudentAttendance from './StudentAttendance';

interface AttendanceTabProps {
    classData: Class;
    user: User;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({ classData, user }) => {
    // Current user's role in this specific class context
    // Ideally classData should have 'role' property populated for the current user, or we check membership.
    // In our app, we usually pass the user object, but for simplicity assuming global role vs class specific role.
    // The ClassDetail component fetches class with userId query param, so classData.role should be set.

    // Fallback if classData.role isn't set (e.g. if we fetched raw class data)
    const isTeacher = classData.role === Role.STAFF || user.id === classData.ownerId;

    if (isTeacher) {
        return <TeacherAttendance classData={classData} />;
    } else {
        return <StudentAttendance classData={classData} userId={user.id} />;
    }
};

export default AttendanceTab;
