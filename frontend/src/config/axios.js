import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:1000';
console.log('Using API URL:', baseURL);

const axiosInstance = axios.create({
    baseURL,
    withCredentials: true
});

// Add request interceptor
axiosInstance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            console.log('Adding token to request');
            config.headers["Authorization"] = `Bearer ${token}`;
        } else {
            console.log('No token available for request');
        }
        return config;
    },
    error => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for debugging
axiosInstance.interceptors.response.use(
    response => {
        console.log(`Response from ${response.config.url}:`, response.status);
        return response;
    },
    error => {
        console.error('Response error:', error.message);
        if (error.response) {
            console.error('Error status:', error.response.status);
            console.error('Error data:', error.response.data);
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;   
