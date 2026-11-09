import api from '../axios';

export const airplaneService = {
  getAll: async () => {
    const res = await api.get('/admin/airplanes');
    return res.data?.data || res.data || [];
  },
  getById: async (id) => {
    const res = await api.get(`/admin/airplanes/${id}`);
    return res.data?.data || res.data;
  },
  create: async (data) => {
    const res = await api.post('/admin/airplanes', data);
    return res.data?.data || res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/admin/airplanes/${id}`, data);
    return res.data?.data || res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/admin/airplanes/${id}`);
    return res.data?.data || res.data;
  },
};
