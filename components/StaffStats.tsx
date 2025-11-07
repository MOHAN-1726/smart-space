import React from 'react';
import { Card } from './UI';

type StaffStatsProps = {
  requests: Array<{ status: string }>;
  onDutyRequests: Array<{ status: string }>;
  assignments: Array<{ status: string; classId: string | null }>;
  selectedClassId: string | null;
  title: string;
};

export function StaffStats({ requests, onDutyRequests, assignments, selectedClassId, title }: StaffStatsProps) {
  const getStat = (title: string, value: string | number, color: string, index: number) => {
    return (
      <Card className={`bg-gradient-to-br ${color} hover:scale-105 transition-transform duration-300 shadow-lg text-white animate-slideInUp !bg-opacity-100 rounded-xl p-6`} style={{ animationDelay: `${index * 100}ms` }}>
        <p className="text-sm font-medium tracking-wide uppercase opacity-80">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
      </Card>
    );
  };

  let pendingNoDue = 0;
  let pendingOnDuty = 0;
  let assignmentsToGrade = 0;

  for (const request of requests) {
    if (request.status === 'Pending') {
      pendingNoDue += 1;
    }
  }

  for (const request of onDutyRequests) {
    if (request.status === 'Pending') {
      pendingOnDuty += 1;
    }
  }

  for (const assignment of assignments) {
    if (assignment.status === 'Submitted' && assignment.classId === selectedClassId) {
      assignmentsToGrade += 1;
    }
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Staff Overview</h2>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">{title}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {getStat('Pending No-Due', pendingNoDue, 'from-primary-500 to-primary-600', 0)}
          {getStat('Pending On-Duty', pendingOnDuty, 'from-yellow-500 to-yellow-600', 1)}
          {getStat('Assignments to Grade', assignmentsToGrade, 'from-green-500 to-green-600', 2)}
        </div>
      </div>
    </div>
  );
}