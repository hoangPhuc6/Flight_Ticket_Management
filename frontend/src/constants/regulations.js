// Nhóm hiển thị cho từng quy định (backend không lưu nhóm, chỉ lưu settingKey)
export const REGULATION_GROUP_BY_KEY = {
  min_flight_duration: 'Chuyến bay',
  max_stops: 'Chuyến bay',
  min_stop_duration: 'Chuyến bay',
  max_stop_duration: 'Chuyến bay',
  cancel_before_hours: 'Đặt vé',
  max_tickets_per_booking: 'Đặt vé',
  payment_timeout_minutes: 'Thanh toán',
  refund_percent: 'Thanh toán',
};

export const OTHER_REGULATION_GROUP = 'Cấu hình khác';

export const REGULATION_GROUP_COLORS = {
  'Chuyến bay': 'bg-violet-50 text-violet-700 border-violet-200',
  'Đặt vé': 'bg-blue-50 text-blue-700 border-blue-200',
  'Thanh toán': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

// RegulationResponse (DB) -> shape dùng trong UI
export const mapRegulation = (r) => ({
  id: `db-${r.id}`,
  dbId: r.id,
  group: REGULATION_GROUP_BY_KEY[r.settingKey] || OTHER_REGULATION_GROUP,
  key: r.settingKey,
  label: r.regulationName,
  value: String(r.settingValue ?? ''),
  type: 'NUMBER',
  description: r.description || '',
  unit: r.unit || '',
});
