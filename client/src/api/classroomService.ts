import api from "./axios";

export const getMyClassrooms = async () => {
  const response = await api.get("/classroom");
  return response.data.data;
};

export const createClassroom = async (data: any) => {
  const response = await api.post("/classroom", data);
  return response.data.data;
};

export const joinClassroom = async (joiningCode: string) => {
  const response = await api.post("/classroom/join", { joiningCode });
  return response.data.data;
};

export const getClassroomById = async (id: string) => {
  const response = await api.get(`/classroom/${id}`);
  return response.data.data;
};

export const updateClassroom = async (id: string, data: any) => {
  const response = await api.patch(`/classroom/${id}`, data);
  return response.data.data;
};

export const deleteClassroom = async (id: string) => {
  const response = await api.delete(`/classroom/${id}`);
  return response.data;
};

export const leaveClassroom = async (id: string) => {
  const response = await api.delete(`/classroom/${id}/leave`);
  return response.data;
};

export const refreshJoiningCode = async (id: string) => {
  const response = await api.patch(`/classroom/${id}/refresh-code`);
  return response.data.data;
};

export const transferOwnership = async (id: string, newOwnerId: string) => {
  const response = await api.patch(`/classroom/${id}/transfer-ownership`, {
    newOwnerId,
  });
  return response.data;
};
