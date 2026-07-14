import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://avatar-expulsion-gander.ngrok-free.dev",
});

// Interceptor to inject the token from localStorage into the Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["ngrok-skip-browser-warning"] = "true";
    
    // Dynamically override baseURL if a custom endpoint is saved in localStorage
    const customBaseURL = localStorage.getItem("cortex_api_url");
    if (customBaseURL) {
      config.baseURL = customBaseURL;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
