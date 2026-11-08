import api from '../axios';

// API hồ sơ cá nhân của khách hàng đang đăng nhập (backend: ProfileController /users/me)
export const profileService = {
  getMe: async () => {
    const res = await api.get('/users/me');
    return res.data?.data;
  },

  updateMe: async (payload) => {
    const res = await api.put('/users/me', payload);
    return res.data; // { status, message, data: ProfileResponse }
  },

  updatePreferences: async (prefs) => {
    const res = await api.put('/users/me/preferences', prefs);
    return res.data; // { status, message, data: PreferencesDto }
  },
};

export default profileService;
