import React, { useMemo } from 'react';
import { OrderDraft } from '../types/pharmacy';
import {
  getMonthlyOrderStats,
  getPharmacyDistribution,
  getCompanyOrderStats,
} from '../utils/dashboardCalculations';
import { formatCurrency } from '../utils/orderCalculations';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  Building,
  Package,
  Gift,
  Coins,
  FileCheck,
  ShoppingBag,
  Activity,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  drafts: OrderDraft[];
  onOpenDraft: (id: string) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  drafts,
  onOpenDraft,
}) => {
  const monthlyData = useMemo(() => getMonthlyOrderStats(drafts), [drafts]);
  const pharmacyData = useMemo(() => getPharmacyDistribution(drafts), [drafts]);
  const companyData = useMemo(() => getCompanyOrderStats(drafts), [drafts]);

  // Overall KPI stats
  const totalOrders = drafts.length;
  const totalAmountAll = drafts.reduce((sum, d) => {
    const s = d.items.reduce((iSum, it) => iSum + it.unitPrice * (it.quantity || 0), 0);
    const disc = s * (Math.max(0, Math.min(100, d.discountPercent || 0)) / 100);
    return sum + (s - disc);
  }, 0);

  const totalPaidUnitsAll = drafts.reduce(
    (sum, d) => sum + d.items.reduce((iSum, it) => iSum + (it.quantity || 0), 0),
    0
  );

  const totalBonusUnitsAll = drafts.reduce(
    (sum, d) => sum + d.items.reduce((iSum, it) => iSum + (it.freeBonusUnits || 0), 0),
    0
  );

  const activePharmaciesCount = pharmacyData.length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xl border border-emerald-200/60">
            📊
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              لوحة التحليلات والإحصائيات الصيدلانية
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة شهرية دقيقة لنشاط طلبيات الأدوية، الإيرادات، وتوزيع المشتريات حسب الصيدليات والشركات
            </p>
          </div>
        </div>
        <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-emerald-600" />
          <span>تحديث إحصائي فوري مع كل مسودة</span>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold block mb-1">
              إجمالي عدد الطلبيات
            </span>
            <div className="text-2xl font-black text-slate-900">
              <span className="font-mono">{totalOrders}</span>{' '}
              <span className="text-xs font-normal text-slate-400">طلبية</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-bold mt-1 block">
              عبر {activePharmaciesCount} صيدلية معتمدة
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Total Commercial Value */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold block mb-1">
              إجمالي القيمة المالية
            </span>
            <div className="text-xl font-black text-emerald-800">
              {formatCurrency(totalAmountAll)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-1 block">
              صافي الفواتير بعد الخصم
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        {/* Units Ordered */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold block mb-1">
              العلب الدوائية المطلوبة
            </span>
            <div className="text-2xl font-black text-slate-900">
              <span className="font-mono">{totalPaidUnitsAll.toLocaleString('en-US')}</span>{' '}
              <span className="text-xs font-normal text-slate-400">علبة</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
              مجموع الطرود والعلب
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Free Bonus Gifts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold block mb-1">
              بونص الأدوية المجاني
            </span>
            <div className="text-2xl font-black text-rose-700">
              +<span className="font-mono">{totalBonusUnitsAll.toLocaleString('en-US')}</span>{' '}
              <span className="text-xs font-normal text-rose-500">علبة مجاناً</span>
            </div>
            <span className="text-[11px] text-rose-600 font-bold mt-1 block">
              وفورات البونص المكتسبة 🎁
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
            <Gift className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Orders Volume & Value */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              تطور عدد الطلبيات في الشهر
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">آخر 6 أشهر</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: any, name?: any) => [
                    name === 'orderCount' ? `${value} طلبية` : formatCurrency(Number(value)),
                    name === 'orderCount' ? 'عدد الطلبيات' : 'إجمالي القيمة',
                  ]}
                  labelStyle={{ textAlign: 'right', fontWeight: 'bold' }}
                  contentStyle={{
                    backgroundColor: '#062014',
                    borderRadius: '12px',
                    color: '#fff',
                    border: '1px solid #c9a227',
                    fontSize: '12px',
                    direction: 'rtl',
                  }}
                />
                <Legend
                  formatter={(value) => (value === 'orderCount' ? 'عدد الطلبيات' : 'العلب المطلوبة')}
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <Bar
                  dataKey="orderCount"
                  name="orderCount"
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Orders Distribution by Pharmacy (Requested specifically by user!) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-700" />
              توزيع الطلبيات حسب الصيدليات
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              {pharmacyData.length} صيدلية
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pharmacyData}
                    dataKey="orderCount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {pharmacyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#10b981'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => [
                      `${val} طلبية (${formatCurrency(item.payload.totalAmount)})`,
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: '#062014',
                      borderRadius: '12px',
                      color: '#fff',
                      border: '1px solid #c9a227',
                      fontSize: '12px',
                      direction: 'rtl',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* List breakdown of pharmacies */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
              {pharmacyData.map((p, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="font-bold text-slate-800 truncate" title={p.name}>
                      {p.name}
                    </span>
                  </div>
                  <div className="text-left font-bold text-emerald-800">
                    <span className="font-mono">{p.orderCount}</span> طلبية
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Charts Row: Top Companies & Value Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Top Pharmaceutical Companies */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-700" />
              أكثر الشركات الدوائية طلباً (حسب عدد العلب)
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">أعلى 8 شركات</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={companyData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  type="category"
                  dataKey="company"
                  tick={{ fontSize: 11, fill: '#334155' }}
                  width={75}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: any) => [`${val} علبة`, 'الكمية']}
                  contentStyle={{
                    backgroundColor: '#062014',
                    borderRadius: '12px',
                    color: '#fff',
                    border: '1px solid #c9a227',
                    fontSize: '12px',
                    direction: 'rtl',
                  }}
                />
                <Bar dataKey="unitCount" fill="#f59e0b" radius={[0, 8, 8, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Monthly Spending Trend (Area Chart) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Coins className="w-4 h-4 text-teal-700" />
              منحنى الإنفاق المالي الشهري
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">بالليرة السورية</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}K`)}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), 'القيمة الإجمالية']}
                  contentStyle={{
                    backgroundColor: '#062014',
                    borderRadius: '12px',
                    color: '#fff',
                    border: '1px solid #c9a227',
                    fontSize: '12px',
                    direction: 'rtl',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalAmount"
                  stroke="#0d9488"
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders Quick Access Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          📋 سجل الطلبيات المباشر ({drafts.length} مسودة)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="p-2.5">الصيدلية</th>
                <th className="p-2.5">الصيدلاني</th>
                <th className="p-2.5 text-center">الأصناف</th>
                <th className="p-2.5 text-center">العلب</th>
                <th className="p-2.5 text-left">القيمة الإجمالية</th>
                <th className="p-2.5 text-center">الحالة</th>
                <th className="p-2.5 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drafts.map((d) => {
                const s = d.items.reduce((sum, i) => sum + i.unitPrice * (i.quantity || 0), 0);
                const disc = s * ((d.discountPercent || 0) / 100);
                const finalTotal = s - disc;
                const units = d.items.reduce((sum, i) => sum + (i.quantity || 0), 0);

                return (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 font-bold text-slate-900">{d.pharmacyName || '—'}</td>
                    <td className="p-2.5 text-slate-600">{d.pharmacistName || '—'}</td>
                    <td className="p-2.5 text-center font-bold text-slate-700">{d.items.length}</td>
                    <td className="p-2.5 text-center text-slate-700">{units}</td>
                    <td className="p-2.5 text-left font-bold text-emerald-800">
                      {formatCurrency(finalTotal)}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        {d.status === 'synced_sheets'
                          ? 'محفوظة في Drive'
                          : d.status === 'sent_whatsapp'
                          ? 'أرسلت لواتساب'
                          : 'مسودة'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => onOpenDraft(d.id)}
                        className="text-xs text-emerald-700 hover:underline font-bold"
                      >
                        فتح
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
