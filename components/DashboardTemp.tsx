import React from 'react';
import { User, Role, RequestStatus, Assignment, Class } from '../types';
import { MOCK_NODUE_REQUESTS, MOCK_ONDUTY_REQUESTS, MOCK_ASSIGNMENTS } from '../constants';
import { Card } from './UI';

interface DashboardProps {
  user: User;
  setActiveView: (view: string) => void;
  selectedClassId: string | null;
  classes: Class[];
}

export const Dashboard: React.FC<DashboardProps> = ({ user, setActiveView, selectedClassId, classes }) => {
  const selectedClass = classes.find(c => c.id === selectedClassId);

  const getStat = (title: string, value: string | number, color: string, index: number) => (
    <Card className={`bg-gradient-to-br ${color} hover:scale-105 transition-transform duration-300 shadow-lg text-white animate-slideInUp !bg-opacity-100 rounded-xl p-6`} style={{ animationDelay: `${index * 100}ms` }}>
      <p className="text-sm font-medium tracking-wide uppercase opacity-80">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </Card>
  );

  const renderContent = () => {
    switch (user.role) {
      case Role.STAFF: {
        const pendingNoDueCount = MOCK_NODUE_REQUESTS.reduce((count, request) => {
          return request.status === 'Pending' ? count + 1 : count;
        }, 0);

        const pendingOnDutyCount = MOCK_ONDUTY_REQUESTS.reduce((count, request) => {
          return request.status === 'Pending' ? count + 1 : count;
        }, 0);

        const assignmentsToGradeCount = MOCK_ASSIGNMENTS.reduce((count, assignment) => {
          return (assignment.status === 'Submitted' && assignment.classId === selectedClassId) ? count + 1 : count;
        }, 0);

        return (
          <div className="p-6 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Staff Overview</h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
                {selectedClass ? `Showing data for ${selectedClass.name}` : 'No class selected'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {getStat('Pending No-Due', pendingNoDueCount, 'from-primary-500 to-primary-600', 0)}
                {getStat('Pending On-Duty', pendingOnDutyCount, 'from-yellow-500 to-yellow-600', 1)}
                {getStat('Assignments to Grade', assignmentsToGradeCount, 'from-green-500 to-green-600', 2)}
              </div>
              <div className="mt-12">
                <Card className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4">Quick Access</h3>
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => setActiveView('assignments')}
                      className="dashboard-button"
                    >
                      View All Assignments
                    </button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return renderContent();
};