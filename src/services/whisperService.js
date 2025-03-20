// Whisper.js kullanarak tarayıcı tarafında ses-metin dönüşümü yapan servis
import { pipeline } from '@xenova/transformers';

class WhisperService {
  constructor() {
    this.transcriber = null;
    this.isLoading = false;
    this.modelName = 'Xenova/whisper-small';
  }

  async initialize(modelName = 'small') {
    if (this.transcriber) return;
    
    try {
      this.isLoading = true;
      
      // Model adını belirle
      if (modelName === 'medium') {
        this.modelName = 'Xenova/whisper-medium';
      } else {
        this.modelName = 'Xenova/whisper-small'; // Varsayılan
      }
      
      // Progress callback fonksiyonu
      const progressCallback = (progress) => {
        console.log(`Model yükleme ilerlemesi: ${Math.round(progress.progress * 100)}%`);
      };
      
      // Model yükleme
      this.transcriber = await pipeline(
        'automatic-speech-recognition', 
        this.modelName, 
        { progress_callback: progressCallback }
      );
      
      this.isLoading = false;
      console.log(`${this.modelName} başarıyla yüklendi`);
    } catch (error) {
      console.error('Whisper model yüklenirken hata:', error);
      this.isLoading = false;
      throw error;
    }
  }

  async transcribe(audioFile, options = {}) {
    if (!this.transcriber && !this.isLoading) {
      await this.initialize(options.model);
    }

    if (this.isLoading) {
      throw new Error('Model yükleniyor, lütfen bekleyin...');
    }

    try {
      // Model değişikliği kontrolü
      if (options.model === 'medium' && this.modelName !== 'Xenova/whisper-medium') {
        await this.initialize('medium');
      } else if (options.model === 'small' && this.modelName !== 'Xenova/whisper-small') {
        await this.initialize('small'); 
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
      console.error('Transkripsiyon hatası:', error);
      throw error;
    }
  }
}

// Singleton instance
export default new WhisperService(); 