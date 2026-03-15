import { logger } from './utils/logger';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Diagnostic function to check stored user data
export const checkTokenStatus = () => {
    const storedUser = localStorage.getItem('currentUser');
    logger.debug('[DIAGNOSTIC] Checking token status...');
    logger.debug('[DIAGNOSTIC] Stored user data:', storedUser ? JSON.parse(storedUser) : 'NO DATA');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            logger.debug('[DIAGNOSTIC] User email:', user.email);
            logger.debug('[DIAGNOSTIC] User role:', user.role);
            logger.debug('[DIAGNOSTIC] Has token:', !!user.token);
            logger.debug('[DIAGNOSTIC] Token preview:', user.token ? user.token.substring(0, 20) + '...' : 'NO TOKEN');
            return user;
        } catch (e) {
            logger.error('[DIAGNOSTIC] Failed to parse stored user:', e);
            return null;
        }
    }
    logger.warn('[DIAGNOSTIC] No user data stored in localStorage');
    return null;
};

const getHeaders = (isFormData: boolean = false) => {
    const headers: Record<string, string> = {};
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            if (user.token) {
                headers['Authorization'] = `Bearer ${user.token}`;
            }
        } catch (e) {
            logger.error('Failed to parse user token', e);
        }
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
        method: options.method || 'GET',
        hasToken: !!headers['Authorization'],
        contentType: headers['Content-Type']
    });

    const maxRetries = 2;
    let attempt = 0;
    let response: Response | null = null;

    while (attempt <= maxRetries) {
        try {
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers
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

    if (response.status === 401 && endpoint !== '/login' && endpoint !== '/register') {
        logger.info('[API] Got 401, attempting token refresh...');
        const storedUser = localStorage.getItem('currentUser');
        if (!storedUser) {
            logger.warn('[API] No stored user for refresh, logging out...');
            localStorage.removeItem('currentUser');
            window.location.reload();
            return Promise.reject(new Error('Session expired'));
        }

        const user = JSON.parse(storedUser);
        const refreshRes = await fetch(`${API_BASE_URL}/refresh`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: user.refreshToken || user.token || user.accessToken }) 
        });
        if (refreshRes.ok) {
            const data = await refreshRes.json();
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                user.token = data.accessToken;
                user.refreshToken = data.refreshToken; // Also update refresh token if returned
                localStorage.setItem('currentUser', JSON.stringify(user));
                logger.info('[API] Token refreshed, retrying request...');

                // Retry
                response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    ...options,
                    headers: {
                        ...getHeaders(options.body instanceof FormData),
                        ...options.headers
                    }
                });
            }
        } else {
            logger.warn('[API] Token refresh failed, logging out...');
            localStorage.removeItem('currentUser');
            const ev = new CustomEvent('auth-expired');
            window.dispatchEvent(ev);
            window.location.reload();
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
    logout: async () => {
        return fetch(`${API_BASE_URL}/logout`, { method: 'POST', headers: getHeaders() });
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
