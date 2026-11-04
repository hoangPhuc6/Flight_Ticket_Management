import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plane, ChevronRight, ArrowRight, Loader2 } from 'lucide-react';

export default function BookingsTab({ myBookings, loadingBookings }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Chuyến bay gần đây</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Xem tổng quan các hành trình và trạng thái vé bạn đã đặt.
          </p>
        </div>
        <Link
          to="/customer/my-flights"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loadingBookings ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          <span className="text-sm">Đang tải lịch sử chuyến bay...</span>
        </div>
      ) : myBookings.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Plane className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1">Bạn chưa có chuyến bay nào</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto mb-5">
            Hãy tìm kiếm những hành trình tuyệt vời và đặt vé ngay cùng EasyFlight.
          </p>
          <button
            type="button"
            onClick={() => navigate('/customer/home')}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
          >
            Khám phá chuyến bay ngay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {myBookings.slice(0, 5).map((b) => (
            <div
              key={b.bookingId}
              className="p-4 rounded-xl border border-slate-200/80 hover:border-blue-200 hover:shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs shrink-0">
                  ✈️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {b.departureAirportCode || 'SGN'} → {b.arrivalAirportCode || 'HAN'}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-semibold text-slate-600">{b.flightCode}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                      {b.pnrCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Khởi hành: {b.departureTime ? new Date(b.departureTime).toLocaleDateString('vi-VN') : '—'}
                    {b.tickets?.length ? ` · ${b.tickets.length} hành khách` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  b.status === 'PAID' || b.status === 'CONFIRMED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : b.status === 'CANCELLED'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {b.status === 'PAID'
                    ? 'Đã thanh toán'
                    : b.status === 'CONFIRMED'
                    ? 'Đã xác nhận'
                    : b.status === 'CANCELLED'
                    ? 'Đã hủy'
                    : 'Chờ xác nhận'}
                </span>

                <Link
                  to="/customer/my-flights"
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}

          <div className="pt-2 text-center">
            <Link
              to="/customer/my-flights"
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Xem toàn bộ {myBookings.length} chuyến bay trong mục Chuyến bay của tôi <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

