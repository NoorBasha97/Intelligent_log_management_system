import api from "./api";

export const getAudits = async () => {
  const response = await api.get("/audits");
  return response.data;
};

export const getAuditsByLog = async (logId) => {
  const response = await api.get(`/audits/log/${logId}`);
  return response.data;
};
