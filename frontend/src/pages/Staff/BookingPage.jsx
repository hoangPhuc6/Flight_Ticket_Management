import { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Eye, Mail, ChevronLeft, ChevronRight, X, CheckCircle2, XCircle, User, Plane, CreditCard, Calendar, Armchair, Loader2, AlertCircle, Download } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { bookingService } from '../../api/services/bookingService';
import { flightService } from '../../api/services/flightService';

const PAGE_SIZE = 8;

// Backend enums → display (chuẩn hoá giống trang Admin)

// Chuẩn hoá trạng thái đặt vé (BookingStatus: PENDING/CONFIRMED/PAID/CANCELLED/EXPIRED) -> 3 nhóm hiển thị
const normStatus = (s) => {
  const v = String(s || '').toUpperCase();
  if (['CONFIRMED', 'PAID', 'SUCCESS', 'COMPLETED'].includes(v)) return 'CONFIRMED';
  if (['CANCELLED', 'CANCELED', 'EXPIRED'].includes(v)) return 'CANCELLED';
  return 'PENDING';
};
const statusStyle = {
  CONFIRMED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  PENDING:   'text-amber-700 bg-amber-50 border-amber-200',
  CANCELLED: 'text-slate-500 bg-slate-100 border-slate-200',
};
const statusLabel = { CONFIRMED: 'Đã xác nhận', PENDING: 'Chờ thanh toán', CANCELLED: 'Đã hủy' };

// Chuẩn hoá trạng thái thanh toán (PaymentStatus: PENDING/SUCCESS/FAILED/REFUNDED) -> nhãn hiển thị
const normPay = (s) => {
  const v = String(s || '').toUpperCase();
  if (['SUCCESS', 'PAID'].includes(v)) return 'PAID';
  if (v === 'REFUNDED') return 'REFUNDED';
  return 'UNPAID';
};
const paymentStatusStyle = {
  PAID:    'text-violet-700 bg-violet-50',
  UNPAID:  'text-red-600 bg-red-50',
  REFUNDED:'text-indigo-600 bg-indigo-50',
};
const paymentStatusLabel = { PAID: 'Đã thanh toán', UNPAID: 'Chưa thanh toán', REFUNDED: 'Đã hoàn tiền' };

function formatAmount(amount) {
  if (!amount) return '—';
  return `${Number(amount).toLocaleString('vi-VN')} đ`;
}

