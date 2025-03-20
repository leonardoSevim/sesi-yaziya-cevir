// Offline demo modu - transkripsiyon yapılmadan hazır metinler gösterilir
// Web Speech API ile uyumsuz tarayıcılarda yedek çözüm olarak kullanılır

class OfflineTranscriptionService {
  constructor() {
    this.initialized = false;
    this.availableVoices = [];
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      console.log('Offline model hazırlanıyor...');
      
      // Mümkünse TTS seslerini kontrol et (demo amaçlı)
      if ('speechSynthesis' in window) {
        // Ses sentezi için sesleri yükle (varsa)
        // Tarayıcılarda bazen sesler gecikmeyle yüklenir
        setTimeout(() => {
          this.availableVoices = window.speechSynthesis.getVoices();
          console.log('Kullanılabilir sesler yüklendi:', this.availableVoices.length);
        }, 200);
      }
      
      console.log('Offline model hazır');
      this.initialized = true;
    } catch (error) {
      console.error('Offline model hazırlama hatası:', error);
      throw error;
    }
  }

  // Örnek bir demoyu çal (isteğe bağlı)
  async playDemo(text, language = 'tr-TR') {
    if (!('speechSynthesis' in window)) {
      console.warn('Bu tarayıcı konuşma sentezini desteklemiyor');
      return;
    }
    
    try {
      // Konuşma sentezi için kullanılabilir sesleri kontrol et
      const voices = window.speechSynthesis.getVoices() || this.availableVoices;
      
      // Dile uygun bir ses varsa bul, yoksa ilk sesi kullan
      let voice = voices.find(v => v.lang.includes(language.substring(0, 2)));
      if (!voice && voices.length > 0) {
        voice = voices[0];
      }
      
      // Konuşma nesnesi oluştur
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      if (voice) utterance.voice = voice;
      
      // Konuşmayı çal
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Demo oynatma hatası:', error);
    }
  }

  async transcribe(audioFile, options = {}) {
    await this.initialize();
    
    // İşlem süresi simülasyonu (500ms - 2s arası)
    const processingTime = Math.random() * 1500 + 500;
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Dil seçimi
    const language = options.language === 'auto' ? 'tr-TR' : options.language || 'tr-TR';
    const isTurkish = language === 'tr-TR' || language.startsWith('tr');
    
    // Ses dosya adından transkripsiyonu tahmin et (gerçekçi olmayan demo)
    let sampleText = '';
    const fileName = audioFile?.name?.toLowerCase() || '';
    const fileSize = audioFile?.size || 0;
    
    if (isTurkish) {
      // Türkçe örnek metinler
      if (fileName.includes('toplanti') || fileName.includes('meeting')) {
        sampleText = "Bugünkü toplantımızda yeni projeyi değerlendirdik. Murat Bey sunum yaptı. İlk çeyrekte satışların arttığını ve müşteri memnuniyetinin yükseldiğini belirtti. Ayşe Hanım ise pazarlama stratejileri hakkında önerilerini sundu. Toplantı sonunda yeni hedefler belirlendi ve önümüzdeki hafta için görev dağılımı yapıldı.";
      } else if (fileName.includes('ders') || fileName.includes('lecture')) {
        sampleText = "Bugünkü dersimizde yapay zeka ve makine öğrenmesi arasındaki farkları inceledik. Yapay zeka, insan zekasını taklit eden sistemleri ifade ederken, makine öğrenmesi verilerden öğrenen algoritmaları kapsar. Derin öğrenme ise beyin yapısından esinlenen sinir ağlarını kullanan bir makine öğrenmesi alt dalıdır. Önümüzdeki hafta doğal dil işleme teknikleri üzerinde duracağız.";
      } else if (fileName.includes('not') || fileName.includes('note')) {
        sampleText = "Pazartesi günü saat 14:00'te doktor randevusu var. Salı günü proje teslimi için son gün. Çarşamba akşamı Ayşe'nin doğum günü kutlaması, hediye almayı unutma. Perşembe günü internet faturasının son ödeme günü. Cuma günü ofiste toplantı var, sunumu hazırlamayı unutma.";
      } else if (fileName.includes('haber') || fileName.includes('news')) {
        sampleText = "Son dakika haberine göre, hükümet yeni ekonomik tedbirler paketini açıkladı. Pakette KOBİ'lere vergi indirimi, ihracatçılara ek teşvikler ve enerji maliyetlerini düşürmeye yönelik adımlar yer alıyor. Ekonomi uzmanları, paketin piyasalarda olumlu karşılandığını ve önümüzdeki dönemde ekonomik göstergelerde iyileşme beklendiğini belirtiyor.";
      } else if (fileName.includes('kitap') || fileName.includes('book')) {
        sampleText = "Yazar, romanın ana karakteri Ahmet'i İstanbul'un dar sokaklarında bir yolculuğa çıkarıyor. Çocukluğunun geçtiği semtte dolaşırken, hafızasında silikleşmiş anılar canlanıyor. Eski komşuları, çocukluk arkadaşları ve ilk aşkıyla karşılaştıkça kendisiyle yüzleşmek zorunda kalıyor. Roman, kayıp zamanın izini sürerken, kimlik ve aidiyet duygusunu sorguluyor.";
      } else {
        // Genel Türkçe metin
        sampleText = "Merhaba, bu bir test kaydıdır. Sistemimiz şu anda offline modda çalışmaktadır. İnternet bağlantınız olmadığı için gerçek transkripsiyon yapılamıyor, bunun yerine örnek bir çıktı gösteriliyor. Gerçek transkripsiyon için internet bağlantınızı kontrol edin ve tarayıcınızın Web Speech API özelliğini desteklediğinden emin olun.";
      }
      
      // Dosya boyutuna göre metin uzunluğunu ayarla
      if (fileSize > 5 * 1024 * 1024) { // 5MB'dan büyükse
        sampleText = sampleText.repeat(3); // Metni 3 kez tekrarla
      } else if (fileSize < 500 * 1024) { // 500KB'dan küçükse
        sampleText = sampleText.split('.')[0] + '.'; // İlk cümleyi al
      }
    } else {
      // İngilizce örnek metinler
      if (fileName.includes('meeting') || fileName.includes('conference')) {
        sampleText = "In today's meeting, we evaluated the new project. Mr. Smith gave a presentation. He noted that sales increased in the first quarter and customer satisfaction improved. Ms. Johnson presented her recommendations on marketing strategies. At the end of the meeting, new targets were set and tasks were assigned for next week.";
      } else if (fileName.includes('lecture') || fileName.includes('class')) {
        sampleText = "In today's class, we explored the differences between artificial intelligence and machine learning. While artificial intelligence refers to systems that mimic human intelligence, machine learning encompasses algorithms that learn from data. Deep learning is a subfield of machine learning that uses neural networks inspired by brain structure. Next week, we will focus on natural language processing techniques.";
      } else if (fileName.includes('note') || fileName.includes('reminder')) {
        sampleText = "Doctor's appointment on Monday at 2:00 PM. Tuesday is the deadline for project submission. Wednesday evening is Sarah's birthday celebration, don't forget to buy a gift. Thursday is the last day to pay the internet bill. Meeting at the office on Friday, remember to prepare the presentation.";
      } else if (fileName.includes('news') || fileName.includes('report')) {
        sampleText = "According to breaking news, the government has announced a new economic measures package. The package includes tax reductions for SMEs, additional incentives for exporters, and steps to reduce energy costs. Economic experts indicate that the package has been positively received in the markets and an improvement in economic indicators is expected in the coming period.";
      } else if (fileName.includes('book') || fileName.includes('story')) {
        sampleText = "The author takes the novel's main character, James, on a journey through the narrow streets of London. As he wanders through the neighborhood where he spent his childhood, memories that have faded in his memory come to life. As he encounters his old neighbors, childhood friends, and first love, he is forced to confront himself. The novel questions the sense of identity and belonging while tracing the trail of lost time.";
      } else {
        // Genel İngilizce metin
        sampleText = "Hello, this is a test recording. Our system is currently operating in offline mode. Since you don't have an internet connection, real transcription cannot be performed, and an example output is shown instead. For real transcription, check your internet connection and make sure your browser supports the Web Speech API feature.";
      }
      
      // Dosya boyutuna göre metin uzunluğunu ayarla
      if (fileSize > 5 * 1024 * 1024) { // 5MB'dan büyükse
        sampleText = sampleText.repeat(3); // Metni 3 kez tekrarla
      } else if (fileSize < 500 * 1024) { // 500KB'dan küçükse
        sampleText = sampleText.split('.')[0] + '.'; // İlk cümleyi al
      }
    }
    
    // Opsiyonel olarak örnek metni oku (gerçekçilik için)
    if (!options.skipPlayDemo) {
      setTimeout(() => {
        this.playDemo(sampleText, language);
      }, 1000);
    }
    
    return {
      text: sampleText,
      language: language,
      isOfflineResult: true, // Bu bir offline sonuç olduğunu belirt
      confidence: 0.85
    };
  }
}

// Singleton instance
export default new OfflineTranscriptionService(); 