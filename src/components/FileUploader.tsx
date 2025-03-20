import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader, Check, Info, AlertTriangle } from 'lucide-react';
import WhisperService from '../services/whisperService';

const FileUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [modelLoading, setModelLoading] = useState(false);
  
  // Whisper modelini yükle
  useEffect(() => {
    const loadModel = async () => {
      try {
        setModelLoading(true);
        await WhisperService.initialize();
        setModelLoading(false);
      } catch (err) {
        setError('Model yüklenirken bir hata oluştu');
        setModelLoading(false);
      }
    };
    
    loadModel();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const audioFile = acceptedFiles[0];
    if (audioFile) {
      setFile(audioFile);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.m4a', '.wav', '.ogg']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setIsLoading(true);
      setProgress(10);
      setResult('');
      
      // Model işleme aşaması
      setProgress(30);
      
      const transcription = await WhisperService.transcribe(file, {
        language: 'turkish',
        model: 'small'
      });
      
      setResult(transcription.text);
      setProgress(100);
    } catch (err: any) {
      setError(err.message || 'Ses dosyası işlenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {modelLoading ? (
        <div className="w-full text-center py-8">
          <Loader className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-space-500">Model hazırlanıyor, lütfen bekleyin...</p>
        </div>
      ) : (
        <>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${isDragActive ? 'border-purple-500 bg-purple-50/10' : 'border-space-600/20 hover:border-purple-500/50'}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-space-700/30 flex items-center justify-center">
                <Upload className="w-8 h-8 text-space-400" />
              </div>
              <p className="text-space-300">
                {isDragActive
                  ? 'Dosyayı buraya bırakın'
                  : 'Ses dosyasını seçin veya buraya sürükleyin'}
              </p>
              <p className="text-xs text-space-500">
                MP3, M4A, WAV veya OGG (maks. 50MB)
              </p>
              {file && (
                <div className="flex items-center gap-2 mt-2 bg-space-700/30 py-1 px-3 rounded-full text-sm text-space-300">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>{file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || isLoading}
            className={`
              w-full py-3 rounded-lg mt-4 transition-all flex items-center justify-center gap-2
              ${!file || isLoading
                ? 'bg-space-700/50 text-space-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-purple-500 hover:to-indigo-500'
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>İşleniyor... {progress}%</span>
              </>
            ) : (
              'Dosyayı Yükle ve Dönüştür'
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-800/30 rounded-lg">
              <div className="flex items-start gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {result && !isLoading && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-green-400">
                  <Check className="w-5 h-5" />
                  <span>Transkripsiyon tamamlandı!</span>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="text-space-400 hover:text-purple-400 bg-space-700/30 p-2 rounded-md transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
              <div className="bg-space-800 p-6 rounded-lg border border-space-700">
                <h2 className="text-xl font-medium mb-4 text-space-300">Sonuç:</h2>
                <p className="whitespace-pre-wrap text-space-400 leading-relaxed">{result}</p>
              </div>
            </div>
          )}
        </>
      )}
      
      <div className="mt-6 flex items-center justify-center">
        <div className="flex items-start gap-2 text-space-500 text-sm">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            Bu dönüştürme işlemi tamamen tarayıcınızda gerçekleşir. Ses dosyanız hiçbir sunucuya gönderilmez.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;