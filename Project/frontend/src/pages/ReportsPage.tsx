import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { reportsAPI, inventoryAPI } from '../services/api';
import { Report, Reconciliation } from '../types';
import { formatDate } from '../utils/helpers';
import { useAuthStore } from '../stores/authStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<number | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const user = useAuthStore((s) => s.user);
  const canGenerate = user && ['ADMIN', 'INFRASTRUCTURE_ENGINEER'].includes(user.role);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reportsRes, reconsRes] = await Promise.all([
        reportsAPI.list(),
        inventoryAPI.listReconciliations(),
      ]);
      setReports(reportsRes.data);
      setReconciliations(reconsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reconId: number) => {
    setGenerating(reconId);
    setError('');
    try {
      await reportsAPI.generate(reconId);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Report generation failed');
    } finally {
      setGenerating(null);
    }
  };

  const downloadReport = async (reportId: number) => {
    setDownloading(reportId);
    try {
      const res = await reportsAPI.download(reportId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Download failed');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading reports..." />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="page-title mb-6">Reports</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Generate Report */}
      {canGenerate && reconciliations.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="section-title mb-4">Generate New Report</h2>
          <div className="space-y-2">
            {reconciliations.filter(r => r.status === 'COMPLETED').map((recon) => (
              <div
                key={recon.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <span className="font-medium text-sm text-gray-800">
                    Reconciliation #{recon.id}
                  </span>
                  <span className="text-xs text-gray-500 ml-3">
                    {formatDate(recon.completed_at)}
                  </span>
                  <span className="text-xs text-gray-400 ml-3">
                    {recon.missing_assets_count + recon.untracked_assets_count + recon.config_mismatch_count + recon.naming_mismatch_count} discrepancies
                  </span>
                </div>
                <button
                  onClick={() => generateReport(recon.id)}
                  disabled={generating === recon.id}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  {generating === recon.id ? (
                    <span className="flex items-center gap-1">
                      <LoadingSpinner size="sm" message="" /> Generating...
                    </span>
                  ) : (
                    '📄 Generate PDF'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-primary mb-2">No Reports Available</h2>
          <p className="text-gray-500">Generate a report from a completed reconciliation.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="section-title">Generated Reports</h2>
          {reports.map((report) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-xl">
                    📄
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      Report for Reconciliation #{report.reconciliation_id}
                    </p>
                    <p className="text-xs text-gray-500">
                      Generated: {formatDate(report.generated_at)} | Type: {report.report_type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => downloadReport(report.id)}
                  disabled={downloading === report.id}
                  className="btn-primary text-xs px-4 py-2"
                >
                  {downloading === report.id ? (
                    <LoadingSpinner size="sm" message="" />
                  ) : (
                    '⬇️ Download PDF'
                  )}
                </button>
              </div>
              {report.executive_summary && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {report.executive_summary.substring(0, 300)}...
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
