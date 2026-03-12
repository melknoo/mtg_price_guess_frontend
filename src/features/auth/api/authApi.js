import apiClient from '../../../api/axios';

export const loginUser = async (username, password) => {
  const response = await apiClient.post('/auth/login', { 
    username, 
    password 
  });
  return response.data;
};

export const registerUser = async (username, email, password) => {
  const response = await apiClient.post('/auth/register', { 
    username, 
    email, 
    password 
  });
  return response.data;
};

export const registerWithScore = async (username, email, password, score) => {
  const response = await apiClient.post('/auth/register-with-score', { 
    username, 
    email, 
    password, 
    score 
  });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const logoutUser = async () => {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    console.warn('Logout error:', error);
  }
};

export const requestPasswordReset = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await apiClient.post('/auth/reset-password', {
    token,
    password
  });
  return response.data;
};

export const socialLoginApi = async (provider, token) => {
  const response = await apiClient.post(`/auth/social/${provider}`, { token });
  return response.data;
};