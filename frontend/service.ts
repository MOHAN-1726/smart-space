import { logger } from './utils/logger';
const getBaseUrl = () => {
    let url = import.meta.env.VITE_API_BASE_URL || '/api';
    // If it's an absolute URL and doesn't end with /api, append it
    if (url.startsWith('http') && !url.endsWith('/api')) {
        url = url.endsWith('/') ? `${url}api` : `${url}/api`;
    }
    return url;
};
const API_BASE_URL = getBaseUrl();

// Guard against concurrent refresh attempts
let isRefreshing = false;
let refreshSubscribers: Array<(success: boolean) => void> = [];

const onRefreshComplete = (success: boolean) => {
    refreshSubscribers.forEach(cb => cb(success));
    refreshSubscribers = [];
};

const waitForRefresh = (): Promise<boolean> => {
    return new Promise(resolve => {
        refreshSubscribers.push(resolve);
    });
};

const getHeaders = (isFormData: boolean = false) => {
    const headers: Record<string, string> = {};
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

const fetchWithAuth = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    const headers = {
        ...getHeaders(options.body instanceof FormData),
        ...options.headers
    };

    logger.debug('[API] Request started:', {
        endpoint,
        method: options.method || 'GET'
    });

    const maxRetries = 2;
    let attempt = 0;
    let response: Response | null = null;

    while (attempt <= maxRetries) {
        try {
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers,
                credentials: 'include' // Mandatory for cookie-based auth
            });
            break;
        } catch (err: any) {
            attempt += 1;
            if (attempt > maxRetries || !(err instanceof TypeError) || !err.message.includes('NetworkError')) {
                logger.error('[API] Fetch failed (no more retries):', err);
                throw err;
            }
            logger.warn('[API] Network change detected, retrying fetch', { endpoint, attempt, err });
            await new Promise(resolve => setTimeout(resolve, 250 * attempt));
        }
    }

    if (!response) {
        throw new Error('Unable to perform request');
    }

    logger.debug('[API] Response received:', {
        endpoint,
        status: response.status,
        statusText: response.statusText
    });

    if (response.status === 401 && endpoint !== '/login' && endpoint !== '/register' && endpoint !== '/refresh') {
        logger.info('[API] Got 401, attempting token refresh...');

        let refreshSuccess = false;

        if (isRefreshing) {
            // Another request is already refreshing — wait for it
            logger.debug('[API] Refresh already in progress, waiting...');
            refreshSuccess = await waitForRefresh();
        } else {
            isRefreshing = true;
            try {
                const refreshRes = await fetch(`${API_BASE_URL}/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
                refreshSuccess = refreshRes.ok;
            } catch (e) {
                refreshSuccess = false;
            } finally {
                isRefreshing = false;
                onRefreshComplete(refreshSuccess);
            }
        }

        if (refreshSuccess) {
            logger.info('[API] Token refreshed, retrying request...');
            // Retry original request (only once — do not re-enter refresh logic)
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    ...getHeaders(options.body instanceof FormData),
                    ...options.headers
                },
                credentials: 'include'
            });
        } else {
            logger.warn('[API] Token refresh failed, logging out...');
            localStorage.removeItem('currentUser');
            const ev = new CustomEvent('auth-expired');
            window.dispatchEvent(ev);
            return Promise.reject(new Error('Session expired, logging out...'));
        }
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[API ERROR DETAILS]', errorData);
        logger.error('[API] Error response:', errorData);
        const msg = errorData.details || errorData.error || response.statusText;
        const err = new Error(`[${response.status}] ${msg}`);
        (err as any).status = response.status;
        throw err;
    }

    const responseData = await response.json();
    logger.debug('[API] Success:', { endpoint, status: response.status, data: responseData });
    return responseData;
};

export const api = {
    // File Upload
    uploadFile: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetchWithAuth('/upload', { method: 'POST', body: formData });
    },

    // Auth
    getStudentAttendanceAnalytics: (studentId: string) => api.get(`/attendance/analytics/${studentId}`),
    getAttendanceAnalyticsDetailed: (studentId: string) => api.get(`/attendance/analytics/${studentId}`),
    getAdminAttendanceClasses: () => api.get('/admin/attendance/classes'),
    getAdminAttendanceReport: (filters: any) => {
        const query = new URLSearchParams(
            Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined))
        ).toString();
        return api.get(`/admin/attendance/report?${query}`);
    },
    downloadAttendanceReportCSV: async (filters: any) => {
        const params = new URLSearchParams(
            Object.fromEntries(Object.entries({ ...filters, format: 'csv' }).filter(([, v]) => v !== '' && v !== null && v !== undefined))
        ).toString();
        const res = await fetch(`${API_BASE_URL}/admin/attendance/report?${params}`, {
            credentials: 'include'
        });
        if (!res.ok) throw new Error('CSV download failed');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    },
    logout: async () => {
        return fetch(`${API_BASE_URL}/logout`, { method: 'POST', headers: getHeaders(), credentials: 'include' });
    },

    get: async (endpoint: string) => {
        return fetchWithAuth(endpoint, { method: 'GET' });
    },

    post: async (endpoint: string, data: any) => {
        return fetchWithAuth(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    put: async (endpoint: string, data: any) => {
        return fetchWithAuth(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (endpoint: string) => {
        return fetchWithAuth(endpoint, { method: 'DELETE' });
    },

    deleteAnnouncement: async (id: string) => {
        return api.delete(`/announcements/${id}`);
    },

    // Assignment Methods
    submitAssignment: async (id: string, file: { name: string, url: string, size: number }) => {
        return api.post(`/assignments/${id}/submit`, { file });
    },
    gradeAssignment: async (id: string, grade: string, gradedFileUrl?: string) => {
        return api.put(`/assignments/${id}/grade`, { grade, gradedFileUrl });
    },

    // Request Methods
    // Leave Request Methods
    createLeaveRequest: async (data: any) => {
        return api.post('/leave-requests', data);
    },
    updateLeaveRequestStatus: async (id: string, status: string, staffRemarks?: string, staffId?: string) => {
        return api.put(`/leave-requests/${id}/status`, { status, staffRemarks, staffId });
    },
    getStudentLeaveRequests: async (studentId: string) => {
        return api.get(`/requests/student/${studentId}`);
    },
    getClassLeaveRequests: async (classId: string) => {
        return api.get(`/classes/${classId}/leave-requests`);
    },
    getRequestSummary: async (studentId: string) => {
        return api.get(`/requests/summary/${studentId}`);
    },
    // Assignments
    getAssignmentSummary: async (classId: string, studentId?: string) => {
        let url = `/classes/${classId}/assignments/summary`;
        if (studentId) url += `?studentId=${studentId}`;
        return api.get(url);
    },
    getClassWork: async (classId: string) => {
        return api.get(`/classes/${classId}/work`);
    },

    // Feedback Methods
    submitFeedback: async (data: any) => {
        return api.post('/feedback', data);
    },
    getFeedback: async (userId: string) => {
        return api.get(`/feedback/${userId}`);
    },

    // Resource Methods
    getResources: async () => {
        return api.get('/resources');
    },
    createBooking: async (data: any) => {
        return api.post('/bookings', data);
    },
    getBookings: async (userId: string) => {
        return api.get(`/bookings/${userId}`);
    }
};

// Utility: Check current token status (used by App.tsx on mount)
export const checkTokenStatus = async (): Promise<{ valid: boolean; user: any | null }> => {
    try {
        const user = await api.get('/me');
        return { valid: true, user };
    } catch {
        return { valid: false, user: null };
    }
};
