import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, CheckCircle } from 'lucide-react';
import { airportService } from '../../api/services/airportService';

const errMsg = (e, fallback) =>
  e?.response?.data?.message || e?.message || fallback || 'Có lỗi xảy ra';

const mapDbAirport = (a) => ({
  id: `db-${a.id}`,
  dbId: a.id,
  code: a.airportCode,
  name: a.name,
  city: a.city,
  country: a.country,
  terminals: 1,
  status: 'ACTIVE',
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

function AirportModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { code: '', name: '', city: '', country: 'Việt Nam', terminals: 1, status: 'ACTIVE' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">{initial ? 'Sửa sân bay' : 'Thêm sân bay mới'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          {[['code', 'Mã IATA (VD: SGN)', 'text'], ['name', 'Tên sân bay', 'text'], ['city', 'Thành phố', 'text'], ['country', 'Quốc gia', 'text']].map(([k, placeholder, type]) => (
            <div key={k}>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">{placeholder}</label>
              <input type={type} value={form[k]} onChange={e => set(k, e.target.value)} placeholder={placeholder}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 transition-all" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Số nhà ga</label>
              <input type="number" min={1} value={form.terminals} onChange={e => set('terminals', +e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-400 transition-all" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Trạng thái</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-400 transition-all">
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Ngừng hoạt động</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">Hủy</button>
          <button onClick={() => onSave(form)} className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors">Lưu</button>
        </div>
      </div>
    </div>
  );
}

export default function AirportManage() {
  const [airports, setAirports] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | { data }
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type }), 3000);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const db = (await airportService.getAll()).map(mapDbAirport);
        if (mounted) setAirports(db);
      } catch {
        // API lỗi -> để trống
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = airports.filter(a =>
    a.code.toLowerCase().includes(search.toLowerCase()) ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.city.toLowerCase().includes(search.toLowerCase()));

  const saveAirport = async (form) => {
    // Validate cơ bản phía client (dùng chung cho thêm và sửa)
    const code = (form.code || '').trim().toUpperCase();
    if (!code || !form.name?.trim() || !form.city?.trim() || !form.country?.trim()) {
      showToast('Vui lòng nhập đầy đủ Mã IATA, Tên, Thành phố, Quốc gia.', 'error');
      return;
    }
    if (!/^[A-Z]{3}$/.test(code)) {
      showToast('Mã IATA phải gồm đúng 3 chữ cái (VD: SGN).', 'error');
      return;
    }
    const payload = {
      airportCode: code,
      name: form.name.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
    };

    // SỬA
    if (modal.data) {
      try {
        const saved = await airportService.update(modal.data.dbId, payload);
        // terminals/status chưa có trong DB -> giữ giá trị trên form
        const mapped = { ...mapDbAirport(saved), terminals: form.terminals, status: form.status };
        setAirports(prev => prev.map(a => a.id === modal.data.id ? mapped : a));
        showToast('Đã cập nhật sân bay!');
        setModal(null);
      } catch (e) {
        showToast(errMsg(e, 'Cập nhật sân bay thất bại.'), 'error');
      }
      return;
    }

    // TẠO MỚI
    try {
      const saved = await airportService.create(payload);
      const mapped = { ...mapDbAirport(saved), terminals: form.terminals, status: form.status };
      setAirports(prev => {
        const rest = prev.filter(a => String(a.code).toUpperCase() !== code);
        return [...rest, mapped];
      });
      showToast('Đã thêm sân bay mới và lưu vào DB!');
      setModal(null);
    } catch (e) {
      showToast(errMsg(e, 'Thêm sân bay thất bại.'), 'error');
    }
  };

  const deleteAirport = async (id) => {
    const a = airports.find(x => x.id === id);
    if (a?.dbId) {
      try {
        await airportService.delete(a.dbId);
        setAirports(prev => prev.filter(x => x.id !== id));
        showToast('Đã xóa sân bay trong DB.');
      } catch (e) { showToast(errMsg(e, 'Xóa sân bay thất bại.'), 'error'); }
    } else {
      setAirports(prev => prev.filter(x => x.id !== id));
      showToast('Đã xóa sân bay (cục bộ).');
    }
  };

  return (
    <div className="space-y-5">
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: toast.type })} />
      {modal && <AirportModal initial={modal.data} onSave={saveAirport} onClose={() => setModal(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Quản lý sân bay</h1>
        <p className="text-slate-400 text-sm mt-1">Thêm và quản lý các sân bay trong hệ thống</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sân bay..." className="flex-1 text-sm outline-none bg-transparent text-slate-700" />
        </div>
        <button onClick={() => setModal({ data: null })}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors whitespace-nowrap">
          <Plus className="w-4 h-4" /> Thêm sân bay
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="px-5 py-3">Mã IATA</th><th className="px-5 py-3">Tên sân bay</th><th className="px-5 py-3">Thành phố</th><th className="px-5 py-3">Quốc gia</th><th className="px-5 py-3">Nhà ga</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-5 py-3.5"><span className="font-mono font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded text-sm">{a.code}</span></td>
                <td className="px-5 py-3.5 text-sm font-medium text-slate-700">{a.name}</td>
                <td className="px-5 py-3.5 text-sm text-slate-600">{a.city}</td>
                <td className="px-5 py-3.5 text-sm text-slate-600">{a.country}</td>
                <td className="px-5 py-3.5 text-sm text-slate-600">{a.terminals} nhà ga</td>
                <td className="px-5 py-3.5">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${a.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    {a.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setModal({ data: a })} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteAirport(a.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">Không tìm thấy sân bay nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
