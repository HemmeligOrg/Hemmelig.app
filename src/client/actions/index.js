import { USER_LOGIN, USER_LOGIN_CHANGED } from '../util/constants';

export const userLoginChanged = (payload) => {
    return {
        type: USER_LOGIN_CHANGED,
        payload,
    };
};

export const userLogin = (payload) => {
    return {
        type: USER_LOGIN,
        payload,
    };
};
