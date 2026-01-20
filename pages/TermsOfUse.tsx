
import React from 'react';
import { Link } from 'react-router-dom';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface TermsOfUseProps {
  lang: Language;
}

const TermsOfUse: React.FC<TermsOfUseProps> = ({ lang }) => {
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
            {lang === 'pt' ? 'Termos de Utilização' : 'Terms of Use'}
          </h1>
          <p className="mt-4 text-gray-500">Vigência a partir de: Fevereiro de 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="prose prose-blue max-w-none space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
            <p>
              Ao aceder e utilizar a plataforma Facilitador Car, o utilizador concorda em cumprir estes Termos de Utilização. Se não concordar com qualquer parte destes termos, não deverá utilizar os nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Natureza do Serviço</h2>
            <p>
              O Facilitador Car é um marketplace que facilita a ligação entre potenciais compradores e stands profissionais. O Facilitador Car não é proprietário das viaturas anunciadas, não atua como vendedor direto e não se responsabiliza pela conclusão física do negócio ou pelo estado mecânico dos veículos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Regras para Stands</h2>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Verificação:</strong> Apenas stands que passem pelo nosso processo de auditoria podem ostentar o selo de "Verificado".</li>
              <li><strong>Veracidade:</strong> Todas as informações dos anúncios (preço, km, extras) devem ser verídicas e estar atualizadas.</li>
              <li><strong>Conduta:</strong> Os stands comprometem-se a responder aos leads de forma profissional e célere.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo da plataforma (logótipos, design, código e textos originais) é propriedade do Facilitador Car. As imagens das viaturas são propriedade dos respetivos stands ou fotógrafos autorizados.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Limitação de Responsabilidade</h2>
            <p>
              Embora realizemos um esforço rigoroso para verificar os nossos parceiros, o Facilitador Car não se responsabiliza por perdas resultantes de transações efetuadas entre compradores e stands. Recomendamos sempre a inspeção física do veículo antes da compra.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Modificações</h2>
            <p>
              Reservamos o direito de modificar estes termos a qualquer momento. Alterações significativas serão notificadas através da plataforma ou via e-mail.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
