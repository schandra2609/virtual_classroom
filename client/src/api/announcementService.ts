import api from "./axios";

export const fetchAnnouncements = async (classroomId: string) => {
  const response = await api.get(`/classroom/${classroomId}/announcements`);
  return response.data.data;
};

export const createAnnouncement = async (classroomId: string, data: any) => {
  const response = await api.post(
    `/classroom/${classroomId}/announcements`,
    data,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data.data;
};
