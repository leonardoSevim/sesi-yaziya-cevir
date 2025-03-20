const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const FormData = require('form-data');
const fetch = require('node-fetch');

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
  async transcribeWithHuggingFace(audioBuffer) {
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
      form.append('language', 'tr');

      // HuggingFace API'ya gönder
      const response = await fetch(
        'https://api-inference.huggingface.co/models/openai/whisper-large-v3',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: form
        }
      );

      // Geçici dosyayı sil
      await unlinkAsync(tempFilePath);

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();
      return { text: result.text };
    } catch (error) {
      console.error('HuggingFace transkripsiyon hatası:', error);
      throw error;
    }
  }
}

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
      result = await service.transcribeWithHuggingFace(buffer);
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