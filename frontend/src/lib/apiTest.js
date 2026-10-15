import api from "./api";

export async function checkApiHealth() {
  const response = await api.get("/health");
  return response.data;
}
