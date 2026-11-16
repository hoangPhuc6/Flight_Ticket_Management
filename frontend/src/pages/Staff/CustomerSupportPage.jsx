import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, FileDown, Loader2, CheckCircle2, AlertCircle, Check, X, Send, Mail, Smartphone } from 'lucide-react';
import { bookingService } from '../../api/services/bookingService';
import { supportService } from '../../api/services/supportService';
import { flightService } from '../../api/services/flightService';
import { notificationService } from '../../api/services/notificationService';


const TABS = [
  { id: 'cancel', label: 'Yêu cầu huỷ vé' },
  { id: 'exchange', label: 'Yêu cầu đổi vé' },
];

const cancelStatusStyle = {
  'Đang chờ': 'text-amber-700 bg-amber-50 border border-amber-200',
  'Đã duyệt': 'text-emerald-700 bg-emerald-50 border border-emerald-200',
  'Bị từ chối': 'text-red-600 bg-red-50 border border-red-200',
};

const exchangeStatusStyle = {
  'Đang chờ': 'text-amber-700 bg-amber-50 border border-amber-200',
  'Đã duyệt': 'text-emerald-700 bg-emerald-50 border border-emerald-200',
  'Bị từ chối': 'text-red-600 bg-red-50 border border-red-200',
};

const exchangeTypeStyle = {
  'Đổi vé': 'text-[#6C5CE7] bg-[#E9E8FC] border border-[#D4D0F8]',
  'Nâng hạng': 'text-violet-700 bg-violet-50 border border-violet-200',
  'Đổi ghế': 'text-sky-700 bg-sky-50 border border-sky-200',
  'Đổi ngày bay': 'text-amber-700 bg-amber-50 border border-amber-200',
};

