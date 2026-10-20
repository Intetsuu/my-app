import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  timeout: 5000,
});

api.interceptors.request.use((config) => {
  console.log("request", config.method, config.url, config.params);
  return config;
});

api.interceptors.response.use((response) => {
  console.log("response", response.data);
  return response;
});
