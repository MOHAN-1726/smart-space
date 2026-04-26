import React, { useState, useEffect } from 'react';
import { api } from '../../service';

interface TrendEntry {
    month: string;
    percentage: number;
    present: number;
    absent: number;
    total: number;
}

interface ClassSummaryEntry {
    classId: string;
    className: string;
    percentage: number;
    present: number;
    total: number;
}

interface AnalyticsData {
    percentage: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    totalDays: number;
    streak: number;
    trend: TrendEntry[];
    classSummary: ClassSummaryEntry[];
}

interface AttendanceAnalyticsProps {
    studentId: string;
}

const getRiskLevel = (pct: number) => {
    if (pct >= 85) return { label: 'Excellent', color: 'emerald', bg: 'from-emerald-500 to-teal-600', text: 'text-emerald-600', light: 'bg-emerald-50 border-emerald-100' };
    if (pct >= 75) return { label: 'Good', color: 'amber', bg: 'from-amber-400 to-orange-500', text: 'text-amber-600', light: 'bg-amber-50 border-amber-100' };
    return { label: 'At Risk', color: 'rose', bg: 'from-rose-500 to-red-600', text: 'text-rose-600', light: 'bg-rose-50 border-rose-100' };
};

const formatMonth = (m: string) => {
    const [y, mo] = m.split('-');
    return new Date(+y, +mo - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
};

// Circular SVG gauge
const GaugeChart: React.FC<{ pct: number; size?: number }> = ({ pct, size = 140 }) => {
    const risk = getRiskLevel(pct);
    const r = 54;
    const circ = 2 * Math.PI * r;
    const offset = circ - (Math.min(pct, 100) / 100) * circ;
    return (
        <svg width={size} height={size} viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="12" />
            <circle
                cx="60" cy="60" r={r}
                fill="none"
                strokeWidth="12"
                stroke={pct >= 85 ? '#10b981' : pct >= 75 ? '#f59e0b' : '#f43f5e'}
                strokeLinecap="round"
                strokeDasharray={`${circ}`}
                strokeDashoffset={offset}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}
            />
            <text x="60" y="55" textAnchor="middle" fontSize="20" fontWeight="800" fill={pct >= 85 ? '#059669' : pct >= 75 ? '#d97706' : '#e11d48'}>
                {pct}%
            </text>
            <text x="60" y="72" textAnchor="middle" fontSize="9" fontWeight="700" fill="#94a3b8" letterSpacing="1">
                {risk.label.toUpperCase()}
            </text>
        </svg>
    );
};

// Inline SVG bar chart
const TrendBarChart: React.FC<{ trend: TrendEntry[] }> = ({ trend }) => {
    if (!trend || trend.length === 0) {
        return (
            <div className="flex items-center justify-center h-28 text-gray-300 text-sm font-medium">
                No trend data yet
            </div>
        );
    }
    const max = 100;
    const barW = Math.min(40, Math.floor(280 / trend.length) - 6);
    return (
        <div className="flex items-end gap-2 pt-2 pb-1 overflow-x-auto">
            {trend.map((t) => {
                const risk = getRiskLevel(t.percentage);
                const h = Math.max(4, (t.percentage / max) * 80);
                return (
                    <div key={t.month} className="flex flex-col items-center gap-1 group flex-shrink-0" style={{ width: barW + 8 }}>
                        <span className="text-[9px] font-black text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow rounded px-1">
                            {t.percentage}%
                        </span>
                        <div
                            className={`rounded-t-lg w-full transition-all duration-700 bg-gradient-to-t ${risk.bg}`}
                            style={{ height: h, width: barW }}
                        />
                        <span className="text-[8px] font-bold text-gray-400 whitespace-nowrap">{formatMonth(t.month)}</span>
                    </div>
                );
            })}
            {/* 75% line reference */}
            <div className="absolute left-0 right-0 border-t-2 border-dashed border-amber-300 pointer-events-none" style={{ bottom: '28px' }} />
        </div>
    );
};

