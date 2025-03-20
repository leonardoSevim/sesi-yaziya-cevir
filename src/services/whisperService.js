// Whisper.js kullanarak tarayıcı tarafında ses-metin dönüşümü yapan servis
import { pipeline, env } from '@xenova/transformers';

// Transformers.js kütüphanesine global ayarlar
// Tarayıcı cache'i ve modelleri aktif et
env.allowLocalModels = true;
env.useBrowserCache = true;

// Mirror CDN seçeneği ekle - doğrudan jsdelivr kullan
env.remoteHost = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.5.0/dist';
env.allowRemoteModels = true;

// En küçük ve en basit model - tiny
const DEFAULT_MODEL = 'Xenova/whisper-tiny.en';

// Transformers.js API'sini kullanmadan doğrudan model dosyalarına erişim için URL'ler
const MODEL_URLS = {
  tokenizer: 'https://huggingface.co/Xenova/whisper-tiny.en/resolve/main/tokenizer.json',
  model: 'https://huggingface.co/Xenova/whisper-tiny.en/resolve/main/model.onnx',
  processor: 'https://huggingface.co/Xenova/whisper-tiny.en/resolve/main/preprocessor_config.json',
  config: 'https://huggingface.co/Xenova/whisper-tiny.en/resolve/main/config.json'
};

// CORS proxy URL
const CORS_PROXY = 'https://corsproxy.io/?';

// Özel hata yakalama fonksiyonu
function handleModelError(error) {
  console.error('Model işleme hatası:', error);
  
  if (error.toString().includes('<!doctype') || error.toString().includes('JSON')) {
    console.warn('HTML/JSON hatası tespit edildi, doğrudan offline moda geçiliyor');
    return new Error('Model yüklenemedi: Ağ hatası. Offline moda geçiliyor...');
  }
  
  if (error.toString().includes('CORS')) {
    console.warn('CORS hatası tespit edildi, doğrudan offline moda geçiliyor');
    return new Error('CORS hatası: Model dosyalarına erişim engellendi. Offline moda geçiliyor...');
  }
  
  return error;
}

class WhisperService {
  constructor() {
    this.transcriber = null;
    this.isLoading = false;
    this.modelName = DEFAULT_MODEL;
  }

  // Doğrudan model URL'sini fetch ile çekmeyi dene
  async fetchWithProxy(url) {
    try {
      // Doğrudan dene
      const response = await fetch(url);
      if (response.ok) return response;
      
      // Doğrudan erişim başarısız olursa CORS proxy ile dene
      const proxyResponse = await fetch(CORS_PROXY + url);
      if (proxyResponse.ok) return proxyResponse;
      
      throw new Error(`Model dosyası indirilemedi: ${url}`);
    } catch (error) {
      console.error('Model indirme hatası:', error);
      throw error;
    }
  }

  async initialize() {
    try {
      this.isLoading = true;
      console.log('Transformers.js ile model yükleniyor...');
      
      try {
        // Basitleştirilmiş yapılandırma ile Transformers.js pipeline kullan
        this.transcriber = await pipeline(
          'automatic-speech-recognition',
          DEFAULT_MODEL,
          { 
            quantized: true,
            revision: 'main',
            config: {
              chunk_length_s: 30,
              stride_length_s: 5
            }
          }
        );
        
        console.log('Model başarıyla yüklendi!');
        return this.transcriber;
      } catch (error) {
        console.warn('Model yüklenemedi, alternatif yöntem deneniyor...', error);
        throw error;
      }
    } catch (error) {
      this.isLoading = false;
      const handledError = handleModelError(error);
      console.error('Model yüklenirken hata:', handledError);
      throw handledError;
    } finally {
      this.isLoading = false;
    }
  }

  async transcribe(audioFile, options = {}) {
    try {
      if (!this.transcriber && !this.isLoading) {
        await this.initialize();
      }

      if (this.isLoading) {
        throw new Error('Model yükleniyor, lütfen bekleyin...');
      }

      if (!this.transcriber) {
        throw new Error('Model yüklenemedi. Offline modda işlem yapılacak.');
      }
      
      // Transcribe parametreleri
      const transcribeParams = {
        language: options.language || 'auto',  // Auto-detect language
        task: 'transcribe',
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true
      };
      
      console.log('Ses dosyası işleniyor...');
      const result = await this.transcriber(audioFile, transcribeParams);
      console.log('İşlem tamamlandı!');

      return {
        text: result.text || '',
        language: result.language || 'tr',
        chunks: result.chunks || []
      };
    } catch (error) {
      console.error('Transkripsiyon hatası:', error);
      throw error;
    }
  }
}

// Singleton instance
export default new WhisperService(); 