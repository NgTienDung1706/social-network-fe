import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    login: {
      currentUser: null,
      accessToken: null,
      isLoading: false,
      error: false,
    },
    register: {
      isLoading: false,
      error: false,
      success: false,
    },
    logout: {
      isLoading: false,
      error: false,
    },
  },
  reducers: {
    loginStart: (state) => {
      state.login.isLoading = true;
    },
    loginSuccess: (state, action) => {
      state.login.isLoading = false;
      state.login.currentUser = action.payload.user;
      state.login.accessToken = action.payload.accessToken; // Assuming token is part of the payload
      state.login.error = false;
    },
    loginFailed: (state) => {
      state.login.isLoading = false;
      state.login.error = true;
    },
    registerStart: (state) => {
      state.register.isLoading = true;
    },
    registerSuccess: (state) => {
      state.register.isLoading = false;
      state.register.error = false;
      state.register.success = true;
    },
    registerFailed: (state) => {
      state.register.isLoading = false;
      state.register.error = true;
      state.register.success = false;
    },
    logoutSuccess: (state) => {
      state.login.isLoading = false;
      state.login.currentUser = null;
      state.login.accessToken = null;
      state.login.error = false;
    },
    logoutFailed: (state) => {
      state.login.isLoading = false;
      state.login.error = true;
    },
    logoutStart: (state) => {
      state.login.isLoading = true;
    },
    setAccessToken: (state, action) => {
      state.login.accessToken = action.payload;
    },
    setCurrentUser: (state, action) => {
      state.login.currentUser = action.payload.user;
    },
  },
});

export const {
  loginStart,
  loginFailed,
  loginSuccess,
  registerStart,
  registerSuccess,
  registerFailed,
  logoutStart,
  logoutSuccess,
  logoutFailed,
  setAccessToken,
  setCurrentUser,
} = authSlice.actions;

export default authSlice.reducer;

export const authSelector = (state) => state.auth.login;
