/**
 * Audio transcription service using Netlify Functions that connect to Whisper API
 * 2025 technology stack with server-side speech recognition
 */

export interface TranscriptionResult {
  id: string;
  text: string;
  duration: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export type TranscriptionProvider = 'openai' | 'huggingface' | 'browser';
export type HuggingFaceModel = 'whisper-large-v3' | 'whisper-large-v3-turbo' | 'whisper-medium' | 'whisper-small';

// Ses dosyasını küçük parçalara bölen yardımcı fonksiyon
async function splitAudioIntoChunks(audioBuffer: AudioBuffer, chunkDuration: number = 15) {
  const sampleRate = audioBuffer.sampleRate;
  const chunkSize = chunkDuration * sampleRate;
  const chunks = [];
  
  for (let i = 0; i < audioBuffer.length; i += chunkSize) {
    const chunkLength = Math.min(chunkSize, audioBuffer.length - i);
    const chunk = new AudioBuffer({
      numberOfChannels: audioBuffer.numberOfChannels,
      length: chunkLength,
      sampleRate: sampleRate
    });
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const sourceData = audioBuffer.getChannelData(channel);
      const chunkData = chunk.getChannelData(channel);
      for (let j = 0; j < chunkLength; j++) {
        chunkData[j] = sourceData[i + j];
      }
    }
    
    chunks.push(chunk);
  }
  
  return chunks;
}

// AudioBuffer'ı Blob'a dönüştüren yardımcı fonksiyon
async function audioBufferToWav(audioBuffer: AudioBuffer): Promise<Blob> {
  const numOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numOfChannels * 2;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);
  
  // WAV formatı için header
  // "RIFF" id
  view.setUint8(0, 82);  // R
  view.setUint8(1, 73);  // I
  view.setUint8(2, 70);  // F
  view.setUint8(3, 70);  // F
  
  // file size
  view.setUint32(4, 36 + length, true);
  
  // RIFF type & "WAVE" id
  view.setUint8(8, 87);   // W
  view.setUint8(9, 65);   // A
  view.setUint8(10, 86);  // V
  view.setUint8(11, 69);  // E
  
  // format chunk id "fmt "
  view.setUint8(12, 102); // f
  view.setUint8(13, 109); // m
  view.setUint8(14, 116); // t
  view.setUint8(15, 32);  // ' '
  
  // format chunk size
  view.setUint32(16, 16, true);
  // formatType (PCM)
  view.setUint16(20, 1, true);
  // channels
  view.setUint16(22, numOfChannels, true);
  // sampleRate
  view.setUint32(24, audioBuffer.sampleRate, true);
  // byteRate (sampleRate * channels * bytesPerSample)
  view.setUint32(28, audioBuffer.sampleRate * numOfChannels * 2, true);
  // blockAlign (channels * bytesPerSample)
  view.setUint16(32, numOfChannels * 2, true);
  // bitsPerSample
  view.setUint16(34, 16, true);
  
  // data chunk id "data"
  view.setUint8(36, 100); // d
  view.setUint8(37, 97);  // a
  view.setUint8(38, 116); // t
  view.setUint8(39, 97);  // a
  
  // data chunk length
  view.setUint32(40, length, true);
  
  // Write the PCM audio data
  const offset = 44;
  const channelData = [];
  for (let i = 0; i < numOfChannels; i++) {
    channelData.push(audioBuffer.getChannelData(i));
  }
  
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset + (i * numOfChannels + channel) * 2, int16, true);
    }
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
}

// Ses dosyasını AudioContext kullanarak buffer'a yükler
async function loadAudioFile(file: File): Promise<AudioBuffer> {
  const audioContext = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
}

// Blob'ı base64'e dönüştüren yardımcı fonksiyon
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Data URL formatından (data:audio/wav;base64,BASE64_STRING) sadece base64 kısmını al
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Web Speech API ile tarayıcı üzerinde transkripsiyon - çalışmayabilir
async function recognizeSpeechWithBrowser(audioBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // YAKLAŞIM 1: AudioContext ve WebAudio API kullanarak ses analizi yapalım
      const audioURL = URL.createObjectURL(audioBlob);
      const audio = new Audio();
      audio.src = audioURL;
      
      // Ses analizi için basit bir çözüm uygulayalım
      // Bu durumda ses dosyasında konuşma olduğunu varsayıyoruz ve kullanıcı manuel kontrol edebilir
      audio.oncanplaythrough = () => {
        // Ses dosyasında konuşma olduğunu varsayalım ve boş dönmek yerine bilgilendirici mesaj
        resolve('[Bu ses dosyası Web Speech API ile tanınamadı. Tarayıcı kısıtlamaları nedeniyle kaydedilmiş dosyalardan tanıma yapılamamaktadır. Alternatif transkripsiyon servisleri için sekme üzerindeki diğer seçenekleri deneyebilirsiniz.]');
      };
      
      audio.onerror = (error) => {
        reject(new Error(`Ses dosyası oynatılamadı: ${error}`));
      };
    } catch (error) {
      reject(new Error('Ses işleme hatası oluştu: ' + error.message));
    }
  });
}

