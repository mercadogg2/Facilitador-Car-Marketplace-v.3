
import React from 'react';

const HelpCard: React.FC = () => {
  const handleOpenModal = () => {
    window.dispatchEvent(new CustomEvent('open-support-modal'));
  };

  return (
    <div className="bg-blue-600 p-10 md:p-12 rounded-[50px] text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
      {/* Círculo decorativo de fundo */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700"></div>
      
      <div className="relative z-10">
        <h4 className="text-3xl font-black mb-4 tracking-tight">Precisa de ajuda?</h4>
        <p className="text-blue-100 text-base font-medium mb-10 max-w-[280px] leading-relaxed">
          Fale com os nossos especialistas para encontrar o carro ideal.
        </p>
        
        <button 
          onClick={handleOpenModal}
          className="w-full py-5 bg-white text-blue-600 rounded-[25px] font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/5"
        >
          Contactar Suporte
        </button>
      </div>
    </div>
  );
};

export default HelpCard;
