import axios from "axios";

export const api = axios.create({
  baseURL: "https://api.openf1.org/v1",
  timeout: 5000,
});

api.interceptors.request.use((config) => {
  console.log("request", config.url, config.params);
  return config;
});

api.interceptors.response.use((response) => {
  console.log("response", response.data);
  return response;
});
