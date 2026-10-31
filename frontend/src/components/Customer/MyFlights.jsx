import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/Customer/MyFlights.css';
import '../../css/Customer/SeatMap.css';
import Navbar from '../Homepage/Navbar';
import Footer from '../Homepage/Footer';
import { bookingService } from '../../api/services/bookingService';

const STATUS_LABEL = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PAID: 'Đã thanh toán',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn'
};

// Các trạng thái còn có thể hủy (khớp với backend: chưa CANCELLED/EXPIRED)
const CANCELLABLE = new Set(['PENDING', 'CONFIRMED', 'PAID']);

// Nhóm lọc -> các status tương ứng
const FILTERS = [
  { key: 'ALL', label: 'Tất cả', match: () => true },
  { key: 'PENDING', label: 'Chờ xác nhận', match: (s) => s === 'PENDING' },
  { key: 'PAID', label: 'Đã thanh toán', match: (s) => s === 'PAID' || s === 'CONFIRMED' },
  { key: 'CANCELLED', label: 'Đã hủy', match: (s) => s === 'CANCELLED' || s === 'EXPIRED' }
];

const fmtTime = (d) => {
  if (!d) return '--:--';
  const x = new Date(d);
  return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`;
};
const fmtDate = (d) => {
  if (!d) return '';
  const x = new Date(d);
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return `${days[x.getDay()]}, ${x.getDate()}/${x.getMonth() + 1}/${x.getFullYear()}`;
};
const fmtMoney = (n) => new Intl.NumberFormat('vi-VN').format(n || 0);

// ===== Modal chọn ghế =====
function SeatSelectionModal({ booking, onClose, onDone }) {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const ticketsToSeat = (booking.tickets || []).filter(t => !t.seatNumber);
  const [assignments, setAssignments] = useState({});
  const [activeTicketId, setActiveTicketId] = useState(ticketsToSeat[0]?.ticketId ?? null);

  useEffect(() => {
    let mounted = true;
    bookingService.getAvailableSeats(booking.flightId)
      .then(data => { if (mounted) setSeats(data); })
      .catch(() => { if (mounted) setError('Không tải được sơ đồ ghế.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [booking.flightId]);

  const selectedSeatIds = new Set(Object.values(assignments).map(s => s.seatId));

  const bookingClassId = booking.ticketClassId;
  // Ghế khác hạng vé đã mua -> không được chọn
  const isWrongClass = (seat) =>
    bookingClassId != null && seat.ticketClassId != null && seat.ticketClassId !== bookingClassId;

  const handleSeatClick = (seat) => {
    const ownerTicketId = Object.keys(assignments).find(tid => assignments[tid].seatId === seat.seatId);
    if (ownerTicketId) {
      setAssignments(prev => { const next = { ...prev }; delete next[ownerTicketId]; return next; });
      setActiveTicketId(Number(ownerTicketId));
      return;
    }
    if (!seat.available || isWrongClass(seat)) return;
    if (activeTicketId == null) return;
    setAssignments(prev => ({ ...prev, [activeTicketId]: seat }));
    const next = ticketsToSeat.find(t => t.ticketId !== activeTicketId && !assignments[t.ticketId]);
    setActiveTicketId(next ? next.ticketId : activeTicketId);
  };

  const allAssigned = ticketsToSeat.length > 0 && ticketsToSeat.every(t => assignments[t.ticketId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = Object.entries(assignments).map(([ticketId, seat]) => ({
        ticketId: Number(ticketId), seatId: seat.seatId
      }));
      await bookingService.selectSeats(booking.bookingId, payload);
      onDone();
    } catch (e) {
      setError(e?.response?.data?.message || 'Đặt chỗ ngồi thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const rows = {};
  seats.forEach(s => { const r = s.rowNumber ?? 0; if (!rows[r]) rows[r] = []; rows[r].push(s); });
  const rowKeys = Object.keys(rows).map(Number).sort((a, b) => a - b);

  const seatClass = (seat) => {
    if (selectedSeatIds.has(seat.seatId)) return 'seat selected';
    if (!seat.available) return 'seat taken';
    if (isWrongClass(seat)) return 'seat otherclass';
    return 'seat available';
  };

  return (
    <div className="seatmap-overlay" onClick={onClose}>
      <div className="seatmap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="seatmap-header">
          <h3>Chọn chỗ ngồi · {booking.flightCode} ({booking.departureAirportCode} → {booking.arrivalAirportCode})</h3>
          <button className="seatmap-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>

        {booking.ticketClassName && (
          <p className="seatmap-class-note">
            <i className="fa-solid fa-circle-info"></i> Bạn chỉ được chọn ghế thuộc hạng <strong>{booking.ticketClassName}</strong> đã mua.
          </p>
        )}

        <div className="seatmap-passengers">
          {ticketsToSeat.map(t => (
            <button key={t.ticketId}
              className={`pax-chip ${activeTicketId === t.ticketId ? 'active' : ''}`}
              onClick={() => setActiveTicketId(t.ticketId)}>
              <span className="pax-name">{t.passengerName}</span>
              <span className="pax-seat">{assignments[t.ticketId]?.seatNumber || 'Chọn ghế'}</span>
            </button>
          ))}
        </div>

        <div className="seatmap-body">
          {loading ? (
            <p className="seatmap-info">Đang tải sơ đồ ghế...</p>
          ) : seats.length === 0 ? (
            <p className="seatmap-info">Chuyến bay này chưa có sơ đồ ghế.</p>
          ) : (
            <div className="seatmap-grid">
              {rowKeys.map(r => (
                <div className="seat-row" key={r}>
                  <span className="row-num">{r}</span>
                  {rows[r].sort((a, b) => (a.columnLetter || '').localeCompare(b.columnLetter || ''))
                    .map(seat => (
                      <button key={seat.seatId} className={seatClass(seat)}
                        onClick={() => handleSeatClick(seat)} disabled={!seat.available || isWrongClass(seat)}
                        title={`${seat.seatNumber}${seat.ticketClassName ? ' · ' + seat.ticketClassName : ''}`}>
                        {seat.columnLetter || seat.seatNumber}
                      </button>
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="seatmap-legend">
          <span><i className="dot available"></i> Còn trống</span>
          <span><i className="dot selected"></i> Đang chọn</span>
          <span><i className="dot taken"></i> Đã có người</span>
          <span><i className="dot otherclass"></i> Khác hạng vé</span>
        </div>

        {error && <div className="seatmap-error">{error}</div>}

        <div className="seatmap-footer">
          <button className="seatmap-btn-cancel" onClick={onClose}>Hủy</button>
          <button className="seatmap-btn-confirm" onClick={handleSubmit} disabled={!allAssigned || submitting}>
            {submitting ? 'Đang lưu...' : 'Xác nhận chỗ ngồi'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Modal chi tiết đơn (vé điện tử) =====
function BookingDetailModal({ booking, onClose, onChooseSeat, onCancel }) {
  const canChooseSeat = booking.status === 'PAID' && !booking.seatsAssigned;
  const canCancel = CANCELLABLE.has(booking.status);
  const isPaid = booking.status === 'PAID' || booking.status === 'CONFIRMED';
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

  const handleSendEmail = async () => {
    setSendingEmail(true);
    setEmailStatus(null);
    try {
      await bookingService.sendTicketEmail(booking.bookingId);
      setEmailStatus({ success: true, message: 'Đã gửi vé điện tử đến email của bạn!' });
    } catch (e) {
      setEmailStatus({
        success: false,
        message: e?.response?.data?.message || 'Không thể gửi email vé. Vui lòng thử lại sau.'
      });
    } finally {
      setSendingEmail(false);
    }
  };
  return (
    <div className="mf-modal-overlay" onClick={onClose}>
      <div className="mf-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mf-modal-header">
          <div>
            <div className="mf-modal-route">{booking.departureAirportCode} → {booking.arrivalAirportCode}</div>
            <div className="mf-modal-sub">
              {booking.airlineName} • {booking.flightCode} · {fmtDate(booking.departureTime)} · {fmtTime(booking.departureTime)}
            </div>
          </div>
          <button className="mf-modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>

        <div className="mf-modal-body">
          <div className="mf-pnr-box">
            <span>MÃ ĐẶT CHỖ</span>
            <h2>{booking.pnrCode}</h2>
          </div>

          <p className="mf-sec-title">Hành khách</p>
          {booking.tickets?.map(t => (
            <div className="mf-pax" key={t.ticketId}>
              <div className="mf-pax-row"><span className="k">Họ tên</span><span className="v">{t.passengerName}</span></div>
              <div className="mf-pax-row"><span className="k">Giấy tờ</span><span className="v">{t.documentNumber}</span></div>
              <div className="mf-pax-row"><span className="k">Ghế</span><span className="v seat">{t.seatNumber || 'Chưa chọn'}</span></div>
              <div className="mf-pax-row"><span className="k">Mã vé</span><span className="v">{t.ticketNumber}</span></div>
            </div>
          ))}

          <div className="mf-total">
            <span className="lbl">Tổng tiền</span>
            <span className="val">{fmtMoney(booking.totalAmount)}đ</span>
          </div>
        </div>

        <div className="mf-modal-foot">
          {emailStatus && (
            <div className={`mf-email-status ${emailStatus.success ? 'success' : 'error'}`}>
              {emailStatus.message}
            </div>
          )}
          {isPaid && (
            <button className="mf-btn-email" onClick={handleSendEmail} disabled={sendingEmail}>
              <i className="fa-solid fa-envelope"></i> {sendingEmail ? 'Đang gửi vé...' : 'Gửi lại vé qua Email'}
            </button>
          )}
          {booking.status === 'PENDING' && (
            <div className="mf-pending-note">
              <i className="fa-solid fa-clock"></i> Đơn đang chờ nhân viên xác nhận chuyển khoản.
            </div>
          )}
          {canChooseSeat && (
            <button className="mf-btn-seat" onClick={onChooseSeat}>
              <i className="fa-solid fa-chair"></i> Đặt chỗ ngồi
            </button>
          )}
          {canCancel && (
            <button className="mf-btn-cancel mf-btn-cancel--block" onClick={onCancel}>
              <i className="fa-solid fa-ban"></i> Hủy vé
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Hộp xác nhận hủy vé =====
function CancelConfirmModal({ booking, busy, onConfirm, onClose }) {
  const isPaid = booking.status === 'PAID' || booking.status === 'CONFIRMED';
  return (
    <div className="mf-modal-overlay" onClick={busy ? undefined : onClose}>
      <div className="mf-confirm" onClick={(e) => e.stopPropagation()}>
        <div className="mf-confirm-icon"><i className="fa-solid fa-triangle-exclamation"></i></div>
        <h3>Hủy vé chuyến bay?</h3>
        <p>
          Bạn sắp hủy đơn <strong>{booking.pnrCode}</strong> ({booking.departureAirportCode} → {booking.arrivalAirportCode}).
        </p>
        <ul className="mf-confirm-notes">
          <li>Chỉ được hủy trước giờ khởi hành ít nhất <strong>24 giờ</strong> theo quy định.</li>
          {isPaid
            ? <li>Đơn đã thanh toán sẽ được hoàn <strong>80%</strong> giá trị theo quy định.</li>
            : <li>Đơn chưa thanh toán sẽ được hủy mà không phát sinh hoàn tiền.</li>}
          <li>Thao tác này không thể hoàn tác.</li>
        </ul>
        <div className="mf-confirm-actions">
          <button className="mf-confirm-keep" onClick={onClose} disabled={busy}>Giữ vé</button>
          <button className="mf-confirm-cancel" onClick={onConfirm} disabled={busy}>
            {busy ? 'Đang hủy...' : 'Xác nhận hủy'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Toast nhỏ =====
function Toast({ msg, type, onClose }) {
  if (!msg) return null;
  return (
    <div className={`mf-toast ${type}`}>
      <i className={`fa-solid ${type === 'error' ? 'fa-circle-xmark' : 'fa-circle-check'}`}></i>
      <span>{msg}</span>
      <button onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
    </div>
  );
}

function MyFlights() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [detailBooking, setDetailBooking] = useState(null);
  const [seatBooking, setSeatBooking] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type }), 4000);
  };

  const doCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await bookingService.cancel(cancelTarget.bookingId);
      setCancelTarget(null);
      setDetailBooking(null);
      await load();
      showToast('Đã hủy vé. Khoản hoàn tiền (nếu có) sẽ được xử lý theo quy định.');
    } catch (e) {
      showToast(e?.response?.data?.message || 'Hủy vé thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await bookingService.getMy();
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const activeFilter = FILTERS.find(f => f.key === filter) || FILTERS[0];
  const visible = bookings.filter(b => activeFilter.match(b.status));
  const countFor = (f) => bookings.filter(b => f.match(b.status)).length;

  // giữ modal chi tiết đồng bộ sau khi reload (vd: sau khi chọn ghế)
  const refreshAfterSeat = async () => {
    setSeatBooking(null);
    await load();
  };

  // cập nhật detailBooking từ danh sách mới nếu đang mở
  useEffect(() => {
    if (detailBooking) {
      const fresh = bookings.find(b => b.bookingId === detailBooking.bookingId);
      if (fresh) setDetailBooking(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);

  return (
    <>
      <Navbar />
      <div className="mf-page">
        <div className="mf-head">
          <h1>Chuyến bay của tôi</h1>
          <p>Toàn bộ các chuyến bay bạn đã đặt từ trước đến nay.</p>
        </div>

        <div className="mf-tabs">
          {FILTERS.map(f => (
            <button key={f.key}
              className={`mf-tab ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}>
              {f.label} ({countFor(f)})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mf-empty"><i className="fa-solid fa-spinner"></i>Đang tải danh sách vé...</div>
        ) : visible.length === 0 ? (
          <div className="mf-empty">
            <i className="fa-regular fa-plane"></i>
            {bookings.length === 0 ? 'Bạn chưa đặt chuyến bay nào.' : 'Không có đơn nào ở mục này.'}
            {bookings.length === 0 && (
              <div><button className="mf-empty-btn" onClick={() => navigate('/customer/home')}>Đặt vé ngay</button></div>
            )}
          </div>
        ) : (
          <div className="mf-list">
            {visible.map(b => {
              const st = (b.status || '').toLowerCase();
              const canSeat = b.status === 'PAID' && !b.seatsAssigned;
              return (
                <div className="mf-card" key={b.bookingId}>
                  <div className="mf-card-left">
                    <div className="mf-airline">
                      {b.airlineName || 'Hãng hàng không'}
                      <span className="mf-flightcode">• {b.flightCode}</span>
                    </div>
                    <div className="mf-route">
                      <div className="mf-point">
                        <span className="t">{fmtTime(b.departureTime)}</span>
                        <span className="c">{b.departureAirportCode}</span>
                      </div>
                      <div className="mf-path">
                        <div className="line"></div>
                        <span className="date">{fmtDate(b.departureTime)}</span>
                      </div>
                      <div className="mf-point">
                        <span className="t">{fmtTime(b.arrivalTime)}</span>
                        <span className="c">{b.arrivalAirportCode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mf-card-right">
                    <span className={`mf-status ${st}`}>{STATUS_LABEL[b.status] || b.status}</span>
                    <span className="mf-pnr">PNR: {b.pnrCode}</span>
                    <span className="mf-amount">{fmtMoney(b.totalAmount)}đ</span>
                    <div className="mf-actions">
                      <button className="mf-btn-detail" onClick={() => setDetailBooking(b)}>Chi tiết</button>
                      {canSeat && (
                        <button className="mf-btn-seat" onClick={() => setSeatBooking(b)}>Đặt chỗ ngồi</button>
                      )}
                      {CANCELLABLE.has(b.status) && (
                        <button className="mf-btn-cancel" onClick={() => setCancelTarget(b)}>Hủy vé</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {detailBooking && (
        <BookingDetailModal
          booking={detailBooking}
          onClose={() => setDetailBooking(null)}
          onChooseSeat={() => { setSeatBooking(detailBooking); setDetailBooking(null); }}
          onCancel={() => setCancelTarget(detailBooking)}
        />
      )}

      {cancelTarget && (
        <CancelConfirmModal
          booking={cancelTarget}
          busy={cancelling}
          onConfirm={doCancel}
          onClose={() => !cancelling && setCancelTarget(null)}
        />
      )}

      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: toast.type })} />


      {seatBooking && (
        <SeatSelectionModal
          booking={seatBooking}
          onClose={() => setSeatBooking(null)}
          onDone={refreshAfterSeat}
        />
      )}

      <Footer />
    </>
  );
}

export default MyFlights;
