// Offline çalışan ve internet bağlantısı gerektirmeyen basit bir transkripsiyon servisi
// Bu servis, gerçek bir speech-to-text dönüşümü yapmaz, sadece demo amaçlı örnek bir çıktı döndürür

class OfflineTranscriptionService {
  constructor() {
    this.isLoading = false;
  }

  // Sahte bir model yükleme işlemi
  async initialize() {
    try {
      this.isLoading = true;
      console.log('Offline model hazırlanıyor...');
      
      // Gerçek bir modelin yüklenmesini taklit etmek için timeout kullanıyoruz
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Offline model hazır');
      this.isLoading = false;
      return true;
    } catch (error) {
      console.error('Offline model hazırlanamadı:', error);
      this.isLoading = false;
      throw new Error('Offline model yüklenemedi');
    }
  }

  // Sahte bir transkripsiyon işlemi
  async transcribe(audioFile, options = {}) {
    try {
      if (this.isLoading) {
        throw new Error('Model hazırlanıyor, lütfen bekleyin...');
      }
      
      console.log('Ses dosyası işleniyor (offline mod)...');
      console.log('Dosya boyutu:', audioFile.size, 'bytes');
      
      // İşlem süresi, dosya boyutuna göre değişsin
      const processingTime = Math.min(Math.max(1000, audioFile.size / 10000), 5000);
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      // Örnek türkçe transkripsiyon metni
      const exampleTranscriptions = [
        "Merhaba, bu bir test kaydıdır. Sistemimiz şu anda offline modda çalışmaktadır. İnternet bağlantınız olmadığı için gerçek transkripsiyon yapılamıyor.",
        "Sesli kayıttan metne dönüştürme işlemi için internet bağlantısı ve Whisper modeli gereklidir. Şu anda örnek bir çıktı görüyorsunuz.",
        "Bu bir demo çıktısıdır. Gerçek transkripsiyon için lütfen internet bağlantınızı kontrol edin ve sayfayı yenileyin.",
        "Offline modda çalışıyorsunuz. Bu mod sadece uygulamanın arayüzünü test etmenizi sağlar. Gerçek ses dosyalarını işlemek için Whisper modelinin yüklenmesi gerekir."
      ];
      
      // Rastgele bir transkripsiyon seçelim
      const transcriptionText = exampleTranscriptions[Math.floor(Math.random() * exampleTranscriptions.length)];
      
      console.log('İşlem tamamlandı (offline mod)!');
      
      return {
        text: transcriptionText,
        language: 'tr',
        chunks: [{text: transcriptionText, timestamp: [0, 10]}],
        isOfflineResult: true
      };
    } catch (error) {
      console.error('Offline transkripsiyon hatası:', error);
      throw error;
    }
  }
}

// Singleton instance
export default new OfflineTranscriptionService(); 