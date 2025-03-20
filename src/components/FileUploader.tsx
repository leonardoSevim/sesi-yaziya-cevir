import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertTriangle, HelpCircle, Cloud, Cpu, Mic, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { transcribeAudio, TranscriptionProvider, HuggingFaceModel } from '../services/transcription';

const FileUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [provider, setProvider] = useState<TranscriptionProvider>('huggingface');
  const [hfModel, setHfModel] = useState<HuggingFaceModel>('whisper-medium');
  const [showModelOptions, setShowModelOptions] = useState(false);
  
  const navigate = useNavigate();
  
  // Model seçeneklerini provider değiştiğinde güncelle
  useEffect(() => {
    // Eğer provider HuggingFace değilse, model seçeneklerini gizle
    setShowModelOptions(provider === 'huggingface');
  }, [provider]);
  
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
      
      // Navigate to status page with file in state and provider info
      navigate(`/status/${transcriptionId}`, { 
        state: { 
          file, 
          provider,
          model: provider === 'huggingface' ? hfModel : undefined
        } 
      });
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Dosya yüklenemedi. Lütfen tekrar deneyin.');
      setUploading(false);
    }
  };

  // Provider seçim kartı bileşeni
  const ProviderCard = ({ value, icon, title, description, isSelected, onClick }: {
    value: TranscriptionProvider;
    icon: React.ReactNode;
    title: string;
    description: string;
    isSelected: boolean;
    onClick: () => void;
  }) => (
    <div 
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'border-space-400 bg-space-50 shadow-lg shadow-space-400/10' 
          : 'border-gray-200 hover:border-space-300 hover:bg-space-50/30'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center mb-2">
        <div className={`p-2 rounded-full ${isSelected ? 'bg-space-400/20' : 'bg-gray-100'}`}>
          {icon}
        </div>
        <h3 className={`ml-3 font-medium ${isSelected ? 'text-space-600' : 'text-gray-700'}`}>{title}</h3>
      </div>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );

  // HuggingFace model seçim kartı
  const ModelOptionCard = ({ value, title, description, isSelected, onClick }: {
    value: HuggingFaceModel;
    title: string;
    description: string;
    isSelected: boolean;
    onClick: () => void;
  }) => (
    <div 
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'border-purple-400 bg-purple-50 shadow-sm' 
          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center mb-1">
        {isSelected && <Check className="w-4 h-4 text-purple-500 mr-2" />}
        <h3 className={`font-medium ${isSelected ? 'text-purple-600' : 'text-gray-700'}`}>{title}</h3>
      </div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-space-700">Ses Tanıma Hizmeti Seçin</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ProviderCard
            value="openai"
            icon={<Cloud className="w-5 h-5 text-space-500" />}
            title="OpenAI Whisper"
            description="Yüksek doğruluklu, sunucu tabanlı transkripsiyon"
            isSelected={provider === 'openai'}
            onClick={() => setProvider('openai')}
          />
          <ProviderCard
            value="huggingface"
            icon={<Cpu className="w-5 h-5 text-space-500" />}
            title="HuggingFace"
            description="Ücretsiz ve açık kaynaklı AI modeli ile transkripsiyon"
            isSelected={provider === 'huggingface'}
            onClick={() => setProvider('huggingface')}
          />
          <ProviderCard
            value="browser"
            icon={<Mic className="w-5 h-5 text-space-500" />}
            title="Tarayıcı API"
            description="Tarayıcı tabanlı ses tanıma API'si (sınırlı destek)"
            isSelected={provider === 'browser'}
            onClick={() => setProvider('browser')}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Not: OpenAI Whisper ve HuggingFace, sunucu API anahtarı gerektirir. 
          Tarayıcı API ise kaydedilmiş ses dosyalarında sınırlı destek sunar.
        </p>
      </div>

      {showModelOptions && (
        <div className="mb-8 bg-purple-50/50 p-4 rounded-lg border border-purple-100">
          <h3 className="text-md font-semibold mb-3 text-purple-700">HuggingFace Model Seçimi</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ModelOptionCard
              value="whisper-large-v3"
              title="Whisper Large V3"
              description="En doğru sonuçlar, tüm diller için iyi performans, daha yavaş"
              isSelected={hfModel === 'whisper-large-v3'}
              onClick={() => setHfModel('whisper-large-v3')}
            />
            <ModelOptionCard
              value="whisper-large-v3-turbo"
              title="Whisper Large V3 Turbo"
              description="Optimize edilmiş büyük model, hız ve doğruluk dengesi"
              isSelected={hfModel === 'whisper-large-v3-turbo'}
              onClick={() => setHfModel('whisper-large-v3-turbo')}
            />
            <ModelOptionCard
              value="whisper-medium"
              title="Whisper Medium"
              description="Orta boyutlu model, çoğu durum için yeterli performans"
              isSelected={hfModel === 'whisper-medium'}
              onClick={() => setHfModel('whisper-medium')}
            />
            <ModelOptionCard
              value="whisper-small"
              title="Whisper Small"
              description="Küçük ve hızlı model, daha kısa ve basit konuşmalar için ideal"
              isSelected={hfModel === 'whisper-small'}
              onClick={() => setHfModel('whisper-small')}
            />
          </div>
        </div>
      )}

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