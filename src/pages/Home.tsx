import React from 'react';
import { Mic, Headphones, FileText, ShieldCheck, LayoutDashboard } from 'lucide-react';
import FileUploader from '../components/FileUploader';

const Home: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-purple-600 via-space-500 to-purple-500 bg-clip-text text-transparent">
          Sesinizi Yazıya Dönüştürün
        </h1>
        <p className="text-lg md:text-xl text-space-600 max-w-2xl mx-auto">
          MP3, M4A ve diğer ses formatlarındaki Türkçe konuşmaları hızlı ve doğru bir şekilde yazıya dökün.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 mb-12">
        <div className="bg-gradient-to-br from-space-800 to-space-900 p-6 rounded-2xl shadow-xl border border-space-700/50 text-center transform hover:scale-105 transition-all duration-300 hover:border-space-500">
          <div className="bg-space-700/50 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Mic className="text-space-400 w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium mb-2 text-space-600">Ses Dosyası Yükleyin</h3>
          <p className="text-space-500 text-sm">
            MP3, M4A, WAV veya OGG formatındaki ses dosyalarınızı yükleyin.
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-space-800 to-space-900 p-6 rounded-2xl shadow-xl border border-space-700/50 text-center transform hover:scale-105 transition-all duration-300 hover:border-space-500">
          <div className="bg-space-700/50 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Headphones className="text-space-400 w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium mb-2 text-space-600">Yapay Zeka İşler</h3>
          <p className="text-space-500 text-sm">
            Gelişmiş yapay zeka teknolojimiz Türkçe konuşmaları analiz eder.
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-space-800 to-space-900 p-6 rounded-2xl shadow-xl border border-space-700/50 text-center transform hover:scale-105 transition-all duration-300 hover:border-space-500">
          <div className="bg-space-700/50 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <FileText className="text-space-400 w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium mb-2 text-space-600">Metni Alın</h3>
          <p className="text-space-500 text-sm">
            Dönüştürülmüş metni görüntüleyin, kopyalayın ve kullanın.
          </p>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-space-800 to-space-900 p-8 rounded-2xl shadow-xl border border-space-700/50">
        <div className="mb-8 space-y-4">
          <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Dosyanızı Yükleyin
          </h2>
          <div className="max-w-2xl mx-auto space-y-2 text-sm text-space-500">
            <p className="flex items-center">
              <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
              Maksimum dosya boyutu: 50MB
            </p>
            <p className="flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              Desteklenen formatlar: MP3, M4A, WAV, OGG
            </p>
            <p className="flex items-center">
              <span className="w-2 h-2 bg-space-400 rounded-full mr-2"></span>
              Tavsiye edilen: Gürültüsüz, net ses kayıtları
            </p>
          </div>
        </div>
        <FileUploader />
      </div>
      
      <div className="mt-16 space-y-12">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-space-200">
          <div className="flex flex-col md:flex-row items-center mb-6">
            <ShieldCheck className="w-12 h-12 text-space-500 mb-4 md:mb-0 md:mr-6" />
            <div>
              <h3 className="text-xl font-bold text-space-700 mb-2">Gizlilik Odaklı</h3>
              <p className="text-space-600">
                Tüm işlemler tarayıcınızda gerçekleşir. Ses dosyalarınız hiçbir sunucuya gönderilmez, bu sayede gizliliğiniz korunur.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-space-200">
          <div className="flex flex-col md:flex-row items-center mb-6">
            <LayoutDashboard className="w-12 h-12 text-space-500 mb-4 md:mb-0 md:mr-6" />
            <div>
              <h3 className="text-xl font-bold text-space-700 mb-2">%100 Ücretsiz</h3>
              <p className="text-space-600">
                Bu hizmet tamamen ücretsizdir ve öyle kalacaktır. Herhangi bir ödeme bilgisi veya kayıt gerektirmez.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;