/**
 * Ses dosyalarını metne çevirmek için Netlify Function API
 * Maksimum süre: 10 saniye (Netlify limiti)
 */

const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const FormData = require('form-data');
const fetch = require('node-fetch');

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

// Ses dosyasını parçalara bölen yardımcı fonksiyon
function splitAudioBuffer(buffer, chunkSize = 1024 * 1024) { // 1MB chunks
  const chunks = [];
  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.slice(i, i + chunkSize));
  }
  return chunks;
}

// Paralel işleme için yardımcı fonksiyon
async function processInBatches(items, batchSize, processor) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchPromises = batch.map((item, index) => 
      processor(item, i + index).catch(error => {
        console.error(`Parça ${i + index} işlenirken hata oluştu:`, error);
        return ''; // Hata durumunda boş string döndür
      })
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  return results;
}

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

      // Çok büyük ses dosyaları için parçalama yap
      if (audioBuffer.length > 4 * 1024 * 1024) { // 4MB'dan büyükse parçala
        console.log('Ses dosyası OpenAI için çok büyük, parçalara bölünüyor...');
        const chunks = splitAudioBuffer(audioBuffer, 2 * 1024 * 1024); // 2MB parçalar
        console.log(`Ses dosyası ${chunks.length} parçaya bölündü`);
        
        const results = await processInBatches(
          chunks, 
          2, // Aynı anda 2 istek gönder
          async (chunk, index) => {
            try {
              console.log(`OpenAI parça ${index + 1}/${chunks.length} işleniyor...`);
              const tempFilePath = path.join(os.tmpdir(), `audio-chunk-${index}-${Date.now()}.mp3`);
              await writeFileAsync(tempFilePath, chunk);
              
              const openai = new OpenAI({ apiKey: this.apiKey });
              const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: "whisper-1",
                language: options.language || "tr",
                response_format: "text"
              });
              
              await unlinkAsync(tempFilePath);
              return transcription.text;
            } catch (error) {
              console.error(`OpenAI parça ${index} işlenirken hata:`, error);
              throw error;
            }
          }
        );
        
        return { text: results.join(' ') };
      }
      
      // Tek parça için işlem
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

      // Ses dosyasını parçalara böl (büyük dosyalar için daha agresif parçalama)
      const chunks = audioBuffer.length > 1 * 1024 * 1024 // 1MB'dan büyükse parçala
        ? splitAudioBuffer(audioBuffer, 2 * 1024 * 1024) // 2MB chunks
        : [audioBuffer];

      console.log(`Ses dosyası ${chunks.length} parçaya bölündü`);

      // Her parça için transkripsiyon işlemi
      const transcribeChunk = async (chunk, index) => {
        try {
          console.log(`HuggingFace parça ${index + 1}/${chunks.length} işleniyor...`);
          const startTime = Date.now();
          
          const tempFilePath = path.join(os.tmpdir(), `audio-chunk-${index}-${Date.now()}.mp3`);
          await writeFileAsync(tempFilePath, chunk);

          const form = new FormData();
          form.append('audio_file', fs.createReadStream(tempFilePath));
          form.append('language', options.language || 'tr');

          // Her zaman en küçük modeli kullan - timeout riskini azaltmak için
          const modelEndpoint = 'https://api-inference.huggingface.co/models/openai/whisper-tiny';

          // API timeout riskleri için zaman kontrolü
          const maxApiTimeSeconds = 7; // maksimum 7 saniye API'de bekle
          let isTimeout = false;
          const timeoutId = setTimeout(() => {
            isTimeout = true;
            console.log(`Parça ${index + 1} için zaman aşımı (${maxApiTimeSeconds}s)`);
          }, maxApiTimeSeconds * 1000);

          // 502 hataları için yeniden deneme mekanizması
          const maxRetries = 2; // max 2 deneme
          let retryCount = 0;
          let response = null;
          let lastError = null;

          while (retryCount < maxRetries && !isTimeout) {
            try {
              console.log(`Parça ${index + 1}/${chunks.length} için HuggingFace API isteği (Deneme ${retryCount + 1}/${maxRetries})...`);
              
              response = await fetch(modelEndpoint, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${this.apiKey}`
                },
                body: form,
                timeout: 5000 // 5 saniye timeout
              });
              
              if (response.ok) {
                break;
              } else if (response.status === 502 || response.status === 500 || response.status === 504) {
                lastError = `API Hatası: ${response.status}`;
                retryCount++;
                if (retryCount < maxRetries && !isTimeout) {
                  await new Promise(resolve => setTimeout(resolve, 500)); // kısa bekleme
                }
              } else {
                throw new Error(`API error: ${response.status}`);
              }
            } catch (error) {
              lastError = error;
              retryCount++;
              if (retryCount >= maxRetries || isTimeout) {
                break;
              }
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
          
          clearTimeout(timeoutId);
          
          // Geçici dosyayı sil
          await unlinkAsync(tempFilePath);

          if (isTimeout) {
            return `[Parça ${index + 1} için zaman aşımı]`;
          }

          if (!response || !response.ok) {
            return `[Parça ${index + 1} için API hatası]`;
          }

          const result = await response.json();
          const elapsedTime = (Date.now() - startTime) / 1000;
          console.log(`Parça ${index + 1}/${chunks.length} işlendi (${elapsedTime.toFixed(1)}s)`);
          
          return result.text || result.sentence || result.transcription || '';
        } catch (error) {
          console.error(`Parça ${index + 1} işlenirken hata:`, error);
          return `[Parça ${index + 1} için hata]`;
        }
      };

      // Parçaları daha küçük gruplar halinde paralel işle (fazla memory kullanmamak için)
      const results = await processInBatches(chunks, 2, transcribeChunk);

      // Sonuçları birleştir
      return { text: results.join(' ') };
    } catch (error) {
      console.error('HuggingFace transkripsiyon hatası:', error);
      throw error;
    }
  }
}

// Netlify Function handler
exports.handler = async function(event, context) {
  // Toplam çalışma süresi kısıtlaması (9 saniye)
  const functionTimeout = 9000; // ms
  const functionStart = Date.now();
  
  // Timeout kontrolü için fonksiyon
  const checkTimeout = () => {
    const elapsed = Date.now() - functionStart;
    if (elapsed > functionTimeout) {
      throw new Error('Function timeout - işlem süresi aşıldı');
    }
    return elapsed;
  };

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
    const model = body.model || 'whisper-tiny'; // Varsayılan olarak whisper-tiny kullan
    
    if (!base64Audio) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'audio parametresi gerekli' })
      };
    }

    checkTimeout(); // Timeout kontrolü

    // Base64 veriyi Buffer'a dönüştür
    const buffer = Buffer.from(base64Audio, 'base64');
    
    // Çok büyük dosyaları reddet (>20MB)
    if (buffer.length > 20 * 1024 * 1024) {
      return {
        statusCode: 413,
        body: JSON.stringify({ 
          error: 'Dosya boyutu çok büyük', 
          details: 'Maksimum 20MB boyutunda dosya yüklenebilir'
        })
      };
    }
    
    // Servis seçimi
    const apiKey = provider === 'openai' 
      ? process.env.OPENAI_API_KEY 
      : process.env.HUGGINGFACE_API_KEY;
    
    checkTimeout(); // Timeout kontrolü
    
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

    checkTimeout(); // Timeout kontrolü
    
    // Response hazırlama
    const totalTime = (Date.now() - functionStart) / 1000;
    console.log(`Toplam işlem süresi: ${totalTime.toFixed(1)} saniye`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        ...result,
        processingTime: totalTime.toFixed(1)
      })
    };
  } catch (error) {
    console.error('Hata:', error);
    
    let errorMessage = error.message || 'Bilinmeyen bir hata oluştu';
    let statusCode = 500;
    
    // Timeout hatası için özel durum
    if (errorMessage.includes('timeout') || errorMessage.includes('zaman aşımı')) {
      statusCode = 504;
      errorMessage = 'İşlem zaman aşımına uğradı. Daha kısa bir ses dosyası veya daha küçük bir model deneyin.';
    }
    
    return {
      statusCode: statusCode,
      body: JSON.stringify({ 
        error: 'Transkripsiyon işlemi sırasında bir hata oluştu', 
        details: errorMessage,
        tip: 'Daha kısa ses dosyaları veya whisper-tiny modeli kullanmayı deneyin'
      })
    };
  }
}; 