const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const FormData = require('form-data');
const fetch = require('node-fetch');

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

// Hızlı bir şekilde farklı API sağlayıcıları ile çalışabilmek için bir wrapper
class TranscriptionService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  // OpenAI Whisper API ile transkripsiyon
  async transcribeWithOpenAI(audioBuffer, options = {}) {
    try {
      // API anahtarı yoksa hata ver
      if (!this.apiKey) {
        throw new Error('API_KEY çevre değişkeni ayarlanmamış');
      }

      const openai = new OpenAI({
        apiKey: this.apiKey
      });

      // Geçici dosya oluştur
      const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.mp3`);
      await writeFileAsync(tempFilePath, audioBuffer);

      // Whisper API'ya gönder
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: "whisper-1",
        language: "tr",
        response_format: "text",
        ...options
      });

      // Geçici dosyayı sil
      await unlinkAsync(tempFilePath);

      return { text: transcription.text };
    } catch (error) {
      console.error('Transkripsiyon hatası:', error);
      throw error;
    }
  }

  // Alternatif Ücretsiz API Sağlayıcısı: HuggingFace
  async transcribeWithHuggingFace(audioBuffer, options = {}) {
    try {
      // API anahtarı yoksa hata ver
      if (!this.apiKey) {
        throw new Error('HUGGINGFACE_API_KEY çevre değişkeni ayarlanmamış');
      }

      // Geçici dosya oluştur
      const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.mp3`);
      await writeFileAsync(tempFilePath, audioBuffer);

      // FormData oluştur
      const form = new FormData();
      form.append('audio_file', fs.createReadStream(tempFilePath));
      form.append('language', options.language || 'tr');

      // Model seçimi
      let modelEndpoint = 'https://api-inference.huggingface.co/models/openai/whisper-small';
      
      // Eğer options içinde model belirtilmişse onu kullan
      if (options.model) {
        switch (options.model) {
          case 'whisper-large-v3':
            modelEndpoint = 'https://api-inference.huggingface.co/models/openai/whisper-large-v3';
            break;
          case 'whisper-large-v3-turbo':
            modelEndpoint = 'https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo';
            break;
          case 'whisper-medium':
            modelEndpoint = 'https://api-inference.huggingface.co/models/openai/whisper-medium';
            break;
          case 'whisper-small':
            modelEndpoint = 'https://api-inference.huggingface.co/models/openai/whisper-small';
            break;
          case 'whisper-tiny':
            modelEndpoint = 'https://api-inference.huggingface.co/models/openai/whisper-tiny';
            break;
          case 'turkish-specific':
            modelEndpoint = 'https://api-inference.huggingface.co/models/jonatasgrosman/wav2vec2-large-xlsr-53-turkish';
            break;
          default:
            modelEndpoint = 'https://api-inference.huggingface.co/models/openai/whisper-small';
        }
      }

      // 502 hataları için yeniden deneme mekanizması
      const maxRetries = 3;
      let retryCount = 0;
      let response = null;
      let lastError = null;

      while (retryCount < maxRetries) {
        try {
          console.log(`HuggingFace API isteği gönderiliyor (Deneme ${retryCount + 1}/${maxRetries})...`);
          
          // HuggingFace API'ya gönder
          response = await fetch(
            modelEndpoint,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${this.apiKey}`
              },
              body: form
            }
          );
          
          if (response.ok) {
            break; // Başarılı yanıt alındı, döngüden çık
          } else if (response.status === 502 || response.status === 500 || response.status === 504) {
            // Gateway hatası, yeniden dene
            lastError = `API Sunucu Hatası: ${response.status} - ${response.statusText}`;
            console.log(`Yeniden deneniyor... (${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 saniye bekle
            retryCount++;
          } else {
            // Diğer hatalar için doğrudan hata fırlat
            throw new Error(`API error: ${response.status} - ${response.statusText}`);
          }
        } catch (error) {
          lastError = error;
          if (retryCount >= maxRetries - 1) {
            throw error; // Maksimum deneme sayısına ulaşıldı
          }
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 saniye bekle
        }
      }

      // Geçici dosyayı sil
      await unlinkAsync(tempFilePath);

      if (!response || !response.ok) {
        throw new Error(lastError || 'API isteği başarısız');
      }

      const result = await response.json();
      return { text: result.text || result.sentence || result.transcription || '' };
    } catch (error) {
      console.error('HuggingFace transkripsiyon hatası:', error);
      throw error;
    }
  }
}

// Netlify Function handler
exports.handler = async function(event, context) {
  // POST isteği değilse hata ver
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Sadece POST metodu destekleniyor' })
    };
  }

  try {
    // İstek gövdesinin içeriğini kontrol et
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Ses verisi bulunamadı' })
      };
    }

    // Base64 olarak gönderilen ses verisini çöz
    const body = JSON.parse(event.body);
    const base64Audio = body.audio;
    const language = body.language || 'tr';
    const provider = body.provider || 'openai';
    const model = body.model || 'whisper-small'; // Varsayılan olarak whisper-small kullan
    
    if (!base64Audio) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'audio parametresi gerekli' })
      };
    }

    // Base64 veriyi Buffer'a dönüştür
    const buffer = Buffer.from(base64Audio, 'base64');
    
    // Servis seçimi
    const apiKey = provider === 'openai' 
      ? process.env.OPENAI_API_KEY 
      : process.env.HUGGINGFACE_API_KEY;
    
    const service = new TranscriptionService(apiKey);
    
    let result;
    if (provider === 'openai') {
      result = await service.transcribeWithOpenAI(buffer, { language });
    } else if (provider === 'huggingface') {
      result = await service.transcribeWithHuggingFace(buffer, { language, model });
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Geçersiz sağlayıcı. Desteklenen: openai, huggingface' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // CORS Ayarı
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Hata:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Transkripsiyon işlemi sırasında bir hata oluştu', 
        details: error.message
      })
    };
  }
}; 