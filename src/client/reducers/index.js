const initialState = {
    isLoggedIn: false,
};

export default function rootReducer(state = initialState, action) {
    switch (action.type) {
        case 'USER_LOGIN_CHANGED':
            return { ...state, isLoggedIn: action.payload };
        default:
            return state;
    }
}
