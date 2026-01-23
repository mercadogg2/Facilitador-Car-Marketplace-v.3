
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Language, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';

interface NavbarProps {
  lang: Language;
  role: UserRole;
  isLoggedIn: boolean;
  onToggleLang: () => void;
  onLogout: () => Promise<void>;
}

const Navbar: React.FC<NavbarProps> = ({ lang, role, isLoggedIn, onToggleLang, onLogout }) => {
  const t = TRANSLATIONS[lang].nav;
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fecha o menu quando a rota muda
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Bloqueia o scroll do corpo quando o menu mobile está aberto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const isActive = (path: string) => location.pathname === path;

  const handleLogoutClick = async () => {
    const confirmMsg = lang === 'pt' ? 'Tem a certeza que deseja sair?' : 'Are you sure you want to logout?';
    if (window.confirm(confirmMsg)) {
      try {
        await onLogout();
        setIsMenuOpen(false);
        navigate('/', { replace: true });
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
        navigate('/', { replace: true });
      }
    }
  };

  const navLinks = [
    { path: '/', label: t.home },
    { path: '/veiculos', label: t.vehicles },
    { path: '/stands', label: t.stands },
    { path: '/sobre', label: t.about },
    { path: '/blog', label: t.blog },
  ];

  return (
    <nav className="sticky top-0 z-[60] bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 md:h-24">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <img 
                src="https://facilitadorcar.com/wp-content/uploads/2026/01/logotipo-centralizado-colorido-sobre-claro-scaled.png" 
                alt="Facilitador Car" 
                className="h-14 md:h-20 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:ml-12 lg:flex lg:space-x-6 h-full">
              {navLinks.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className={`${isActive(link.path) ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-900'} px-3 py-2 text-sm font-bold h-full flex items-center transition-all`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Actions (Desktop) */}
          <div className="hidden lg:flex items-center space-x-4">
            <button 
              onClick={onToggleLang}
              className="px-3 py-1.5 text-xs font-black border border-gray-200 rounded-lg uppercase hover:bg-gray-50 transition-colors"
            >
              {lang}
            </button>
            
            {!isLoggedIn ? (
              <Link 
                to="/login" 
                className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
              >
                {t.login}
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                {role === UserRole.ADMIN ? (
                  <Link to="/admin" className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center gap-2">
                    <i className="fas fa-tools text-xs"></i>
                    {t.admin}
                  </Link>
                ) : role === UserRole.STAND ? (
                  <Link to="/dashboard" className="bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center gap-2">
                    <i className="fas fa-chart-line text-xs"></i>
                    {t.dashboard}
                  </Link>
                ) : (
                  <Link to="/cliente" className="bg-gray-900 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 shadow-md shadow-gray-200 transition-all flex items-center gap-2">
                    <i className="fas fa-user text-xs"></i>
                    {t.client}
                  </Link>
                )}
                
                <button 
                  onClick={handleLogoutClick}
                  className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all border border-transparent hover:border-red-100"
                  title={t.logout}
                >
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-3">
            <button 
              onClick={onToggleLang}
              className="w-10 h-10 text-xs font-black border border-gray-200 rounded-xl uppercase flex items-center justify-center"
            >
              {lang}
            </button>
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="w-12 h-12 flex items-center justify-center text-gray-900 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
              aria-label="Open Menu"
            >
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
      </div>

      {/* --- MOBILE SIDEBAR PANEL (FIXED) --- */}
      <div 
        className={`lg:hidden fixed inset-0 z-[100] transition-all duration-300 ${isMenuOpen ? 'visible' : 'invisible'}`}
      >
        {/* Backdrop (Dark Overlay) */}
        <div 
          className={`fixed inset-0 bg-gray-900/80 backdrop-blur-md transition-opacity duration-500 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMenuOpen(false)}
        ></div>
        
        {/* Slide-out Sidebar Panel */}
        <div 
          className={`fixed top-0 right-0 w-[85%] max-w-[380px] h-screen bg-white shadow-2xl flex flex-col transform transition-transform duration-500 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
            <img 
              src="https://facilitadorcar.com/wp-content/uploads/2026/01/logotipo-centralizado-colorido-sobre-claro-scaled.png" 
              alt="Logo" 
              className="h-12 w-auto"
            />
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="w-12 h-12 flex items-center justify-center text-gray-900 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* Sidebar Navigation Links */}
          <div className="flex-grow py-8 px-6 space-y-3 overflow-y-auto">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center px-6 py-5 rounded-[25px] text-lg font-black transition-all ${
                  isActive(link.path) 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' 
                    : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Sidebar Bottom Actions */}
          <div className="p-8 border-t border-gray-100 bg-gray-50/50 space-y-4">
            {!isLoggedIn ? (
              <Link 
                to="/login" 
                onClick={() => setIsMenuOpen(false)}
                className="w-full bg-blue-600 text-white py-5 rounded-[25px] font-black text-center block shadow-2xl shadow-blue-100 text-lg transition-transform active:scale-95"
              >
                {t.login}
              </Link>
            ) : (
              <div className="space-y-3">
                {role === UserRole.ADMIN ? (
                  <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="w-full bg-indigo-600 text-white py-5 rounded-[25px] font-black text-center flex items-center justify-center gap-3 shadow-lg">
                    <i className="fas fa-tools"></i> {t.admin}
                  </Link>
                ) : role === UserRole.STAND ? (
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="w-full bg-blue-600 text-white py-5 rounded-[25px] font-black text-center flex items-center justify-center gap-3 shadow-lg">
                    <i className="fas fa-chart-line"></i> {t.dashboard}
                  </Link>
                ) : (
                  <Link to="/cliente" onClick={() => setIsMenuOpen(false)} className="w-full bg-gray-900 text-white py-5 rounded-[25px] font-black text-center flex items-center justify-center gap-3 shadow-lg">
                    <i className="fas fa-user"></i> {t.client}
                  </Link>
                )}
                
                <button 
                  onClick={handleLogoutClick}
                  className="w-full py-5 text-red-500 font-black text-center flex items-center justify-center gap-2 hover:bg-red-50 rounded-[25px] transition-all border border-transparent hover:border-red-100"
                >
                  <i className="fas fa-sign-out-alt"></i> {t.logout}
                </button>
              </div>
            )}
            
            <div className="text-center pt-4">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">© 2024 Facilitador Car</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
