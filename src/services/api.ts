
import { createApi } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query'
import type { AxiosRequestConfig, AxiosError } from 'axios'
import api from '../api/client';
import { User, Exam } from '../types';

const axiosBaseQuery = (
  { baseUrl }: { baseUrl: string } = { baseUrl: '' }
): BaseQueryFn<
  {
    url: string
    method: AxiosRequestConfig['method']
    data?: AxiosRequestConfig['data']
    params?: AxiosRequestConfig['params']
  },
  unknown,
  unknown
> => async ({ url, method, data, params }) => {
  try {
    const result = await api({ url: baseUrl + url, method, data, params })
    return { data: result.data }
  } catch (axiosError) {
    let err = axiosError as AxiosError
    return {
      error: {
        status: err.response?.status,
        data: err.response?.data || err.message,
      },
    }
  }
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery({ baseUrl: process.env.REACT_APP_API_BASE_URL || '' }),
  tagTypes: ['Student', 'Staff', 'Appointment', 'Hospital', 'Dashboard', 'Class', 'Material', 'Exam', 'User'],
  endpoints: builder => ({
    // Auth
    login: builder.mutation({ 
        query: credentials => ({ url: '/auth/login', method: 'post', data: credentials }),
    }),
    register: builder.mutation({ 
        query: userInfo => ({ url: '/auth/register', method: 'post', data: userInfo }),
    }),
    verifyEmail: builder.mutation({ 
        query: ({ email, otp }) => ({ url: '/auth/verify-email', method: 'post', data: { email, otp } }),
    }),
    resendVerification: builder.mutation({ 
        query: ({ email }) => ({ url: '/auth/resend-verification', method: 'post', data: { email } }),
    }),
    forgotPassword: builder.mutation({ 
        query: ({ email }) => ({ url: '/auth/forgot-password', method: 'post', data: { email } }),
    }),
    resetPassword: builder.mutation({ 
        query: credentials => ({ url: '/auth/reset-password', method: 'post', data: credentials }),
    }),
    
    // Users, Students, Staff
    getStudents: builder.query<User[], void>({ 
        query: () => ({ url: '/students', method: 'get' }),
        providesTags: (result = []) => [...result.map(({ id }) => ({ type: 'Student' as const, id })), { type: 'Student', id: 'LIST' }],
    }),
    getStudent: builder.query<User, string>({ 
        query: id => ({ url: `/students/${id}`, method: 'get' }),
        providesTags: (result, error, id) => [{ type: 'Student', id }],
    }),
    addStudent: builder.mutation<User, Partial<User>>({ 
        query: student => ({ url: '/students', method: 'post', data: student }),
        invalidatesTags: [{ type: 'Student', id: 'LIST' }],
    }),
    updateUser: builder.mutation<User, Partial<User>>({ 
        query: ({ id, ...patch }) => ({ url: `/users/${id}`, method: 'put', data: patch }),
        invalidatesTags: (result, error, { id }) => [{ type: 'User', id }, { type: 'Student', id }, { type: 'Staff', id }],
    }),
    deleteStudent: builder.mutation<{ success: boolean; id: string }, string>({ 
        query: id => ({ url: `/students/${id}`, method: 'delete' }),
        invalidatesTags: (result, error, id) => [{ type: 'Student', id }],
    }),
    getStaff: builder.query<User[], void>({ 
        query: () => ({ url: '/staff', method: 'get' }),
        providesTags: (result = []) => [...result.map(({ id }) => ({ type: 'Staff' as const, id })), { type: 'Staff', id: 'LIST' }],
    }),

    // Exams
    getExams: builder.query<Exam[], { classId: string | null }>({
      query: ({ classId }) => ({ url: `/exams`, method: 'get', params: { classId } }),
      providesTags: (result = []) => [
        ...result.map(({ id }) => ({ type: 'Exam' as const, id })),
        { type: 'Exam', id: 'LIST' }
      ],
    }),
    requestExamPaper: builder.mutation<{ success: boolean }, { examId: string }>({
      query: ({ examId }) => ({
        url: `/exams/${examId}/request-paper`,
        method: 'post',
      }),
      invalidatesTags: (result, error, { examId }) => [{ type: 'Exam', id: examId }],
    }),
    getExamPaperPresignedUrl: builder.query<{ url: string }, { examId: string }>({
      query: ({ examId }) => ({
        url: `/exams/${examId}/download-url`,
        method: 'get',
      }),
    }),

    // Dashboard
    getDashboardSummary: builder.query<any, void>({ 
      query: () => ({ url: '/dashboard/summary', method: 'get' }),
      providesTags: ['Dashboard'],
    }),
    // Appointments
    getAppointments: builder.query<any[], void>({ 
      query: () => ({ url: '/appointments', method: 'get' }),
      providesTags: (result = []) => [...result.map(({ id }) => ({ type: 'Appointment' as const, id })), { type: 'Appointment', id: 'LIST' }],
    }),
    // Hospital
    getBedCounts: builder.query<any, void>({ 
      query: () => ({ url: '/hospital/bedcounts', method: 'get' }),
      providesTags: ['Hospital'],
    }),
    updateBedCounts: builder.mutation<any, any>({ 
        query: counts => ({ url: '/hospital/bedcounts', method: 'put', data: counts }),
        invalidatesTags: ['Hospital'],
    }),
  }),
});

export const { 
    useLoginMutation,
    useRegisterMutation,
    useVerifyEmailMutation,
    useResendVerificationMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,
    useGetStudentsQuery,
    useGetStudentQuery,
    useAddStudentMutation,
    useUpdateUserMutation,
    useDeleteStudentMutation,
    useGetStaffQuery,
    useGetExamsQuery,
    useRequestExamPaperMutation,
    useLazyGetExamPaperPresignedUrlQuery, // Use lazy query for on-demand fetching
    useGetDashboardSummaryQuery,
    useGetAppointmentsQuery,
    useGetBedCountsQuery,
    useUpdateBedCountsMutation,
} = apiSlice;
