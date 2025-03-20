import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertTriangle, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { transcribeAudio } from '../services/transcription';

const FileUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      // Handle rejected files
      const { errors } = rejectedFiles[0];
      if (errors[0]?.code === 'file-too-large') {
        setError('Dosya boyutu çok büyük. Maksimum 50MB desteklenmektedir.');
      } else if (errors[0]?.code === 'file-invalid-type') {
        setError('Desteklenmeyen dosya formatı. Lütfen MP3, M4A, WAV veya OGG dosyası yükleyin.');
      } else {
        setError('Dosya yüklenemedi. Lütfen tekrar deneyin.');
      }
      return;
    }
    
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      // Reset error when new file is dropped
      setError(null);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/mpeg': ['.mp3'],
      'audio/mp4': ['.m4a'],
      'audio/wav': ['.wav'],
      'audio/ogg': ['.ogg']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024 // 50MB
  });
  
  const removeFile = () => {
    setFile(null);
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setUploading(true);
      setError(null);
      
      // Generate unique ID
      const transcriptionId = `tr_${Date.now()}`;
      
      // Navigate to status page with file in state
      navigate(`/status/${transcriptionId}`, { state: { file } });
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Dosya yüklenemedi. Lütfen tekrar deneyin.');
      setUploading(false);
    }
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition bg-space-50
          ${isDragActive ? 'border-space-400 bg-white/10' : 'border-space-300 hover:border-space-400'}`}
        onMouseEnter={() => setTooltip('Tüm konuşmalar cihazınızda işlenir ve sunucuya gönderilmez.')}
        onMouseLeave={() => setTooltip(null)}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto w-12 h-12 text-space-400 mb-4" />
        <p className="text-lg text-space-600">
          {isDragActive
            ? 'Dosyayı buraya bırakın...'
            : 'Ses dosyasını buraya sürükleyin veya dosya seçmek için tıklayın'}
        </p>
        <p className="text-sm text-space-500 mt-2">
          MP3, M4A, WAV veya OGG formatında dosyalar (maks. 50MB)
        </p>
        
        {tooltip && (
          <div className="mt-4 flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-space-400 mr-2" />
            <p className="text-xs text-space-400">{tooltip}</p>
          </div>
        )}
      </div>
      
      {file && (
        <div className="mt-4 p-4 bg-space-50 rounded-lg border border-space-300/50 shadow-lg flex items-center justify-between">
          <div className="flex items-center">
            <File className="text-space-400 w-5 h-5 mr-3" />
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-space-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={removeFile}
            className="p-2 text-space-400 hover:text-red-400 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400">{error}</p>
        </div>
      )}
      
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className={`mt-6 w-full py-3 px-4 rounded-lg font-medium text-white
          ${file && !uploading
            ? 'bg-space-500 hover:bg-space-400 shadow-lg shadow-space-400/20'
            : 'bg-space-600/50 cursor-not-allowed'
          }
        `}
      >
        {uploading ? 'Yükleniyor...' : 'Dosyayı Yükle ve Dönüştür'}
      </button>
    </div>
  );
};

export default FileUploader;