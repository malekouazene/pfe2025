import axios from 'axios';

const createApiClient = () => {
  const token = localStorage.getItem('token');
  const API_BASE_URL = 'http://localhost:8005/api/v1/notifications';
  
  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    },
    timeout: 10000
  });

  apiClient.interceptors.response.use(
    response => response,
    error => {
      console.error("API Error:", error);
      if (error.response && error.response.status === 401) {
        console.log("Token expired or invalid");
      }
      return Promise.reject(error);
    }
  );

  return apiClient;
};

export const getNotifications = async (userId) => {
  if (!userId) {
    console.warn("getNotifications called without userId");
    return [];
  }

  try {
    const apiClient = createApiClient();
    const response = await apiClient.get(`/user/${userId}`);
    return response.data.items || [];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};
export const markAsRead = async (notificationId) => {
  if (!notificationId) {
    console.warn("markAsRead called without notificationId");
    return null;
  }

  try {
    const apiClient = createApiClient();
    // Assurez-vous que l'URL est correcte
    const response = await apiClient.post(`/read/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw new Error("Failed to mark notification as read");
  }
};