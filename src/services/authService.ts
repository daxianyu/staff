import { login as loginApi, logout as logoutApi, getUserInfo as getUserInfoApi } from './auth';

export const authService = {
  login: loginApi,
  logout: logoutApi,
  getUserInfo: getUserInfoApi,
};

export default authService; 