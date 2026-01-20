
import React from 'react';
import { Link } from 'react-router-dom';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface PrivacyPolicyProps {
  lang: Language;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ lang }) => {
  const tc = TRANSLATIONS[lang].common;

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="bg-gray-50 border-b border-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/" className="text-blue-600 font-bold text-sm flex items-center mb-4 group">
            <i className="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i>
            {tc.back}
          </Link>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            {lang === 'pt' ? 'Política de Privacidade' : 'Privacy Policy'}
          </h1>
          <p className="mt-4 text-gray-500">Última atualização: Outubro de 2024</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="prose prose-blue max-w-none space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introdução</h2>
            <p>
              O Facilitador Car valoriza a sua privacidade. Esta política descreve como recolhemos, utilizamos e protegemos as suas informações pessoais ao utilizar a nossa plataforma de marketplace automóvel. Ao utilizar o nosso serviço, concorda com as práticas descritas neste documento.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Informações que Recolhemos</h2>
            <p>Recolhemos informações para fornecer melhores serviços aos nossos utilizadores:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Dados de Perfil:</strong> Nome, e-mail, telemóvel e localização fornecidos durante o registo.</li>
              <li><strong>Dados de Leads:</strong> Informações de contacto enviadas através de formulários de interesse em veículos para conexão com stands.</li>
              <li><strong>Dados de Veículos:</strong> No caso dos stands, recolhemos detalhes técnicos e imagens das viaturas anunciadas.</li>
              <li><strong>Dados de Navegação:</strong> Cookies e analytics para melhorar a experiência do utilizador.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Utilização dos Dados</h2>
            <p>Os seus dados são utilizados para:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Facilitar o contacto direto entre compradores e stands verificados.</li>
              <li>Personalizar a sua experiência e guardar os seus veículos favoritos.</li>
              <li>Garantir a segurança da plataforma e prevenir fraudes.</li>
              <li>Enviar comunicações de marketing e newsletters (apenas com o seu consentimento explícito).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Partilha de Informação</h2>
            <p>
              O Facilitador Car não vende os seus dados a terceiros. A partilha de informação ocorre exclusivamente para viabilizar o negócio: os dados de um "Lead" (nome, telemóvel, e-mail) são partilhados apenas com o Stand específico que detém o anúncio pelo qual demonstrou interesse.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Segurança</h2>
            <p>
              Implementamos medidas de segurança técnicas e organizativas rigorosas, incluindo encriptação de dados e armazenamento em servidores seguros (Supabase Cloud), para proteger a sua informação contra acessos não autorizados.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Os Seus Direitos</h2>
            <p>
              Em conformidade com o RGPD (Regulamento Geral sobre a Proteção de Dados), tem o direito de aceder, retificar, exportar ou solicitar a eliminação dos seus dados pessoais a qualquer momento através das definições do seu perfil ou contactando o nosso suporte.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