function Toast({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white min-w-[260px] ${t.type === 'success' ? 'bg-violet-600' : 'bg-red-500'}`}>
          {t.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      ))}
    </div>
  );
}

// Modal chi tiết đặt vé + thao tác (xác nhận / hủy) — đồng bộ với trang Admin
function DetailModal({ booking, flightInfo, onClose, onConfirm, onCancel, onSendEmail }) {
  if (!booking) return null;
  const st = normStatus(booking.status);
  const pay = normPay(booking.paymentStatus);
  const tickets = booking.tickets || [];
  const fmtDateTime = (iso) => iso
    ? new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white">
          <div>
            <h3 className="text-base font-bold text-slate-800">Chi tiết đặt vé</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{booking.pnrCode || `#${booking.bookingId}`}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Trạng thái */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusStyle[st]}`}>{statusLabel[st]}</span>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${paymentStatusStyle[pay]}`}>{paymentStatusLabel[pay]}</span>
          </div>

          {/* Hành khách & vé */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Hành khách ({tickets.length})</h4>
            {tickets.length === 0 && <p className="text-sm text-slate-400">Chưa có thông tin vé</p>}
            {tickets.map((t, i) => (
              <div key={t.ticketId || i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold">{t.passengerName || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  {t.seatNumber && <span className="inline-flex items-center gap-1 text-violet-700 font-semibold"><Armchair className="w-3.5 h-3.5" />{t.seatNumber}</span>}
                  {t.price != null && <span>{formatAmount(t.price)}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Chuyến bay */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Thông tin chuyến bay</h4>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Plane className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-semibold">{flightInfo?.code || `#${booking.flightId}`}</span>
              {flightInfo?.route && (<><span className="text-slate-400">—</span><span>{flightInfo.route}</span></>)}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Đặt lúc: {fmtDateTime(booking.bookingDate)}</span>
            </div>
          </div>

          {/* Thanh toán */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Thanh toán</h4>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Chuyển khoản</span>
            </div>
            {Number(booking.refundAmount) > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Hoàn tiền</span>
                <span className="font-semibold text-blue-600">{formatAmount(booking.refundAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-sm font-semibold text-slate-700">Tổng tiền</span>
              <span className="text-lg font-bold text-violet-600">{formatAmount(booking.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Thao tác */}
        {st !== 'CANCELLED' && (
          <div className="flex gap-3 p-5 pt-0">
            {pay !== 'PAID' ? (
              <button onClick={() => onConfirm(booking.bookingId)} className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Xác nhận thanh toán
              </button>
            ) : (
              <button onClick={() => onSendEmail(booking.bookingId)} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" /> Gửi lại vé qua Email
              </button>
            )}
            <button onClick={() => onCancel(booking.bookingId)} className="flex-1 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4" /> Hủy đặt vé
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BookingPage() {
  const [searchParams] = useSearchParams();
  const { data, loading, error, refetch } = useApi(bookingService.getAll);
  const { data: flightsData } = useApi(() => flightService.search({}), []);

  const querySearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(querySearch);
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  const bookings = data || [];

  // Bản đồ chuyến bay theo id -> hiển thị mã chuyến + tuyến thay vì id thô
  const flightMap = useMemo(() => {
    const map = {};
    (flightsData || []).forEach(f => {
      map[f.id] = {
        code: f.flightCode || `#${f.id}`,
        route: f.departureAirportCode && f.arrivalAirportCode
          ? `${f.departureAirportCode} → ${f.arrivalAirportCode}`
          : '',
      };
    });
    return map;
  }, [flightsData]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      const q = search.toLowerCase();
      const pnr = b.pnrCode?.toLowerCase() || '';
      const matchSearch = !q || String(b.bookingId).includes(q) || pnr.includes(q);
      const matchStatus = statusFilter === 'All' || normStatus(b.status) === statusFilter;
      const matchPayment = paymentFilter === 'All' || normPay(b.paymentStatus) === paymentFilter;
      return matchSearch && matchStatus && matchPayment;
    });
  }, [bookings, search, statusFilter, paymentFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleCancel = async (id) => {
    try {
      await bookingService.cancel(id);
      addToast(`Đã huỷ đơn đặt vé #${id}.`);
      setSelected(null);
      refetch();
    } catch (e) {
      addToast(e.response?.data?.message || 'Không thể huỷ đơn đặt vé.', 'error');
    }
  };

  const handleConfirmPayment = async (id) => {
    try {
      await bookingService.confirmPayment(id);
      addToast(`Đã xác nhận thanh toán và gửi vé điện tử cho đơn #${id}.`);
      setSelected(null);
      refetch();
    } catch (e) {
      addToast(e.response?.data?.message || 'Không thể xác nhận thanh toán.', 'error');
    }
  };

  const handleSendEmail = async (id) => {
    try {
      await bookingService.sendTicketEmail(id);
      addToast(`Đã gửi lại vé điện tử qua email cho đơn #${id}.`);
    } catch (e) {
      addToast(e.response?.data?.message || 'Không thể gửi vé qua email.', 'error');
    }
  };

  const handleExportReport = () => {
    if (filtered.length === 0) {
      addToast('Không có dữ liệu để xuất báo cáo!', 'error');
      return;
    }

    try {
      const headers = ['Mã Booking', 'Mã PNR', 'Mã Chuyến bay', 'Tổng tiền (VND)', 'Phương thức thanh toán', 'Trạng thái thanh toán', 'Trạng thái đặt vé'];
      
      const rows = filtered.map(b => [
        `#${b.bookingId}`,
        b.pnrCode || '—',
        flightMap[b.flightId]?.code || `#${b.flightId}`,
        b.totalAmount || 0,
        'Chuyển khoản',
        paymentStatusLabel[normPay(b.paymentStatus)],
        statusLabel[normStatus(b.status)]
      ]);

      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Bao_cao_booking_EasyFlight_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addToast('Xuất báo cáo thành công!', 'success');
    } catch (err) {
      addToast('Gặp lỗi khi xuất báo cáo.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <Toast toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      {selected && (
        <DetailModal
          booking={selected}
          flightInfo={flightMap[selected.flightId]}
          onClose={() => setSelected(null)}
          onConfirm={handleConfirmPayment}
          onCancel={handleCancel}
          onSendEmail={handleSendEmail}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Quản lý đặt vé</h1>
          <p className="text-sm text-slate-400 mt-0.5">Theo dõi lịch đặt vé và tình trạng thanh toán của khách hàng.</p>
        </div>
        <button
          onClick={handleExportReport}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-500/10 transition-all hover:-translate-y-0.5 active:translate-y-0 shrink-0"
        >
          <Download className="w-4 h-4" />
          Xuất báo cáo (CSV)
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm mã booking, PNR..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 outline-none focus:ring-2 focus:ring-violet-500/20">
            <option value="All">Tất cả trạng thái</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="PENDING">Chờ thanh toán</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
          <select value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 outline-none focus:ring-2 focus:ring-violet-500/20">
            <option value="All">Tất cả thanh toán</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="UNPAID">Chưa thanh toán</option>
            <option value="REFUNDED">Đã hoàn tiền</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-5 py-4">Mã Booking</th>
                <th className="px-5 py-4">PNR</th>
                <th className="px-5 py-4">Chuyến bay</th>
                <th className="px-5 py-4">Tổng tiền</th>
                <th className="px-5 py-4">Thanh toán</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="py-20 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Đang tải dữ liệu...</p>
                </td></tr>
              ) : error ? (
                <tr><td colSpan={7} className="py-20 text-center">
                  <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-red-400 mb-3">{error}</p>
                  <button onClick={refetch} className="text-xs font-semibold text-violet-600 hover:underline">Thử lại</button>
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center text-slate-400 text-sm italic">Không có dữ liệu hiển thị</td></tr>
              ) : paginated.map(b => (
                <tr key={b.bookingId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold text-violet-600">#{b.bookingId}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold text-slate-700">{b.pnrCode || '—'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-slate-700">{flightMap[b.flightId]?.code || `#${b.flightId}`}</div>
                    {flightMap[b.flightId]?.route && (
                      <div className="text-xs text-slate-400">{flightMap[b.flightId].route}</div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-bold text-slate-700">{formatAmount(b.totalAmount)}</div>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${paymentStatusStyle[normPay(b.paymentStatus)] || 'text-slate-500'}`}>
                      {paymentStatusLabel[normPay(b.paymentStatus)]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-slate-500">Chuyển khoản</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusStyle[normStatus(b.status)] || 'text-slate-500 bg-slate-100 border-slate-200'}`}>
                      {statusLabel[normStatus(b.status)]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center">
                      <button onClick={() => setSelected(b)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors" title="Xem chi tiết">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-slate-50 flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
            Hiển thị {paginated.length} trên {filtered.length} kết quả
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-100 disabled:opacity-30 hover:bg-slate-50 transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div className="flex items-center px-3">
              <span className="text-xs font-bold text-slate-700">{currentPage}</span>
              <span className="text-xs font-bold text-slate-300 mx-1">/</span>
              <span className="text-xs font-bold text-slate-300">{totalPages}</span>
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-100 disabled:opacity-30 hover:bg-slate-50 transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingPage;