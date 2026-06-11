import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { inventoryAPI } from '../services/api';
import { Upload, Reconciliation } from '../types';
import { formatDate, getDiscrepancyLabel, getSeverityColor } from '../utils/helpers';
import { useAuthStore } from '../stores/authStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ReconciliationPage() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [csvUploadId, setCsvUploadId] = useState<number>(0);
  const [jsonUploadId, setJsonUploadId] = useState<number>(0);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [selected, setSelected] = useState<Reconciliation | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [error, setError] = useState('');
  const user = useAuthStore((s) => s.user);
  const canReconcile = user && ['ADMIN', 'INFRASTRUCTURE_ENGINEER'].includes(user.role);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [uploadsRes, reconsRes] = await Promise.all([
        inventoryAPI.listUploads(),
        inventoryAPI.listReconciliations(),
      ]);
      setUploads(uploadsRes.data);
      setReconciliations(reconsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runReconciliation = async () => {
    if (!csvUploadId || !jsonUploadId) {
      setError('Please select both CSV and JSON uploads');
      return;
    }
    setReconciling(true);
    setError('');
    try {
      const res = await inventoryAPI.reconcile(csvUploadId, jsonUploadId);
      setSelected(res.data);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Reconciliation failed');
    } finally {
      setReconciling(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading reconciliation data..." />;

  const csvUploads = uploads.filter((u) => u.upload_type === 'csv');
  const jsonUploads = uploads.filter((u) => u.upload_type === 'json');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="page-title mb-6">Reconciliation</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Run Reconciliation */}
      {canReconcile && (
        <div className="card p-6 mb-6">
          <h2 className="section-title mb-4">Run New Reconciliation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                CSV Upload
              </label>
              <select
                value={csvUploadId}
                onChange={(e) => setCsvUploadId(Number(e.target.value))}
                className="select-field"
              >
                <option value={0}>Select CSV upload...</option>
                {csvUploads.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.filename} ({u.total_records} records)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                JSON Upload
              </label>
              <select
                value={jsonUploadId}
                onChange={(e) => setJsonUploadId(Number(e.target.value))}
                className="select-field"
              >
                <option value={0}>Select JSON upload...</option>
                {jsonUploads.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.filename} ({u.total_records} records)
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={runReconciliation}
              disabled={reconciling || !csvUploadId || !jsonUploadId}
              className="btn-primary"
            >
              {reconciling ? (
                <span className="flex items-center gap-2 justify-center">
                  <LoadingSpinner size="sm" message="" />
                  Processing...
                </span>
              ) : (
                '🔍 Run Reconciliation'
              )}
            </button>
          </div>
          {reconciling && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">
                ⏳ AI agents are analyzing your inventory data...
              </p>
              <p className="text-xs text-blue-600 mt-1">
                This may take a minute — running validation, analysis, recommendations, and executive summary agents.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Reconciliation History */}
      {reconciliations.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-primary mb-2">No Reconciliation Data Available</h2>
          <p className="text-gray-500">Run a reconciliation to compare your inventory files.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="section-title">Reconciliation History</h2>
          {reconciliations.map((recon) => (
            <motion.div
              key={recon.id}
              layout
              className={`card p-5 cursor-pointer border-2 transition-colors ${
                selected?.id === recon.id ? 'border-primary' : 'border-transparent'
              }`}
              onClick={() => setSelected(selected?.id === recon.id ? null : recon)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    recon.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    #{recon.id}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      Reconciliation #{recon.id}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(recon.started_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="badge text-red-600 bg-red-50 border-red-200">
                    {recon.missing_assets_count} Missing
                  </span>
                  <span className="badge text-amber-600 bg-amber-50 border-amber-200">
                    {recon.untracked_assets_count} Untracked
                  </span>
                  <span className="badge text-purple-600 bg-purple-50 border-purple-200">
                    {recon.config_mismatch_count} Config
                  </span>
                  <span className="badge text-blue-600 bg-blue-50 border-blue-200">
                    {recon.naming_mismatch_count} Naming
                  </span>
                </div>
              </div>

              {/* Expanded details */}
              {selected?.id === recon.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-5 pt-5 border-t border-gray-100"
                >
                  {/* AI Analysis */}
                  {recon.ai_analysis && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">🤖 AI Analysis</h4>
                      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {recon.ai_analysis}
                      </div>
                    </div>
                  )}

                  {/* Discrepancies Table */}
                  {recon.discrepancies && recon.discrepancies.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">📋 Discrepancies ({recon.discrepancies.length})</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 text-left">
                              <th className="px-3 py-2 font-medium text-gray-600">Type</th>
                              <th className="px-3 py-2 font-medium text-gray-600">CSV Asset</th>
                              <th className="px-3 py-2 font-medium text-gray-600">Live Asset</th>
                              <th className="px-3 py-2 font-medium text-gray-600">Severity</th>
                              <th className="px-3 py-2 font-medium text-gray-600">Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recon.discrepancies.map((d) => (
                              <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                                <td className="px-3 py-2">
                                  <span className="text-xs font-medium">
                                    {getDiscrepancyLabel(d.discrepancy_type)}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-600">{d.csv_asset_id || '—'}</td>
                                <td className="px-3 py-2 text-xs text-gray-600">{d.json_asset_id || '—'}</td>
                                <td className="px-3 py-2">
                                  <span className={`badge text-xs ${getSeverityColor(d.severity)}`}>
                                    {d.severity || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-600 max-w-xs truncate">
                                  {d.details || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
