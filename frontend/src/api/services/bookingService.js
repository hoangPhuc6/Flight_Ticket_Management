import api from '../axios';

const getLocalBookingsState = () => {
  return JSON.parse(localStorage.getItem('local_bookings_state') || '{}');
};

const saveLocalBookingState = (id, state) => {
  const states = getLocalBookingsState();
  states[id] = { ...(states[id] || {}), ...state };
  localStorage.setItem('local_bookings_state', JSON.stringify(states));
  window.dispatchEvent(new Event('storage'));
};

export const bookingService = {
  getAll: async () => {
    const res = await api.get('/bookings');
    const bookings = res.data?.data || res.data || [];
    const localStates = getLocalBookingsState();
    return bookings.map(b => {
      // Map flat backend properties if they are nested in raw entities
      const flightId = b.flight?.id || b.flightId;
      const paymentStatus = b.payment?.status || b.paymentStatus || 'UNPAID';
      const paymentMethod = b.payment?.paymentMethod || b.paymentMethod || 'CASH';
      
      const mapped = {
        ...b,
        bookingId: b.id || b.bookingId,
        flightId,
        paymentStatus,
        paymentMethod,
      };

      const localState = localStates[mapped.bookingId];
      if (localState) {
        return { ...mapped, ...localState };
      }
      return mapped;
    });
  },
  getById: async (id) => {
    const res = await api.get(`/bookings/${id}`);
    const b = res.data?.data || res.data;
    if (!b) return null;

    const flightId = b.flight?.id || b.flightId;
    const paymentStatus = b.payment?.status || b.paymentStatus || 'UNPAID';
    const paymentMethod = b.payment?.paymentMethod || b.paymentMethod || 'CASH';

    const mapped = {
      ...b,
      bookingId: b.id || b.bookingId,
      flightId,
      paymentStatus,
      paymentMethod,
    };

    const localStates = getLocalBookingsState();
    const localState = localStates[mapped.bookingId];
    if (localState) {
      return { ...mapped, ...localState };
    }
    return mapped;
  },
  create: (data) => api.post('/bookings', data),
  getMy: async () => {
    const res = await api.get('/bookings/my');
    return res.data?.data || res.data || [];
  },
  getAvailableSeats: async (flightId) => {
    const res = await api.get(`/flights/${flightId}/available-seats`);
    return res.data?.data || res.data || [];
  },
  selectSeats: async (bookingId, assignments) => {
    const res = await api.post(`/bookings/${bookingId}/select-seats`, { assignments });
    return res.data?.data || res.data;
  },
  expire: async (id) => {
    try {
      const res = await api.put(`/bookings/${id}/expire`);
      saveLocalBookingState(id, { status: 'EXPIRED' });
      return res.data?.data || res.data;
    } catch {
      saveLocalBookingState(id, { status: 'EXPIRED' });
      return { id, status: 'EXPIRED' };
    }
  },
  cancel: async (id) => {
    try {
      const res = await api.delete(`/bookings/${id}`);
      saveLocalBookingState(id, { status: 'CANCELLED' });
      return res.data?.data || res.data;
    } catch (e) {
      // Lỗi nghiệp vụ từ server (vd: vi phạm quy định hủy vé) -> báo cho người dùng
      if (e?.response) throw e;
      // Lỗi mạng -> fallback cục bộ
      saveLocalBookingState(id, { status: 'CANCELLED' });
      return { id, status: 'CANCELLED' };
    }
  },
  sendTicketEmail: async (bookingId) => {
    const res = await api.post(`/bookings/${bookingId}/send-email`);
    return res.data?.data || res.data;
  },
  confirmPayment: async (bookingId) => {
    const res = await api.post(`/bookings/${bookingId}/confirm-payment`);
    saveLocalBookingState(bookingId, { paymentStatus: 'PAID', status: 'PAID' });
    return res.data?.data || res.data;
  }
};
