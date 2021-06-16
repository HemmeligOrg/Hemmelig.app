const STORAGE_KEY = '__HEMMELIG_TOKEN';

export const setToken = (token) => {
    window.localStorage.setItem(STORAGE_KEY, token);
};

export const getToken = () => {
    return window.localStorage.getItem(STORAGE_KEY);
};

export const removeToken = () => {
    window.localStorage.removeItem(STORAGE_KEY);
};

export const hasToken = () => {
    return !!getToken();
};
