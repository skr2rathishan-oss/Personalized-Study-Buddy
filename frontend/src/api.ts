import axios, { InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
    baseURL: 'http://20.244.40.57:5000',
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
