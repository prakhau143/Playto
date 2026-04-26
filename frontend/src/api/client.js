import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";

const api = axios.create({ baseURL, timeout: 30000 });

export function setAuthToken(accessToken) {
  if (accessToken) {
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

let refreshing = null;

async function refreshAccessToken() {
  const refresh = localStorage.getItem("refreshToken");
  if (!refresh) throw new Error("No refresh token");
  const res = await axios.post(`${baseURL}/auth/refresh/`, { refresh });
  const access = res.data?.access;
  if (!access) throw new Error("Refresh failed");
  localStorage.setItem("accessToken", access);
  setAuthToken(access);
  return access;
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const status = error?.response?.status;
    const original = error?.config;
    if (status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;
    try {
      if (!refreshing) refreshing = refreshAccessToken().finally(() => (refreshing = null));
      await refreshing;
      return api(original);
    } catch (e) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setAuthToken(null);
      return Promise.reject(e);
    }
  }
);

export default api;

