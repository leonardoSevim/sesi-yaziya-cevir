// Web Speech API kullanarak tarayıcı tabanlı ses tanıma servisi
// Bu servis, tarayıcının dahili konuşma tanıma yeteneklerini kullanır
// Transformers.js yüklenemediğinde alternatif olarak kullanılır

class WebSpeechService {
  constructor() {
    this.isLoading = false;
    this.isAvailable = this.checkAvailability();
    this.recognition = null;
    this.isSystemAudio = false; // Sistem sesi kullanımını belirten değişken
    this.audioContext = null;
    this.audioElement = null;
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

  // Kullanıcıya sistem sesi izni isteme
  async requestSystemAudio() {
    try {
      // Eğer tarayıcı mediaDevices destekliyorsa
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        });
        
        // Sadece ses izni verildiyse
        if (displayStream.getAudioTracks().length > 0) {
          this.isSystemAudio = true;
          console.log('Sistem sesi izni alındı');
          return displayStream;
        } else {
          throw new Error('Sistem sesi izni verilmedi');
        }
      } else {
        throw new Error('Bu tarayıcı sistem sesi yakalamayı desteklemiyor');
      }
    } catch (error) {
      console.error('Sistem sesi izni alınamadı:', error);
      return null;
    }
  }

  // Ses dosyasını oynatıp, söylenenleri tanıma
  async transcribeFromFile(audioFile, options = {}) {
    try {
      if (!this.isAvailable) {
        throw new Error('Web Speech API bu tarayıcıda desteklenmiyor.');
      }

      // Audio element ile ses dosyası çalma yaklaşımı
      const audioUrl = URL.createObjectURL(audioFile);
      
      // Eğer önceki audio elementi varsa temizle
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.src = '';
        document.body.removeChild(this.audioElement);
      }
      
      // Audio element oluştur ve ekle
      this.audioElement = document.createElement('audio');
      this.audioElement.src = audioUrl;
      this.audioElement.style.display = 'none';
      document.body.appendChild(this.audioElement);
      
      return new Promise((resolve, reject) => {
        try {
          // SpeechRecognition nesnesini hazırla
          if (!this.recognition) {
            this.initialize();
          }
          
          // Dil ayarları
          this.recognition.lang = options.language === 'auto' ? 'tr-TR' : options.language || 'tr-TR';
          
          // Tanıma sonuçları
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
          
          // Tanıma hataları
          this.recognition.onerror = (event) => {
            // Dosya çalışırken hata olduğunda ne yapılacak
            if (event.error === 'no-speech') {
              // Ses yoksa veya tanımada hata varsa
              console.warn('Ses tanıma hatası: ses algılanamadı');
              this.audioElement.pause(); // Dosyayı durdur
              
              // Yine de text ile hata mesajı döndür
              resolve({
                text: 'Ses dosyasında konuşma algılanamadı. Lütfen farklı bir dosya deneyin.',
                language: this.recognition.lang,
                confidence: 0,
                chunks: [],
                error: event.error
              });
            } else {
              reject(new Error(`Konuşma tanıma hatası: ${event.error}`));
            }
          };
          
          // Tanıma tamamlandığında
          this.recognition.onend = () => {
            // Dosyayı durdur
            this.audioElement.pause();
          };
          
          // Ses dosyasının yüklenmesi
          this.audioElement.oncanplay = () => {
            // Önce ses tanımayı başlat, sonra sesi çal
            this.recognition.start();
            
            // Kısa bir bekleme ile ses çalmayı başlat
            setTimeout(() => {
              this.audioElement.play().catch(e => {
                console.error('Ses çalma hatası:', e);
                reject(e);
              });
            }, 500);
          };
          
          // Dosya bitiminde tanımayı durdur
          this.audioElement.onended = () => {
            setTimeout(() => {
              try {
                this.recognition.stop();
              } catch (e) {
                console.log('Tanıma zaten durmuş olabilir:', e);
              }
            }, 1000); // Dosya bittikten 1 saniye sonra durdur
          };
          
          // Yükleme başlat
          this.audioElement.load();
          
          // En fazla 60 saniye sonra işlemi durdur
          setTimeout(() => {
            try {
              this.recognition.stop();
              this.audioElement.pause();
              
              // Hâlâ sonuç yoksa
              resolve({
                text: 'Ses işleme zaman aşımına uğradı. Ses dosyası çok uzun olabilir.',
                language: this.recognition.lang,
                confidence: 0,
                chunks: [],
                timeout: true
              });
            } catch (e) {
              console.log('Timeout temizleme hatası:', e);
            }
          }, 60000);
          
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      console.error('Ses dosyası işleme hatası:', error);
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
            try {
              this.recognition.stop();
            } catch (e) {
              console.log('Timeout durma hatası:', e);
            }
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