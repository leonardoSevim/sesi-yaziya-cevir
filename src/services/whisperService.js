// Whisper.js kullanarak tarayıcı tarafında ses-metin dönüşümü yapan servis
import { pipeline } from '@xenova/transformers';

class WhisperService {
  constructor() {
    this.transcriber = null;
    this.isLoading = false;
  }

  async initialize() {
    if (this.transcriber) return;
    
    try {
      this.isLoading = true;
      // Küçük model ile başlayalım, performans sorunlarını önlemek için
      this.transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small');
      this.isLoading = false;
    } catch (error) {
      console.error('Whisper model yüklenirken hata:', error);
      this.isLoading = false;
      throw error;
    }
  }

  async transcribe(audioFile, options = {}) {
    if (!this.transcriber && !this.isLoading) {
      await this.initialize();
    }

    if (this.isLoading) {
      throw new Error('Model yükleniyor, lütfen bekleyin...');
    }

    try {
      const result = await this.transcriber(audioFile, {
        language: options.language || 'turkish',
        task: 'transcribe',
        chunk_length_s: 30, // Her 30 saniyelik parça için
        stride_length_s: 5, // 5 saniye örtüşme
      });

      return {
        text: result.text,
        language: result.language,
      };
    } catch (error) {
      console.error('Transkripsiyon hatası:', error);
      throw error;
    }
  }
}

// Singleton instance
export default new WhisperService(); 