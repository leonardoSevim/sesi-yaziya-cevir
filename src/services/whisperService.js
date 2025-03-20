// Whisper.js kullanarak tarayıcı tarafında ses-metin dönüşümü yapan servis
import { pipeline, env } from '@xenova/transformers';

// Transformers.js kütüphanesine global ayarlar
// 1. Cache yolunu değiştiriyoruz - modeller application cache'te saklanacak
env.allowLocalModels = true;
env.useBrowserCache = true;

// 2. CORS ve ağ sorunlarını çözmek için çeşitli ayarlar
// Varsayılan CDN'leri deneyelim (sırayla)
const CDN_HOSTS = [
  'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2',
  'https://unpkg.com/@xenova/transformers@2.17.2',
  'https://cdnjs.cloudflare.com/ajax/libs/transformers.js/2.17.2'
];

// CDN'leri rastgele seçelim - CORS sorunu olursa farklı bir CDN denenir
env.remoteHost = CDN_HOSTS[Math.floor(Math.random() * CDN_HOSTS.length)];
env.allowRemoteModels = true; // Uzaktan modellere izin ver

// Mevcut en küçük modeli kullan - daha stabil
const WHISPER_MODELS = {
  small: 'Xenova/whisper-tiny.en', // tiny.en daha küçük, daha stabil (İngilizce)
  medium: 'Xenova/whisper-tiny'    // tiny modeli orta olarak kullan
};

// Özel hata yakalama fonksiyonu
function handleModelError(error) {
  console.error('Model işleme hatası:', error);
  
  if (error.toString().includes('<!doctype') || error.toString().includes('JSON')) {
    console.warn('HTML/JSON hatası tespit edildi, CDN değiştiriliyor');
    // Farklı bir CDN dene
    const currentIndex = CDN_HOSTS.indexOf(env.remoteHost);
    const nextIndex = (currentIndex + 1) % CDN_HOSTS.length;
    env.remoteHost = CDN_HOSTS[nextIndex];
    console.log(`CDN değiştirildi: ${env.remoteHost}`);
    
    return new Error('Ağ hatası: Model dosyaları indirilemedi. Alternatif CDN deneniyor...');
  }
  
  if (error.toString().includes('CORS')) {
    console.warn('CORS hatası tespit edildi, CDN değiştiriliyor');
    // Farklı bir CDN dene
    const currentIndex = CDN_HOSTS.indexOf(env.remoteHost);
    const nextIndex = (currentIndex + 1) % CDN_HOSTS.length;
    env.remoteHost = CDN_HOSTS[nextIndex];
    console.log(`CDN değiştirildi: ${env.remoteHost}`);
    
    return new Error('CORS hatası: Model dosyalarına erişim engellendi. Alternatif CDN deneniyor...');
  }
  
  return error;
}

class WhisperService {
  constructor() {
    this.transcriber = null;
    this.isLoading = false;
    this.modelName = WHISPER_MODELS.small;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.cdnTriesCount = 0;
    this.maxCdnTries = CDN_HOSTS.length;
  }

  async initialize(modelName = 'small') {
    if (this.transcriber) return;
    
    try {
      this.isLoading = true;
      
      // Model adını belirle - daha güvenilir ve küçük modeller kullan
      this.modelName = modelName === 'medium' ? WHISPER_MODELS.medium : WHISPER_MODELS.small;
      
      // Progress callback fonksiyonu
      const progressCallback = (progress) => {
        console.log(`Model yükleme ilerlemesi: ${Math.round((progress?.progress || 0) * 100)}%`);
      };
      
      // Modeli yüklemeyi dene
      try {
        console.log(`Model yükleniyor: ${this.modelName} (CDN: ${env.remoteHost})...`);
        // Önce model bilgilerini çek - genellikle daha küçük bir json dosyası
        this.transcriber = await pipeline(
          'automatic-speech-recognition', 
          this.modelName, 
          { progress_callback: progressCallback }
        );
      } catch (initialError) {
        // Model yüklenemezse farklı CDN veya model deneyelim
        console.warn('Model yüklenemedi, alternatif deneniyor:', initialError.message);
        
        if (this.cdnTriesCount < this.maxCdnTries) {
          this.cdnTriesCount++;
          // CDN değiştir
          const currentIndex = CDN_HOSTS.indexOf(env.remoteHost);
          const nextIndex = (currentIndex + 1) % CDN_HOSTS.length;
          env.remoteHost = CDN_HOSTS[nextIndex];
          console.log(`CDN değiştirildi: ${env.remoteHost} (${this.cdnTriesCount}/${this.maxCdnTries})`);
          
          // Aynı modeli tekrar dene
          this.transcriber = await pipeline(
            'automatic-speech-recognition', 
            this.modelName, 
            { progress_callback: progressCallback }
          );
        } else {
          // CDN'ler denendi, daha basit modeli dene
          console.warn("Tüm CDN'ler başarısız, en basit modele geçiliyor");
          this.modelName = 'Xenova/whisper-tiny.en';  // En küçük İngilizce model
          this.transcriber = await pipeline(
            'automatic-speech-recognition', 
            this.modelName, 
            { progress_callback: progressCallback }
          );
        }
      }
      
      this.isLoading = false;
      console.log(`${this.modelName} başarıyla yüklendi`);
    } catch (error) {
      this.isLoading = false;
      const handledError = handleModelError(error);
      console.error('Whisper model yüklenirken hata:', handledError);
      throw handledError;
    }
  }

  async transcribe(audioFile, options = {}) {
    try {
      if (!this.transcriber && !this.isLoading) {
        await this.initialize(options.model);
      }

      if (this.isLoading) {
        throw new Error('Model yükleniyor, lütfen bekleyin...');
      }

      // Eğer model hala yüklenemezse tekrar deneyelim (maksimum 3 kez)
      if (!this.transcriber && this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Model yüklenemedi, yeniden deneniyor (${this.retryCount}/${this.maxRetries})...`);
        
        // Her deneme için farklı CDN ve model deneyelim
        const currentIndex = CDN_HOSTS.indexOf(env.remoteHost);
        const nextIndex = (currentIndex + 1) % CDN_HOSTS.length;
        env.remoteHost = CDN_HOSTS[nextIndex];
        console.log(`CDN değiştirildi: ${env.remoteHost}`);
        
        await this.initialize('small'); // En küçük modeli dene
      }
      
      if (!this.transcriber) {
        throw new Error('Model yüklenemedi. Lütfen bağlantınızı kontrol edip sayfayı yenileyiniz.');
      }
      
      // Transcribe parametreleri
      const transcribeParams = {
        language: options.language || 'turkish',
        task: 'transcribe',
        chunk_length_s: 30, // Her 30 saniyelik parça için
        stride_length_s: 5, // 5 saniye örtüşme
        return_timestamps: true, // Zaman damgalarını göster (isteğe bağlı)
      };
      
      console.log('Ses dosyası işleniyor...');
      const result = await this.transcriber(audioFile, transcribeParams);
      console.log('İşlem tamamlandı!');

      return {
        text: result.text,
        language: result.language || 'tr',
        chunks: result.chunks || []
      };
    } catch (error) {
      const handledError = handleModelError(error);
      console.error('Transkripsiyon hatası:', handledError);
      throw handledError;
    }
  }
}

// Singleton instance
export default new WhisperService(); 