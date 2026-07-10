import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../services/api';
import { Loader2 } from 'lucide-react';

export default function BloodworkPage({ user }) {
  const [bloodworkLogs, setBloodworkLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const logs = await api.getBloodworkLogs(user.id);
      setBloodworkLogs(logs);
      if (logs.length > 0) {
        setSelectedLog(logs[0]);
      }
    } catch (err) {
      setError('Failed to fetch bloodwork history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user.id]);

  const processFile = async (file) => {
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.id);

    try {
      await api.uploadBloodwork(formData);
      setSuccess('Bloodwork uploaded and analyzed successfully!');
      
      const logs = await api.getBloodworkLogs(user.id);
      setBloodworkLogs(logs);
      if (logs.length > 0) {
        setSelectedLog(logs[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload bloodwork. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full text-on-surface">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="font-text-headline-lg text-primary-fixed mb-2">Bloodwork Analysis</h2>
          <p className="text-on-surface-variant max-w-md">Optimize your health with deep clinical insights. Upload your latest results for AI-powered biological markers analysis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-md">
        {/* Left: Upload & AI Insights */}
        <div className="lg:col-span-4 space-y-gutter-md">
          {/* Upload Zone */}
          <section className="glass-card p-8 flex flex-col items-center text-center relative overflow-hidden">
            <div 
              className={`upload-zone w-full py-12 rounded-2xl cursor-pointer flex flex-col items-center group transition-colors border-2 border-dashed ${isDragActive ? 'border-primary bg-primary/10' : 'border-primary-container/30 hover:border-primary-container hover:bg-primary-container/5'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current.click()}
            >
              <div className="w-16 h-16 bg-primary-container/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {uploading ? (
                  <Loader2 className="animate-spin text-primary-container" size={32} />
                ) : (
                  <span className="material-symbols-outlined text-primary-container text-4xl">cloud_upload</span>
                )}
              </div>
              <h3 className="font-text-title-md text-on-surface mb-2">{uploading ? 'Analyzing...' : 'Upload Results'}</h3>
              <p className="font-text-body-sm text-on-surface-variant px-6">Drag and drop your PDF or TXT lab reports here to begin analysis</p>
              <input 
                className="hidden" 
                id="fileUpload" 
                type="file" 
                accept=".pdf,.docx,.txt"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
            
            {error && <p className="mt-4 text-error text-sm font-semibold">{error}</p>}
            {success && <p className="mt-4 text-primary-container text-sm font-semibold">{success}</p>}
          </section>

          {/* AI Insights Callout */}
          {selectedLog && (
            <section className="glass-card overflow-hidden animate-float relative">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-container/10 blur-3xl rounded-full pointer-events-none"></div>
              <div className="p-6 relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <h3 className="font-text-title-md text-primary-container">Quick Analysis</h3>
                </div>
                <p className="text-on-surface-variant leading-relaxed mb-6 text-sm line-clamp-4">
                  {selectedLog.ai_analysis_summary.substring(0, 150)}...
                </p>
                <div className="w-full py-3 bg-surface-container-highest text-center text-primary-container font-semibold rounded-lg border border-primary-container/20 text-sm">
                  Analyzed {new Date(selectedLog.created_at).toLocaleDateString()}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Right: Detailed Results List */}
        <div className="lg:col-span-8 space-y-gutter-md">
          <div className="glass-card p-6 min-h-[400px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h3 className="font-text-title-md text-on-surface">Detailed Biological Markers</h3>
              <div className="flex items-center gap-2 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/20">
                <select 
                  className="bg-transparent border-none text-on-surface-variant text-sm focus:ring-0 cursor-pointer"
                  onChange={(e) => {
                    const log = bloodworkLogs.find(l => l.id === parseInt(e.target.value));
                    if (log) setSelectedLog(log);
                  }}
                  value={selectedLog?.id || ''}
                >
                  <option value="" disabled>Select a report...</option>
                  {bloodworkLogs.map(log => (
                    <option key={log.id} value={log.id}>{log.file_name} ({new Date(log.created_at).toLocaleDateString()})</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="animate-spin text-primary-container" size={32} />
              </div>
            ) : selectedLog ? (
              <div className="prose prose-invert max-w-none prose-headings:text-primary-container prose-a:text-primary-container hover:prose-a:underline">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedLog.ai_analysis_summary}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-on-surface-variant opacity-70">
                <span className="material-symbols-outlined text-4xl mb-2">science</span>
                <p>No analysis selected or available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
