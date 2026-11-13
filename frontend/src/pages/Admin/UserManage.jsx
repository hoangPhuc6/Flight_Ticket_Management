import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, CheckCircle, Shield, UserCheck } from 'lucide-react';
import { staffService } from '../../api/services/staffService';

const ROLE_STYLE = { ADMIN: 'bg-red-50 text-red-700 border border-red-200', STAFF: 'bg-violet-50 text-violet-700 border border-violet-200', AGENT: 'bg-blue-50 text-blue-700 border border-blue-200' };
const ROLE_LABEL = { ADMIN: 'Quản trị viên', STAFF: 'Nhân viên', AGENT: 'Đại lý' };
const DEPTS = ['Ban Giám đốc', 'Vận hành mặt đất', 'Check-in', 'Chăm sóc khách hàng', 'Đặt vé', 'Bảo trì'];

const errMsg = (e, fallback) =>
  e?.response?.data?.message || e?.message || fallback || 'Có lỗi xảy ra';

// StaffResponse (DB) -> shape dùng trong bảng
const mapDbStaff = (s) => ({
  id: `db-${s.id}`,
  dbId: s.id,
  fullName: s.fullName,
  email: s.email,
  phone: s.phoneNumber,
  role: 'STAFF',
  department: s.department,
  status: s.status,
  joinDate: s.hireDate,
  hireDate: s.hireDate, // form sửa đọc field này
  lastLogin: '—',
  staffCode: s.staffCode,
});

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

function StaffModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { fullName: '', email: '', phone: '', role: 'STAFF', department: DEPTS[0], status: 'ACTIVE', staffCode: '', hireDate: '' });
  const [pwd, setPwd] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">{initial ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          {[['fullName', 'Họ và tên', 'text'], ['email', 'Email', 'email'], ['phone', 'Số điện thoại', 'text']].map(([k, lbl, type]) => (
            <div key={k}>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">{lbl}</label>
              <input type={type} value={form[k]} onChange={e => set(k, e.target.value)} placeholder={lbl}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 transition-all" />
            </div>
          ))}
          {!initial && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Mật khẩu</label>
              <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Nhập mật khẩu"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-400 transition-all" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Mã nhân viên</label>
              <input type="number" min={1} value={form.staffCode} onChange={e => set('staffCode', e.target.value)} placeholder="VD: 1001"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-400 transition-all" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Ngày vào làm</label>
              <input type="date" value={form.hireDate} onChange={e => set('hireDate', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-400 transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Vai trò</label>
              <select value={form.role} onChange={e => set('role', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-400 transition-all">
                <option value="ADMIN">Quản trị viên</option>
                <option value="STAFF">Nhân viên</option>
                <option value="AGENT">Đại lý</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Trạng thái</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-400 transition-all">
                <option value="ACTIVE">Đang làm việc</option>
                <option value="INACTIVE">Nghỉ việc</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Phòng ban</label>
            <select value={form.department} onChange={e => set('department', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-400 transition-all">
              {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">Hủy</button>
          <button onClick={() => onSave({ ...form, password: pwd })} disabled={!form.fullName || !form.email} className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Lưu</button>
        </div>
      </div>
    </div>
  );
}

export default function UserManage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type }), 3000);
  };

  // Tải nhân viên từ DB
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await staffService.getAll();
        const dbStaff = (res.data?.data || res.data || []).map(mapDbStaff);
        if (mounted) setStaff(dbStaff);
      } catch (e) {
        if (mounted) setLoadError(errMsg(e, 'Không tải được danh sách nhân viên.'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = staff.filter(s => {
    const matchSearch = s.fullName.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()) || s.department.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || s.role === roleFilter;
    return matchSearch && matchRole;
  });

  const saveStaff = async (form) => {
    const phoneNumber = (form.phone || '').replace(/\s+/g, '');
    const basePayload = {
      fullName: (form.fullName || '').trim(),
      email: (form.email || '').trim(),
      phoneNumber,
      staffCode: Number(form.staffCode),
      department: form.department,
      hireDate: form.hireDate,
      status: form.status,
    };

    // SỬA
    if (modal.data) {
      try {
        // password @NotBlank ở DTO nhưng update không dùng tới -> gửi placeholder
        const res = await staffService.update(modal.data.dbId, { ...basePayload, password: form.password?.trim() || 'unchanged' });
        const mapped = { ...mapDbStaff(res.data), id: modal.data.id, role: form.role, lastLogin: modal.data.lastLogin };
        setStaff(prev => prev.map(s => s.id === modal.data.id ? mapped : s));
        showToast('Đã cập nhật nhân viên!');
        setModal(null);
      } catch (e) { showToast(errMsg(e, 'Cập nhật nhân viên thất bại.'), 'error'); }
      return;
    }

    // TẠO MỚI
    if (!basePayload.fullName || !basePayload.email || !form.password?.trim() || !phoneNumber || !form.staffCode || !form.hireDate) {
      showToast('Vui lòng nhập đủ: Họ tên, Email, Mật khẩu, SĐT, Mã NV, Ngày vào làm.', 'error');
      return;
    }
    try {
      const res = await staffService.create({ ...basePayload, password: form.password.trim() });
      const mapped = { ...mapDbStaff(res.data), role: form.role };
      setStaff(prev => {
        const rest = prev.filter(s => String(s.email).toLowerCase() !== mapped.email.toLowerCase());
        return [...rest, mapped];
      });
      showToast('Đã thêm nhân viên và lưu vào DB!');
      setModal(null);
    } catch (e) { showToast(errMsg(e, 'Thêm nhân viên thất bại.'), 'error'); }
  };

  const deactivate = async (id) => {
    const s = staff.find(x => x.id === id);
    if (!s) return;
    try {
      await staffService.update(s.dbId, {
        fullName: s.fullName,
        email: s.email,
        password: 'unchanged',
        phoneNumber: (s.phone || '').replace(/\s+/g, ''),
        staffCode: Number(s.staffCode),
        department: s.department,
        hireDate: s.joinDate,
        status: 'INACTIVE',
      });
      setStaff(prev => prev.map(x => x.id === id ? { ...x, status: 'INACTIVE' } : x));
      showToast('Đã vô hiệu hóa tài khoản.');
    } catch (e) { showToast(errMsg(e, 'Thao tác thất bại.'), 'error'); }
  };

  const counts = { ALL: staff.length, ADMIN: staff.filter(s => s.role === 'ADMIN').length, STAFF: staff.filter(s => s.role === 'STAFF').length, AGENT: staff.filter(s => s.role === 'AGENT').length };

  return (
    <div className="space-y-5">
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: toast.type })} />
      {modal && <StaffModal initial={modal.data} onSave={saveStaff} onClose={() => setModal(null)} />}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý nhân viên</h1>
          <p className="text-slate-400 text-sm mt-1">Thêm, phân quyền và quản lý tài khoản nhân viên</p>
        </div>
        <button onClick={() => setModal({ data: null })} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors">
          <Plus className="w-4 h-4" /> Thêm nhân viên
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[['Tổng nhân viên', staff.length, 'bg-violet-50 text-violet-700'], ['Đang làm việc', staff.filter(s => s.status === 'ACTIVE').length, 'bg-emerald-50 text-emerald-700'], ['Quản trị viên', counts.ADMIN, 'bg-red-50 text-red-700'], ['Đại lý', counts.AGENT, 'bg-blue-50 text-blue-700']].map(([lbl, val, cls]) => (
          <div key={lbl} className={`rounded-xl p-4 ${cls}`}>
            <p className="text-2xl font-bold">{val}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{lbl}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2 w-full md:max-w-md bg-white border border-slate-200 rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm nhân viên, email, phòng ban..." className="flex-1 text-sm outline-none bg-transparent text-slate-700 w-full" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[['ALL', 'Tất cả'], ['ADMIN', 'Quản trị viên'], ['STAFF', 'Nhân viên'], ['AGENT', 'Đại lý']].map(([val, lbl]) => (
            <button key={val} onClick={() => setRoleFilter(val)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${roleFilter === val ? 'bg-violet-600 text-white border-violet-600' : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300'}`}>
              {lbl} ({counts[val] ?? filtered.length})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="px-5 py-3">Nhân viên</th><th className="px-5 py-3">Vai trò</th><th className="px-5 py-3">Phòng ban</th><th className="px-5 py-3">Ngày vào làm</th><th className="px-5 py-3">Đăng nhập gần nhất</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {(loading || loadError || filtered.length === 0) && (
              <tr>
                <td colSpan={7} className={`px-5 py-12 text-center text-sm ${loadError ? 'text-red-600' : 'text-slate-400'}`}>
                  {loading ? 'Đang tải danh sách nhân viên...' : loadError || 'Không có nhân viên nào.'}
                </td>
              </tr>
            )}
            {filtered.map(s => (
              <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-5 py-3.5 max-w-[200px]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 text-sm font-bold flex items-center justify-center shrink-0">{s.fullName.charAt(0)}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{s.fullName}</p>
                      <p className="text-xs text-slate-400 truncate">{s.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${ROLE_STYLE[s.role]}`}>{ROLE_LABEL[s.role]}</span>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-600">{s.department}</td>
                <td className="px-5 py-3.5 text-sm text-slate-600">{new Date(s.joinDate).toLocaleDateString('vi-VN')}</td>
                <td className="px-5 py-3.5 text-xs text-slate-400">{s.lastLogin}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    {s.status === 'ACTIVE' ? 'Đang làm việc' : 'Nghỉ việc'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setModal({ data: s })} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors" title="Sửa"><Edit2 className="w-3.5 h-3.5" /></button>
                    {s.status === 'ACTIVE' && (
                      <button onClick={() => deactivate(s.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Vô hiệu hóa"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
