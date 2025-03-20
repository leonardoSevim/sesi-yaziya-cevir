// Basitleştirilmiş Ana Sayfa Komponenti - Tarayıcı tarafında Whisper.js çalıştıran versiyon
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Loader, 
  AlertCircle, 
  Check, 
  Cpu, 
  Wifi,
  WifiOff,
  Globe,
  Server,
  Mic
} from 'lucide-react';
import WhisperService from '../services/whisperService';
import OfflineTranscriptionService from '../services/offlineTranscriptionService';
import ApiWhisperService from '../services/apiWhisperService';
import WebSpeechService from '../services/webSpeechService';

const HomePage = () => {
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState('whisper-small');
  const [modelLoading, setModelLoading] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [modelLoadAttempted, setModelLoadAttempted] = useState(false);
  const [processingMode, setProcessingMode] = useState('browser'); // 'browser', 'api' veya 'webspeech'
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [webSpeechAvailable, setWebSpeechAvailable] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Web Speech API'nin kullanılabilir olup olmadığını kontrol et
  useEffect(() => {
    const checkWebSpeechAvailability = async () => {
      try {
        const isAvailable = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        setWebSpeechAvailable(isAvailable);
        console.log(`Web Speech API ${isAvailable ? 'kullanılabilir' : 'kullanılamaz'}`);
      } catch (error) {
        console.error('Web Speech API kontrol hatası:', error);
        setWebSpeechAvailable(false);
      }
    };
    
    checkWebSpeechAvailability();
  }, []);

  // Whisper modelini yükleyen fonksiyon
  const initializeWhisperModel = async () => {
    try {
      setModelLoading(true);
      setError(null);
      
      if (processingMode === 'browser') {
        // Tarayıcı modu - Whisper.js
        await WhisperService.initialize();
        setOfflineMode(false);
        console.log('Online model başarıyla yüklendi');
      } else if (processingMode === 'api') {
        // API modu
        await ApiWhisperService.initialize();
        setOfflineMode(false);
        console.log('API servisi başarıyla yüklendi');
      } else if (processingMode === 'webspeech') {
        // Web Speech API modu
        await WebSpeechService.initialize();
        setOfflineMode(false);
        console.log('Web Speech API başarıyla yüklendi');
      }
    } catch (err) {
      console.error('Model başlatma hatası:', err);
      
      if (processingMode === 'webspeech') {
        setError('Web Speech API başlatılamadı. Tarayıcınız desteklemiyor olabilir.');
        return;
      }
      
      // Eğer model yüklenemezse, offline moda geç
      setOfflineMode(true);
      // Offline modeli hazırla
      await OfflineTranscriptionService.initialize();
      console.log('Offline moda geçildi');
      
      // Kullanıcıya bilgi ver
      setError('Model yüklenemedi. Offline demo modunda çalışılıyor. Bu modda gerçek transkripsiyon yapılamaz, sadece örnek çıktılar gösterilir.');
    } finally {
      setModelLoading(false);
      setModelLoadAttempted(true);
    }
  };

  // Sayfa yüklendiğinde modeli hazırla
  useEffect(() => {
    // Sayfa yüklenince modeli yüklemeye başla
    initializeWhisperModel();
    
    // Sayfa kapatılırken temizlik yap
    return () => {
      // Temizlik işlemleri gerekirse buraya eklenebilir
      if (isRecording) {
        WebSpeechService.recognition?.stop();
      }
    };
  }, [processingMode]); // İşleme modu değiştiğinde yeniden yükle

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

  const processAudio = async (file) => {
    if (!file) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setProgress(10);
      setTranscription('');

      // Model parametrelerini belirle
      const modelParam = selectedModel === 'whisper-medium' ? 'medium' : 'small';
      
      // İlerleme göster
      setProgress(30);
      
      let result;
      
      if (offlineMode) {
        // Offline modda işlem yap
        console.log('Offline modda ses işleniyor...');
        setProgress(50);
        result = await OfflineTranscriptionService.transcribe(file, {
          language: 'auto',
          model: modelParam
        });
      } else {
        // Online modda işlem yap
        if (processingMode === 'browser') {
          // Tarayıcı modunda Whisper.js kullan
          // Yükleme esnasında modeli tekrar başlatmaya gerek yok
          if (!WhisperService.transcriber && !WhisperService.isLoading && !modelLoading) {
            await initializeWhisperModel();
          }
          
          setProgress(50);
          
          // Eğer model yüklemesi offline moda geçtiyse
          if (offlineMode) {
            result = await OfflineTranscriptionService.transcribe(file, {
              language: 'auto',
              model: modelParam
            });
          } else {
            result = await WhisperService.transcribe(file, {
              language: 'auto', // Auto ile kendisi dili tespit etsin
              model: modelParam
            });
          }
        } else if (processingMode === 'api') {
          // API modunda işlem yap
          setProgress(50);
          result = await ApiWhisperService.transcribe(file, {
            language: 'auto',
            apiKey: apiKey // OpenAI API anahtarı varsa ekle
          });
        } else if (processingMode === 'webspeech') {
          // Web Speech API modunda işlem yap
          setProgress(50);
          result = await WebSpeechService.transcribe(file, {
            language: 'auto'
          });
        }
      }
      
      if (result && result.text) {
        setTranscription(result.text);
        setProgress(100);
        
        // Offline sonuç uyarısı
        if (result.isOfflineResult) {
          setError('Bu sonuç gerçek değil! Offline demo modunda çalışıyorsunuz. Gerçek transkripsiyon için internet bağlantısı gereklidir.');
        } else {
          setError(null);
        }
      } else {
        throw new Error('Ses dosyasından metin elde edilemedi.');
      }
    } catch (err) {
      console.error('İşleme hatası:', err);
      
      // Eğer online modda hata alındıysa offline moda geç
      if (!offlineMode && processingMode !== 'webspeech') {
        setOfflineMode(true);
        await OfflineTranscriptionService.initialize();
        setError('Online işleme sırasında hata oluştu. Offline demo moduna geçildi. Bu modda gerçek transkripsiyon yapılamaz.');
        
        // Offline modda işlemi tekrar dene
        setProgress(30);
        const offlineResult = await OfflineTranscriptionService.transcribe(file, {
          language: 'auto'
        });
        
        if (offlineResult && offlineResult.text) {
          setTranscription(offlineResult.text);
          setProgress(100);
        }
      } else {
        setError(err.message || 'Ses dosyası işlenirken bir hata oluştu');
      }
    } finally {
      setIsLoading(false);
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

  const toggleProcessingMode = (mode) => {
    if (mode !== processingMode) {
      setProcessingMode(mode);
      setOfflineMode(false);
      setModelLoadAttempted(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Sesi Yazıya Çevir</h1>
        <p className="text-center text-gray-600">
          Ses dosyanızı yükleyin ve tamamen tarayıcınızda dönüştürün
        </p>
      </div>

      {/* İşleme Modu Seçimi */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-center text-purple-600">İşleme Modu</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            className={`p-4 rounded-lg border transition-all flex flex-col items-center ${
              processingMode === 'browser' 
                ? 'bg-gradient-to-r from-purple-100 to-purple-200 border-purple-400 shadow-md' 
                : 'bg-white/50 border-gray-200 hover:border-purple-300'
            }`}
            onClick={() => toggleProcessingMode('browser')}
          >
            <div className="flex items-center gap-2">
              <Cpu className="w-6 h-6 text-purple-500" />
              <div className={`font-medium ${processingMode === 'browser' ? 'text-purple-600' : 'text-gray-700'}`}>
                Tarayıcı İşleme
              </div>
              
              {processingMode === 'browser' && (
                offlineMode ? (
                  <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full flex items-center ml-2">
                    <WifiOff className="w-3 h-3 mr-1" />
                    Offline Demo
                  </span>
                ) : modelLoadAttempted ? (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center ml-2">
                    <Wifi className="w-3 h-3 mr-1" />
                    Online
                  </span>
                ) : null
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {offlineMode && processingMode === 'browser'
                ? 'Offline demo modunda çalışıyorsunuz. Gerçek transkripsiyon için internet bağlantınızı kontrol edin.'
                : 'Ses dosyanız tamamen cihazınızda işlenir. Hızlı, gizli ve tamamen ücretsiz.'}
            </p>
          </button>

          <button 
            className={`p-4 rounded-lg border transition-all flex flex-col items-center ${
              processingMode === 'api' 
                ? 'bg-gradient-to-r from-indigo-100 to-indigo-200 border-indigo-400 shadow-md' 
                : 'bg-white/50 border-gray-200 hover:border-indigo-300'
            }`}
            onClick={() => toggleProcessingMode('api')}
          >
            <div className="flex items-center gap-2">
              <Server className="w-6 h-6 text-indigo-500" />
              <div className={`font-medium ${processingMode === 'api' ? 'text-indigo-600' : 'text-gray-700'}`}>
                API İşleme
              </div>
              
              {processingMode === 'api' && modelLoadAttempted && !offlineMode && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center ml-2">
                  <Globe className="w-3 h-3 mr-1" />
                  API Hazır
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Ses dosyanız çevrimiçi API ile işlenir. Tarayıcı çözümü çalışmadığında kullanın.
            </p>
          </button>
          
          <button 
            className={`p-4 rounded-lg border transition-all flex flex-col items-center ${
              !webSpeechAvailable ? 'opacity-50 cursor-not-allowed' : 
              processingMode === 'webspeech' 
                ? 'bg-gradient-to-r from-green-100 to-green-200 border-green-400 shadow-md' 
                : 'bg-white/50 border-gray-200 hover:border-green-300'
            }`}
            onClick={() => webSpeechAvailable && toggleProcessingMode('webspeech')}
            disabled={!webSpeechAvailable}
          >
            <div className="flex items-center gap-2">
              <Mic className="w-6 h-6 text-green-500" />
              <div className={`font-medium ${processingMode === 'webspeech' ? 'text-green-600' : 'text-gray-700'}`}>
                Tarayıcı Konuşma API
              </div>
              
              {processingMode === 'webspeech' && modelLoadAttempted && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center ml-2">
                  <Check className="w-3 h-3 mr-1" />
                  Hazır
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {webSpeechAvailable 
                ? 'Tarayıcınızın dahili konuşma tanıma özelliğini kullanır. Çevrimdışı da çalışabilir.' 
                : 'Bu özellik tarayıcınızda kullanılamıyor.'}
            </p>
          </button>
        </div>
      </div>

      {/* API Key girişi (sadece API modu seçiliyse ve "OpenAI ile kullan" işaretliyse) */}
      {processingMode === 'api' && showApiKeyInput && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium">OpenAI API Anahtarı (İsteğe Bağlı)</h3>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">Ücretsiz API kullanmak için boş bırakabilirsiniz</span>
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="OpenAI API anahtarınızı girin (isteğe bağlı)"
            className="w-full p-2 border border-gray-300 rounded"
          />
          <p className="text-xs text-gray-500 mt-1">
            Not: API anahtarı girerseniz, OpenAI'nin Whisper API'si kullanılır. Aksi takdirde ücretsiz alternatif API kullanılır.
          </p>
        </div>
      )}

      {/* Web Speech API - Mikrofon butonu */}
      {processingMode === 'webspeech' && webSpeechAvailable && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={startRecording}
            disabled={isLoading || isRecording}
            className={`
              p-6 rounded-full 
              ${isRecording 
                ? 'bg-red-500 animate-pulse'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'}
              shadow-xl transition-all
              ${isLoading || isRecording ? 'opacity-70' : 'hover:shadow-2xl hover:scale-105'}
            `}
          >
            <Mic className={`w-12 h-12 text-white ${isRecording ? 'animate-bounce' : ''}`} />
          </button>
          <p className="mt-3 text-center text-green-700 font-medium">
            {isRecording 
              ? 'Dinleniyor... Konuşmanız tamamlandığında otomatik olarak sonlanacak.'
              : 'Mikrofon ile kayıt başlatmak için tıklayın'}
          </p>
        </div>
      )}

      {/* Model seçimi - sadece tarayıcı modu için göster */}
      {processingMode === 'browser' && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 text-center text-purple-600">Model Seçimi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              className={`p-4 rounded-lg border transition-all flex flex-col items-center ${
                selectedModel === 'whisper-small' 
                  ? 'bg-gradient-to-r from-purple-100 to-purple-200 border-purple-400 shadow-md' 
                  : 'bg-white/50 border-gray-200 hover:border-purple-300'
              }`}
              onClick={() => setSelectedModel('whisper-small')}
            >
              <div className={`font-medium ${selectedModel === 'whisper-small' ? 'text-purple-600' : 'text-gray-700'}`}>
                Whisper Small
              </div>
              <div className="text-xs text-gray-600 mt-1">Hafif model, hızlı sonuç (küçük)</div>
            </button>

            <button 
              className={`p-4 rounded-lg border transition-all flex flex-col items-center ${
                selectedModel === 'whisper-medium' 
                  ? 'bg-gradient-to-r from-indigo-100 to-indigo-200 border-indigo-400 shadow-md' 
                  : 'bg-white/50 border-gray-200 hover:border-indigo-300'
              }`}
              onClick={() => setSelectedModel('whisper-medium')}
            >
              <div className={`font-medium ${selectedModel === 'whisper-medium' ? 'text-indigo-600' : 'text-gray-700'}`}>
                Whisper Medium
              </div>
              <div className="text-xs text-gray-600 mt-1">Daha doğru sonuçlar (orta)</div>
            </button>
          </div>
        </div>
      )}

      {/* İyileştirilmiş dosya sürükle bırak alanı - Web Speech API modunda gösterme */}
      {processingMode !== 'webspeech' && (
        <div className="mt-6">
          <div 
            {...getRootProps()} 
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all 
              bg-white/30 backdrop-blur-sm
              ${isDragActive ? 'border-purple-500 bg-purple-50/50' : 'border-gray-300 hover:border-purple-400'}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                <Upload className="w-10 h-10 text-purple-500" />
              </div>
              <p className="text-purple-800 font-medium">
                {isDragActive
                  ? 'Dosyayı buraya bırakın'
                  : 'Ses dosyasını seçin veya buraya sürükleyin'}
              </p>
              <p className="text-sm text-gray-600">
                Desteklenen formatlar: MP3, M4A, WAV, OGG (maks. 50MB)
              </p>
              {selectedFile && (
                <div className="mt-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                  {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* API modu için API Key gösterme/gizleme seçeneği */}
      {processingMode === 'api' && (
        <div className="mt-2 flex justify-center">
          <button 
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            {showApiKeyInput ? 'API Anahtar Girişini Gizle' : 'OpenAI API Anahtarı Kullan (İsteğe Bağlı)'}
          </button>
        </div>
      )}

      {/* İyileştirilmiş buton - Web Speech API modunda gösterme */}
      {processingMode !== 'webspeech' && (
        <button 
          disabled={!selectedFile || isLoading || modelLoading} 
          className={`
            w-full py-3 rounded-lg mt-4 font-medium transition-all
            ${!selectedFile || isLoading || modelLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : processingMode === 'browser' 
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg hover:shadow-xl hover:translate-y-[-1px]'
                : 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg hover:shadow-xl hover:translate-y-[-1px]'
            }
          `}
          onClick={handleUpload}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader className="w-5 h-5 animate-spin" />
              <span>İşleniyor... {progress}%</span>
            </div>
          ) : modelLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader className="w-5 h-5 animate-spin" />
              <span>{processingMode === 'browser' ? 'Model hazırlanıyor...' : 'API bağlantısı kuruluyor...'}</span>
            </div>
          ) : (
            'Dosyayı Yükle ve Dönüştür'
          )}
        </button>
      )}

      {/* Hata mesajı */}
      {error && (
        <div className="mt-8 p-4 bg-red-50 rounded-lg">
          <div className="flex items-start gap-2 text-red-600">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Sonuç alanı */}
      {transcription && !isLoading && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-green-600 font-medium">Transkripsiyon tamamlandı!</span>
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={() => navigator.clipboard.writeText(transcription)}
                className="text-purple-600 hover:text-purple-700 bg-purple-50 p-2 rounded-md"
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
    </div>
  );
};

export default HomePage; 