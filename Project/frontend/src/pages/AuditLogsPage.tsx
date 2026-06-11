import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auditAPI } from '../services/api';
import { AuditLog } from '../types';
import { formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const actionIcons: Record<string, string> = {
  LOGIN: '🔑',
  UPLOAD_INVENTORY: '📄',
  UPLOAD_LIVE_INVENTORY: '🌐',
  RUN_RECONCILIATION: '🔍',
  GENERATE_REPORT: '📋',
  CHATBOT_QUERY: '🤖',
  CREATE_USER: '👤',
  DELETE_USER: '🗑️',
};

const actionLabels: Record<string, string> = {
  LOGIN: 'User Login',
  UPLOAD_INVENTORY: 'CSV Upload',
  UPLOAD_LIVE_INVENTORY: 'JSON Upload',
  RUN_RECONCILIATION: 'Reconciliation',
  GENERATE_REPORT: 'Report Generated',
  CHATBOT_QUERY: 'Chatbot Query',
  CREATE_USER: 'User Created',
  DELETE_USER: 'User Deleted',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const res = await auditAPI.getLogs({ limit: 200 });
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading audit logs..." />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="page-title mb-6">Audit Logs</h1>

      {logs.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-xl font-semibold text-primary mb-2">No Audit Logs</h2>
          <p className="text-gray-500">System events will appear here as users interact with the platform.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left font-medium text-gray-600 w-10"></th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">User</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Details</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.5) }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-center text-lg">
                      {actionIcons[log.action] || '📌'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600">{log.username}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                      {log.details || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(log.created_at)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
