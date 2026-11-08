import React from 'react';
import { Bell, Loader2 } from 'lucide-react';

export default function PreferencesTab({ preferences, setPreferences, onSave, isSaving = false }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Cài đặt & Tùy chọn thông báo</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Tùy chỉnh các kênh nhận thông báo cập nhật chuyến bay và ưu đãi.
          </p>
        </div>
        <span className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
          <Bell className="w-5 h-5" />
        </span>
      </div>

      <div className="space-y-6">
        {/* Option 1 */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div>
            <p className="font-semibold text-slate-800 text-sm">
              Vé điện tử & Xác nhận thanh toán qua Email
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Tự động gửi file vé điện tử và hóa đơn đến hộp thư của bạn.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.emailNotifications}
              onChange={(e) =>
                setPreferences({ ...preferences, emailNotifications: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Option 2 */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div>
            <p className="font-semibold text-slate-800 text-sm">
              Cảnh báo Delay / Đổi giờ bay qua SMS & Email
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhận tin nhắn khẩn cấp khi chuyến bay bị hoãn hoặc thay đổi cổng ra máy bay.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.smsAlerts}
              onChange={(e) =>
                setPreferences({ ...preferences, smsAlerts: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Option 3 */}
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-semibold text-slate-800 text-sm">
              Mã giảm giá & Khuyến mãi EasyFlight
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhận thông báo sớm nhất các đợt flash sale vé 0 đồng và voucher độc quyền.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.promoEmails}
              onChange={(e) =>
                setPreferences({ ...preferences, promoEmails: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-60 transition-all cursor-pointer"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? 'Đang lưu...' : 'Lưu cài đặt tùy chọn'}
          </button>
        </div>
      </div>
    </div>
  );
}

