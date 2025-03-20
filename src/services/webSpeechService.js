// Web Speech API kullanarak tarayıcı tabanlı ses tanıma servisi
// Bu servis, tarayıcının dahili konuşma tanıma yeteneklerini kullanır
// Transformers.js yüklenemediğinde alternatif olarak kullanılır

class WebSpeechService {
  constructor() {
    this.isLoading = false;
    this.isAvailable = this.checkAvailability();
    this.recognition = null;
  }

  // Web Speech API'nin kullanılabilir olup olmadığını kontrol et
  checkAvailability() {
    return 'webkitSpeechRecognition' in window || 
           'SpeechRecognition' in window;
  }

  // Servisi başlat
  async initialize() {
    try {
      this.isLoading = true;
      
      // Web Speech API'nin varlığını kontrol et
      if (!this.isAvailable) {
        throw new Error('Web Speech API bu tarayıcıda desteklenmiyor.');
      }
      
      // SpeechRecognition nesnesini oluştur
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      // Ayarlar
      this.recognition.continuous = false;
      this.recognition.interimResults = false; 
      
      console.log('Web Speech API hazır');
      this.isLoading = false;
      return true;
    } catch (error) {
      console.error('Web Speech API başlatılamadı:', error);
      this.isLoading = false;
      throw error;
    }
  }

  // Ses dosyasını doğrudan işleyemez, ancak AudioContext ile çalabilir
  // ve mikrofondan ses tanıma yapabilir
  async transcribeFromFile(audioFile, options = {}) {
    try {
      if (!this.isAvailable) {
        throw new Error('Web Speech API bu tarayıcıda desteklenmiyor.');
      }
      
      // Ses dosyası yerine, mikrofondan giriş alarak transkripsiyon yapıyoruz
      console.warn('Web Speech API doğrudan ses dosyası işleyemez. Bunun yerine dosya çalınıp, mikrofondan kayıt yapılacak.');
      
      // AudioContext ile ses dosyasını çal
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioArrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(audioArrayBuffer);
      
      // Sesi oynatmak için kaynak oluştur
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      // Mikrofondan kayıt yapmak için Web Speech API kullan
      const result = await this.transcribeFromMicrophone(options);
      
      // Ses dosyasını çal ve bitince durdur
      source.start(0);
      source.onended = () => {
        audioContext.close();
      };
      
      return result;
    } catch (error) {
      console.error('Ses dosyası işlenirken hata:', error);
      throw error;
    }
  }

  // Mikrofonu kullanarak ses tanıma
  async transcribeFromMicrophone(options = {}) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.recognition) {
          this.initialize();
        }
        
        // Dil ayarı
        this.recognition.lang = options.language === 'auto' ? 'tr-TR' : options.language || 'tr-TR';
        
        // Sonuç fonksiyonu
        this.recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          const confidence = event.results[0][0].confidence;
          
          resolve({
            text: transcript,
            language: this.recognition.lang,
            confidence: confidence,
            chunks: []
          });
        };
        
        // Hata fonksiyonu
        this.recognition.onerror = (event) => {
          reject(new Error(`Konuşma tanıma hatası: ${event.error}`));
        };
        
        // Kayıt sona erdiğinde
        this.recognition.onend = () => {
          // Eğer sonuç yoksa (sessizlik), boş bir sonuç döndür
          resolve({
            text: 'Ses tanınamadı veya sessizlik algılandı.',
            language: this.recognition.lang,
            confidence: 0,
            chunks: []
          });
        };
        
        // Kayıt başlat
        this.recognition.start();
        
        // 30 saniye sonra zorla bitir (eğer onend tetiklenmezse)
        setTimeout(() => {
          if (this.recognition) {
            this.recognition.stop();
          }
        }, 30000);
        
      } catch (error) {
        console.error('Mikrofon transkripsiyon hatası:', error);
        reject(error);
      }
    });
  }
  
  // Genel transkripsiyon metodu - dosya veya canlı girişi destekler
  async transcribe(audioFile, options = {}) {
    try {
      // Eğer bir dosya verilmişse, dosyayı işle
      if (audioFile instanceof File || audioFile instanceof Blob) {
        return await this.transcribeFromFile(audioFile, options);
      } 
      // Dosya verilmemişse mikrofondan kayıt yap
      else {
        return await this.transcribeFromMicrophone(options);
      }
    } catch (error) {
      console.error('Web Speech transkripsiyon hatası:', error);
      throw error;
    }
  }
}

// Singleton instance
export default new WebSpeechService(); 