const AttendanceAnalytics: React.FC<AttendanceAnalyticsProps> = ({ studentId }) => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        api.getAttendanceAnalyticsDetailed(studentId)
            .then(setData)
            .catch(() => setError('Failed to load analytics'))
            .finally(() => setLoading(false));
    }, [studentId]);

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-36 bg-gradient-to-r from-gray-100 to-gray-50 rounded-3xl" />
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
                </div>
                <div className="h-40 bg-gray-100 rounded-2xl" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium text-center">
                {error || 'No attendance data available yet.'}
            </div>
        );
    }

    const risk = getRiskLevel(data.percentage);

    return (
        <div className="space-y-5">
            {/* --- Top Row: Gauge + Key Stats --- */}
            <div className={`rounded-3xl border-2 p-6 ${risk.light} flex flex-col sm:flex-row items-center gap-6`}>
                {/* Gauge */}
                <div className="flex-shrink-0">
                    <GaugeChart pct={data.percentage} />
                </div>

                {/* Stats Grid */}
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                    {[
                        { label: 'Present', value: data.presentDays, icon: '✅', clr: 'text-emerald-700' },
                        { label: 'Absent', value: data.absentDays, icon: '❌', clr: 'text-rose-600' },
                        { label: 'Leave', value: data.leaveDays ?? 0, icon: '📋', clr: 'text-sky-600' },
                        { label: 'Total Days', value: data.totalDays, icon: '📅', clr: 'text-gray-700' },
                    ].map(({ label, value, icon, clr }) => (
                        <div key={label} className="bg-white/80 rounded-2xl p-4 text-center shadow-sm border border-white">
                            <div className="text-lg mb-0.5">{icon}</div>
                            <div className={`text-2xl font-black ${clr}`}>{value}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- Streak Warning --- */}
            {data.streak >= 2 && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border-2 border-rose-100">
                    <div className="text-2xl flex-shrink-0">🚨</div>
                    <div>
                        <div className="text-sm font-black text-rose-700">
                            {data.streak} Consecutive Day{data.streak !== 1 ? 's' : ''} Absent
                        </div>
                        <div className="text-xs font-medium text-rose-500 mt-0.5">
                            {data.streak >= 3
                                ? 'Alert has been sent to your parent/guardian.'
                                : 'One more absence will trigger an automatic parent alert.'}
                        </div>
                    </div>
                    <div className="ml-auto flex-shrink-0 bg-rose-200 text-rose-800 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                        Streak
                    </div>
                </div>
            )}

            {/* --- Monthly Trend Chart --- */}
            {data.trend && data.trend.length > 0 && (
                <div className="bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h4 className="text-sm font-black text-gray-800">Monthly Trend</h4>
                            <p className="text-[10px] font-medium text-gray-400 mt-0.5">Attendance % per month</p>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold">
                            <span className="flex items-center gap-1 text-amber-600">
                                <span className="inline-block w-6 border-t-2 border-dashed border-amber-400" />
                                75% min
                            </span>
                        </div>
                    </div>
                    <div className="relative">
                        {/* 75% dashed guideline */}
                        <div className="absolute left-0 right-0 border-t-2 border-dashed border-amber-200" style={{ bottom: 28, zIndex: 0 }} />
                        <TrendBarChart trend={data.trend} />
                    </div>
                </div>
            )}

            {/* --- Class-Level Breakdown --- */}
            {data.classSummary && data.classSummary.length > 0 && (
                <div className="bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-sm">
                    <h4 className="text-sm font-black text-gray-800 mb-4">Per-Class Breakdown</h4>
                    <div className="space-y-3">
                        {data.classSummary.map((cls) => {
                            const clsRisk = getRiskLevel(cls.percentage);
                            return (
                                <div key={cls.classId} className="flex items-center gap-3">
                                    <div className="text-xs font-bold text-gray-700 w-32 truncate flex-shrink-0">
                                        {cls.className}
                                    </div>
                                    <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${clsRisk.bg} transition-all duration-1000`}
                                            style={{ width: `${Math.min(cls.percentage, 100)}%` }}
                                        />
                                    </div>
                                    <span className={`text-xs font-black w-12 text-right flex-shrink-0 ${clsRisk.text}`}>
                                        {cls.percentage}%
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 w-20 text-right flex-shrink-0">
                                        {cls.present}/{cls.total} days
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* --- Minimum Requirement Banner --- */}
            {data.percentage < 75 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white flex items-center gap-3 shadow-lg shadow-rose-100">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <div className="font-black text-sm">Below Minimum Attendance</div>
                        <div className="text-rose-100 text-xs font-medium mt-0.5">
                            You need {data.totalDays > 0
                                ? Math.ceil(0.75 * (data.totalDays + 10) - data.presentDays)
                                : 0} more present days to reach 75% (assuming 10 more sessions).
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceAnalytics;
