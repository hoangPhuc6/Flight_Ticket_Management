import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, CheckCircle, Plane } from 'lucide-react';
import { airplaneService } from '../../api/services/airplaneService';
import { airlineService } from '../../api/services/airlineService';
import { airplaneModelService } from '../../api/services/airplaneModelService';

const errMsg = (e, fallback) =>
  e?.response?.data?.message || e?.message || fallback || 'Có lỗi xảy ra';

const STATUS = [
  { value: 'ACTIVE', label: 'Hoạt động', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'MAINTENANCE', label: 'Bảo trì', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'INACTIVE', label: 'Ngừng hoạt động', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
];
const statusInfo = (v) => STATUS.find(s => s.value === v) || STATUS[0];

const mapDbAirplane = (a) => ({
  id: `db-${a.id}`,
  dbId: a.id,
  code: a.airplaneCode,
  modelName: a.model?.modelName || '—',
  modelId: a.model?.id ?? null,
  airlineName: a.airlineName || '—',
  totalSeats: a.totalSeats ?? a.model?.totalSeats ?? 0,
  status: a.status || 'ACTIVE',
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

function AirplaneModal({ initial, airlines, models, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    code: '', airlineId: airlines[0]?.id || '', modelId: models[0]?.id || '', status: 'ACTIVE',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">{initial ? 'Sửa máy bay' : 'Thêm máy bay mới'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          {(airlines.length === 0 || models.length === 0) && !initial && (
            <div className="text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg p-3">
              Cần có sẵn <b>hãng bay</b> và <b>model</b> trong DB để lưu máy bay. Hãy tạo chúng trước.
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Mã máy bay (VD: VN-A321)</label>
            <input type="text" value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="VN-A321"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 transition-all" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Hãng bay</label>
            <select value={form.airlineId} onChange={e => set('airlineId', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-400 transition-all">
              <option value="">— Chọn hãng bay —</option>
              {airlines.map(a => <option key={a.id} value={a.id}>{a.airlineCode} — {a.airlineName}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Model máy bay</label>
            <select value={form.modelId} onChange={e => set('modelId', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-400 transition-all">
              <option value="">— Chọn model —</option>
              {models.map(m => <option key={m.id} value={m.id}>{m.modelName} ({m.totalSeats} ghế)</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Trạng thái</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-400 transition-all">
              {STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
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

export default function AirplaneManage() {
  const [airplanes, setAirplanes] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [models, setModels] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | { data }
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type }), 3500);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [ap, al, md] = await Promise.all([
        airplaneService.getAll().catch(() => []),
        airlineService.getAll().catch(() => []),
        airplaneModelService.getAll().catch(() => []),
      ]);
      if (!mounted) return;
      setAirplanes((ap || []).map(mapDbAirplane));
      setAirlines(al || []);
      setModels(md || []);
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = airplanes.filter(a =>
    a.code.toLowerCase().includes(search.toLowerCase()) ||
    a.modelName.toLowerCase().includes(search.toLowerCase()) ||
    a.airlineName.toLowerCase().includes(search.toLowerCase()));

  const saveAirplane = async (form) => {
    const code = (form.code || '').trim().toUpperCase();
    if (!/^[A-Z0-9-]{2,10}$/.test(code)) {
      showToast('Mã máy bay 2-10 ký tự (A-Z, 0-9, dấu gạch ngang).', 'error');
      return;
    }

    if (!form.airlineId || !form.modelId) {
      showToast('Vui lòng chọn hãng bay và model.', 'error');
      return;
    }
    const payload = {
      airplaneCode: code,
      airlineId: Number(form.airlineId),
      modelId: Number(form.modelId),
      status: form.status,
    };

    // SỬA
    if (modal.data) {
      try {
        const saved = await airplaneService.update(modal.data.dbId, payload);
        const mapped = mapDbAirplane(saved);
        setAirplanes(prev => prev.map(a => a.id === modal.data._id ? mapped : a));
        showToast('Đã cập nhật máy bay!');
        setModal(null);
      } catch (e) { showToast(errMsg(e, 'Cập nhật máy bay thất bại.'), 'error'); }
      return;
    }

    // TẠO MỚI
    try {
      const saved = await airplaneService.create(payload);
      const mapped = mapDbAirplane(saved);
      setAirplanes(prev => {
        const rest = prev.filter(a => String(a.code).toUpperCase() !== code);
        return [...rest, mapped];
      });
      showToast('Đã thêm máy bay và lưu vào DB!');
      setModal(null);
    } catch (e) { showToast(errMsg(e, 'Thêm máy bay thất bại.'), 'error'); }
  };

  const deleteAirplane = async (id) => {
    const a = airplanes.find(x => x.id === id);
    if (a?.dbId) {
      try {
        await airplaneService.delete(a.dbId);
        setAirplanes(prev => prev.filter(x => x.id !== id));
        showToast('Đã xóa máy bay trong DB.');
      } catch (e) { showToast(errMsg(e, 'Xóa máy bay thất bại.'), 'error'); }
    } else {
      setAirplanes(prev => prev.filter(x => x.id !== id));
      showToast('Đã xóa máy bay (cục bộ).');
    }
  };

  // chuẩn bị data cho modal sửa (map id của hãng/model theo tên)
  const toEditForm = (a) => ({
    code: a.code,
    airlineId: airlines.find(x => x.airlineName === a.airlineName)?.id || '',
    modelId: a.modelId || models.find(x => x.modelName === a.modelName)?.id || '',
    status: a.status,
    _id: a.id,
    dbId: a.dbId,
  });

  return (
    <div className="space-y-5">
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: toast.type })} />
      {modal && <AirplaneModal initial={modal.data} airlines={airlines} models={models} onSave={saveAirplane} onClose={() => setModal(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Quản lý máy bay</h1>
        <p className="text-slate-400 text-sm mt-1">Quản lý đội bay theo hãng bay và model</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm máy bay, model, hãng..." className="flex-1 text-sm outline-none bg-transparent text-slate-700" />
        </div>
        <button onClick={() => setModal({ data: null })}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors whitespace-nowrap">
          <Plus className="w-4 h-4" /> Thêm máy bay
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="px-5 py-3">Mã máy bay</th><th className="px-5 py-3">Hãng bay</th><th className="px-5 py-3">Model</th><th className="px-5 py-3">Số ghế</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(a => {
              const st = statusInfo(a.status);
              return (
                <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0"><Plane className="w-4 h-4" /></span>
                      <span className="font-mono font-bold text-violet-700 text-sm">{a.code}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-700">{a.airlineName}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{a.modelName}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{a.totalSeats} ghế</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModal({ data: toEditForm(a) })} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteAirplane(a.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">Không tìm thấy máy bay nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
