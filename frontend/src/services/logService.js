import api from "./api";

export const getLogs = async () => {
  const response = await api.get("/logs");
  return response.data;
};

export const getLogById = async (logId) => {
  const response = await api.get(`/logs/${logId}`);
  return response.data;
};
