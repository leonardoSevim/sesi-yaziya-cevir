// SesiYaziyaCevir - Tarayıcı Konuşma API kullanarak ses-metin dönüşümü yapan uygulama
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Loader, 
  AlertCircle, 
  Check, 
  Mic,
  Volume2
} from 'lucide-react';
import WebSpeechService from '../services/webSpeechService';
import OfflineTranscriptionService from '../services/offlineTranscriptionService';

const HomePage = () => {
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [webSpeechAvailable, setWebSpeechAvailable] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Web Speech API'nin kullanılabilir olup olmadığını kontrol et
  useEffect(() => {
    const checkWebSpeechAvailability = async () => {
      try {
        const isAvailable = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        setWebSpeechAvailable(isAvailable);
        console.log(`Web Speech API ${isAvailable ? 'kullanılabilir' : 'kullanılamaz'}`);
        
        if (isAvailable) {
          await WebSpeechService.initialize();
        } else {
          setError('Web Speech API tarayıcınızda desteklenmiyor. Chrome, Edge veya Safari kullanarak tekrar deneyin.');
        }
      } catch (error) {
        console.error('Web Speech API kontrol hatası:', error);
        setWebSpeechAvailable(false);
        setError('Web Speech API başlatılamadı: ' + error.message);
      }
    };
    
    checkWebSpeechAvailability();
    
    // Sayfa kapatılırken temizlik yap
    return () => {
      if (isRecording) {
        WebSpeechService.recognition?.stop();
      }
    };
  }, []);

  // Mikrofon kaydını başlat
  const startRecording = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setProgress(10);
      setTranscription('');
      setIsRecording(true);
      
      setProgress(30);
      
      const result = await WebSpeechService.transcribeFromMicrophone({
        language: 'tr-TR'
      });
      
      if (result && result.text) {
        setTranscription(result.text);
        setProgress(100);
      } else {
        throw new Error('Konuşma tanınamadı.');
      }
    } catch (err) {
      console.error('Mikrofon kaydı hatası:', err);
      setError('Mikrofon kaydı sırasında bir hata oluştu: ' + err.message);
    } finally {
      setIsLoading(false);
      setIsRecording(false);
    }
  };

  // Ses dosyasını işle
  const processAudio = async (file) => {
    if (!file) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setProgress(10);
      setTranscription('');
      
      // İlerleme göster
      setProgress(30);
      
      if (!webSpeechAvailable) {
        // Web Speech API kullanılamıyorsa, offline örnek sonuç göster
        setProgress(50);
        const offlineResult = await OfflineTranscriptionService.transcribe(file, {
          language: 'tr-TR'
        });
        
        if (offlineResult && offlineResult.text) {
          setTranscription(offlineResult.text);
          setProgress(100);
          setError('Bu sonuç gerçek değil! Web Speech API tarayıcınızda desteklenmediği için örnek bir sonuç gösteriliyor.');
        }
      } else {
        // Web Speech API kullanarak ses dosyasını işle
        setProgress(50);
        setAudioPlaying(true);
        
        const result = await WebSpeechService.transcribe(file, {
          language: 'tr-TR'
        });
        
        if (result && result.text) {
          setTranscription(result.text);
          setProgress(100);
        } else {
          throw new Error('Ses dosyasından metin elde edilemedi.');
        }
        
        setAudioPlaying(false);
      }
    } catch (err) {
      console.error('İşleme hatası:', err);
      setError('Ses dosyası işlenirken bir hata oluştu: ' + err.message);
      
      // Hata durumunda bile offline örnek göster
      try {
        const offlineResult = await OfflineTranscriptionService.transcribe(file, {
          language: 'tr-TR'
        });
        
        if (offlineResult && offlineResult.text) {
          setTranscription(offlineResult.text);
          setProgress(100);
          setError('Ses dosyası işlenirken bir hata oluştu. Bu sonuç gerçek değil, sadece örnek bir gösterimdir.');
        }
      } catch (offlineErr) {
        console.error('Offline işleme hatası:', offlineErr);
      }
    } finally {
      setIsLoading(false);
      setAudioPlaying(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const handleUpload = () => {
    if (selectedFile) {
      processAudio(selectedFile);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Sesi Yazıya Çevir</h1>
        <p className="text-center text-gray-600">
          Ses dosyanızı yükleyin veya mikrofondan kayıt yapın
        </p>
        
        {!webSpeechAvailable && (
          <p className="mt-2 text-center text-amber-600">
            Tarayıcınız Web Speech API'yi desteklemiyor. Chrome, Edge veya Safari tarayıcılarını kullanmanızı öneririz.
          </p>
        )}
      </div>

      {/* Ana İşlevler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Mikrofon ile Kayıt */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl shadow-sm border border-emerald-100">
          <h2 className="text-xl font-semibold text-emerald-700 mb-4 flex items-center">
            <Mic className="mr-2 h-5 w-5" /> Mikrofondan Kaydet
          </h2>
          
          <p className="text-sm text-gray-600 mb-6">
            Doğrudan mikrofonunuzu kullanarak konuşmanızı yazıya çevirin. Konuşmaya başlamak için butona tıklayın.
          </p>
          
          <div className="flex flex-col items-center">
            <button
              onClick={startRecording}
              disabled={isLoading || isRecording || !webSpeechAvailable}
              className={`
                p-6 rounded-full 
                ${!webSpeechAvailable 
                  ? 'bg-gray-300 cursor-not-allowed'
                  : isRecording 
                    ? 'bg-red-500 animate-pulse'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'}
                shadow-xl transition-all
                ${isLoading || isRecording || !webSpeechAvailable ? 'opacity-70' : 'hover:shadow-2xl hover:scale-105'}
              `}
            >
              <Mic className={`w-10 h-10 text-white ${isRecording ? 'animate-bounce' : ''}`} />
            </button>
            <p className="mt-3 text-center text-emerald-700 font-medium">
              {!webSpeechAvailable 
                ? 'Mikrofon kaydı bu tarayıcıda desteklenmiyor'
                : isRecording 
                  ? 'Dinleniyor... Konuşmanız tamamlandığında otomatik olarak sonlanacak.'
                  : 'Mikrofon ile kayıt başlatmak için tıklayın'}
            </p>
          </div>
        </div>
        
        {/* Dosya Yükleme */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-100">
          <h2 className="text-xl font-semibold text-blue-700 mb-4 flex items-center">
            <Upload className="mr-2 h-5 w-5" /> Ses Dosyası Yükle
          </h2>
          
          <p className="text-sm text-gray-600 mb-4">
            Mevcut bir ses dosyasını yükleyin ve yazıya çevirin. Tarayıcınız dosyayı çalacak ve sonra transkripsiyon yapacaktır.
          </p>
          
          <div 
            {...getRootProps()} 
            className={`
              border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-4
              bg-white/30 backdrop-blur-sm
              ${isDragActive ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 hover:border-blue-400'}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                <Upload className="w-7 h-7 text-blue-500" />
              </div>
              <p className="text-blue-800 font-medium text-sm">
                {isDragActive
                  ? 'Dosyayı buraya bırakın'
                  : 'Ses dosyasını seçin veya buraya sürükleyin'}
              </p>
              <p className="text-xs text-gray-600">
                Desteklenen formatlar: MP3, M4A, WAV, OGG (maks. 50MB)
              </p>
            </div>
          </div>
          
          {selectedFile && (
            <div className="bg-white p-3 rounded-lg flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Volume2 className="text-blue-500 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium truncate max-w-[180px]">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded-md hover:bg-red-100"
                onClick={() => setSelectedFile(null)}
              >
                Kaldır
              </button>
            </div>
          )}
          
          <button 
            disabled={!selectedFile || isLoading || audioPlaying || !webSpeechAvailable} 
            className={`
              w-full py-3 rounded-lg font-medium transition-all
              ${!selectedFile || isLoading || audioPlaying || !webSpeechAvailable
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:shadow-xl hover:translate-y-[-1px]'
              }
            `}
            onClick={handleUpload}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader className="w-5 h-5 animate-spin" />
                <span>İşleniyor... {progress}%</span>
              </div>
            ) : audioPlaying ? (
              <div className="flex items-center justify-center gap-2">
                <Volume2 className="w-5 h-5 animate-pulse" />
                <span>Ses dosyası çalınıyor...</span>
              </div>
            ) : (
              'Dosyayı İşle ve Yazıya Çevir'
            )}
          </button>
        </div>
      </div>

      {/* Hata mesajı */}
      {error && (
        <div className="mt-4 mb-4 p-4 bg-red-50 rounded-lg">
          <div className="flex items-start gap-2 text-red-600">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Sonuç alanı */}
      {transcription && !isLoading && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-green-600 font-medium">Transkripsiyon tamamlandı!</span>
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={() => navigator.clipboard.writeText(transcription)}
                className="text-blue-600 hover:text-blue-700 bg-blue-50 p-2 rounded-md"
                title="Metni kopyala"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
              <button 
                onClick={() => window.print()}
                className="text-indigo-600 hover:text-indigo-700 bg-indigo-50 p-2 rounded-md"
                title="Yazdır"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Sonuç:</h2>
            <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">{transcription}</p>
          </div>
        </div>
      )}
      
      {/* Alt bilgi */}
      <div className="mt-10 text-center text-sm text-gray-500">
        <p>Ses kayıtlarınız gizli kalır ve sunuculara gönderilmez. Tüm işlemler tarayıcınızda gerçekleşir.</p>
        <p className="mt-1">SesiYaziyaCevir © 2024 - Tüm hakları saklıdır.</p>
      </div>
    </div>
  );
};

export default HomePage; 