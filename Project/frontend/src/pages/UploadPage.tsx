import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryAPI } from '../services/api';
import { Upload } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

export default function UploadPage() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [csvResult, setCsvResult] = useState<Upload | null>(null);
  const [jsonResult, setJsonResult] = useState<Upload | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [jsonLoading, setJsonLoading] = useState(false);
  const [error, setError] = useState('');
  const csvRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);

  const handleCsvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setError('Only .csv files are allowed for inventory upload');
        return;
      }
      setError('');
      setCsvFile(file);
      setCsvResult(null);
    }
  };

  const handleJsonSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.json')) {
        setError('Only .json files are allowed for live inventory upload');
        return;
      }
      setError('');
      setJsonFile(file);
      setJsonResult(null);
    }
  };

  const uploadCsv = async () => {
    if (!csvFile) return;
    setCsvLoading(true);
    setError('');
    try {
      const res = await inventoryAPI.uploadCSV(csvFile);
      setCsvResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'CSV upload failed');
    } finally {
      setCsvLoading(false);
    }
  };

  const uploadJson = async () => {
    if (!jsonFile) return;
    setJsonLoading(true);
    setError('');
    try {
      const res = await inventoryAPI.uploadJSON(jsonFile);
      setJsonResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'JSON upload failed');
    } finally {
      setJsonLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="page-title mb-6">Upload Inventory Files</h1>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CSV Upload */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl">📄</div>
            <div>
              <h2 className="section-title">Inventory CSV</h2>
              <p className="text-xs text-gray-500">Upload your inventory records (.csv only)</p>
            </div>
          </div>

          <div
            onClick={() => csvRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-all duration-200"
          >
            <input
              ref={csvRef}
              type="file"
              accept=".csv"
              onChange={handleCsvSelect}
              className="hidden"
            />
            <div className="text-4xl mb-3">📁</div>
            {csvFile ? (
              <div>
                <p className="font-medium text-gray-800">{csvFile.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(csvFile.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-gray-600">Click to select CSV file</p>
                <p className="text-xs text-gray-400 mt-1">Accepted format: .csv</p>
              </div>
            )}
          </div>

          <button
            onClick={uploadCsv}
            disabled={!csvFile || csvLoading}
            className="btn-primary w-full mt-4"
          >
            {csvLoading ? <LoadingSpinner size="sm" message="" /> : 'Upload CSV'}
          </button>

          {csvResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <p className="text-sm font-medium text-green-700">✅ Upload successful</p>
              <p className="text-xs text-green-600 mt-1">
                Upload ID: {csvResult.id} | Records: {csvResult.total_records}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* JSON Upload */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-xl">🌐</div>
            <div>
              <h2 className="section-title">Live Inventory JSON</h2>
              <p className="text-xs text-gray-500">Upload live infrastructure data (.json only)</p>
            </div>
          </div>

          <div
            onClick={() => jsonRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-green-300 hover:bg-green-50/30 transition-all duration-200"
          >
            <input
              ref={jsonRef}
              type="file"
              accept=".json"
              onChange={handleJsonSelect}
              className="hidden"
            />
            <div className="text-4xl mb-3">📁</div>
            {jsonFile ? (
              <div>
                <p className="font-medium text-gray-800">{jsonFile.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(jsonFile.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-gray-600">Click to select JSON file</p>
                <p className="text-xs text-gray-400 mt-1">Accepted format: .json</p>
              </div>
            )}
          </div>

          <button
            onClick={uploadJson}
            disabled={!jsonFile || jsonLoading}
            className="btn-primary w-full mt-4"
          >
            {jsonLoading ? <LoadingSpinner size="sm" message="" /> : 'Upload JSON'}
          </button>

          {jsonResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <p className="text-sm font-medium text-green-700">✅ Upload successful</p>
              <p className="text-xs text-green-600 mt-1">
                Upload ID: {jsonResult.id} | Records: {jsonResult.total_records}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="card p-6 mt-6"
      >
        <h3 className="section-title mb-3">📋 Upload Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-800 mb-1">CSV Format (Inventory.csv)</h4>
            <ul className="space-y-1 text-xs list-disc list-inside">
              <li>Must include: asset_id, asset_name, asset_type</li>
              <li>Optional: location, status, os, ip_address, environment</li>
              <li>Each row represents one asset record</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">JSON Format (LiveInventory.json)</h4>
            <ul className="space-y-1 text-xs list-disc list-inside">
              <li>Array of objects with: asset_id, asset_name, asset_type</li>
              <li>Optional: location, status, os, ip_address, environment</li>
              <li>Represents current live infrastructure state</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
