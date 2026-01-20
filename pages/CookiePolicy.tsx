
import React from 'react';
import { Link } from 'react-router-dom';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface CookiePolicyProps {
  lang: Language;
}

const CookiePolicy: React.FC<CookiePolicyProps> = ({ lang }) => {
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
            {lang === 'pt' ? 'Política de Cookies' : 'Cookie Policy'}
          </h1>
          <p className="mt-4 text-gray-500">Última atualização: Outubro de 2024</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="prose prose-blue max-w-none space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. O que são Cookies?</h2>
            <p>
              Cookies são pequenos ficheiros de texto que são armazenados no seu computador ou dispositivo móvel quando visita um website. Eles são amplamente utilizados para fazer os websites funcionarem de forma mais eficiente, bem como para fornecer informações aos proprietários do site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Como utilizamos os Cookies</h2>
            <p>O Facilitador Car utiliza cookies para várias finalidades:</p>
            <div className="space-y-4 mt-6">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h4 className="font-bold text-gray-900 flex items-center">
                  <i className="fas fa-lock mr-2 text-blue-600"></i>
                  {lang === 'pt' ? 'Cookies Estritamente Necessários' : 'Strictly Necessary Cookies'}
                </h4>
                <p className="text-sm mt-2">
                  Essenciais para o funcionamento do site, permitindo a navegação, acesso a áreas seguras (como o Dashboard do Stand) e autenticação. Sem estes, o site não funcionaria corretamente.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h4 className="font-bold text-gray-900 flex items-center">
                  <i className="fas fa-chart-line mr-2 text-blue-600"></i>
                  {lang === 'pt' ? 'Cookies de Desempenho e Analíticos' : 'Performance & Analytics Cookies'}
                </h4>
                <p className="text-sm mt-2">
                  Ajudam-nos a entender como os visitantes interagem com o marketplace, quais as páginas mais populares e se ocorrem erros. Utilizamos estes dados de forma anónima para melhorar o serviço.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h4 className="font-bold text-gray-900 flex items-center">
                  <i className="fas fa-bullhorn mr-2 text-blue-600"></i>
                  {lang === 'pt' ? 'Cookies de Marketing' : 'Marketing Cookies'}
                </h4>
                <p className="text-sm mt-2">
                  Utilizados para rastrear visitantes em websites. A intenção é exibir anúncios que sejam relevantes e envolventes para o utilizador individual.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Gestão de Cookies</h2>
            <p>
              Pode controlar e/ou apagar cookies conforme desejar através das definições do seu navegador. Pode apagar todos os cookies já instalados no seu dispositivo e configurar a maioria dos navegadores para impedir a sua instalação.
            </p>
            <p className="mt-4 italic">
              Nota: Se desativar os cookies, algumas funcionalidades do Facilitador Car (como manter a sessão iniciada ou guardar favoritos) poderão não funcionar corretamente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Cookies de Terceiros</h2>
            <p>
              Em alguns casos, também utilizamos cookies fornecidos por terceiros confiáveis. Por exemplo, o Google Analytics para nos ajudar a entender como utiliza o site e como podemos melhorar a sua experiência.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Mais informações</h2>
            <p>
              Esperamos que estas informações tenham esclarecido o uso de cookies na nossa plataforma. Se tiver dúvidas adicionais, pode contactar a nossa equipa de suporte através do email: <strong>privacidade@facilitadorcar.pt</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
