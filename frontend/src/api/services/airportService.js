import api from '../axios';

export const airportService = {
  getAll: async () => {
    const res = await api.get('/admin/airports');
    return res.data?.data || res.data || [];
  },
  create: async (data) => {
    const res = await api.post('/admin/airports', data);
    return res.data?.data || res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/admin/airports/${id}`, data);
    return res.data?.data || res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/admin/airports/${id}`);
    return res.data?.data || res.data;
  },
};
