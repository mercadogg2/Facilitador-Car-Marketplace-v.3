
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

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
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

          <div className="flex lg:hidden items-center space-x-3">
            <button onClick={onToggleLang} className="w-10 h-10 text-xs font-black border border-gray-200 rounded-xl uppercase flex items-center justify-center">
              {lang}
            </button>
            <button onClick={() => setIsMenuOpen(true)} className="w-12 h-12 flex items-center justify-center text-gray-900 bg-gray-50 rounded-xl">
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
      </div>

      <div className={`lg:hidden fixed inset-0 z-[2000] transition-all duration-300 ${isMenuOpen ? 'visible' : 'invisible'}`}>
        <div className={`fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-500 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMenuOpen(false)}></div>
        <div className={`fixed top-0 right-0 w-[80%] max-w-[340px] h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-500 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <img src="https://facilitadorcar.com/wp-content/uploads/2026/01/logotipo-centralizado-colorido-sobre-claro-scaled.png" alt="Logo" className="h-10 w-auto" />
            <button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 flex items-center justify-center text-gray-900 bg-gray-50 rounded-xl"><i className="fas fa-times text-xl"></i></button>
          </div>
          <div className="flex-grow py-8 px-6 space-y-2 overflow-y-auto">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className={`flex items-center px-6 py-4 rounded-2xl text-lg font-bold transition-all ${isActive(link.path) ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-gray-600 hover:bg-gray-50'}`}>
                {link.label}
              </Link>
            ))}
          </div>
          <div className="p-8 border-t border-gray-100 bg-gray-50/50 space-y-4">
            {!isLoggedIn ? (
              <Link to="/login" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-center block shadow-lg shadow-blue-100">
                {t.login}
              </Link>
            ) : (
              <div className="space-y-2">
                <Link to={role === UserRole.ADMIN ? '/admin' : role === UserRole.STAND ? '/dashboard' : '/cliente'} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-center block">
                  {role === UserRole.ADMIN ? t.admin : role === UserRole.STAND ? t.dashboard : t.client}
                </Link>
                <button onClick={handleLogoutClick} className="w-full py-4 text-red-500 font-bold text-center border border-red-100 rounded-2xl">
                  {t.logout}
                </button>
              </div>
            )}
            <p className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-4">© 2024 Facilitador Car</p>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
