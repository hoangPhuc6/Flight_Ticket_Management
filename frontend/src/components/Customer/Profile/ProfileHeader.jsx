import React from 'react';
import { Mail, Phone, Check, ShieldCheck } from 'lucide-react';

export default function ProfileHeader({ profileForm, currentUser, stats }) {
  const avatarLetter = (profileForm.fullName || currentUser.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 mb-8 relative overflow-hidden">
      {/* Subtle decorative background circles */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-32 -bottom-20 w-80 h-80 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar circle */}
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-3xl sm:text-4xl font-extrabold shadow-inner text-white uppercase">
              {avatarLetter}
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 border-2 border-white rounded-full">
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {profileForm.fullName || 'Khách hàng EasyFlight'}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${stats.tierBadge}`}>
                {stats.tier}
              </span>
            </div>
            <p className="text-blue-100 text-sm flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 opacity-80" />
              {currentUser.email || 'Chưa liên kết email'}
              <span className="inline-flex items-center gap-1 text-[11px] bg-white/15 px-2 py-0.5 rounded-md font-medium text-emerald-200">
                <ShieldCheck className="w-3 h-3" /> Đã xác thực
              </span>
            </p>
            {profileForm.phoneNumber && (
              <p className="text-blue-100 text-xs flex items-center gap-2 mt-1">
                <Phone className="w-3 h-3 opacity-80" />
                {profileForm.phoneNumber}
              </p>
            )}
          </div>
        </div>

        {/* Quick stats banner */}
        <div className="flex items-center gap-4 sm:gap-6 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3.5 rounded-2xl self-stretch md:self-auto justify-around">
          <div className="text-center">
            <span className="block text-2xl font-black">{stats.total}</span>
            <span className="text-xs text-blue-100 font-medium">Chuyến bay</span>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center">
            <span className="block text-2xl font-black text-amber-300">
              {stats.miles.toLocaleString()}
            </span>
            <span className="text-xs text-blue-100 font-medium">Dặm EasyMiles</span>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center">
            <span className="block text-2xl font-black text-emerald-300">
              {stats.confirmedCount}
            </span>
            <span className="text-xs text-blue-100 font-medium">Đã hoàn thành</span>
          </div>
        </div>
      </div>
    </div>
  );
}

