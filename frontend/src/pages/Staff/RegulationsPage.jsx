import { Info, ShieldAlert, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { regulationService } from '../../api/services/regulationService';
import { REGULATION_GROUP_COLORS as GROUP_COLORS, mapRegulation } from '../../constants/regulations';

export default function RegulationsPage() {
  const { data: dbRegs, loading, error } = useApi(regulationService.getAll, []);

  const regs = (Array.isArray(dbRegs) ? dbRegs : []).map(r => {
    const reg = mapRegulation(r);
    return { ...reg, description: reg.description || `Đơn vị tính: ${reg.unit || '—'}` };
  });

  const groups = [...new Set(regs.map(r => r.group))];

  if (loading && !dbRegs) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
        <p className="text-sm text-slate-500 font-medium">Đang tải cấu hình hệ thống...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cấu hình hệ thống</h1>
          <p className="text-slate-400 text-sm mt-1">Xem các quy định và thông số vận hành của hệ thống</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold">
          <Lock className="w-4 h-4" /> Chế độ chỉ xem
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-700 leading-relaxed">
          <p className="font-semibold mb-0.5">Quyền truy cập hạn chế (Chỉ xem)</p>
          <p className="text-xs text-blue-600">
            Tài khoản của bạn là tài khoản <strong className="text-blue-800">Nhân viên (Staff)</strong>. Bạn chỉ có quyền xem cấu hình vận hành hiện tại và không thể chỉnh sửa. Nếu cần thay đổi, vui lòng liên hệ Quản trị viên (Admin).
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}
      {!error && regs.length === 0 && (
        <p className="py-16 text-center text-sm text-slate-400">Chưa có quy định nào trong hệ thống.</p>
      )}

      {/* Groups */}
      <div className="space-y-5">
        {groups.map(group => (
          <div key={group} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${GROUP_COLORS[group] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {group}
              </span>
              <span className="text-xs text-slate-400">
                {regs.filter(r => r.group === group).length} thiết lập vận hành
              </span>
            </div>
            
            <div className="divide-y divide-slate-50">
              {regs.filter(r => r.group === group).map(reg => (
                <div key={reg.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{reg.label}</p>
                    <p className="text-xs text-slate-400 mt-1">{reg.description}</p>
                    <p className="text-[10px] text-slate-300 mt-1 font-mono uppercase tracking-wider bg-slate-100 w-fit px-1.5 py-0.5 rounded">
                      {reg.key}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                    <input
                      type={reg.type === 'NUMBER' ? 'number' : 'text'}
                      value={reg.value}
                      disabled
                      readOnly
                      className="w-28 text-center border border-slate-200 bg-slate-50 text-slate-500 rounded-xl px-3 py-2 text-sm font-bold outline-none cursor-not-allowed select-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Audit Log / Note */}
      <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Tuân thủ & Bảo mật</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Các tham số cấu hình trên đây quy định trực tiếp hoạt động thương mại và khai thác bay. Mọi hành động chỉnh sửa của Quản trị viên đều được ghi log chi tiết và đồng bộ hóa tự động theo tiêu chuẩn an toàn hàng không.
          </p>
        </div>
      </div>
    </div>
  );
}
