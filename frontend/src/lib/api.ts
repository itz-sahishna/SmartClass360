import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// ✅ REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem("sc360_token") ||
      sessionStorage.getItem("sc360_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ✅ RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (typeof window !== "undefined") {
      if (err.response?.status === 401) {
        localStorage.removeItem("sc360_token");
        localStorage.removeItem("sc360_user");
        sessionStorage.removeItem("sc360_token");
        sessionStorage.removeItem("sc360_user");
        window.location.href = "/login"; // ✅ FIXED (was '/')
      }
    }
    return Promise.reject(err);
  }
);


// ================= AUTH =================
export const authApi = {
  login: (
    identifier: string,
    password: string,
    rememberMe: boolean
  ) =>
    api.post("/auth/login", {
      identifier,
      password,
      rememberMe,
    }),

  me: () => api.get("/auth/me"),
};


// ================= ADMIN =================
export const adminApi = {
  getDashboard: () => api.get("/admin/dashboard"),
  getUsers: () => api.get("/admin/users"),
  getLookups: () => api.get("/admin/lookups"),
  createSubject: (data: object) => api.post("/admin/subjects", data),
  createSection: (data: object) => api.post("/admin/sections", data),
  createTimetable: (data: object) => api.post("/admin/timetables", data),
  createUser: (data: object) => api.post("/admin/users", data),
  updateUser: (id: string, data: object) => api.put(`/admin/users/${id}`, data),
  toggleUserBlock: (id: string) => api.patch(`/admin/users/${id}/block`),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getAnalytics: () => api.get("/admin/analytics"),
  getRequests: () => api.get("/admin/requests"),
  reviewRequest: (id: string, status: "approved" | "rejected") =>
    api.patch(`/admin/requests/${id}`, { status }),
  getProfile: () => api.get("/admin/profile"),
  updateProfile: (data: object) => api.put("/admin/profile", data),
};


// ================= TEACHER =================
export const teacherApi = {
  getDashboard: () => api.get("/teacher/dashboard"),
  getStudents: () => api.get("/teacher/students"),
  getAttendance: (params?: object) => api.get("/teacher/attendance", { params }),
  updateAttendance: (data: object) => api.patch("/teacher/attendance", data),
  getSubjects: () => api.get("/teacher/subjects"),
  getAssignments: (params?: object) => api.get("/teacher/assignments", { params }),
  getAssignmentDetails: (id: string) => api.get(`/teacher/assignments/${id}`),
  createAssignment: (data: object) => api.post("/teacher/assignments", data),
  getMaterials: () => api.get("/teacher/materials"),
  createMaterial: (data: object) => api.post("/teacher/materials", data),
  gradeSubmission: (assignmentId: string, submissionId: string, data: object) =>
    api.patch(`/teacher/assignments/${assignmentId}/submissions/${submissionId}`, data),
  getMarks: (params?: object) => api.get("/teacher/marks", { params }),
  updateMarks: (data: object) => api.put("/teacher/marks", data),
  getAnalysis: (params?: object) => api.get("/teacher/analysis", { params }),
  getAnalytics: (params?: object) => api.get("/teacher/analytics", { params }),
  getNotifications: () => api.get("/teacher/notifications"),
  getProfile: () => api.get("/teacher/profile"),
  updateProfile: (data: object) => api.put("/teacher/profile", data),
  requestProfileUpdate: (data: object) => api.post("/teacher/profile/request", data),
  reviewRequest: (id: string, status: "approved" | "rejected") =>
    api.patch(`/teacher/requests/${id}`, { status }),

  // ML prediction
  predict: (data: object) =>
    api.post("/teacher/predict", data),
};


// ================= STUDENT =================
export const studentApi = {
  getDashboard: () => api.get("/student/dashboard"),
  getAttendance: (params?: object) => api.get("/student/attendance", { params }),
  getSubjects: () => api.get("/student/subjects"),
  getAssignments: (params?: object) => api.get("/student/assignments", { params }),
  submitAssignment: (id: string, data: object) => api.post(`/student/assignments/${id}/submit`, data),
  getExams: () => api.get("/student/exams"),
  getAnalysis: () => api.get("/student/analysis"),
  getNotifications: () => api.get("/student/notifications"),
  getTimetable: () => api.get("/student/timetable"),
  getProfile: () => api.get("/student/profile"),
  updateProfile: (data: object) => api.put("/student/profile", data),
  requestProfileUpdate: (data: object) => api.post("/student/profile/request", data),
  requestAttendanceChange: (data: object) => api.post("/student/attendance/request", data),
};


// ================= AI =================
export const aiApi = {
  ask: (
    question: string,
    history?: { role: string; content: string }[]
  ) =>
    api.post("/ai/ask", { question, history }),

  summarize: (text: string) =>
    api.post("/ai/summarize", { text }),
};

export default api;
