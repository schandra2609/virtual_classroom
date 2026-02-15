import api from "./axios";

export const getMyInvitations = async () => {
  const response = await api.get("/invitations");
  return response.data.data;
};

export const acceptInvite = async (id: string) => {
  const response = await api.patch(`/invitations/${id}/accept`);
  return response.data;
};

export const inviteTutor = async (classroomId: string, data: any) => {
  const response = await api.post(
    `/classroom/${classroomId}/invite-tutor`,
    data,
  );
  return response.data;
};
