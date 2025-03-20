import React from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, AlertTriangle, Loader, ArrowLeft, Copy, Download } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { transcribeAudio, TranscriptionResult } from '../services/transcription';

const TranscriptionStatus: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [interimResult, setInterimResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<TranscriptionResult['status']>('processing');
  const [copiedText, setCopiedText] = useState(false);

  const attemptTranscription = useCallback(async (file: File) => {
    try {
      const finalText = await transcribeAudio(file, (interim) => {
        setInterimResult(interim);
        setProgress(90);
      });
      setResult(finalText);
      setStatus('completed');
      setProgress(100);
    } catch (err: any) {
      console.error('Transcription failed:', err);
      setError(err.message);
      setStatus('failed');
    }
  }, []);

  useEffect(() => {
    const file = location.state?.file;
    if (file && status === 'processing') {
      attemptTranscription(file);
    }
  }, [location.state, status, attemptTranscription]);

  // Reset progress when status changes
  useEffect(() => {
    if (status === 'completed') {
      setProgress(100);
    } else if (status === 'failed') {
      setProgress(0);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'processing') {
      const interval = setInterval(() => {
        setProgress(prev => {
          // Increment progress more gradually
          const increment = Math.max(1, Math.floor((100 - prev) / 10));
          const nextProgress = prev + increment;
          
          if (nextProgress >= 90) {
            clearInterval(interval);
            return 90; // Cap at 90% until completion
          }
          return nextProgress;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status]);

  const getStatusDisplay = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-6 h-6 text-yellow-500" />,
          text: 'Beklemede',
          message: 'Dosyanız işlenmeyi bekliyor...'
        };
      case 'processing':
        return {
          icon: <Loader className="w-6 h-6 text-blue-500 animate-spin" />,
          text: 'İşleniyor',
          message: `Ses dosyanız metne dönüştürülüyor... (%${progress})`
        };
      case 'completed':
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-500" />,
          text: 'Tamamlandı',
          message: 'Dönüştürme işlemi tamamlandı!'
        };
      case 'failed':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
          text: 'Başarısız',
          message: 'Bir hata oluştu. Lütfen tekrar deneyin.'
        };
      default:
        return {
          icon: <Clock className="w-6 h-6 text-gray-500" />,
          text: 'Bilinmiyor',
          message: 'Durum bilgisi alınamadı.'
        };
    }
  };

  const statusInfo = getStatusDisplay();

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const downloadAsText = () => {
    if (result) {
      const blob = new Blob([result], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcription_${id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-space-500 hover:text-space-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Yeni Dönüşüm
        </button>
      </div>
    
      <div className="bg-space-50 rounded-2xl shadow-xl p-8 border border-space-300/30">
        <div className="flex items-center justify-center mb-4">
          {statusInfo.icon}
          <h2 className="text-2xl font-bold ml-3 bg-gradient-to-r from-space-400 to-purple-400 bg-clip-text text-transparent">
            {statusInfo.text}
          </h2>
        </div>
        
        {status === 'processing' && (
          <div className="relative w-full h-4 bg-white/5 rounded-full mb-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-space-400 to-purple-400 rounded-full transition-all duration-500"
                 style={{ width: `${progress}%` }}>
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-space-300 to-purple-300 opacity-50"></div>
            </div>
          </div>
        )}
        
        <p className="text-space-200 text-center text-lg mb-8">
          {statusInfo.message}
        </p>
        
        {status === 'processing' && interimResult && (
          <div className="mt-8 p-6 bg-white rounded-xl border border-space-300/30">
            <h3 className="font-medium mb-3 text-space-600">Gerçek Zamanlı Sonuç:</h3>
            <p className="text-space-500 whitespace-pre-wrap leading-relaxed">{interimResult}</p>
          </div>
        )}
        
        {status === 'completed' && result && (
          <div className="mt-8 p-6 bg-white rounded-xl border border-space-300/30">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-space-600">Dönüştürülen Metin:</h3>
              <div className="flex gap-2">
                <button 
                  onClick={copyToClipboard}
                  className="p-2 bg-space-100 hover:bg-space-200 rounded-lg flex items-center text-space-600 text-sm transition-all"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  {copiedText ? 'Kopyalandı!' : 'Kopyala'}
                </button>
                <button 
                  onClick={downloadAsText}
                  className="p-2 bg-space-100 hover:bg-space-200 rounded-lg flex items-center text-space-600 text-sm transition-all"
                >
                  <Download className="w-4 h-4 mr-1" />
                  İndir
                </button>
              </div>
            </div>
            <p className="text-space-500 whitespace-pre-wrap leading-relaxed">{result}</p>
          </div>
        )}
        
        {status === 'failed' && error && (
          <div className="mt-8 p-6 bg-red-900/20 rounded-xl border border-red-500/30 text-red-400">
            <h3 className="font-medium mb-2">Hata:</h3>
            <p>{error}</p>
          </div>
        )}
        
        <div className="text-center mt-8">
          <p className="text-sm text-space-500 mb-4">
            Transcription ID: {id}
          </p>
          
          <Link
            to="/"
            className="text-space-500 hover:text-space-600 font-medium transition-colors"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionStatus;