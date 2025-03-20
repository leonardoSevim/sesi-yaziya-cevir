import React, { useState } from 'react';
import { AlertTriangle, FileAudio } from 'lucide-react';
import { TranscriptionProvider, HuggingFaceModel } from '../services/transcription';

interface ModelSelectionProps {
  onModelSelect: (provider: TranscriptionProvider, model?: HuggingFaceModel) => void;
}

const ModelSelection: React.FC<ModelSelectionProps> = ({ onModelSelect }) => {
  // Varsayılan olarak whisper-small ve huggingface seçili olsun
  const [selectedProvider, setSelectedProvider] = useState<TranscriptionProvider>('huggingface');
  const [selectedModel, setSelectedModel] = useState<HuggingFaceModel>('whisper-small');

  const handleProviderChange = (provider: TranscriptionProvider) => {
    setSelectedProvider(provider);
    
    // Provider değişince model seçimini güncelle
    if (provider === 'huggingface') {
      onModelSelect(provider, selectedModel);
    } else {
      onModelSelect(provider);
    }
  };

  const handleModelChange = (model: HuggingFaceModel) => {
    setSelectedModel(model);
    onModelSelect(selectedProvider, model);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-space-200/30 mb-6">
      <h2 className="text-xl font-bold text-space-900 mb-4">Model Seçimi</h2>
      
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            className={`py-2 px-4 rounded-lg ${
              selectedProvider === 'browser' 
                ? 'bg-space-500 text-white' 
                : 'bg-space-100 text-space-700 hover:bg-space-200'
            } transition-colors`}
            onClick={() => handleProviderChange('browser')}
          >
            Tarayıcı API
          </button>
          
          <button
            className={`py-2 px-4 rounded-lg ${
              selectedProvider === 'huggingface' 
                ? 'bg-space-500 text-white' 
                : 'bg-space-100 text-space-700 hover:bg-space-200'
            } transition-colors`}
            onClick={() => handleProviderChange('huggingface')}
          >
            HuggingFace API
          </button>
          
          <button
            className={`py-2 px-4 rounded-lg ${
              selectedProvider === 'openai' 
                ? 'bg-space-500 text-white' 
                : 'bg-space-100 text-space-700 hover:bg-space-200'
            } transition-colors`}
            onClick={() => handleProviderChange('openai')}
          >
            OpenAI API
          </button>
        </div>
      </div>
      
      {selectedProvider === 'huggingface' && (
        <div className="mt-4">
          <h3 className="text-md font-medium text-space-700 mb-3">Whisper Model Boyutu:</h3>
          
          <div className="flex flex-wrap gap-2">
            <button
              className={`py-2 px-4 rounded-lg ${
                selectedModel === 'whisper-tiny' 
                  ? 'bg-space-500 text-white' 
                  : 'bg-space-100 text-space-700 hover:bg-space-200'
              } transition-colors`}
              onClick={() => handleModelChange('whisper-tiny')}
            >
              Tiny
            </button>
            
            <button
              className={`py-2 px-4 rounded-lg ${
                selectedModel === 'whisper-small' 
                  ? 'bg-space-500 text-white' 
                  : 'bg-space-100 text-space-700 hover:bg-space-200'
              } transition-colors`}
              onClick={() => handleModelChange('whisper-small')}
            >
              Small
            </button>
            
            <button
              className={`py-2 px-4 rounded-lg ${
                selectedModel === 'whisper-medium' 
                  ? 'bg-space-500 text-white' 
                  : 'bg-space-100 text-space-700 hover:bg-space-200'
              } transition-colors`}
              onClick={() => handleModelChange('whisper-medium')}
            >
              Medium
            </button>
            
            <button
              className={`py-2 px-4 rounded-lg ${
                selectedModel === 'whisper-large-v3' 
                  ? 'bg-space-500 text-white' 
                  : 'bg-space-100 text-space-700 hover:bg-space-200'
              } transition-colors`}
              onClick={() => handleModelChange('whisper-large-v3')}
            >
              Large-v3
            </button>
          </div>
          
          <div className="mt-3 text-sm text-space-500 flex items-start">
            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 text-amber-500 mt-0.5" />
            <p>
              <strong>Not:</strong> Daha büyük modeller daha iyi sonuç verir ancak işlem süreleri daha uzun olabilir ve sunucu hatası riski yüksektir. Başlangıç için Small veya Tiny model önerilir. Büyük dosyalar için Tiny model en iyi performansı verebilir.
            </p>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-sm bg-space-50 p-3 rounded-lg">
        {selectedProvider === 'browser' && (
          <div className="flex items-start">
            <FileAudio className="w-4 h-4 mr-2 flex-shrink-0 text-space-500 mt-0.5" />
            <p>
              <strong>Tarayıcı Speech API:</strong> Ses dosyasını tamamen tarayıcınızda işler. 
              İnternet bağlantısına ihtiyaç duymaz, ancak sadece basit ses dosyaları için kullanılabilir ve tüm tarayıcılarda çalışmayabilir.
            </p>
          </div>
        )}
        
        {selectedProvider === 'huggingface' && (
          <div className="flex items-start">
            <FileAudio className="w-4 h-4 mr-2 flex-shrink-0 text-space-500 mt-0.5" />
            <p>
              <strong>HuggingFace API ({selectedModel}):</strong>{' '}
              {selectedModel === 'whisper-tiny' && 'En hızlı model, basit konuşmalar için uygundur. Dosya boyutu sınırlaması yok.'}
              {selectedModel === 'whisper-small' && 'Hız ve kalite dengesi en iyi model. Çoğu konuşma için yeterli doğruluk sağlar.'}
              {selectedModel === 'whisper-medium' && 'Daha iyi doğruluk için, karmaşık konuşmalarda avantajlı. İşlem süresi daha uzun.'}
              {selectedModel === 'whisper-large-v3' && 'En iyi doğruluk için, aksan ve gürültü içeren kayıtlarda daha iyi sonuç verir. İşlem süresi uzun.'}
            </p>
          </div>
        )}
        
        {selectedProvider === 'openai' && (
          <div className="flex items-start">
            <FileAudio className="w-4 h-4 mr-2 flex-shrink-0 text-space-500 mt-0.5" />
            <p>
              <strong>OpenAI Whisper API:</strong> OpenAI'nin resmi Whisper modeli. 
              En doğru sonuçları verir ancak API anahtarı gerektirir ve ücretli bir hizmettir.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelSelection; 