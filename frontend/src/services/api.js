import axios from 'axios';

const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:8000/api' 
  : 'https://ai-learning-dashboard-po3t.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const uploadAPI = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getInfo: async () => {
    const response = await api.get('/upload/info');
    return response.data;
  }
};

export const analysisAPI = {
  getAnalysis: async () => {
    const response = await api.get('/analysis/');
    return response.data;
  }
};

export const modelAPI = {
  trainModel: async (target_column) => {
    const response = await api.post('/model/train', { target_column });
    return response.data;
  },
  predict: async (features) => {
    const response = await api.post('/model/predict', { features });
    return response.data;
  }
};
