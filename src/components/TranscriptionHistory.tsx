import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, AlertTriangle, Loader } from 'lucide-react';

const TranscriptionHistory: React.FC = () => {
  // TODO: Implement actual history fetching
  const history = [];

  if (history.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-gray-600 mb-2">
          Henüz dönüşüm geçmişi yok
        </h2>
        <p className="text-gray-500 mb-6">
          Ses dosyası yükleyerek dönüşüm işlemlerine başlayın
        </p>
        <Link
          to="/"
          className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
        >
          Yeni Dönüşüm Başlat
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Dönüşüm Geçmişi</h2>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4">
          <p className="text-gray-600">
            Henüz dönüşüm geçmişi bulunmuyor.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionHistory;