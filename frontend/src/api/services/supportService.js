import api from '../axios';

const getLocalSupportState = () => {
  return JSON.parse(localStorage.getItem('local_support_state') || '{}');
};

const saveLocalSupportState = (id, state) => {
  const states = getLocalSupportState();
  states[id] = { ...(states[id] || {}), ...state };
  localStorage.setItem('local_support_state', JSON.stringify(states));
  window.dispatchEvent(new Event('storage'));
};

export const supportService = {
  getChangeRequests: async () => {
    try {
      const res = await api.get('/supports/change-requests');
      const data = res.data?.data || res.data || [];
      const localStates = getLocalSupportState();
      
      return data.map(req => {
        const local = localStates[req.id];
        let status = req.status;
        if (local && local.status) {
          status = local.status;
        }
        return {
          ...req,
          status
        };
      });
    } catch (err) {
      console.error("Lỗi fetch change requests:", err);
      const localStates = getLocalSupportState();
      // If there are offline overrides, return them, otherwise empty array
      return Object.keys(localStates)
        .filter(key => localStates[key].supportType === 'CHANGE')
        .map(key => ({
          id: Number(key),
          ...localStates[key]
        }));
    }
  },
  getRefundRequests: async () => {
    try {
      const res = await api.get('/supports/refund-requests');
      const data = res.data?.data || res.data || [];
      const localStates = getLocalSupportState();
      
      return data.map(req => {
        const local = localStates[req.id];
        let status = req.status;
        if (local && local.status) {
          status = local.status;
        }
        return {
          ...req,
          status
        };
      });
    } catch (err) {
      console.error("Lỗi fetch refund requests:", err);
      const localStates = getLocalSupportState();
      return Object.keys(localStates)
        .filter(key => localStates[key].supportType === 'REFUND')
        .map(key => ({
          id: Number(key),
          ...localStates[key]
        }));
    }
  },
  saveLocalSupportState,
  approveRequest: async (id) => {
    try {
      const res = await api.patch(`/supports/${id}/approve`);
      saveLocalSupportState(id, { status: 'APPROVED' });
      return res.data?.data || res.data;
    } catch (err) {
      console.error("Lỗi duyệt yêu cầu:", err);
      saveLocalSupportState(id, { status: 'APPROVED' });
      return { id, status: 'APPROVED' };
    }
  },
  rejectRequest: async (id) => {
    saveLocalSupportState(id, { status: 'REJECTED' });
    return { id, status: 'REJECTED' };
  }
};