// ─── PREMIUM EXCEL EXPORTER ──────────────────────────────────────────────────
const downloadExcel = (title, headers, data, filename) => {
  const meta = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>EasyFlight Report</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .title { font-size: 16pt; font-weight: bold; color: #6C5CE7; text-align: center; height: 40px; }
        .subtitle { font-size: 10pt; color: #6E7491; text-align: center; height: 25px; }
        .header { background-color: #6C5CE7; color: #FFFFFF; font-weight: bold; text-align: center; height: 30px; border: 1px solid #D4D0F8; }
        .row { height: 25px; }
        .cell { border: 0.5pt solid #E8E8F0; font-size: 10pt; vertical-align: middle; }
        .text { mso-number-format:"\\@"; text-align: left; }
        .number { mso-number-format:"#,##0"; text-align: right; }
        .center { text-align: center; }
        .badge-pending { color: #B45309; background-color: #FEF3C7; font-weight: bold; text-align: center; }
        .badge-approved { color: #047857; background-color: #D1FAE5; font-weight: bold; text-align: center; }
        .badge-rejected { color: #B91C1C; background-color: #FEE2E2; font-weight: bold; text-align: center; }
      </style>
    </head>
    <body>
      <table>
        <tr><td colspan="${headers.length}" class="title">${title}</td></tr>
        <tr><td colspan="${headers.length}" class="subtitle">Hệ thống quản lý vé EasyFlight - Báo cáo xuất ngày ${new Date().toLocaleString('vi-VN')}</td></tr>
        <tr><td colspan="${headers.length}" style="height: 15px;"></td></tr>
        <tr>
          ${headers.map(h => `<td class="header">${h}</td>`).join('')}
        </tr>
        ${data.map((row, index) => `
          <tr class="row">
            ${row.map(cell => {
              let cellClass = 'cell text';
              let val = cell ?? '';
              
              if (typeof val === 'number' || (typeof val === 'string' && val.endsWith(' đ') && !isNaN(parseFloat(val.replace(/\./g, '').replace(' đ', ''))))) {
                cellClass = 'cell number';
              } else if (val === 'Đang chờ' || val === 'OPEN' || val === 'Chờ xử lý' || val === 'Đang xử lý') {
                cellClass = 'cell badge-pending';
              } else if (val === 'Đã duyệt' || val === 'RESOLVED' || val === 'Đã xử lý' || val === 'Đã phê duyệt') {
                cellClass = 'cell badge-approved';
              } else if (val === 'Bị từ chối' || val === 'CLOSED' || val === 'CRITICAL') {
                cellClass = 'cell badge-rejected';
              } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(val) || val.includes(':')) {
                cellClass = 'cell center';
              }
              
              return `<td class="${cellClass}">${val}</td>`;
            }).join('')}
          </tr>
        `).join('')}
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([meta], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ─── CORE UI COMPONENTS ──────────────────────────────────────────────────────
function Avatar({ initials, color }) {
  const colors = ['bg-[#6C5CE7]', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-sky-500'];
  const bg = color || colors[initials ? initials.charCodeAt(0) % colors.length : 0];
  return (
    <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center shrink-0`}>
      <span className="text-[10px] font-bold text-white uppercase">{initials || 'HK'}</span>
    </div>
  );
}

function Pagination({ current, total, onChange }) {
  if (total <= 1) return null;
  return (
    <div className="px-6 py-4 border-t border-[#E8E8F0] flex items-center justify-between">
      <button onClick={() => onChange(Math.max(1, current - 1))} disabled={current === 1}
        className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-[#6E7491] border border-[#E8E8F0] rounded-lg disabled:opacity-30 hover:bg-[#F0EFFA] transition-colors">
        <ChevronLeft className="w-3.5 h-3.5" /> Trước
      </button>
      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(total, 3) }, (_, i) => (
          <button key={i + 1} onClick={() => onChange(i + 1)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${current === i + 1 ? 'bg-[#6C5CE7] text-white' : 'text-[#6E7491] hover:bg-[#F0EFFA]'}`}>
            {i + 1}
          </button>
        ))}
        {total > 3 && <span className="px-1 text-[#9CA3AF]">...</span>}
        {total > 3 && (
          <button onClick={() => onChange(total)}
            className={`w-8 h-8 rounded-lg text-xs font-bold ${current === total ? 'bg-[#6C5CE7] text-white' : 'text-[#6E7491] hover:bg-[#F0EFFA]'}`}>{total}</button>
        )}
      </div>
      <button onClick={() => onChange(Math.min(total, current + 1))} disabled={current === total}
        className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-[#6E7491] border border-[#E8E8F0] rounded-lg disabled:opacity-30 hover:bg-[#F0EFFA] transition-colors">
        Tiếp <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function SearchFilter({ search, setSearch, status, setStatus, statusOptions }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-5 bg-[#FAFAFE] rounded-xl border border-[#E8E8F0] mb-5">
      <div className="flex-1">
        <label className="text-xs font-semibold text-[#6E7491] mb-1.5 block">Tìm kiếm</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Nhập ID, tên khách hàng hoặc thông tin liên quan..."
            className="w-full pl-9 pr-4 py-2.5 border border-[#E8E8F0] rounded-lg text-sm placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7]/40 bg-white transition-all" />
        </div>
      </div>
      {statusOptions && statusOptions.length > 0 && (
        <div className="w-48">
          <label className="text-xs font-semibold text-[#6E7491] mb-1.5 block">Trạng thái</label>
          <select 
            value={status} 
            onChange={e => setStatus(e.target.value)}
            className="w-full px-3 py-2.5 border border-[#E8E8F0] rounded-lg text-sm text-[#6E7491] bg-white focus:outline-none cursor-pointer"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function Toast({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(t => {
        const bg = t.type === 'error' ? 'bg-red-600' : 'bg-emerald-600';
        return (
          <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white min-w-[280px] ${bg} border border-white/10 animate-in slide-in-from-bottom duration-300`}>
            {t.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => onRemove(t.id)} className="hover:opacity-100 opacity-75 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── HELPERS & MAPPERS ──────────────────────────────────────────────────────
const getPassengerInitials = (name) => {
  if (!name) return 'HK';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const mapSupportToCancelRequest = (support, ticketMap) => {
  const passengerName = support.createdByFullName || 'Khách hàng';
  const initials = getPassengerInitials(passengerName);
  const email = support.createdByFullName
    ? `${passengerName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, '')}@gmail.com`
    : 'khachhang@gmail.com';
  
  const status = support.status === 'APPROVED'
    ? 'Đã duyệt'
    : (support.status === 'REJECTED' ? 'Bị từ chối' : 'Đang chờ');

  const dbData = ticketMap[support.ticketId];
  const ticketPrice = dbData?.ticket?.price || 1500000;
  
  const feeAmountVal = support.feeAmount || (ticketPrice * 0.8);
  const refundAmount = `${Number(feeAmountVal).toLocaleString('vi-VN')} đ`;

  const flightName = dbData?.flight 
    ? `${dbData.flight.departureAirportCode || dbData.flight.departureAirport?.airportCode || 'SGN'} → ${dbData.flight.arrivalAirportCode || dbData.flight.arrivalAirport?.airportCode || 'HAN'}`
    : `Vé #${support.ticketCode || support.ticketId}`;
  
  const flightCode = dbData?.flight?.flightCode || support.ticketCode || 'N/A';
  const flightDate = dbData?.flight?.departureTime 
    ? new Date(dbData.flight.departureTime).toLocaleDateString('vi-VN') 
    : (support.createdAt ? new Date(support.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay');

  return {
    id: String(support.id),
    pnrCode: dbData?.booking?.pnrCode || support.ticketCode || `VE-${support.ticketId}`,
    customer: dbData?.ticket?.passengerName || passengerName,
    email: email,
    avatar: initials,
    flight: flightName,
    flightCode: flightCode,
    flightDate: flightDate,
    reason: support.reason || 'Lịch trình cá nhân',
    requestDate: support.createdAt ? new Date(support.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay',
    refundAmount: refundAmount,
    status: status,
    isDb: true,
    raw: support,
    ticketPrice: ticketPrice,
    originalFlight: dbData?.flight
  };
};

const mapSupportToExchangeRequest = (support, ticketMap) => {
  const passengerName = support.createdByFullName || 'Khách hàng';
  const initials = getPassengerInitials(passengerName);
  const email = support.createdByFullName
    ? `${passengerName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, '')}@gmail.com`
    : 'khachhang@gmail.com';
  
  const status = support.status === 'APPROVED'
    ? 'Đã duyệt'
    : (support.status === 'REJECTED' ? 'Bị từ chối' : 'Đang chờ');

  const dbData = ticketMap[support.ticketId];
  const ticketPrice = dbData?.ticket?.price || 1500000;

  const flightName = dbData?.flight 
    ? `${dbData.flight.departureAirportCode || dbData.flight.departureAirport?.airportCode || 'SGN'} → ${dbData.flight.arrivalAirportCode || dbData.flight.arrivalAirport?.airportCode || 'HAN'}`
    : `Vé #${support.ticketCode || support.ticketId}`;
  
  const flightCode = dbData?.flight?.flightCode || support.ticketCode || 'N/A';
  const flightDate = dbData?.flight?.departureTime 
    ? new Date(dbData.flight.departureTime).toLocaleDateString('vi-VN') 
    : (support.createdAt ? new Date(support.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay');

  const localStates = JSON.parse(localStorage.getItem('local_support_state') || '{}');
  const local = localStates[support.id] || {};

  let toText = 'Thay đổi theo yêu cầu';
  if (local.newFlightCode) {
    const diff = Number(local.feeAmount || 0);
    const diffText = diff > 0 
      ? `(+${Number(diff).toLocaleString('vi-VN')} đ)` 
      : diff < 0 
        ? `(Hoàn ${Number(-diff).toLocaleString('vi-VN')} đ)` 
        : '(0 đ)';
    toText = `${local.newFlightCode} (${local.newFlightRoute}) - ${diffText}`;
  }

  return {
    id: String(support.id),
    pnrCode: dbData?.booking?.pnrCode || support.ticketCode || `VE-${support.ticketId}`,
    customer: dbData?.ticket?.passengerName || passengerName,
    email: email,
    avatar: initials,
    flight: flightName,
    flightCode: flightCode,
    flightDate: flightDate,
    type: 'Đổi vé',
    from: dbData?.flight 
      ? `${dbData.flight.flightCode} (${dbData.flight.departureAirportCode || 'SGN'}→${dbData.flight.arrivalAirportCode || 'HAN'}) - ${Number(ticketPrice).toLocaleString('vi-VN')} đ` 
      : 'Vé hiện tại',
    to: toText,
    requestDate: support.createdAt ? new Date(support.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay',
    status: status,
    isDb: true,
    raw: support,
    ticketPrice: ticketPrice,
    originalFlight: dbData?.flight
  };
};

// ─── TAB: Cancel Requests ───────────────────────────────────────────────────
function CancelTab({ requests, addToast, onRequestAction }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(1);

  const filtered = requests.filter(r => {
    const matchesSearch = 
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.customer.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === 'All' || r.status === status;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    const headers = ['Booking ID', 'Khách hàng', 'Email', 'Chuyến bay', 'Mã chuyến', 'Ngày bay', 'Lý do', 'Ngày yêu cầu', 'Số tiền hoàn', 'Trạng thái'];
    const data = filtered.map(r => [
      r.id,
      r.customer,
      r.email,
      r.flight,
      r.flightCode || 'N/A',
      r.flightDate || 'N/A',
      r.reason,
      r.requestDate,
      r.refundAmount,
      r.status
    ]);
    downloadExcel('DANH SÁCH YÊU CẦU HỦY VÉ', headers, data, `yeu_cau_huy_ve_${new Date().toISOString().slice(0, 10)}.xls`);
    addToast('Xuất báo cáo thành công!', 'success');
  };

  const handleUpdateStatus = (id, newStatus) => {
    const req = requests.find(r => r.id === id);
    if (req) {
      onRequestAction(req, newStatus);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'Đang chờ').length;
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-[#27273F]">Yêu cầu huỷ vé</h2>
          <p className="text-sm text-[#6E7491] mt-1">Có <span className="font-bold text-[#6C5CE7]">{pendingCount} yêu cầu</span> đang chờ xử lý.</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-[#6C5CE7] text-white rounded-lg text-sm font-semibold hover:bg-[#5A4BD1] transition-colors">
          <FileDown className="w-4 h-4" /> Xuất báo cáo
        </button>
      </div>

      <SearchFilter 
        search={search} 
        setSearch={setSearch} 
        status={status} 
        setStatus={setStatus} 
        statusOptions={[
          { value: 'All', label: 'Tất cả trạng thái' },
          { value: 'Đang chờ', label: 'Đang chờ' },
          { value: 'Đã duyệt', label: 'Đã duyệt' },
          { value: 'Bị từ chối', label: 'Bị từ chối' }
        ]} 
      />

      <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#E8E8F0] bg-[#FAFAFE] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">
              <th className="px-6 py-4">Mã Yêu Cầu</th>
              <th className="px-6 py-4">Khách Hàng</th>
              <th className="px-6 py-4">Thông Tin Chuyến Bay</th>
              <th className="px-6 py-4">Lý Do</th>
              <th className="px-6 py-4">Ngày Yêu Cầu</th>
              <th className="px-6 py-4">Số Tiền Hoàn</th>
              <th className="px-6 py-4 text-center">Trạng Thái</th>
              <th className="px-6 py-4 text-center">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F5]">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-sm text-[#9CA3AF] italic">
                  Không có yêu cầu huỷ vé nào trong cơ sở dữ liệu.
                </td>
              </tr>
            ) : paginated.map(r => (
              <tr key={r.id} className="hover:bg-[#FAFAFE] transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-[#6C5CE7]">{r.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={r.avatar} />
                    <div>
                      <div className="text-sm font-semibold text-[#27273F]">{r.customer}</div>
                      <div className="text-[11px] text-[#9CA3AF]">{r.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-[#27273F]">{r.flight}</div>
                  <div className="text-[11px] text-[#9CA3AF]">{r.flightCode || 'N/A'} • {r.flightDate || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 text-sm text-[#6E7491]">{r.reason}</td>
                <td className="px-6 py-4 text-sm text-[#6E7491]">{r.requestDate}</td>
                <td className="px-6 py-4 text-sm font-bold text-[#6C5CE7]">{r.refundAmount}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center justify-center min-w-[90px] px-2.5 py-1 rounded-full text-[10px] font-bold ${cancelStatusStyle[r.status]}`}>{r.status}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    {r.status === 'Đang chờ' ? (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'Đã duyệt')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" /> Duyệt
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'Bị từ chối')}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          <X className="w-3.5 h-3.5" /> Từ chối
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-[#9CA3AF] italic">Đã xử lý</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination current={page} total={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}

// ─── TAB: Ticket Exchange Requests ───────────────────────────────────────────
function ExchangeTab({ requests, addToast, onRequestAction }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(1);

  const filtered = requests.filter(r => {
    const matchesSearch = 
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.customer.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === 'All' || r.status === status;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    const headers = ['Mã yêu cầu', 'Khách hàng', 'Email', 'Chuyến bay', 'Mã chuyến', 'Ngày bay', 'Loại đổi', 'Từ', 'Sang', 'Ngày yêu cầu', 'Trạng thái'];
    const data = filtered.map(r => [
      r.id,
      r.customer,
      r.email,
      r.flight,
      r.flightCode,
      r.flightDate,
      r.type,
      r.from,
      r.to,
      r.requestDate,
      r.status
    ]);
    downloadExcel('DANH SÁCH YÊU CẦU ĐỔI VÉ', headers, data, `yeu_cau_doi_ve_${new Date().toISOString().slice(0, 10)}.xls`);
    addToast('Xuất báo cáo thành công!', 'success');
  };

  const handleUpdateStatus = (id, newStatus) => {
    const req = requests.find(r => r.id === id);
    if (req) {
      onRequestAction(req, newStatus);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'Đang chờ').length;
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-[#27273F]">Yêu cầu đổi vé</h2>
          <p className="text-sm text-[#6E7491] mt-1">Có <span className="font-bold text-[#6C5CE7]">{pendingCount} yêu cầu</span> đang chờ xử lý.</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-[#6C5CE7] text-white rounded-lg text-sm font-semibold hover:bg-[#5A4BD1] transition-colors">
          <FileDown className="w-4 h-4" /> Xuất báo cáo
        </button>
      </div>

      <SearchFilter 
        search={search} 
        setSearch={setSearch} 
        status={status} 
        setStatus={setStatus} 
        statusOptions={[
          { value: 'All', label: 'Tất cả trạng thái' },
          { value: 'Đang chờ', label: 'Đang chờ' },
          { value: 'Đã duyệt', label: 'Đã duyệt' },
          { value: 'Bị từ chối', label: 'Bị từ chối' }
        ]} 
      />

      <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#E8E8F0] bg-[#FAFAFE] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">
              <th className="px-6 py-4">Mã yêu cầu</th>
              <th className="px-6 py-4">Khách Hàng</th>
              <th className="px-6 py-4">Chuyến Bay</th>
              <th className="px-6 py-4">Loại Đổi</th>
              <th className="px-6 py-4">Từ → Sang</th>
              <th className="px-6 py-4">Ngày Yêu Cầu</th>
              <th className="px-6 py-4 text-center">Trạng Thái</th>
              <th className="px-6 py-4 text-center">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F5]">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-sm text-[#9CA3AF] italic">
                  Không có yêu cầu đổi vé nào trong cơ sở dữ liệu.
                </td>
              </tr>
            ) : paginated.map(r => (
              <tr key={r.id} className="hover:bg-[#FAFAFE] transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-[#6C5CE7]">{r.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={r.avatar} />
                    <div>
                      <div className="text-sm font-semibold text-[#27273F]">{r.customer}</div>
                      <div className="text-[11px] text-[#9CA3AF]">{r.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-[#27273F]">{r.flight}</div>
                  <div className="text-[11px] text-[#9CA3AF]">{r.flightCode} • {r.flightDate}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center justify-center min-w-[110px] px-2.5 py-1 rounded-full text-[10px] font-bold ${exchangeTypeStyle[r.type] || 'text-slate-600 bg-slate-100'}`}>
                    {r.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs text-[#6E7491]">
                    <span className="line-through opacity-60">{r.from}</span>
                    <span className="mx-1 text-[#6C5CE7] font-bold">→</span>
                    <span className="font-semibold text-[#27273F]">{r.to}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#6E7491]">{r.requestDate}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center justify-center min-w-[90px] px-2.5 py-1 rounded-full text-[10px] font-bold ${exchangeStatusStyle[r.status]}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {r.status === 'Đang chờ' ? (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'Đã duyệt')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" /> Duyệt
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'Bị từ chối')}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          <X className="w-3.5 h-3.5" /> Từ chối
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-[#9CA3AF] italic">Đã xử lý</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination current={page} total={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}

// ─── SUB-COMPONENT: DispatchNotificationModal ────────────────────────────────
function DispatchNotificationModal({ isOpen, type, action, request, onConfirm, onCancel, flights }) {
  const [selectedFlightId, setSelectedFlightId] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [smsText, setSmsText] = useState('');
  const [sendingState, setSendingState] = useState(''); // '', 'sms', 'email', 'in_app', 'done'
  const [progress, setProgress] = useState(0);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(false);
  const [sendInApp, setSendInApp] = useState(true);

  useEffect(() => {
    if (isOpen && flights && flights.length > 0) {
      setSelectedFlightId(String(flights[0].id));
    } else {
      setSelectedFlightId('');
    }
  }, [isOpen, flights]);

  useEffect(() => {
    if (!request) return;

    const isApprove = action === 'Đã duyệt';
    const isCancel = type === 'cancel';
    
    let sub = '';
    let body = '';
    let sms = '';

    if (isCancel) {
      if (isApprove) {
        sub = `[EasyFlight] Xác nhận hoàn tất yêu cầu hủy đặt vé - Mã PNR: ${request.pnrCode || request.id}`;
        body = `Kính gửi Quý khách ${request.customer},\n\nEasyFlight xin thông báo yêu cầu hủy đặt vé của Quý khách đã được phê duyệt thành công.\n\nChi tiết yêu cầu hủy vé:\n- Mã PNR: ${request.pnrCode || request.id}\n- Chuyến bay: ${request.flight} (${request.flightCode || 'VN-123'})\n- Lý do: ${request.reason || 'Lịch trình cá nhân'}\n- Số tiền hoàn lại: ${request.refundAmount}\n\nSố tiền hoàn trả sẽ được chuyển vào tài khoản thanh toán ban đầu của Quý khách trong vòng 3-5 ngày làm việc tùy thuộc vào ngân hàng thụ hưởng.\n\nTrân trọng,\nĐội ngũ Hỗ trợ khách hàng EasyFlight.`;
        sms = `EasyFlight: Yeu cau huy ve PNR ${request.pnrCode || request.id} cua Quy khach da duoc PHE DUYET. So tien hoan tra ${request.refundAmount} se duoc chuyen ve TK cua Quy khach trong 3-5 ngay lam viec.`;
      } else {
        sub = `[EasyFlight] Thông báo kết quả xử lý yêu cầu hủy vé - Mã PNR: ${request.pnrCode || request.id}`;
        body = `Kính gửi Quý khách ${request.customer},\n\nCảm ơn Quý khách đã liên hệ với EasyFlight.\n\nChúng tôi rất tiếc phải thông báo rằng yêu cầu hủy đặt vé với Mã PNR ${request.pnrCode || request.id} của Quý khách không thể được phê duyệt vào lúc này.\n\nLý do từ chối: Điều kiện vé của Quý khách không áp dụng chính sách hoàn trả hoặc yêu cầu gửi trễ so với giờ bay quy định.\n\nQuý khách vui lòng kiểm tra lại điều kiện hạng vé của mình hoặc phản hồi email này để được tư vấn thêm giải pháp đổi ngày bay/đổi giờ bay.\n\nTrân trọng,\nĐội ngũ Hỗ trợ khách hàng EasyFlight.`;
        sms = `EasyFlight: Yeu cau huy ve PNR ${request.pnrCode || request.id} cua Quy khach BI TU CHOI do khong du dieu kien hoan tra theo quy dinh. Vui long kiem tra email de duoc huong dan chi tiet.`;
      }
    } else {
      const selectedFlight = flights.find(f => String(f.id) === String(selectedFlightId));
      const ticketPrice = request.ticketPrice || 1500000;
      const newPrice = selectedFlight ? selectedFlight.basePrice : ticketPrice;
      const diff = Number(newPrice) - Number(ticketPrice);
      
      let diffText = '0 đ';
      let policyText = 'Không phát sinh chênh lệch giá vé.';
      if (diff > 0) {
        diffText = `Thu thêm: ${Number(diff).toLocaleString('vi-VN')} đ`;
        policyText = `Chính sách áp dụng: Phát sinh chênh lệch giá vé tăng. Quý khách vui lòng thanh toán thêm số tiền ${Number(diff).toLocaleString('vi-VN')} đ tại quầy làm thủ tục hoặc qua cổng thanh toán trực tuyến.`;
      } else if (diff < 0) {
        diffText = `Hoàn tiền: ${Number(-diff).toLocaleString('vi-VN')} đ`;
        policyText = `Chính sách áp dụng: Phát sinh chênh lệch giá vé giảm. EasyFlight sẽ hoàn trả lại số tiền chênh lệch ${Number(-diff).toLocaleString('vi-VN')} đ vào tài khoản thanh toán ban đầu của Quý khách trong 3-5 ngày làm việc.`;
      }

      const toFlightText = selectedFlight 
        ? `${selectedFlight.flightCode} (${selectedFlight.departureAirportCode} → ${selectedFlight.arrivalAirportCode}) - Khởi hành: ${new Date(selectedFlight.departureTime).toLocaleDateString('vi-VN')} ${new Date(selectedFlight.departureTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}`
        : 'Chuyến bay mới theo yêu cầu';

      if (isApprove) {
        sub = `[EasyFlight] Xác nhận thay đổi thông tin đặt vé thành công - Mã PNR: ${request.pnrCode || request.id}`;
        body = `Kính gửi Quý khách ${request.customer},\n\nEasyFlight xin thông báo yêu cầu đổi vé (Mã PNR: ${request.pnrCode || request.id}) của Quý khách đã được phê duyệt thành công.\n\nThông tin chi tiết thay đổi:\n- Chuyến bay cũ: ${request.flight} (${request.flightCode})\n- Chuyến bay mới: ${toFlightText}\n- Giá vé gốc: ${Number(ticketPrice).toLocaleString('vi-VN')} đ\n- Giá vé mới: ${Number(newPrice).toLocaleString('vi-VN')} đ\n- Chênh lệch giá vé: ${diffText}\n\n${policyText}\n\nVé điện tử (E-ticket) mới với thông tin cập nhật đã được đính kèm. Quý khách vui lòng kiểm tra kỹ thông tin hành trình mới trước giờ bay.\n\nTrân trọng,\nĐội ngũ Hỗ trợ khách hàng EasyFlight.`;
        sms = `EasyFlight: Yeu cau doi ve PNR ${request.pnrCode || request.id} da duoc DUYET. Chuyen moi: ${selectedFlight ? selectedFlight.flightCode : 'Da cap nhat'}. Chenh lech: ${diffText}. Vui long kiem tra email.`;
      } else {
        sub = `[EasyFlight] Thông báo kết quả xử lý yêu cầu đổi vé - Mã PNR: ${request.pnrCode || request.id}`;
        body = `Kính gửi Quý khách ${request.customer},\n\nCảm ơn Quý khách đã liên hệ với EasyFlight.\n\nChúng tôi rất tiếc phải thông báo rằng yêu cầu đổi vé với Mã PNR ${request.pnrCode || request.id} của Quý khách không thể được phê duyệt vào lúc này.\n\nLý do từ chối: Hạng ghế/chuyến bay yêu cầu không khả dụng, đã hết chỗ trống hoặc yêu cầu đổi vé gửi trễ hơn 3 tiếng so với giờ khởi hành quy định.\n\nVé gốc của Quý khách vẫn giữ nguyên giá trị sử dụng. Mọi thắc mắc vui lòng liên hệ tổng đài 1900 xxxx để được hỗ trợ trực tiếp.\n\nTrân trọng,\nĐội ngũ Hỗ trợ khách hàng EasyFlight.`;
        sms = `EasyFlight: Yeu cau doi ve PNR ${request.pnrCode || request.id} cua Quy khach BI TU CHOI do het cho hoac khong du dieu kien. Ve goc van giu nguyen gia tri.`;
      }
    }

    setEmailSubject(sub);
    setEmailBody(body);
    setSmsText(sms);
    setSendingState('');
    setProgress(0);
  }, [request, action, type, selectedFlightId, flights]);

  if (!isOpen || !request) return null;

  const handleSend = async () => {
    if (!sendEmail && !sendSms && !sendInApp) {
      alert("Vui lòng chọn ít nhất một kênh gửi thông báo!");
      return;
    }

    if (sendSms) {
      setSendingState('sms');
      setProgress(20);
      await new Promise(r => setTimeout(r, 600));
    }

    if (sendEmail) {
      setSendingState('email');
      setProgress(55);
      await new Promise(r => setTimeout(r, 800));
    }

    if (sendInApp) {
      setSendingState('in_app');
      setProgress(85);
      await new Promise(r => setTimeout(r, 600));
    }

    setSendingState('done');
    setProgress(100);
    await new Promise(r => setTimeout(r, 600));

    const channels = [];
    if (sendEmail) channels.push('EMAIL');
    if (sendSms) channels.push('SMS');
    if (sendInApp) channels.push('IN_APP');

    onConfirm(emailSubject, emailBody, sendSms ? smsText : null, selectedFlightId, channels);
  };

  const isApprove = action === 'Đã duyệt';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-3xl border border-[#E8E8F0] shadow-2xl w-[1000px] max-w-full overflow-hidden flex flex-col md:flex-row h-[680px] relative animate-in zoom-in-95 duration-200">
        
        {sendingState && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white p-6">
            <div className="w-20 h-20 relative flex items-center justify-center mb-6">
              {sendingState !== 'done' ? (
                <Loader2 className="w-16 h-16 animate-spin text-[#6C5CE7]" />
              ) : (
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
                  <Check className="w-10 h-10 text-white stroke-[3]" />
                </div>
              )}
            </div>
            
            <h3 className="text-xl font-bold mb-2 tracking-wide text-center">
              {sendingState === 'sms' && 'Đang kết nối cổng SMS Gateway...'}
              {sendingState === 'email' && 'Đang gửi Email qua SMTP Server...'}
              {sendingState === 'done' && 'Gửi thông báo thành công!'}
            </h3>
            
            <p className="text-sm text-slate-400 mb-6 text-center max-w-md">
              {sendingState === 'sms' && 'Hệ thống đang mã hóa các ký tự và truyền qua kênh viễn thông...'}
              {sendingState === 'email' && `Đang chuyển phát Email và file đính kèm E-ticket tới ${request.email}...`}
              {sendingState === 'done' && 'Khách hàng sẽ nhận được thông báo trong giây lát.'}
            </p>

            <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-[#6C5CE7] transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 mt-2 font-mono">{progress}%</span>
          </div>
        )}

        <div className="w-full md:w-3/5 p-6 flex flex-col border-r border-[#E8E8F0] overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E8F0] mb-4">
            <div>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 ${
                isApprove ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
              }`}>
                {isApprove ? 'Đồng ý' : 'Từ chối'} • {type === 'cancel' ? 'Hủy vé' : 'Đổi vé'}
              </span>
              <h2 className="text-lg font-bold text-[#27273F]">
                Thiết lập thông báo khách hàng
              </h2>
            </div>
            <button onClick={onCancel} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-[#FAFAFE] border border-[#E8E8F0] rounded-2xl p-4 mb-4 grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[#9CA3AF] block font-medium mb-0.5">Khách hàng</span>
              <span className="font-bold text-[#27273F] text-sm">{request.customer}</span>
            </div>
            <div>
              <span className="text-[#9CA3AF] block font-medium mb-0.5">Mã PNR</span>
              <span className="font-mono font-bold text-[#6C5CE7] text-sm">{request.pnrCode || request.id}</span>
            </div>
            <div>
              <span className="text-[#9CA3AF] block font-medium mb-0.5">Email</span>
              <span className="font-semibold text-slate-700 break-all">{request.email}</span>
            </div>
          </div>

          {type === 'exchange' && isApprove && (
            <div className="mb-4 bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">
                Chọn Chuyến Bay Mới Cho Khách Hàng
              </label>
              <select
                value={selectedFlightId}
                onChange={e => setSelectedFlightId(e.target.value)}
                className="w-full px-3 py-2 border border-[#E8E8F0] rounded-xl text-xs text-[#27273F] bg-white focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20 mb-3 cursor-pointer"
              >
                {flights.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.flightCode} • {f.departureAirportCode} → {f.arrivalAirportCode} • Khởi hành: {new Date(f.departureTime).toLocaleDateString('vi-VN')} {new Date(f.departureTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} ({Number(f.basePrice).toLocaleString('vi-VN')} đ)
                  </option>
                ))}
              </select>
              
              {(() => {
                const selectedFlight = flights.find(f => String(f.id) === String(selectedFlightId));
                if (!selectedFlight) return null;
                const ticketPrice = request.ticketPrice || 1500000;
                const newPrice = selectedFlight.basePrice;
                const diff = Number(newPrice) - Number(ticketPrice);
                
                return (
                  <div className="grid grid-cols-3 gap-3 border-t border-slate-200/60 pt-3 text-xs">
                    <div>
                      <span className="text-[#9CA3AF] block font-medium mb-0.5">Giá vé gốc</span>
                      <span className="font-bold text-slate-500 text-sm line-through">
                        {Number(ticketPrice).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <div>
                      <span className="text-[#9CA3AF] block font-medium mb-0.5">Giá vé mới</span>
                      <span className="font-bold text-[#27273F] text-sm">
                        {Number(newPrice).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <div>
                      <span className="text-[#9CA3AF] block font-medium mb-0.5">Chênh lệch tài chính</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                        diff > 0 
                          ? 'text-amber-700 bg-amber-50 border border-amber-200' 
                          : diff < 0 
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                            : 'text-slate-600 bg-slate-100 border border-slate-200'
                      }`}>
                        {diff > 0 
                          ? `Khách đóng thêm: +${Number(diff).toLocaleString('vi-VN')} đ` 
                          : diff < 0 
                            ? `Hoàn trả cho khách: -${Number(-diff).toLocaleString('vi-VN')} đ` 
                            : '0 đ (Bằng giá)'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Chọn kênh gửi thông báo */}
          <div className="mb-4 bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
            <label className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-wide">
              Chọn các kênh phát thông báo
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={sendEmail} 
                  onChange={e => setSendEmail(e.target.checked)} 
                  className="rounded text-[#6C5CE7] focus:ring-[#6C5CE7]/30 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-700">Email</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={sendInApp} 
                  onChange={e => setSendInApp(e.target.checked)} 
                  className="rounded text-[#6C5CE7] focus:ring-[#6C5CE7]/30 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-700">Thông báo App khách hàng</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={sendSms} 
                  onChange={e => setSendSms(e.target.checked)} 
                  className="rounded text-[#6C5CE7] focus:ring-[#6C5CE7]/30 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-700">Mobile SMS</span>
              </label>
            </div>
          </div>

          <div className="flex-1 flex flex-col space-y-3 min-h-[250px]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#6E7491] uppercase tracking-wider">
              <Mail className="w-4 h-4 text-[#6C5CE7]" /> Soạn Email Thông Báo
            </div>
            
            <div>
              <label className="text-[11px] font-semibold text-[#9CA3AF] block mb-1">Tiêu đề thư (Subject)</label>
              <input 
                type="text" 
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                className="w-full px-3 py-2 border border-[#E8E8F0] rounded-xl text-sm placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7]/40 font-medium"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="text-[11px] font-semibold text-[#9CA3AF] block mb-1">Nội dung Email</label>
              <textarea 
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
                className="w-full flex-1 p-3 border border-[#E8E8F0] rounded-xl text-xs placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7]/40 font-mono resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        <div className="w-full md:w-2/5 p-6 bg-[#FAFAFE] flex flex-col items-center justify-between border-t md:border-t-0 border-[#E8E8F0]">
          <div className="w-full flex items-center gap-1.5 text-xs font-bold text-[#6E7491] uppercase tracking-wider mb-2">
            <Smartphone className="w-4 h-4 text-[#6C5CE7]" /> Mô phỏng gửi SMS
          </div>

          <div className="w-[210px] h-[330px] bg-slate-950 rounded-[30px] p-2 shadow-xl relative border-4 border-slate-800 flex flex-col shrink-0 mb-3 select-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-950 w-20 h-3 rounded-b-xl z-20" />
            
            <div className="bg-[#ECE5DD] w-full h-full rounded-[22px] overflow-hidden flex flex-col relative border border-slate-900/10">
              <div className="h-4 bg-slate-900/10 text-[7px] text-slate-800 flex justify-between items-center px-3 pt-1 font-semibold">
                <span>03:45</span>
                <div className="flex items-center gap-0.5">
                  <span>📶</span>
                  <span>🔋</span>
                </div>
              </div>
              
              <div className="bg-slate-800 text-white h-8 px-2 flex items-center gap-1.5 shrink-0">
                <div className="w-4 h-4 rounded-full bg-[#6C5CE7] flex items-center justify-center text-[7px] font-bold">EF</div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold">EasyFlight</span>
                  <span className="text-[5px] text-slate-300">Brandname</span>
                </div>
              </div>
              
              <div className="flex-1 p-2 space-y-1.5 overflow-y-auto text-[8px] flex flex-col justify-end">
                <div className="bg-white text-slate-800 p-2 rounded-xl rounded-tl-none max-w-[95%] shadow-sm self-start break-words border border-slate-200 leading-relaxed font-sans">
                  {smsText}
                  <span className="text-[5px] text-[#9CA3AF] block text-right mt-1 font-medium">Vừa xong</span>
                </div>
              </div>

              <div className="bg-slate-100 p-1 flex gap-1 items-center shrink-0 border-t border-slate-200">
                <div className="flex-1 bg-white rounded-full h-4 border border-slate-300 px-2 flex items-center text-[6px] text-slate-400">
                  Tin nhắn văn bản...
                </div>
                <div className="w-4 h-4 rounded-full bg-[#6C5CE7] flex items-center justify-center text-white text-[7px]">
                  <Send className="w-2 h-2" />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full space-y-1 mb-3">
            <label className="text-[11px] font-semibold text-[#9CA3AF] block">Nội dung tin nhắn SMS</label>
            <textarea 
              value={smsText}
              onChange={e => setSmsText(e.target.value)}
              rows={2}
              className="w-full p-2 border border-[#E8E8F0] rounded-xl text-xs placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7]/40 font-mono leading-relaxed resize-none"
            />
          </div>

          <div className="w-full flex gap-2">
            <button 
              onClick={onCancel}
              className="flex-1 py-2 border border-[#E8E8F0] text-[#6E7491] hover:bg-[#F0EFFA] rounded-xl text-xs font-semibold transition-colors"
            >
              Hủy bỏ
            </button>
            <button 
              onClick={handleSend}
              className={`flex-1 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-md ${
                isApprove 
                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Xác nhận & Gửi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN CUSTOMER SUPPORT PAGE ──────────────────────────────────────────────
function CustomerSupportPage() {
  const [activeTab, setActiveTab] = useState('cancel');
  
  const [cancelRequests, setCancelRequests] = useState([]);
  const [exchangeRequests, setExchangeRequests] = useState([]);
  
  const [flightsList, setFlightsList] = useState([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const [dispatchModal, setDispatchModal] = useState({
    isOpen: false,
    type: '',
    action: '',
    request: null
  });

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchData = useCallback(async () => {
    setApiLoading(true);
    try {
      const [refunds, changes, bookings, flights] = await Promise.all([
        supportService.getRefundRequests(),
        supportService.getChangeRequests(),
        bookingService.getAll().catch(() => []),
        flightService.getAll().catch(() => []),
      ]);

      setFlightsList(flights);

      const ticketMap = {};
      bookings.forEach(b => {
        const fl = flights.find(f => f.id === b.flightId);
        if (b.tickets) {
          b.tickets.forEach(t => {
            ticketMap[t.ticketId] = {
              ticket: t,
              booking: b,
              flight: fl
            };
          });
        }
      });

      const mappedCancel = refunds.map(r => mapSupportToCancelRequest(r, ticketMap));
      const mappedExchange = changes.map(c => mapSupportToExchangeRequest(c, ticketMap));

      setCancelRequests(mappedCancel);
      setExchangeRequests(mappedExchange);
    } catch (err) {
      console.error("Lỗi fetch support requests từ database:", err);
      addToast("Không thể đồng bộ dữ liệu từ server. Đang hiển thị danh sách trống.", "error");
      setCancelRequests([]);
      setExchangeRequests([]);
    } finally {
      setApiLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRequestAction = (request, action) => {
    setDispatchModal({
      isOpen: true,
      type: activeTab,
      action: action,
      request: request
    });
  };

  const handleConfirmDispatch = async (emailSub, emailBody, smsText, selectedFlightId, channels = ['EMAIL', 'IN_APP']) => {
    const { type, action, request } = dispatchModal;
    if (!request) return;

    const isApprove = action === 'Đã duyệt';
    const id = Number(request.id);

    try {
      if (type === 'cancel' || type === 'exchange') {
        if (isApprove) {
          await supportService.approveRequest(id);
          
          if (type === 'exchange' && selectedFlightId) {
            const selectedFlight = flightsList.find(f => String(f.id) === String(selectedFlightId));
            const ticketPrice = request.ticketPrice || 1500000;
            const newPrice = selectedFlight ? selectedFlight.basePrice : ticketPrice;
            const diff = Number(newPrice) - Number(ticketPrice);
            
            supportService.saveLocalSupportState(id, {
              status: 'APPROVED',
              feeAmount: diff,
              newFlightCode: selectedFlight?.flightCode || 'N/A',
              newFlightDate: selectedFlight ? new Date(selectedFlight.departureTime).toLocaleDateString('vi-VN') : 'N/A',
              newFlightRoute: selectedFlight ? `${selectedFlight.departureAirportCode} → ${selectedFlight.arrivalAirportCode}` : 'N/A'
            });
          }
        } else {
          await supportService.rejectRequest(id);
        }

        // Call notificationService.create for each selected channel
        const promises = channels.map(chan => {
          let title = '';
          let content = '';
          if (chan === 'EMAIL') {
            title = emailSub;
            content = emailBody;
          } else if (chan === 'SMS') {
            title = `EF Alert PNR ${request.pnrCode || request.id}`;
            content = smsText || emailBody.slice(0, 160);
          } else { // IN_APP
            title = isApprove 
              ? `Yêu cầu ${type === 'cancel' ? 'hủy' : 'đổi'} vé đã được duyệt` 
              : `Yêu cầu ${type === 'cancel' ? 'hủy' : 'đổi'} vé bị từ chối`;
            content = `Yêu cầu của quý khách đối với vé ${request.pnrCode || request.id} đã được ${isApprove ? 'chấp thuận' : 'từ chối'}. Vui lòng kiểm tra email chi tiết.`;
          }

          return notificationService.create({
            title,
            content,
            userId: request.raw?.createdBy?.id || 1,
            type: 'BOOKING_STATUS',
            channel: chan
          }).catch(err => console.error("Lỗi gửi thông báo cho kênh", chan, err));
        });

        await Promise.all(promises);

        const channelLabels = channels.map(c => c === 'EMAIL' ? 'Email' : (c === 'SMS' ? 'SMS' : 'App')).join(' & ');
        const successMsg = isApprove
          ? `Đã duyệt yêu cầu #${id} và gửi thông báo qua ${channelLabels}!`
          : `Đã từ chối yêu cầu #${id} và gửi thông báo qua ${channelLabels}!`;

        addToast(successMsg, 'success');
      }
      await fetchData();
    } catch (err) {
      console.error(err);
      addToast('Thao tác thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setDispatchModal({ isOpen: false, type: '', action: '', request: null });
    }
  };

  return (
    <div className="space-y-5 relative">
      {/* Tabs list */}
      <div className="flex gap-0 border-b border-[#E8E8F0]">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === tab.id
                ? 'text-[#6C5CE7] border-[#6C5CE7]'
                : 'text-[#9CA3AF] border-transparent hover:text-[#6E7491]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab contents */}
      {apiLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#6C5CE7]" />
          <p className="text-xs font-semibold text-[#6E7491]">Đang đồng bộ hóa dữ liệu từ database MySQL...</p>
        </div>
      ) : (
        <>
          {activeTab === 'cancel' && (
            <CancelTab 
              requests={cancelRequests} 
              addToast={addToast} 
              onRequestAction={handleRequestAction}
            />
          )}
          {activeTab === 'exchange' && (
            <ExchangeTab 
              requests={exchangeRequests} 
              addToast={addToast} 
              onRequestAction={handleRequestAction}
            />
          )}
        </>
      )}

      {/* Global Toast Alerts */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Notification dispatching center modal */}
      <DispatchNotificationModal 
        isOpen={dispatchModal.isOpen}
        type={dispatchModal.type}
        action={dispatchModal.action}
        request={dispatchModal.request}
        flights={flightsList}
        onConfirm={handleConfirmDispatch}
        onCancel={() => setDispatchModal({ isOpen: false, type: '', action: '', request: null })}
      />
    </div>
  );
}

export default CustomerSupportPage;