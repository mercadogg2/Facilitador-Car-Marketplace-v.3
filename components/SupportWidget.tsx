
import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';

interface SupportWidgetProps {
  lang: Language;
}

const SUPPORT_WHATSAPP_NUMBER = '351910000000'; 

const SupportWidget: React.FC<SupportWidgetProps> = ({ lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = TRANSLATIONS[lang].support;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const closeSupport = () => {
    setIsOpen(false);
    setIsSuccess(false);
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  // Listener para abrir o suporte de qualquer lugar do app
  useEffect(() => {
    const handleOpenSupport = () => setIsOpen(true);
    window.addEventListener('open-support-modal', handleOpenSupport);
    return () => window.removeEventListener('open-support-modal', handleOpenSupport);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('leads')
        .insert([{
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          message: `[SUPORTE] Assunto: ${formData.subject} | Mensagem: ${formData.message}`,
          stand_name: 'SUPORTE CENTRAL',
          status: 'Pendente'
        }]);

      if (insertError) throw insertError;

      const waMessage = `🚀 *Novo Pedido de Ajuda - Facilitador Car*\n\n` +
        `*Assunto:* ${formData.subject}\n` +
        `*Nome:* ${formData.name}\n` +
        `*E-mail:* ${formData.email}\n` +
        `*Telemóvel:* ${formData.phone}\n\n` +
        `*Mensagem:* ${formData.message}`;

      const waUrl = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;

      setIsSuccess(true);
      window.open(waUrl, '_blank');

      setTimeout(closeSupport, 4000);

    } catch (err: any) {
      setError(err.message || 'Erro ao processar pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-[900] w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
      >
        <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-20"></div>
        <i className="fas fa-headset text-2xl relative z-10"></i>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[2001] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[50px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/20">
            <div className="bg-blue-600 p-10 text-white relative">
              <div className="relative z-10">
                <h2 className="text-3xl font-black">{t.title}</h2>
                <p className="text-blue-100 text-sm font-medium mt-2">{t.subtitle}</p>
              </div>
              <button 
                onClick={closeSupport} 
                className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center hover:bg-white/40 transition-all text-white"
                title="Fechar"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-10">
              {isSuccess ? (
                <div className="text-center py-8">
                  <div className="w-24 h-24 bg-green-50 text-green-500 rounded-[35px] flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner animate-bounce">
                    <i className="fab fa-whatsapp"></i>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-2">Redirecionando...</h3>
                  <p className="text-slate-500 font-medium mb-10">A abrir conversa direta no WhatsApp.</p>
                  
                  <button 
                    onClick={closeSupport}
                    className="px-10 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Fechar Agora
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Assunto</label>
                      <select 
                        required 
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold text-sm appearance-none"
                      >
                        <option value="">Selecione o assunto</option>
                        <option value="Ajuda a encontrar carro">Ajuda a encontrar carro</option>
                        <option value="Dúvida sobre financiamento">Dúvida sobre financiamento</option>
                        <option value="Suporte Técnico">Suporte Técnico</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">O seu Nome</label>
                      <input 
                        required 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Telemóvel</label>
                      <input 
                        required 
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold text-sm" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">E-mail</label>
                    <input 
                      required 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold text-sm" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Mensagem</label>
                    <textarea 
                      required 
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-600 font-medium text-sm resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full py-5 bg-blue-600 text-white rounded-[25px] font-black text-lg shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                    >
                      {isSubmitting ? <i className="fas fa-spinner animate-spin"></i> : <i className="fab fa-whatsapp"></i>}
                      Iniciar Atendimento
                    </button>
                    <button 
                      type="button"
                      onClick={closeSupport}
                      className="w-full py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupportWidget;
