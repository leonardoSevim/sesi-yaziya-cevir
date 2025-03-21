// SesiYaziyaCevir - Tarayıcı Konuşma API kullanarak ses-metin dönüşümü yapan uygulama
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Loader, 
  AlertCircle, 
  Check, 
  Mic,
  Volume2,
  Info
} from 'lucide-react';
import webSpeechService from '../services/webSpeechService';
import OfflineTranscriptionService from '../services/offlineTranscriptionService';
import { Languages } from '../constants/languages';
import '../styles/HomePage.css';

// Constants ve diğer tanımlamalar buraya gelecek

const HomePage = () => {
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [language, setLanguage] = useState('tr-TR');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isWebSpeechAvailable, setIsWebSpeechAvailable] = useState(true);

  // Web Speech API'sini başlatma
  const initializeWebSpeech = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const initialized = await webSpeechService.initialize();
      
      if (!initialized) {
        setError('Web Speech API başlatılamadı.');
        setIsWebSpeechAvailable(false);
      } else {
        setIsWebSpeechAvailable(true);
      }
      
      setIsLoading(false);
      return initialized;
    } catch (err) {
      console.error('Web Speech başlatma hatası:', err);
      setError(`Web Speech API başlatılamadı: ${err.message}`);
      setIsWebSpeechAvailable(false);
      setIsLoading(false);
      return false;
    }
  }, []);

  // Sayfa yüklendiğinde Web Speech API'yi başlat
  useEffect(() => {
    initializeWebSpeech();
  }, [initializeWebSpeech]);

  // Ses dosyası işleme
  const processAudio = async (file) => {
    if (!file) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setTranscription('');
      setProgress(0);
      
      // Web Speech servisinin hazır olduğundan emin ol
      if (!webSpeechService.isAvailable) {
        await initializeWebSpeech();
      }
      
      // Kullanıcıya ses çalma hakkında bilgi ver
      setTranscription('Ses dosyası hazırlanıyor... Lütfen hoparlör sesinin açık olduğundan emin olun.');
      
      // Ses dosyasını işle ve sonuçları al
      setAudioPlaying(true);
      const result = await webSpeechService.transcribe(file, { language });
      setAudioPlaying(false);
      
      // Sonuçları göster
      if (result.error === 'no-speech' || result.timeout) {
        setTranscription(`${result.text}\n\nNot: Web Speech API, ses dosyalarını doğrudan işleyemez. Dosya çalarken sistem sesi veya mikrofon üzerinden tanıma yapar.`);
      } else {
        setTranscription(result.text);
      }

      // İşleme tamamlandı
      setProgress(100);
    } catch (err) {
      console.error('Ses işleme hatası:', err);
      setError(`Ses dosyası işlenemedi: ${err.message}`);
      setAudioPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Mikrofondan kayıt başlatma
  const startRecording = async () => {
    try {
      setIsLoading(true);
      setIsRecording(true);
      setError(null);
      setTranscription('Konuşmaya başlayabilirsiniz...');
      
      // Web Speech servisinin hazır olduğundan emin ol
      if (!webSpeechService.isAvailable) {
        await initializeWebSpeech();
      }
      
      // Mikrofonu kullanarak tanıma başlat
      const result = await webSpeechService.transcribe(null, { language });
      
      // Sonuçları göster
      setTranscription(result.text);
    } catch (err) {
      console.error('Mikrofon kaydı hatası:', err);
      setError(`Mikrofon kaydı yapılamadı: ${err.message}`);
    } finally {
      setIsLoading(false);
      setIsRecording(false);
    }
  };

  // Dosya bırakma alanı için gereken hooks
  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      processAudio(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac']
    },
    maxFiles: 1
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-6">Ses Tanıma Uygulaması</h1>
      
      {!isWebSpeechAvailable && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Web Speech API Desteklenmiyor</h3>
              <p className="text-sm text-red-700 mt-1">
                Tarayıcınız Web Speech API'yi desteklemiyor. Lütfen Chrome, Edge veya Safari gibi modern bir tarayıcıyı deneyin.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Dil Seçimi */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">Dil Seçimi:</label>
        <select
          className="w-full p-2 border border-gray-300 rounded-md"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={isLoading || audioPlaying || isRecording}
        >
          {Object.entries(Languages).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>

      {/* Ses Dosyası Yükleme Alanı */}
      <div className="mb-6">
        <div
          {...getRootProps({
            className: `border-2 ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            } border-dashed rounded-lg p-6 text-center cursor-pointer`
          })}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
          <p className="text-gray-600">
            {isDragActive
              ? 'Dosyayı buraya bırakın...'
              : 'Ses dosyasını yüklemek için tıklayın veya buraya sürükleyin'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            MP3, WAV, M4A, OGG, FLAC ve AAC formatları desteklenmektedir
          </p>
        </div>
        
        {selectedFile && (
          <div className="mt-2 text-sm text-gray-600">
            Seçilen dosya: {selectedFile.name}
          </div>
        )}
      </div>
      
      {/* Mikrofon Kayıt Butonu */}
      <div className="mb-6 flex justify-center">
        <button
          className={`flex items-center px-4 py-2 rounded-md ${
            isRecording 
              ? 'bg-red-500 text-white' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          onClick={startRecording}
          disabled={isLoading || audioPlaying || !isWebSpeechAvailable}
        >
          <Mic className="mr-2 h-5 w-5" />
          {isRecording ? 'Kaydediliyor...' : 'Mikrofondan Kaydet'}
        </button>
      </div>

      {/* Bilgi Kutusu */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800">Nasıl Çalışır?</h3>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Ses Dosyası:</strong> Dosyanız çalarken sistem sesini mikrofonunuz aracılığıyla dinler ve metne çevirir. 
              Lütfen dosya çalınırken ses sisteminizin açık olduğundan emin olun.
            </p>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Mikrofon:</strong> Doğrudan mikrofonunuzdan konuşmalarınızı tanır ve metne çevirir.
            </p>
          </div>
        </div>
      </div>

      {/* Yükleme ve Hata Gösterimi */}
      {isLoading && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${Math.max(5, progress)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {audioPlaying 
              ? 'Ses dosyası çalınıyor ve dinleniyor...' 
              : 'İşleniyor...'}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Transkripsiyon Sonucu */}
      {transcription && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Transkripsiyon Sonucu:</h2>
          <div className="p-4 bg-white border rounded-md whitespace-pre-wrap">
            {transcription}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage; 