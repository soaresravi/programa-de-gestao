import axios from 'axios';

const api = axios.create({

    baseURL: 'http://localhost:8080',

    headers: {
        'Content-Type': 'application/json',
    },

});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {

    failedQueue.forEach(prom => {

        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }

    });

    failedQueue = [];

};

api.interceptors.request.use((config) => {

    const token = localStorage.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;

});

api.interceptors.response.use((response) => response, async (error) => {

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {

        originalRequest._retry = true;

        if (isRefreshing) {
            
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then(token => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);               
            }).catch(error => Promise.reject(error));
        
        }

        isRefreshing = true;

        try {

            const refreshToken = localStorage.getItem('refreshToken');
            const response = await api.post('/auth/refresh', { refreshToken });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('refreshToken', response.data.refreshToken);

            processQueue(null, response.data.token);
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;

            return api(originalRequest);

        } catch (refreshError) {

            processQueue(refreshError, null);
            
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');

            window.location.href = '/login';
            return Promise.reject(refreshError);

        } finally {
            isRefreshing = false;
        }

    }

    return Promise.reject(error);

});

export default api;