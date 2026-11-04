import React from 'react';
import { Shield, Sparkles, KeyRound, Loader2, Check, X } from 'lucide-react';
import PasswordInput from './PasswordInput';

// Password strength evaluator
function getPasswordStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: '', width: '0%' };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { score, label: 'Rất yếu', color: 'bg-rose-500', width: '20%' };
  if (score === 2) return { score, label: 'Yếu', color: 'bg-orange-500', width: '40%' };
  if (score === 3) return { score, label: 'Trung bình', color: 'bg-amber-500', width: '60%' };
  if (score === 4) return { score, label: 'Mạnh', color: 'bg-blue-500', width: '80%' };
  return { score, label: 'Rất mạnh', color: 'bg-emerald-500', width: '100%' };
}

export default function SecurityTab({
  pwdForm,
  setPwdForm,
  onChangePassword,
  isChangingPwd
}) {
  const strength = getPasswordStrength(pwdForm.newPassword);
  const isMatch = pwdForm.newPassword && pwdForm.confirmPassword && pwdForm.newPassword === pwdForm.confirmPassword;
  const isMismatch = pwdForm.newPassword && pwdForm.confirmPassword && pwdForm.newPassword !== pwdForm.confirmPassword;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Đổi mật khẩu & Bảo mật</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Cập nhật mật khẩu định kỳ để bảo vệ tài khoản và lịch trình bay của bạn.
          </p>
        </div>
        <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
          <Shield className="w-5 h-5" />
        </span>
      </div>

      <form onSubmit={onChangePassword} className="max-w-xl space-y-5">
        {/* Mật khẩu cũ */}
        <PasswordInput
          label="Mật khẩu hiện tại *"
          placeholder="Nhập mật khẩu bạn đang dùng"
          value={pwdForm.oldPassword}
          onChange={(e) => setPwdForm({ ...pwdForm, oldPassword: e.target.value })}
        />

        {/* Mật khẩu mới */}
        <div>
          <PasswordInput
            label="Mật khẩu mới *"
            placeholder="Tối thiểu 6 ký tự"
            value={pwdForm.newPassword}
            onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
          />

          {/* Password Strength Indicator */}
          {pwdForm.newPassword && (
            <div className="mt-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500 font-medium">Độ bảo mật:</span>
                <span className="font-bold text-slate-700">{strength.label}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${strength.color}`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Mẹo: Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt (@, #, $) để tăng tính bảo mật.
              </p>
            </div>
          )}
        </div>

        {/* Nhập lại mật khẩu mới */}
        <div>
          <PasswordInput
            label="Xác nhận mật khẩu mới *"
            placeholder="Nhập lại chính xác mật khẩu mới"
            value={pwdForm.confirmPassword}
            onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
          />
          {isMatch && (
            <p className="text-xs mt-1.5 flex items-center gap-1.5 font-medium text-emerald-600">
              <Check className="w-3.5 h-3.5" /> Mật khẩu xác nhận trùng khớp
            </p>
          )}
          {isMismatch && (
            <p className="text-xs mt-1.5 flex items-center gap-1.5 font-medium text-rose-600">
              <X className="w-3.5 h-3.5" /> Mật khẩu xác nhận chưa khớp
            </p>
          )}
        </div>

        {/* Security tips card */}
        <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Tiêu chuẩn mật khẩu an toàn:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-800/90 pl-1">
            <li>Tối thiểu từ 6 đến 20 ký tự theo quy định hệ thống.</li>
            <li>Không sử dụng ngày sinh, số điện thoại hoặc mật khẩu đã dùng trước đó.</li>
            <li>Sau khi đổi thành công, bạn có thể tiếp tục sử dụng phiên đăng nhập hiện tại.</li>
          </ul>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isChangingPwd}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-60 transition-all cursor-pointer"
          >
            {isChangingPwd ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang cập nhật mật khẩu...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Cập nhật mật khẩu mới</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

