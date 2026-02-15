import api from "./axios";

export const getClassroomMembers = async (
  classroomId: string,
  status?: string,
) => {
  const response = await api.get(`/classroom/${classroomId}/members`, {
    params: { status },
  });
  return response.data.data;
};

export const removeMember = async (classroomId: string, memberId: string) => {
  const response = await api.delete(
    `/classroom/${classroomId}/members/${memberId}`,
  );
  return response.data;
};

export const approveStudent = async (
  classroomId: string,
  studentId: string,
) => {
  const response = await api.patch(
    `/classroom/${classroomId}/members/${studentId}/approve`,
  );
  return response.data.data;
};

export const updatePayment = async (
  classroomId: string,
  studentId: string,
  data: any,
) => {
  const response = await api.patch(
    `/classroom/${classroomId}/members/${studentId}/payment`,
    data,
  );
  return response.data.data;
};
