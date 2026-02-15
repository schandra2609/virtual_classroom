import api from "./axios";

export const getTutorApplications = async (status: string) => {
  const response = await api.get(`/admin/tutors?status=${status}`);
  return response.data.data;
};

export const approveTutor = async (tutorId: string) => {
  const response = await api.patch(`/admin/tutors/${tutorId}/approve`);
  return response.data.data;
};

export const rejectTutor = async (tutorId: string) => {
  const response = await api.patch(`/admin/tutors/${tutorId}/reject`);
  return response.data.data;
};
