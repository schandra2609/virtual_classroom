import api from "./axios";

export const fetchAssignments = async (classroomId: string) => {
  const response = await api.get(`/classroom/${classroomId}/assignments`);
  return response.data.data;
};

export const createAssignment = async (classroomId: string, data: any) => {
  const response = await api.post(
    `/classroom/${classroomId}/assignments`,
    data,
  );
  return response.data.data;
};

export const getAssignmentDetails = async (classroomId: string, id: string) => {
  const response = await api.get(`/classroom/${classroomId}/assignments/${id}`);
  return response.data.data;
};

export const submitAssignment = async (
  classroomId: string,
  id: string,
  formData: FormData,
) => {
  const response = await api.post(
    `/classroom/${classroomId}/assignments/${id}/submit`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data.data;
};

export const unsubmitAssignment = async (classroomId: string, id: string) => {
  // Unsubmit logic usually involves deleting the submission
  // Let's assume the backend expects classroomId and assignmentId context
  const response = await api.delete(
    `/classroom/${classroomId}/assignments/${id}/submit`,
  );
  return response.data.data;
};
