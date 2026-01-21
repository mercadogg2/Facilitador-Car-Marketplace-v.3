
import React from 'react';
import { Link } from 'react-router-dom';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface FooterProps {
  lang: Language;
}

const Footer: React.FC<FooterProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang].footer;
  const nav = TRANSLATIONS[lang].nav;

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="bg-gray-900 text-white py-16 mt-20 relative overflow-hidden">
      {/* Botão flutuante interno para voltar ao topo */}
      <button 
        onClick={scrollToTop}
        className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all duration-300 group border border-white/10"
        title={lang === 'pt' ? 'Voltar ao Topo' : 'Back to Top'}
      >
        <i className="fas fa-arrow-up group-hover:-translate-y-1 transition-transform"></i>
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <img 
              src="https://facilitadorcar.com/wp-content/uploads/2026/01/logotipo-centralizado-colorido-sobre-claro-scaled.png" 
              alt="Facilitador Car" 
              className="h-24 w-auto mb-6 brightness-0 invert"
            />
            <p className="text-gray-400 mb-8 max-w-sm leading-relaxed text-base">
              {t.desc}
            </p>
            
            <div className="mt-4 flex items-center gap-6">
              <a 
                href="https://www.livroreclamacoes.pt/Inicio/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block transition-transform hover:scale-105"
              >
                <img 
                  src="https://facilitadorcar.com/wp-content/uploads/2026/01/download-removebg-preview.png" 
                  alt="Livro de Reclamações Eletrónico" 
                  className="h-12 w-auto object-contain brightness-0 invert opacity-60 hover:opacity-100 transition-opacity duration-300"
                />
              </a>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-pink-600 transition-colors">
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6 uppercase text-xs tracking-[0.2em] text-gray-500">{t.links}</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-semibold">
              <li>
                <Link to="/veiculos" className="hover:text-blue-500 transition-colors flex items-center group">
                  <span className="w-0 group-hover:w-2 h-[2px] bg-blue-500 mr-0 group-hover:mr-2 transition-all"></span>
                  {nav.vehicles}
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="hover:text-blue-500 transition-colors flex items-center group">
                  <span className="w-0 group-hover:w-2 h-[2px] bg-blue-500 mr-0 group-hover:mr-2 transition-all"></span>
                  {nav.about}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-blue-500 transition-colors flex items-center group">
                  <span className="w-0 group-hover:w-2 h-[2px] bg-blue-500 mr-0 group-hover:mr-2 transition-all"></span>
                  {nav.blog}
                </Link>
              </li>
              <li>
                <Link to="/stands" className="hover:text-blue-500 transition-colors flex items-center group">
                  <span className="w-0 group-hover:w-2 h-[2px] bg-blue-500 mr-0 group-hover:mr-2 transition-all"></span>
                  {nav.stands}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 uppercase text-xs tracking-[0.2em] text-gray-500">{t.legal}</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-semibold">
              <li>
                <Link to="/privacidade" className="hover:text-blue-500 transition-colors">
                  {lang === 'pt' ? 'Privacidade' : 'Privacy'}
                </Link>
              </li>
              <li>
                <Link to="/termos" className="hover:text-blue-500 transition-colors">
                  {lang === 'pt' ? 'Termos de Uso' : 'Terms of Use'}
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-blue-500 transition-colors">
                  Cookies
                </Link>
              </li>
              <li className="pt-6 border-t border-gray-800 mt-6">
                <Link to="/admin/login" className="text-gray-600 hover:text-indigo-400 transition-colors text-xs flex items-center gap-2 font-black uppercase tracking-widest">
                  <i className="fas fa-lock text-[10px]"></i>
                  {lang === 'pt' ? 'Área Admin' : 'Admin Area'}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-20 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-widest">
          <p>© 2024 Facilitador Car. {t.rights}</p>
          <p className="mt-4 md:mt-0">Desenvolvido com <i className="fas fa-heart text-red-600 mx-1"></i> em Portugal</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
