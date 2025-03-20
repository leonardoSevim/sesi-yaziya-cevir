import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Mic, GitHub, ExternalLink } from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-purple-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              SesiYaziyaCevir
            </h1>
          </Link>
          
          <nav className="flex items-center gap-4">
            <Link 
              to="/" 
              className={`text-sm font-medium px-3 py-1.5 rounded-full transition-all ${
                isHomePage 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Ana Sayfa
            </Link>
            <a 
              href="https://github.com/leonardoSevim/sesi-yaziya-cevir" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors"
            >
              <GitHub className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </nav>
        </div>
      </header>
      
      <main className="flex-grow py-6 px-4">
        <Outlet />
      </main>
      
      <footer className="py-6 border-t border-purple-100 bg-white/80 backdrop-blur-md mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-600">
                SesiYaziyaCevir © {new Date().getFullYear()}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-gray-500">
                Tamamen tarayıcı taraflı konuşma tanıma
              </span>
              <a 
                href="https://huggingface.co/models?pipeline_tag=automatic-speech-recognition&sort=trending" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-purple-600 hover:text-purple-700 transition-colors"
              >
                <span>Whisper Modelleri</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;