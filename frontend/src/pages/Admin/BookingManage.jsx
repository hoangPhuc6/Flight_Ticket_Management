import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, X, CheckCircle, XCircle, User, Plane, CreditCard, Calendar, Armchair, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { bookingService } from '../../api/services/bookingService';
import { flightService } from '../../api/services/flightService';

const errMsg = (e, fallback) =>
  e?.response?.data?.message || e?.message || fallback || 'Có lỗi xảy ra';

// Chuẩn hoá trạng thái booking (BookingStatus: PENDING/CONFIRMED/PAID/CANCELLED/EXPIRED) về 3 nhóm hiển thị
const normStatus = (s) => {
  const v = String(s || '').toUpperCase();
  if (['CONFIRMED', 'PAID', 'SUCCESS', 'COMPLETED'].includes(v)) return 'CONFIRMED';
  if (['CANCELLED', 'CANCELED', 'EXPIRED'].includes(v)) return 'CANCELLED';
  return 'PENDING';
};

// Chuẩn hoá trạng thái thanh toán (PaymentStatus: PENDING/SUCCESS/FAILED/REFUNDED) -> nhãn hiển thị
const normPay = (s) => {
  const v = String(s || '').toUpperCase();
  if (['SUCCESS', 'PAID'].includes(v)) return 'PAID';
  if (v === 'REFUNDED') return 'REFUNDED';
  return 'UNPAID';
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
};
const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
};
const vnd = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';

const METHOD_LABEL = {
  BANK_TRANSFER: 'Chuyển khoản',
  CREDIT_CARD: 'Thẻ tín dụng',
  E_WALLET: 'Ví điện tử',
  CASH: 'Tiền mặt',
};

// BookingResponse (DTO thật từ DB) + bản đồ chuyến bay -> shape dùng trong bảng
const mapDbBooking = (b, flightMap) => {
  const id = b.bookingId || b.id;
  const fl = flightMap[b.flightId] || {};
  const tickets = b.tickets || [];
  const passengers = tickets.map(t => t.passengerName).filter(Boolean);
  const seats = tickets.map(t => t.seatNumber).filter(Boolean);
  return {
    id,
    dbId: id,
    pnr: b.pnrCode || `BK-${id}`,
    passenger: passengers[0] || '—',
    passengerExtra: Math.max(0, passengers.length - 1),
    flightCode: fl.code || (b.flightId ? `#${b.flightId}` : '—'),
    route: fl.route || '—',
    date: fmtDate(b.bookingDate),
    seat: seats.join(', ') || '—',
    tickets,
    amount: Number(b.totalAmount || 0),
    refund: Number(b.refundAmount || 0),
    status: normStatus(b.status),
    paymentStatus: normPay(b.paymentStatus),
    paymentMethod: b.paymentMethod || '',
    bookedAt: fmtDateTime(b.bookingDate),
  };
};

const STATUS_LABEL = { CONFIRMED: 'Đã xác nhận', PENDING: 'Chờ thanh toán', CANCELLED: 'Đã hủy' };
const STATUS_STYLE = { CONFIRMED: 'bg-emerald-50 text-emerald-700 border border-emerald-200', PENDING: 'bg-amber-50 text-amber-700 border border-amber-200', CANCELLED: 'bg-red-50 text-red-700 border border-red-200' };
const PAY_LABEL = { PAID: 'Đã thanh toán', UNPAID: 'Chưa thanh toán', REFUNDED: 'Đã hoàn tiền' };
const PAY_STYLE = { PAID: 'bg-emerald-50 text-emerald-700', UNPAID: 'bg-amber-50 text-amber-700', REFUNDED: 'bg-blue-50 text-blue-700' };

function Toast({ msg, type, onClose }) {
  if (!msg) return null;
  const isError = type === 'error';
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white min-w-[280px] max-w-[90vw]"
      style={{ backgroundColor: isError ? '#DC2626' : '#16A34A' }}>
      {isError ? <X className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
      <span className="flex-1">{msg}</span>
      <button onClick={onClose}><X className="w-4 h-4 opacity-70 hover:opacity-100" /></button>
    </div>
  );
}

