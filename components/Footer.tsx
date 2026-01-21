
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

  return (
    <footer className="bg-gray-900 text-white py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <img 
              src="https://facilitadorcar.com/wp-content/uploads/2026/01/logotipo-centralizado-colorido-sobre-claro-scaled.png" 
              alt="Facilitador Car" 
              className="h-24 w-auto mb-6 brightness-0 invert"
            />
            <p className="text-gray-400 mb-8 max-w-sm leading-relaxed">{t.desc}</p>
            
            <div className="mt-4">
              <a 
                href="https://www.livroreclamacoes.pt/Inicio/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block"
              >
                <img 
                  src="https://facilitadorcar.com/wp-content/uploads/2026/01/download-removebg-preview.png" 
                  alt="Livro de Reclamações Eletrónico" 
                  className="h-12 w-auto object-contain brightness-0 invert opacity-60 hover:opacity-100 transition-opacity duration-300"
                />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4 uppercase text-sm tracking-widest text-gray-500">{t.links}</h4>
            <ul className="space-y-2 text-gray-400 text-sm font-medium">
              <li><Link to="/veiculos" className="hover:text-white transition-colors">{nav.vehicles}</Link></li>
              <li><Link to="/sobre" className="hover:text-white transition-colors">{nav.about}</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">{nav.blog}</Link></li>
              <li><Link to="/stands" className="hover:text-white transition-colors">{nav.stands}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 uppercase text-sm tracking-widest text-gray-500">{t.legal}</h4>
            <ul className="space-y-2 text-gray-400 text-sm font-medium">
              <li><Link to="/privacidade" className="hover:text-white transition-colors">{lang === 'pt' ? 'Privacidade' : 'Privacy'}</Link></li>
              <li><Link to="/termos" className="hover:text-white transition-colors">{lang === 'pt' ? 'Termos de Uso' : 'Terms of Use'}</Link></li>
              <li><Link to="/cookies" className="hover:text-white transition-colors">Cookies</Link></li>
              <li className="pt-4 border-t border-gray-800 mt-4">
                <Link to="/admin/login" className="text-gray-600 hover:text-indigo-400 transition-colors text-xs flex items-center gap-2">
                  <i className="fas fa-lock text-[10px]"></i>
                  {lang === 'pt' ? 'Área Administrativa' : 'Admin Area'}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-16 pt-8 text-center text-sm text-gray-500 font-medium">
          <p>© 2024 Facilitador Car. {t.rights}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
