// API tabanlı ses-metin dönüşümü servisi
// Yerel Whisper modeline erişim sorununuz varsa bu servis kullanılabilir

class ApiWhisperService {
  constructor() {
    this.isLoading = false;
    this.apiEndpoint = 'https://api.openai.com/v1/audio/transcriptions'; // OpenAI Whisper API
    this.alternativeEndpoint = 'https://humeai-speech-to-text.hf.space/api/predict'; // HumeAI alternatif API
    this.useOpenAI = false; // OpenAI API anahtarı varsa true yapın
  }

  // API key kontrolü yap ve servisi hazırla
  async initialize() {
    try {
      this.isLoading = true;
      console.log('API servisi hazırlanıyor...');
      
      // 2 saniye bekle - gerçek bir API yapılandırması simüle ediliyor
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('API servisi hazır');
      this.isLoading = false;
      return true;
    } catch (error) {
      console.error('API servisi hazırlanamadı:', error);
      this.isLoading = false;
      throw new Error('API servisi hazırlanamadı');
    }
  }

  // OpenAI Whisper API ile transkripsiyon
  async transcribeWithOpenAI(audioFile, apiKey, options = {}) {
    try {
      if (!apiKey) {
        throw new Error('OpenAI API anahtarı gerekli');
      }
      
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('language', options.language || 'tr');
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      return {
        text: data.text,
        language: options.language || 'tr',
        chunks: []
      };
    } catch (error) {
      console.error('OpenAI API hatası:', error);
      throw error;
    }
  }
  
  // Ücretsiz Hugging Face Space API ile transkripsiyon
  async transcribeWithHumeAI(audioFile, options = {}) {
    try {
      const formData = new FormData();
      
      // Base64'e çevir
      const arrayBuffer = await audioFile.arrayBuffer();
      const base64data = btoa(
        new Uint8Array(arrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      // İstek gönder
      const response = await fetch(this.alternativeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: [
            `data:audio/wav;base64,${base64data}`,
            options.language || 'tr'
          ]
        })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // HumeAI formatını işle
      if (data && data.data && data.data[0]) {
        return {
          text: data.data[0],
          language: options.language || 'tr',
          chunks: []
        };
      } else {
        throw new Error('Geçersiz API yanıtı');
      }
    } catch (error) {
      console.error('HumeAI API hatası:', error);
      throw error;
    }
  }
  
  // Proxy Whisper API hizmeti
  async transcribeWithProxy(audioFile, options = {}) {
    try {
      // Proxy URL
      const proxyUrl = 'https://whisper-proxy.glitch.me/transcribe';
      
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('language', options.language || 'tr');
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Proxy API Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        text: data.text || '',
        language: data.language || 'tr',
        chunks: data.segments || []
      };
    } catch (error) {
      console.error('Proxy API hatası:', error);
      throw error;
    }
  }

  // Ana transkripsiyon metodu
  async transcribe(audioFile, options = {}) {
    try {
      if (this.isLoading) {
        throw new Error('API servisi hazırlanıyor, lütfen bekleyin');
      }
      
      console.log('Ses dosyası API ile işleniyor...');
      
      let result;
      
      // OpenAI API'si varsa kullan
      if (this.useOpenAI && options.apiKey) {
        result = await this.transcribeWithOpenAI(audioFile, options.apiKey, options);
      } 
      // Yoksa alternatif API'yi dene
      else {
        try {
          // Önce Proxy dene
          result = await this.transcribeWithProxy(audioFile, options);
        } catch (error) {
          console.warn('Proxy API hatası, alternatif API deneniyor:', error.message);
          
          // Proxy başarısız olursa HumeAI dene
          result = await this.transcribeWithHumeAI(audioFile, options);
        }
      }
      
      console.log('API işlemi tamamlandı!');
      return result;
    } catch (error) {
      console.error('API transkripsiyon hatası:', error);
      throw error;
    }
  }
}

// Singleton instance
export default new ApiWhisperService(); 