function DetailModal({ booking, onClose, onConfirm, onCancel }) {
  if (!booking) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white">
          <div>
            <h3 className="text-base font-bold text-slate-800">Chi tiết đặt chỗ</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{booking.pnr}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Trạng thái */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_STYLE[booking.status]}`}>{STATUS_LABEL[booking.status]}</span>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${PAY_STYLE[booking.paymentStatus]}`}>{PAY_LABEL[booking.paymentStatus]}</span>
          </div>

          {/* Hành khách & vé */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Hành khách ({booking.tickets.length})</h4>
            {booking.tickets.length === 0 && <p className="text-sm text-slate-400">Chưa có thông tin vé</p>}
            {booking.tickets.map((t, i) => (
              <div key={t.ticketId || i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold">{t.passengerName || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  {t.seatNumber && <span className="inline-flex items-center gap-1 text-violet-700 font-semibold"><Armchair className="w-3.5 h-3.5" />{t.seatNumber}</span>}
                  {t.price != null && <span>{vnd(t.price)}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Chuyến bay */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Thông tin chuyến bay</h4>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Plane className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-semibold">{booking.flightCode}</span>
              <span className="text-slate-400">—</span>
              <span>{booking.route}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Đặt lúc: {booking.bookedAt}</span>
            </div>
          </div>

          {/* Thanh toán */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Thanh toán</h4>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{METHOD_LABEL[booking.paymentMethod] || booking.paymentMethod || 'Chưa xác định'}</span>
            </div>
            {booking.refund > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Hoàn tiền</span>
                <span className="font-semibold text-blue-600">{vnd(booking.refund)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-sm font-semibold text-slate-700">Tổng tiền</span>
              <span className="text-lg font-bold text-violet-600">{vnd(booking.amount)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {booking.status !== 'CANCELLED' && (
          <div className="flex gap-3 p-5 pt-0">
            {booking.status === 'PENDING' && (
              <button onClick={() => onConfirm(booking.id)} className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> Xác nhận đặt chỗ
              </button>
            )}
            <button onClick={() => onCancel(booking.id)} className="flex-1 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4" /> Hủy đặt chỗ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingManage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type }), 3500);
  };

  // Tải booking thật từ DB (kèm bản đồ chuyến bay để hiển thị mã/tuyến)
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dbBookings, flights] = await Promise.all([
        bookingService.getAll(),
        flightService.getAdminList().catch(() => []),
      ]);
      const flightMap = {};
      flights.forEach(f => { flightMap[f.id] = { code: f.flightCode, route: f.routeCode || '—' }; });
      setBookings(dbBookings.map(b => mapDbBooking(b, flightMap)));
    } catch (e) {
      setError(errMsg(e, 'Không tải được danh sách đặt chỗ.'));
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = b.pnr.toLowerCase().includes(q) || b.passenger.toLowerCase().includes(q) || b.flightCode.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleConfirm = async (id) => {
    const b = bookings.find(x => x.id === id);
    if (!b) return;
    try {
      await bookingService.confirmPayment(b.dbId);
      showToast('Đã xác nhận đặt chỗ!');
      setSelected(null);
      load();
    } catch (e) {
      showToast(errMsg(e, 'Xác nhận thất bại.'), 'error');
    }
  };
  const handleCancel = async (id) => {
    const b = bookings.find(x => x.id === id);
    if (!b) return;
    try {
      await bookingService.cancel(b.dbId);
      showToast('Đã hủy đặt chỗ.');
      setSelected(null);
      load();
    } catch (e) {
      showToast(errMsg(e, 'Hủy đặt chỗ thất bại.'), 'error');
    }
  };

  const counts = { ALL: bookings.length, CONFIRMED: bookings.filter(b => b.status === 'CONFIRMED').length, PENDING: bookings.filter(b => b.status === 'PENDING').length, CANCELLED: bookings.filter(b => b.status === 'CANCELLED').length };

  return (
    <div className="space-y-5">
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: toast.type })} />
      {selected && <DetailModal booking={selected} onClose={() => setSelected(null)} onConfirm={handleConfirm} onCancel={handleCancel} />}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý đặt chỗ</h1>
          <p className="text-slate-400 text-sm mt-1">Theo dõi và xử lý toàn bộ đơn đặt vé máy bay</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border bg-white border-slate-200 text-slate-600 hover:border-violet-300 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-white border border-slate-200 rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm PNR, hành khách, chuyến bay..." className="flex-1 text-sm outline-none bg-transparent text-slate-700" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[['ALL', 'Tất cả'], ['CONFIRMED', 'Đã xác nhận'], ['PENDING', 'Chờ thanh toán'], ['CANCELLED', 'Đã hủy']].map(([val, lbl]) => (
            <button key={val} onClick={() => { setStatusFilter(val); setPage(1); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${statusFilter === val ? 'bg-violet-600 text-white border-violet-600' : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300'}`}>
              {lbl} ({counts[val]})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3">Mã PNR</th>
                <th className="px-5 py-3">Hành khách</th>
                <th className="px-5 py-3">Chuyến bay</th>
                <th className="px-5 py-3">Ghế</th>
                <th className="px-5 py-3">Số tiền</th>
                <th className="px-5 py-3">Phương thức</th>
                <th className="px-5 py-3">Thanh toán</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={9} className="py-16 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Đang tải dữ liệu...</p>
                </td></tr>
              ) : error ? (
                <tr><td colSpan={9} className="py-16 text-center">
                  <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-red-400 mb-3">{error}</p>
                  <button onClick={load} className="text-xs font-semibold text-violet-600 hover:underline">Thử lại</button>
                </td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-sm text-slate-400">Không tìm thấy kết quả phù hợp</td></tr>
              ) : paged.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-mono font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">{b.pnr}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center shrink-0">{b.passenger.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{b.passenger}</p>
                        {b.passengerExtra > 0 && <p className="text-xs text-slate-400">+{b.passengerExtra} hành khách khác</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-slate-700">{b.flightCode}</p>
                    <p className="text-xs text-slate-400">{b.route} · {b.date}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-violet-600 font-semibold">{b.seat}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-slate-700">{vnd(b.amount)}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                      {METHOD_LABEL[b.paymentMethod] || b.paymentMethod || 'Chuyển khoản'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${PAY_STYLE[b.paymentStatus]}`}>{PAY_LABEL[b.paymentStatus]}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLE[b.status]}`}>{STATUS_LABEL[b.status]}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => setSelected(b)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors" title="Xem chi tiết">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">Hiển thị {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} / {filtered.length} kết quả</span>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${p === page ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
