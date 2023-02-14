const STORAGE_KEY = '__HEMMELIG_TOKEN';

export const removeCookie = () => {
    document.cookie = `${STORAGE_KEY}=;path=/;domain=${window.location.host};expires=Thu, 01 Jan 1970 00:00:01 GMT`;
};
