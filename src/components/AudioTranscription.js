// Ses dosyalarını metin dönüştürme komponenti
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Mic, Upload, AlertCircle, Check, Loader } from 'lucide-react';
import WhisperService from '../services/whisperService';

const AudioTranscription = () => {
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const processAudio = async (file) => {
    try {
      setIsLoading(true);
      setError(null);
      setProgress(10);

      // Model yüklenirken progress göster
      setProgress(30);
      
      const result = await WhisperService.transcribe(file);
      
      setTranscription(result.text);
      setProgress(100);
      setError(null);
    } catch (err) {
      setError(err.message || 'Ses dosyası işlenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      processAudio(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg']
    },
    maxFiles: 1
  });

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Sesi Yazıya Çevir</h1>
        <p className="text-center text-gray-600">
          Ses dosyanızı yükleyin veya sürükleyin
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-500'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <Upload className="w-12 h-12 text-gray-400" />
          <p className="text-gray-600">
            {isDragActive
              ? 'Dosyayı buraya bırakın'
              : 'Ses dosyasını seçin veya buraya sürükleyin'}
          </p>
          <p className="text-sm text-gray-500">
            Desteklenen formatlar: MP3, WAV, M4A, OGG
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-2">
            <Loader className="w-5 h-5 animate-spin text-purple-500" />
            <span>İşleniyor... %{progress}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-8 p-4 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {transcription && !isLoading && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-green-600">Transkripsiyon tamamlandı!</span>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Sonuç:</h2>
            <p className="whitespace-pre-wrap">{transcription}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioTranscription; 