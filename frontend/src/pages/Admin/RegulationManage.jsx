import { useState, useEffect } from 'react';
import { Save, X, CheckCircle, Info, Loader2, AlertCircle } from 'lucide-react';
import { regulationService } from '../../api/services/regulationService';
import { REGULATION_GROUP_COLORS as GROUP_COLORS, mapRegulation } from '../../constants/regulations';

const errMsg = (e, fallback) =>
  e?.response?.data?.message || e?.message || fallback || 'Có lỗi xảy ra';

function Toast({ msg, type, onClose }) {
  if (!msg) return null;
  const isError = type === 'error';
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white min-w-[280px] max-w-[90vw]"
      style={{ backgroundColor: isError ? '#DC2626' : '#16A34A' }}>
      {isError ? <X className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
      <span className="flex-1">{msg}</span>
      <button onClick={onClose}><X className="w-4 h-4 opacity-70" /></button>
    </div>
  );
}

export default function RegulationManage() {
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [edited, setEdited] = useState({});
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type }), 3000);
  };

  // Tải quy định từ DB
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await regulationService.getAll();
        const dbRegs = (res.data?.data || res.data || []).map(mapRegulation);
        if (mounted) setRegs(dbRegs);
      } catch (e) {
        if (mounted) setLoadError(errMsg(e, 'Không tải được danh sách quy định.'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const groups = [...new Set(regs.map(r => r.group))];
  const hasChanges = Object.keys(edited).length > 0;

  const handleChange = (id, val) => {
    const original = regs.find(r => r.id === id)?.value;
    if (val === original) {
      const next = { ...edited }; delete next[id]; setEdited(next);
    } else {
      setEdited(prev => ({ ...prev, [id]: val }));
    }
  };

  const handleSave = async () => {
    const ids = Object.keys(edited);
    let savedCount = 0, firstErr = null;
    const savedIds = new Set();
    for (const id of ids) {
      const reg = regs.find(r => r.id === id);
      if (!reg) continue;
      const payload = {
        regulationName: reg.label,
        settingKey: reg.key,
        settingValue: Number(edited[id]),
        unit: reg.unit?.trim() ? reg.unit : '-', // backend yêu cầu unit không rỗng
        description: reg.description || '',
      };
      try {
        await regulationService.update(reg.dbId, payload);
        savedIds.add(id);
        savedCount++;
      } catch (e) {
        firstErr = firstErr || errMsg(e);
      }
    }
    // Chỉ cập nhật giá trị đã lưu thành công; giữ lại các thay đổi lưu lỗi để người dùng thử lại
    setRegs(prev => prev.map(r => savedIds.has(r.id) ? { ...r, value: edited[r.id] } : r));
    setEdited(prev => Object.fromEntries(Object.entries(prev).filter(([id]) => !savedIds.has(id))));
    if (firstErr) showToast(`Có lỗi khi lưu: ${firstErr}`, 'error');
    else showToast(`Đã lưu ${savedCount} quy định vào DB.`);
  };

  const handleReset = () => { setEdited({}); showToast('Đã hoàn tác tất cả thay đổi.'); };

  return (
    <div className="space-y-5">
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: toast.type })} />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cấu hình hệ thống</h1>
          <p className="text-slate-400 text-sm mt-1">Quản lý các quy định và thông số vận hành của hệ thống</p>
        </div>
        {hasChanges && (
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
              Hoàn tác ({Object.keys(edited).length})
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors">
              <Save className="w-4 h-4" /> Lưu tất cả
            </button>
          </div>
        )}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">Các thay đổi sẽ được áp dụng ngay sau khi lưu. Vui lòng kiểm tra kỹ trước khi xác nhận.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-violet-500" /> Đang tải cấu hình...
        </div>
      )}
      {!loading && loadError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {loadError}
        </div>
      )}
      {!loading && !loadError && regs.length === 0 && (
        <p className="py-16 text-center text-sm text-slate-400">Chưa có quy định nào trong hệ thống.</p>
      )}

      {/* Groups */}
      {groups.map(group => (
        <div key={group} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${GROUP_COLORS[group] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{group}</span>
            <span className="text-xs text-slate-400">{regs.filter(r => r.group === group).length} cài đặt</span>
          </div>
          <div className="divide-y divide-slate-50">
            {regs.filter(r => r.group === group).map(reg => {
              const currentVal = edited[reg.id] !== undefined ? edited[reg.id] : reg.value;
              const isChanged = edited[reg.id] !== undefined;
              return (
                <div key={reg.id} className={`flex items-center gap-4 px-5 py-4 transition-colors ${isChanged ? 'bg-amber-50/50' : 'hover:bg-slate-50/50'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-slate-700">{reg.label}</p>
                      {isChanged && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">Đã sửa</span>}
                    </div>
                    <p className="text-xs text-slate-400">{reg.description}</p>
                    <p className="text-xs text-slate-300 mt-0.5 font-mono">{reg.key}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isChanged && (
                      <span className="text-xs text-slate-400 line-through">{reg.value}</span>
                    )}
                    <input
                      type={reg.type === 'NUMBER' ? 'number' : 'text'}
                      value={currentVal}
                      onChange={e => handleChange(reg.id, e.target.value)}
                      className={`w-24 text-center border rounded-xl px-3 py-2 text-sm font-bold outline-none transition-all ${isChanged ? 'border-amber-400 bg-amber-50 text-amber-700 focus:ring-2 focus:ring-amber-500/20' : 'border-slate-200 text-slate-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20'}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Save bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg px-6 py-4 flex items-center justify-between z-40">
          <p className="text-sm text-slate-600">{Object.keys(edited).length} thay đổi chưa được lưu</p>
          <div className="flex items-center gap-3">
            <button onClick={handleReset} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">Hoàn tác</button>
            <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors">
              <Save className="w-4 h-4" /> Lưu tất cả thay đổi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
