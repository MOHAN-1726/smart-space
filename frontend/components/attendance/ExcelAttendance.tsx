import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../service';
import { Class } from '../../types';

interface ExcelAttendanceProps {
    classData: Class;
}

interface SheetRow {
    id: string; // Student ID
    name: string;
    email: string;
    photoUrl?: string;
    status: 'P' | 'A' | string;
}

const ExcelAttendance: React.FC<ExcelAttendanceProps> = ({ classData }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [rows, setRows] = useState<SheetRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        fetchSheet();
    }, [date, classData.id]);

    const fetchSheet = async () => {
        setLoading(true);
        try {
            const data = await api.get(`/classes/${classData.id}/sheet?date=${date}`);
            setRows(data.sheet);
        } catch (err) {
            import('../../utils/logger').then(m => m.logger.error('Failed to submit attendance:', err)).catch(() => {});
        } finally {
            setLoading(false);
        }
    };

    const handleCellChange = (index: number, value: string) => {
        const val = value.toUpperCase();
        if (val === 'P' || val === 'A' || val === '') {
            const newRows = [...rows];
            newRows[index].status = val === '' ? 'A' : val;
            setRows(newRows);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        const key = e.key.toUpperCase();

        if (key === 'ARROWDOWN' || key === 'ENTER') {
            e.preventDefault();
            if (index < rows.length - 1) {
                inputRefs.current[index + 1]?.focus();
            }
        } else if (key === 'ARROWUP') {
            e.preventDefault();
            if (index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
        } else if (key === 'P') {
            e.preventDefault();
            handleCellChange(index, 'P');
            // Optional: Auto-move down after selection? Excel usually doesn't unless Enter used.
            // But for speed, let's keep focus here or user hits Enter.
        } else if (key === 'A') {
            e.preventDefault();
            handleCellChange(index, 'A');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const records: Record<string, string> = {};
            rows.forEach(r => records[r.id] = r.status);

            await api.post(`/classes/${classData.id}/sheet`, {
                date,
                records
            });
            alert('Attendance saved successfully!');
        } catch (err) {
            alert('Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading sheet...</div>;

    const presentCount = rows.filter(r => r.status === 'P').length;
    const absenteeCount = rows.filter(r => r.status === 'A').length;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-sm rounded-lg border border-gray-200 mt-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-green-600">📊</span>
                        Daily Attendance Sheet
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Use keyboard (Arrow keys / Enter) to navigate. Type 'P' or 'A'.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium shadow-sm"
                    >
                        {saving ? 'Saving...' : 'Save Sheet'}
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="flex gap-6 mb-6 text-sm">
                <div className="px-4 py-2 bg-green-50 text-green-700 rounded-md font-medium border border-green-100">
                    Present: {presentCount}
                </div>
                <div className="px-4 py-2 bg-red-50 text-red-700 rounded-md font-medium border border-red-100">
                    Absent: {absenteeCount}
                </div>
                <div className="px-4 py-2 bg-gray-50 text-gray-700 rounded-md font-medium border border-gray-200">
                    Total: {rows.length}
                </div>
            </div>

            <div className="overflow-x-auto border border-gray-300 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-300 w-16">
                                #
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-300">
                                Student Name
                            </th>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-32 bg-yellow-50 text-center">
                                {new Date(date).toLocaleDateString()}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {rows.map((row, index) => (
                            <tr key={row.id} className="hover:bg-gray-50">
                                <td className="py-2 px-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200 font-mono">
                                    {String(index + 1).padStart(2, '0')}
                                </td>
                                <td className="py-2 px-4 whitespace-nowrap border-r border-gray-200">
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-600 mr-3">
                                            {row.name[0]}
                                        </div>
                                        <div className="text-sm font-medium text-gray-900">{row.name}</div>
                                    </div>
                                </td>
                                <td className="p-0 h-12 relative group att-cell">
                                    <input
                                        ref={el => { inputRefs.current[index] = el; }}
                                        type="text"
                                        readOnly
                                        value={row.status}
                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                        onFocus={(e) => e.target.select()}
                                        className={`w-full h-full text-center font-bold text-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors
                                            ${row.status === 'P' ? 'bg-green-100 text-green-700' :
                                                row.status === 'A' ? 'bg-red-50 text-red-700' : 'bg-white'}`}
                                    />

                                    {/* Hover Box for Quick Select */}
                                    <div className="hidden group-hover:flex absolute top-[100%] left-1/2 -translate-x-1/2 bg-white border border-gray-300 shadow-lg z-20 rounded-md overflow-hidden">
                                        <button
                                            onClick={() => handleCellChange(index, 'P')}
                                            className="px-4 py-2 hover:bg-green-50 text-green-700 font-bold border-r border-gray-200"
                                        >
                                            P
                                        </button>
                                        <button
                                            onClick={() => handleCellChange(index, 'A')}
                                            className="px-4 py-2 hover:bg-red-50 text-red-700 font-bold"
                                        >
                                            A
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {rows.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    No students found in this class.
                </div>
            )}
        </div>
    );
};

export default ExcelAttendance;
