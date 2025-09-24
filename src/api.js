import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:4200/api/v1',
  withCredentials: true,
});

// Request Interceptor: Attach the JWT token to every outgoing request.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors, like 401 Unauthorized.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check for a canceled request (happens in React's StrictMode)
    if (axios.isCancel(error)) {
      // Silently ignore it by returning a promise that never resolves.
      return new Promise(() => {});
    }

    // If the token is expired or invalid, redirect to the login page.
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('accessToken');
      // Use window.location.replace to prevent the user from navigating back.
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    // For all other errors, let the component's catch block handle it.
    return Promise.reject(error);
  }
);

export default apiClient;
