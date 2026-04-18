import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const documentApi = {
  createDraft: async (title: string) => {
    const res = await apiClient.post('/documents', { title });
    return res.data;
  },
  updateContent: async (id: string, content: any) => {
    const res = await apiClient.put(`/documents/${id}`, { content });
    return res.data;
  },
  publishToConfluence: async (id: string) => {
    const res = await apiClient.post(`/documents/${id}/publish`);
    return res.data;
  },
  generateTasks: async (id: string) => {
    const res = await apiClient.post(`/documents/${id}/tasks/generate`);
    return res.data;
  },
  publishTasks: async (id: string, tasks: any[]) => {
    const res = await apiClient.post(`/documents/${id}/tasks/publish`, { tasks });
    return res.data;
  }
};
