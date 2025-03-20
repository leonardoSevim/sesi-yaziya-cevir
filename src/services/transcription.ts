/**
 * Audio transcription service using Whisper model
 * Performs offline transcription of audio files using Whisper model via transformers.js
 * Includes ONNX runtime configuration for web environment
 */

import { pipeline, env } from '@xenova/transformers';
import * as ort from 'onnxruntime-web';

// CORS ayarları
env.allowCrossOriginRequests = true;
env.allowLocalModels = false;
env.useCDN = true;

// Configure ONNX runtime
env.backends.onnx.wasm.wasmPaths = {
  'ort-wasm.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm.wasm',
  'ort-wasm-simd.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm-simd.wasm',
  'ort-wasm-threaded.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm-threaded.wasm'
};

// Register ONNX backend
if (ort.env) {
  ort.env.wasm.wasmPaths = env.backends.onnx.wasm.wasmPaths;
}

let transcriptionPipeline: any = null;

export interface TranscriptionResult {
  id: string;
  text: string;
  duration: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

async function initializePipeline() {
  if (!transcriptionPipeline) {
    try {
      console.log("Pipeline başlatılıyor...");
      // Daha küçük ve daha hızlı model kullanılıyor
      transcriptionPipeline = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
        quantized: true,
        progress_callback: (progress) => {
          if (progress && typeof progress.progress === 'number') {
            const percentage = Math.round(progress.progress * 100);
            console.log(`Model yükleniyor: ${percentage}%`);
          }
        }
      });
      console.log("Pipeline başarıyla başlatıldı!");
      return transcriptionPipeline;
    } catch (error) {
      console.error("Pipeline başlatılamadı:", error);
      throw error;
    }
  }
  return transcriptionPipeline;
}

export async function transcribeAudio(
  file: File,
  onProgress?: (interim: string) => void
): Promise<string> {
  try {
    // Validate file size
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('Dosya boyutu çok büyük. Maksimum 50MB desteklenmektedir.');
    }

    console.log("Transcription başlatılıyor...");
    onProgress?.("Ses dosyası işleniyor. Lütfen bekleyin...");
    
    // Initialize pipeline
    try {
      const pipe = await initializePipeline();
      
      // Convert file to blob for processing
      const audioBlob = new Blob([await file.arrayBuffer()]);
      
      console.log("Model hazır, ses dosyası dönüştürülüyor...");
      onProgress?.("Model yüklendi. Dönüşüm işlemi devam ediyor...");
      
      // Transcribe audio
      const result = await pipe(audioBlob, {
        language: 'tr',
        task: 'transcribe',
        chunk_length_s: 30,
        stride_length_s: 5
      });

      if (!result?.text) {
        throw new Error('Dönüştürme başarısız: Sonuç alınamadı');
      }

      const transcribedText = result.text.trim();
      onProgress?.(transcribedText);
      return transcribedText;
    } catch (modelError) {
      console.error('Model hatası:', modelError);
      if (modelError instanceof Error) {
        throw new Error(`Model hatası: ${modelError.message}`);
      }
      throw new Error('Model yüklenirken beklenmeyen bir hata oluştu.');
    }
  } catch (error) {
    console.error('Transcription error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Model yüklenemedi. İnternet bağlantınızı kontrol edin.');
      }
      throw error;
    }
    
    throw new Error('Ses dosyası işlenirken bir hata oluştu. Lütfen tekrar deneyin.');
  }
}