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

const extrairNomeToken = (token) => {

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.nome || payload.upn?.split('@')[0] || 'Usuário';
    } catch (error) {
        console.error('Erro ao extrair nome do token:', error);
        return 'Usuário';
    }

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
            const response = await axios.post('http://localhost:8080/auth/refresh', { refreshToken });
            const newToken = response.data.token;

            localStorage.setItem('token', newToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);

            const nomeUsuario = extrairNomeToken(newToken);
            localStorage.setItem('usuarioNome', nomeUsuario);

            processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            return api(originalRequest);

        } catch (refreshError) {

            processQueue(refreshError, null);
            
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('usuarioNome');

            window.location.href = '/login';
            return Promise.reject(refreshError);

        } finally {
            isRefreshing = false;
        }

    }

    return Promise.reject(error);

});

export default api;