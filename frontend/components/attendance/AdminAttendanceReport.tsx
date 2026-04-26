import React, { useState, useEffect } from 'react';
import { api } from '../../service';

interface ClassOption {
    id: string;
    name: string;
    section?: string;
    subject?: string;
}

interface ReportRow {
    id: string;
    date: string;
    studentName: string;
    studentEmail: string;
    className: string;
    sessionName: string;
    status: string;
    remarks?: string;
}

interface ReportSummary {
    total: number;
    present: number;
    absent: number;
    presentPct: string;
    absentPct: string;
}

const statusColors: Record<string, string> = {
    PRESENT: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    ABSENT: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
    ON_DUTY: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
    LEAVE: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200',
};

const AdminAttendanceReport: React.FC = () => {
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [filters, setFilters] = useState({
        classId: '',
        studentId: '',
        startDate: '',
        endDate: ''
    });
    const [report, setReport] = useState<ReportRow[]>([]);
    const [summary, setSummary] = useState<ReportSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    // Load class list for dropdown
    useEffect(() => {
        api.getAdminAttendanceClasses()
            .then((data: ClassOption[]) => setClasses(data))
            .catch(() => {});
    }, []);

    const handleFetchReport = async () => {
        setLoading(true);
        setHasGenerated(true);
        try {
            const data = await api.getAdminAttendanceReport(filters);
            setReport(data.report || []);
            setSummary(data.summary || null);
        } catch (err) {
            console.error('Failed to fetch report:', err);
            setReport([]);
            setSummary(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadCSV = async () => {
        setDownloading(true);
        try {
            await api.downloadAttendanceReportCSV(filters);
        } catch (err) {
            console.error('CSV download failed:', err);
        } finally {
            setDownloading(false);
        }
    };

    const presentPct = summary ? parseFloat(summary.presentPct) : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                        <span className="text-indigo-600">📊</span>
                        Attendance Reports
                    </h2>
                    <p className="text-gray-400 text-sm font-medium mt-0.5">Generate, filter, and export detailed attendance data</p>
                </div>
                {report.length > 0 && (
                    <button
                        onClick={handleDownloadCSV}
                        disabled={downloading}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95 disabled:opacity-50"
                    >
                        {downloading ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        )}
                        {downloading ? 'Downloading...' : 'Download CSV'}
                    </button>
                )}
            </div>

            {/* Filter Panel */}
            <div className="bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-sm">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Filter Options</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Class dropdown */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Class</label>
                        <select
                            value={filters.classId}
                            onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
                            className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 focus:outline-none transition-all text-sm font-bold text-gray-700"
                        >
                            <option value="">All Classes</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name}{c.section ? ` – ${c.section}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Student ID */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Student ID</label>
                        <input
                            type="text"
                            value={filters.studentId}
                            onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}
                            placeholder="All Students"
                            className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 focus:outline-none transition-all text-sm font-bold"
                        />
                    </div>

                    {/* Date range */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">From Date</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 focus:outline-none transition-all text-sm font-bold"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">To Date</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 focus:outline-none transition-all text-sm font-bold"
                        />
                    </div>
                </div>

                <div className="mt-5 flex justify-end">
                    <button
                        onClick={handleFetchReport}
                        disabled={loading}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Generating...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Generate Report
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Summary Stats Bar */}
            {summary && report.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {[
                        { label: 'Total Records', value: summary.total, icon: '📋', clr: 'text-gray-800', bg: 'bg-gray-50 border-gray-100' },
                        { label: 'Present', value: summary.present, icon: '✅', clr: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
                        { label: 'Absent', value: summary.absent, icon: '❌', clr: 'text-rose-700', bg: 'bg-rose-50 border-rose-100' },
                        { label: 'Present %', value: `${summary.presentPct}%`, icon: '📈', clr: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
                        { label: 'Absent %', value: `${summary.absentPct}%`, icon: '📉', clr: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
                    ].map(({ label, value, icon, clr, bg }) => (
                        <div key={label} className={`rounded-2xl border-2 p-4 ${bg} text-center`}>
                            <div className="text-xl mb-1">{icon}</div>
                            <div className={`text-xl font-black ${clr}`}>{value}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Attendance Health Bar */}
            {summary && summary.total > 0 && (
                <div className="bg-white rounded-2xl border-2 border-gray-100 p-4 flex items-center gap-4 shadow-sm">
                    <span className="text-xs font-black text-gray-500 w-20 flex-shrink-0">Health</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${presentPct >= 85 ? 'bg-emerald-500' : presentPct >= 75 ? 'bg-amber-400' : 'bg-rose-500'}`}
                            style={{ width: `${presentPct}%` }}
                        />
                    </div>
                    <span className={`text-sm font-black w-14 text-right flex-shrink-0 ${presentPct >= 85 ? 'text-emerald-600' : presentPct >= 75 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {summary.presentPct}%
                    </span>
                </div>
            )}

            {/* Results Table */}
            {loading ? (
                <div className="space-y-2 animate-pulse">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-14 bg-gray-100 rounded-xl" style={{ opacity: 1 - i * 0.15 }} />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border-2 border-gray-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Date', 'Student', 'Class', 'Session', 'Status', 'Remarks'].map(h => (
                                        <th key={h} className="px-5 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {report.map((row, i) => (
                                    <tr key={row.id || i} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-5 py-4 text-sm font-bold text-gray-500 whitespace-nowrap">
                                            {new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-sm font-black text-gray-800">{row.studentName}</div>
                                            <div className="text-[10px] font-bold text-gray-400">{row.studentEmail}</div>
                                        </td>
                                        <td className="px-5 py-4 text-sm font-bold text-gray-600">{row.className}</td>
                                        <td className="px-5 py-4 text-xs font-medium text-gray-500 max-w-[140px] truncate">{row.sessionName}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[row.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-xs font-medium text-gray-400 italic max-w-[120px] truncate">
                                            {row.remarks || '—'}
                                        </td>
                                    </tr>
                                ))}
                                {report.length === 0 && hasGenerated && !loading && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="text-4xl mb-3">🔍</div>
                                            <div className="text-gray-500 font-bold text-sm">No records found</div>
                                            <div className="text-gray-400 text-xs mt-1">Try adjusting your filters</div>
                                        </td>
                                    </tr>
                                )}
                                {!hasGenerated && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="text-4xl mb-3">📊</div>
                                            <div className="text-gray-500 font-bold text-sm">No report generated yet</div>
                                            <div className="text-gray-400 text-xs mt-1">Select filters above and click Generate Report</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {report.length > 0 && (
                        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400">{report.length} record{report.length !== 1 ? 's' : ''} shown</span>
                            <button
                                onClick={handleDownloadCSV}
                                disabled={downloading}
                                className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export CSV
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminAttendanceReport;
