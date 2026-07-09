import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../services/api';
import { TextEffect } from '../../components/motion-primitives/text-effect';
import { Upload, FileText, AlertCircle, CheckCircle, Activity, Loader2, RefreshCw } from 'lucide-react';

export default function BloodworkPage({ user }) {
  const [bloodworkLogs, setBloodworkLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
      setSuccess('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.id);
    // Include logDate if needed, defaults to today in backend

    try {
      const response = await api.uploadBloodwork(formData);
      setSuccess('Bloodwork uploaded and analyzed successfully!');
      setFile(null);
      
      // Refresh list and select the new log
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

  return (
    <div className="space-y-lg">
      <div className="bg-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="bg-primary/5 p-lg border-b border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-md">
          <div>
            <h2 className="text-xl font-headline-md text-primary font-bold flex items-center gap-sm">
              <Activity size={24} />
              AI Bloodwork Analysis
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Upload your lab results (PDF, DOCX, or TXT) and our AI will analyze your biomarkers for deficiencies and fitness impact.
            </p>
          </div>
        </div>

        <div className="p-lg">
          <form onSubmit={handleUpload} className="flex flex-col md:flex-row items-end gap-md mb-md">
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold text-on-surface mb-2">Upload Lab Report</label>
              <div className="relative">
                <input 
                  type="file" 
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all border border-outline-variant/50 rounded-full cursor-pointer focus:outline-none"
                  disabled={uploading}
                />
              </div>
              <p className="text-xs text-secondary mt-2 flex items-center gap-1">
                <AlertCircle size={12} /> Supported formats: PDF, DOCX, TXT. Max 10MB.
              </p>
            </div>
            <button
              type="submit"
              disabled={!file || uploading}
              className="bg-primary text-white font-bold px-lg py-sm rounded-full shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-sm w-full md:w-auto justify-center h-[42px]"
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Analyzing...
                </>
              ) : (
                <>
                  <Upload size={18} /> Upload & Analyze
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="bg-error/10 text-error px-md py-sm rounded-lg text-sm mb-md flex items-center gap-sm font-semibold">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {success && (
            <div className="bg-teal-50 text-teal-700 px-md py-sm rounded-lg text-sm mb-md flex items-center gap-sm font-semibold">
              <CheckCircle size={16} /> {success}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-xl">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : bloodworkLogs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-outline-variant/30 p-xl text-center">
          <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-md text-secondary">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-sm">No Bloodwork Logs Found</h3>
          <p className="text-secondary text-sm max-w-md mx-auto">
            Upload your first lab report above to get started. Our AI will break down your key biomarkers and provide actionable fitness insights.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg items-start">
          {/* History Sidebar */}
          <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="bg-surface-container-low px-md py-sm border-b border-outline-variant/30 flex justify-between items-center">
              <h3 className="font-bold text-on-surface text-sm">Past Uploads</h3>
              <button onClick={fetchLogs} className="text-secondary hover:text-primary transition-colors" title="Refresh list">
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="divide-y divide-outline-variant/20 max-h-[500px] overflow-y-auto">
              {bloodworkLogs.map(log => (
                <button 
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`w-full text-left p-md transition-colors hover:bg-primary/5 ${selectedLog?.id === log.id ? 'bg-primary/10 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                >
                  <p className="font-bold text-sm text-on-surface truncate pr-2">{log.file_name}</p>
                  <p className="text-xs text-secondary mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                    {new Date(log.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Analysis View */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-outline-variant/30 p-lg min-h-[400px]">
            {selectedLog ? (
              <div>
                <div className="flex items-center gap-sm mb-lg pb-md border-b border-outline-variant/20">
                  <Activity className="text-primary" size={24} />
                  <div>
                    <h3 className="font-headline-md text-lg text-on-surface font-extrabold">{selectedLog.file_name}</h3>
                    <p className="text-xs text-secondary mt-0.5">Analyzed on {new Date(selectedLog.created_at).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="prose prose-sm md:prose-base prose-slate max-w-none prose-headings:text-primary prose-a:text-primary hover:prose-a:underline">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedLog.ai_analysis_summary}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-secondary">
                Select a log to view the analysis.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
