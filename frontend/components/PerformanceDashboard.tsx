import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie
} from 'recharts';
import { api } from '../service';
import { PerformanceRecord } from '../types';

interface PerformanceDashboardProps {
  studentId: string;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ studentId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/analytics/performance/detailed/${studentId}`);
        setData(res);
      } catch (err) {
        console.error('Failed to fetch performance data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, [studentId]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!data) return <div className="text-center py-20 text-slate-400">No performance data available.</div>;

  const COLORS = ['#4f46e5', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100"
        >
          <p className="text-indigo-100 text-sm font-medium">Global Rank</p>
          <h3 className="text-4xl font-black mt-2">#{data.rank}</h3>
          <p className="text-indigo-200 text-xs mt-4">Top {data.percentile}% of the class</p>
        </motion.div>

        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Average Score</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{data.averageScore}%</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Assignments</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{data.assignmentCompletion}%</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Tests Taken</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{data.totalTests}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-slate-900 font-bold mb-8">Subject-wise Mastery</h3>
          <div className="space-y-6">
            {data.subjectStats.map((subject: any, idx: number) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-700">{subject.name}</span>
                  <span className="text-slate-500">{subject.score}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${subject.score}%` }}
                    transition={{ duration: 1, delay: idx * 0.1 }}
                    className="h-full bg-indigo-600 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-slate-900 font-bold mb-8">Performance Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.subjectStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {data.subjectStats.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-900 p-8 rounded-3xl text-white overflow-hidden relative">
        <div className="relative z-10">
          <h3 className="font-bold mb-2">Academic Consistency</h3>
          <p className="text-slate-400 text-sm mb-8">Quarterly progress tracking</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.quarterlyProgress}>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="score" fill="#4f46e5" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 blur-[120px] opacity-20 -mr-32 -mt-32"></div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
