import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { motion } from 'framer-motion';

interface AttendanceData {
  percentage: number;
  present: number;
  absent: number;
  total: number;
  trend: { month: string; percentage: number }[];
}

export const AttendanceSummaryCard: React.FC<{ data: AttendanceData }> = ({ data }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Attendance</h3>
          <p className="text-3xl font-bold text-slate-900 mt-1">{data.percentage.toFixed(1)}%</p>
        </div>
        <div className={`p-2 rounded-lg ${data.percentage >= 75 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="w-full bg-slate-100 rounded-full h-2">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${data.percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-2 rounded-full ${data.percentage >= 75 ? 'bg-indigo-600' : 'bg-red-500'}`}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-slate-400">Present</span>
            <span className="font-semibold text-slate-700">{data.present} days</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-slate-400">Absent</span>
            <span className="font-semibold text-slate-700">{data.absent} days</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const AssignmentsDueWidget: React.FC<{ assignments: any[] }> = ({ assignments }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-slate-900 font-bold">Assignments Due Today</h3>
        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
          {assignments.length} Total
        </span>
      </div>
      
      <div className="space-y-3">
        {assignments.length === 0 ? (
          <p className="text-slate-400 text-sm italic py-4">No assignments due today! 🎉</p>
        ) : (
          assignments.map((assignment, idx) => (
            <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-slate-200 shadow-sm text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{assignment.title}</p>
                <p className="text-xs text-slate-500">{assignment.className}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-amber-600">Today</p>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export const UpcomingExamsWidget: React.FC<{ exams: any[] }> = ({ exams }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-slate-900 p-6 rounded-2xl shadow-xl shadow-slate-200 h-full text-white"
    >
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Upcoming Exams
      </h3>
      
      <div className="space-y-4">
        {exams.length === 0 ? (
          <p className="text-slate-400 text-sm italic">No upcoming exams scheduled.</p>
        ) : (
          exams.map((exam, idx) => {
            const date = new Date(exam.date);
            const diff = Math.ceil((date.getTime() - Date.now()) / (1000 * 3600 * 24));
            
            return (
              <div key={idx} className="flex gap-4">
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/10 border border-white/10 w-14 h-14">
                  <span className="text-xs font-bold uppercase text-slate-400">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                  <span className="text-xl font-bold leading-none">{date.getDate()}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{exam.title}</p>
                  <p className="text-xs text-slate-400">In {diff} days</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export const PerformanceChart: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
    >
      <h3 className="text-slate-900 font-bold mb-6">Performance Trends</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8' }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#4f46e5" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export const AnnouncementsPanel: React.FC<{ announcements: any[] }> = ({ announcements }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-slate-900 font-bold">Latest Announcements</h3>
        <button className="text-indigo-600 text-sm font-semibold hover:underline">View all</button>
      </div>
      <div className="divide-y divide-slate-50">
        {announcements.map((ann, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ backgroundColor: '#f8fafc' }}
            className="p-4 flex gap-4 transition-colors"
          >
            <div className={`w-2 rounded-full shrink-0 ${idx === 0 ? 'bg-indigo-500' : 'bg-slate-200'}`} />
            <div>
              <p className="text-sm font-semibold text-slate-800 line-clamp-1">{ann.content}</p>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                <span className="font-medium text-slate-500">{ann.authorName}</span>
                <span>•</span>
                <span>{ann.className}</span>
                <span>•</span>
                <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
