import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { inventoryAPI } from '../services/api';
import { Reconciliation } from '../types';
import { getDiscrepancyLabel, getDiscrepancyColor, formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

export default function DashboardPage() {
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await inventoryAPI.listReconciliations();
      setReconciliations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  const latest = reconciliations.length > 0 ? reconciliations[0] : null;

  if (!latest) {
    return (
      <motion.div {...fadeIn}>
        <h1 className="page-title mb-6">Dashboard</h1>
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-primary mb-2">No Inventory Data Available</h2>
          <p className="text-gray-500">
            Upload inventory files and run a reconciliation to see your dashboard.
          </p>
        </div>
      </motion.div>
    );
  }

  const totalDiscrepancies =
    latest.missing_assets_count +
    latest.untracked_assets_count +
    latest.config_mismatch_count +
    latest.naming_mismatch_count;

  const compliance = latest.total_csv_assets > 0
    ? Math.round(((latest.total_csv_assets - latest.missing_assets_count) / latest.total_csv_assets) * 100)
    : 0;

  const healthScore = Math.max(
    0,
    100 - (totalDiscrepancies / Math.max(latest.total_csv_assets, 1)) * 100
  );

  const kpis = [
    { label: 'CSV Assets', value: latest.total_csv_assets, icon: '📄', color: 'from-blue-500 to-blue-600' },
    { label: 'Live Assets', value: latest.total_json_assets, icon: '🌐', color: 'from-green-500 to-green-600' },
    { label: 'Compliance', value: `${compliance}%`, icon: '✅', color: compliance >= 80 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600' },
    { label: 'Discrepancies', value: totalDiscrepancies, icon: '⚠️', color: totalDiscrepancies > 0 ? 'from-amber-500 to-amber-600' : 'from-emerald-500 to-emerald-600' },
  ];

  const pieData = [
    { name: 'Missing', value: latest.missing_assets_count, color: '#ef4444' },
    { name: 'Untracked', value: latest.untracked_assets_count, color: '#f59e0b' },
    { name: 'Config Mismatch', value: latest.config_mismatch_count, color: '#8b5cf6' },
    { name: 'Naming Mismatch', value: latest.naming_mismatch_count, color: '#3b82f6' },
  ].filter((d) => d.value > 0);

  const barData = [
    { name: 'Missing', count: latest.missing_assets_count, fill: '#ef4444' },
    { name: 'Untracked', count: latest.untracked_assets_count, fill: '#f59e0b' },
    { name: 'Config', count: latest.config_mismatch_count, fill: '#8b5cf6' },
    { name: 'Naming', count: latest.naming_mismatch_count, fill: '#3b82f6' },
  ];

  return (
    <motion.div {...fadeIn}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Dashboard</h1>
        <span className="text-sm text-gray-400">
          Last reconciliation: {formatDate(latest.completed_at)}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{kpi.icon}</span>
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium text-white bg-gradient-to-r ${kpi.color}`}>
                {typeof kpi.value === 'number' ? (kpi.value > 0 ? `${kpi.value}` : '0') : kpi.value}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-800">{kpi.value}</div>
            <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Health Score + Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Health Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="card p-6 flex flex-col items-center justify-center"
        >
          <h3 className="section-title mb-4">Infrastructure Health</h3>
          <div className="relative w-36 h-36">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60" cy="60" r="52"
                fill="none" stroke="#e5e7eb" strokeWidth="10"
              />
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke={healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#ef4444'}
                strokeWidth="10"
                strokeDasharray={`${(healthScore / 100) * 326.7} 326.7`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-800">{Math.round(healthScore)}</span>
              <span className="text-xs text-gray-500">/ 100</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            {healthScore >= 70 ? 'Good' : healthScore >= 40 ? 'Needs Attention' : 'Critical'}
          </p>
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <h3 className="section-title mb-4">Discrepancy Breakdown</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-400">
              No discrepancies found
            </div>
          )}
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="card p-6"
        >
          <h3 className="section-title mb-4">Discrepancies by Type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {barData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Executive Summary */}
      {latest.executive_summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-6"
        >
          <h3 className="section-title mb-3">Executive Summary</h3>
          <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap leading-relaxed">
            {latest.executive_summary}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
