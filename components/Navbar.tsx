
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

  // Fecha o menu sempre que a rota mudar
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Impede o scroll do fundo quando o menu está aberto e lida com viewport mobile
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isMenuOpen]);

  const isActive = (path: string) => location.pathname === path;

  const handleLogoutClick = async () => {
    if (window.confirm(lang === 'pt' ? 'Tem a certeza que deseja sair?' : 'Are you sure you want to logout?')) {
      await onLogout();
      setIsMenuOpen(false);
      navigate('/', { replace: true });
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
    <>
      <nav className="sticky top-0 z-[1000] bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 md:h-24">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center group">
                <img 
                  src="https://facilitadorcar.com/wp-content/uploads/2026/01/logotipo-centralizado-colorido-sobre-claro-scaled.png" 
                  alt="Facilitador Car" 
                  className="h-12 md:h-16 w-auto object-contain transition-transform group-hover:scale-105"
                />
              </Link>
              <div className="hidden lg:ml-12 lg:flex lg:space-x-8 h-full">
                {navLinks.map((link) => (
                  <Link 
                    key={link.path}
                    to={link.path} 
                    className={`${isActive(link.path) ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-900'} px-1 py-2 text-sm font-bold h-full flex items-center transition-all`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex items-center space-x-4">
              <button onClick={onToggleLang} className="px-3 py-1.5 text-xs font-black border border-gray-200 rounded-lg uppercase hover:bg-gray-50">
                {lang}
              </button>
              {!isLoggedIn ? (
                <Link to="/login" className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
                  {t.login}
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to={role === UserRole.ADMIN ? '/admin' : role === UserRole.STAND ? '/dashboard' : '/cliente'} className="bg-gray-900 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 flex items-center gap-2">
                    <i className="fas fa-user-circle"></i>
                    {role === UserRole.ADMIN ? t.admin : role === UserRole.STAND ? t.dashboard : t.client}
                  </Link>
                  <button onClick={handleLogoutClick} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                    <i className="fas fa-sign-out-alt"></i>
                  </button>
                </div>
              )}
            </div>

            {/* Botão de Toggle Mobile */}
            <div className="flex lg:hidden items-center space-x-3">
              <button onClick={onToggleLang} className="w-10 h-10 text-xs font-black border border-gray-200 rounded-xl uppercase flex items-center justify-center">
                {lang}
              </button>
              <button 
                onClick={() => setIsMenuOpen(true)} 
                className="w-12 h-12 flex items-center justify-center text-gray-900 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label="Abrir Menu"
              >
                <i className="fas fa-bars text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* COMPONENTE DE MENU MOBILE - ESTRUTURA REFORÇADA */}
      <div 
        className={`lg:hidden fixed inset-0 z-[9999] transition-all duration-500 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop escuro com desfoque */}
        <div 
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-500"
          onClick={() => setIsMenuOpen(false)}
        />
        
        {/* Painel Lateral usando dvh para altura real do dispositivo */}
        <div 
          className={`absolute top-0 right-0 w-[85%] max-w-[320px] h-[100dvh] bg-white shadow-2xl flex flex-col transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header do Menu Fixo no Topo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white shrink-0">
            <img 
              src="https://facilitadorcar.com/wp-content/uploads/2026/01/logotipo-centralizado-colorido-sobre-claro-scaled.png" 
              alt="Logo" 
              className="h-10 w-auto" 
            />
            <button 
              onClick={() => setIsMenuOpen(false)} 
              className="w-10 h-10 flex items-center justify-center text-gray-900 bg-gray-50 rounded-xl shadow-sm active:scale-95 transition-all"
              aria-label="Fechar Menu"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          
          {/* Área de Links com Scroll Suave e Independente */}
          <div className="flex-grow py-8 px-6 space-y-2 overflow-y-auto scroll-smooth">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center px-6 py-4 rounded-2xl text-lg font-bold transition-all duration-300 ${
                  isActive(link.path) 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 translate-x-1' 
                    : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Rodapé do Menu Fixo na Base */}
          <div className="p-8 border-t border-gray-100 bg-gray-50/80 backdrop-blur-md space-y-4 shrink-0">
            {!isLoggedIn ? (
              <Link 
                to="/login" 
                onClick={() => setIsMenuOpen(false)}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-center block shadow-lg shadow-blue-100 active:scale-[0.98] transition-all"
              >
                {t.login}
              </Link>
            ) : (
              <div className="space-y-3">
                <Link 
                  to={role === UserRole.ADMIN ? '/admin' : role === UserRole.STAND ? '/dashboard' : '/cliente'} 
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-center block active:scale-[0.98] transition-all"
                >
                  {role === UserRole.ADMIN ? t.admin : role === UserRole.STAND ? t.dashboard : t.client}
                </Link>
                <button 
                  onClick={handleLogoutClick} 
                  className="w-full py-4 text-red-500 font-bold text-center border border-red-100 rounded-2xl hover:bg-red-50 transition-colors active:scale-[0.98]"
                >
                  {t.logout}
                </button>
              </div>
            )}
            <div className="pt-4 flex flex-col items-center">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                © 2026 Facilitador Car
              </p>
              <div className="flex gap-4 mt-3 text-gray-300">
                <i className="fab fa-instagram text-sm"></i>
                <i className="fab fa-facebook text-sm"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
