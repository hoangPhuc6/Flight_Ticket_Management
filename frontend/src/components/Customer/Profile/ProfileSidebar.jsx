import React from 'react';
import { Link } from 'react-router-dom';
import { User, KeyRound, Plane, Bell, ChevronRight } from 'lucide-react';

export default function ProfileSidebar({ activeTab, setActiveTab, totalBookings }) {
  const tabs = [
    { id: 'info', label: 'Thông tin cá nhân', icon: User },
    { id: 'security', label: 'Đổi mật khẩu & Bảo mật', icon: KeyRound },
    { id: 'bookings', label: `Lịch sử bay (${totalBookings || 0})`, icon: Plane },
    { id: 'preferences', label: 'Tùy chọn & Thông báo', icon: Bell }
  ];

  return (
    <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm sticky top-28">
      <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
        Quản lý tài khoản
      </div>

      <div className="space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100">
        <Link
          to="/customer/my-flights"
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Plane className="w-3.5 h-3.5" /> Quản lý vé của tôi
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

