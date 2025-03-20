import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Mic, Instagram, Mail, Twitter } from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-white flex flex-col text-space-900">
      <header className="bg-white/5 backdrop-blur-lg shadow-lg border-b border-space-300/20">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Mic className="w-8 h-8 text-space-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-space-500 to-purple-500 bg-clip-text text-transparent">
              SesiYaziyaCevir
            </h1>
          </Link>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Outlet />
      </main>
      
      <footer className="bg-white border-t border-space-300/20 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center items-center space-x-6 mb-4">
            <a
              href="https://instagram.com/jessemir"
              target="_blank"
              rel="noopener noreferrer"
              className="text-space-600 hover:text-space-400 transition-colors"
            >
              <Instagram className="w-6 h-6" />
            </a>
            <a
              href="https://x.com/emirhansevm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-space-600 hover:text-space-400 transition-colors"
            >
              <Twitter className="w-6 h-6" />
            </a>
            <a
              href="mailto:eemirhansevim@gmail.com"
              className="text-space-600 hover:text-space-400 transition-colors"
            >
              <Mail className="w-6 h-6" />
            </a>
          </div>
          <div className="text-space-600">
            <p className="font-medium">
              SesiYaziyaCevir © {new Date().getFullYear()}
            </p>
            <p className="text-sm mt-1">
              Developed by{' '}
              <a
                href="https://instagram.com/jessemir"
                target="_blank"
                rel="noopener noreferrer"
                className="text-space-400 hover:text-space-500 transition-colors"
              >
                Emirhan Sevim
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;