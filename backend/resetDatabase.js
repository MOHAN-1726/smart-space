import db from './database.js';

console.log("Clearing database...");

try {
    const tables = [
        "messages",
        "Attendance",
        "Assignments",
        "assignment_submissions",
        "LeaveRequests",
        "leave_requests",
        "parent_student_relationships",
        "class_members",
        "events",
        "event_participants",
        "feedback",
        "classes",
        "users",
        "organizations",
        "Notifications"
    ];

    for (const table of tables) {
        try {
            db.prepare(`DELETE FROM ${table}`).run();
        } catch (e) {
            // Ignore missing tables
        }
    }

    console.log("Database cleared successfully!");
} catch (error) {
    console.error("Error clearing database:", error);
}
