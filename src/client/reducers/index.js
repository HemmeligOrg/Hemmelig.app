import { USER_LOGIN_CHANGED, USER_LOGIN } from '../util/constants';

const initialState = {
    isLoggedIn: false,
};

export default function rootReducer(state = initialState, action) {
    switch (action.type) {
        case USER_LOGIN_CHANGED:
            return { ...state, isLoggedIn: action.payload };
        case USER_LOGIN:
            return { ...state, ...action.payload };
        default:
            return state;
    }
}