// Netlify Function aracılığıyla Whisper API ile transkripsiyon
async function transcribeWithServerApi(
  audioBase64: string, 
  provider: TranscriptionProvider = 'openai',
  model?: HuggingFaceModel
): Promise<string> {
  try {
    // Yeniden deneme ayarları
    const maxRetries = 3;
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount < maxRetries) {
      try {
        console.log(`API isteği gönderiliyor (Deneme ${retryCount + 1}/${maxRetries})...`);
        
        const response = await fetch('/api/transcribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audio: audioBase64,
            language: 'tr',
            provider: provider,
            model: model
          })
        });

        if (response.ok) {
          const result = await response.json();
          return result.text;
        } else if (response.status === 502 || response.status === 500 || response.status === 504) {
          // Gateway hatası, yeniden deneyelim
          const errorText = await response.text().catch(() => 'İçerik alınamadı');
          lastError = new Error(`API Gateway Hatası (${response.status}): ${errorText}`);
          console.warn(`API gateway hatası (${response.status}), yeniden deneniyor (${retryCount + 1}/${maxRetries})...`);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 saniye bekleyelim
        } else {
          // Diğer hata durumları
          const errorData = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(`API Hatası (${response.status}): ${errorData.error || response.statusText}`);
        }
      } catch (error) {
        console.error(`API isteği hatası (Deneme ${retryCount + 1}/${maxRetries}):`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (retryCount >= maxRetries - 1) {
          // Son deneme başarısız oldu, hatayı fırlat
          throw lastError;
        }
        
        // Yeniden denemeden önce bekle
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Bu noktaya gelinmemeli, ancak TypeScript için bir dönüş değeri gerekli
    throw lastError || new Error('Bilinmeyen bir API hatası oluştu');
  } catch (error) {
    console.error('Sunucu transkripsiyon hatası:', error);
    throw error;
  }
}

// Ses dosyalarını transkript etme fonksiyonu - 2025 modeli
export async function transcribeAudio(
  file: File,
  onProgress?: (interim: string) => void,
  provider: TranscriptionProvider = 'openai',
  model?: HuggingFaceModel
): Promise<string> {
  try {
    // Dosya boyutunu kontrol et
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('Dosya boyutu çok büyük. Maksimum 50MB desteklenmektedir.');
    }

    console.log("Transcription başlatılıyor...");
    onProgress?.("Ses dosyası işleniyor. Lütfen bekleyin...");
    
    try {
      if (provider === 'browser') {
        // Tarayıcı tabanlı tanıma (sınırlı destek)
        const audioContext = new AudioContext();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const wavBlob = await audioBufferToWav(audioBuffer);
        return await recognizeSpeechWithBrowser(wavBlob);
      } else {
        // Sunucu tabanlı API tanıma (Whisper API veya HuggingFace)
        // Ses dosyasını AudioBuffer'a yükle
        const audioBuffer = await loadAudioFile(file);
        
        // Ses dosyasını küçük parçalara böl
        console.log("Ses dosyası parçalara bölünüyor...");
        onProgress?.("Ses dosyası parçalara bölünüyor...");
        const chunks = await splitAudioIntoChunks(audioBuffer);
        
        console.log(`${chunks.length} parça oluşturuldu.`);
        
        // Her bir parçayı işle ve transkript et
        let fullTranscription = '';
        
        for (let i = 0; i < chunks.length; i++) {
          console.log(`Parça ${i+1}/${chunks.length} işleniyor...`);
          onProgress?.(`Parça ${i+1}/${chunks.length} işleniyor... (${Math.round((i / chunks.length) * 100)}%)`);
          
          // Chunk'ı WAV formatına dönüştür
          const wavBlob = await audioBufferToWav(chunks[i]);
          
          // Wav'ı base64'e dönüştür
          const base64Audio = await blobToBase64(wavBlob);
          
          // API kullanarak transkript et
          const chunkText = await transcribeWithServerApi(base64Audio, provider, model);
          fullTranscription += ' ' + chunkText;
          
          // Ara sonucu göster
          if (onProgress) {
            onProgress(fullTranscription.trim());
          }
        }
        
        console.log("Transkripsiyon tamamlandı!");
        return fullTranscription.trim();
      }
    } catch (error) {
      console.error('İşleme hatası:', error);
      throw new Error(`Ses dosyası işlenirken bir hata oluştu: ${error.message}`);
    }
  } catch (error) {
    console.error('Transcription error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Ses dosyası işlenirken bir hata oluştu. Lütfen tekrar deneyin.');
  }
}

// TypeScript için global SpeechRecognition arayüzü tanımlaması
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}