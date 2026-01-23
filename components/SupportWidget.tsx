
import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';

interface SupportWidgetProps {
  lang: Language;
}

const SUPPORT_WHATSAPP_NUMBER = '351910000000'; // Substitua pelo número real do Facilitador Car

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
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Guardar Lead para histórico administrativo
      const { error: insertError } = await supabase
        .from('leads')
        .insert([{
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          message: `[SUPORTE CENTRAL] ${formData.message}`,
          stand_name: 'SUPORTE CENTRAL',
          status: 'Pendente'
        }]);

      if (insertError) throw insertError;

      // 2. Preparar mensagem do WhatsApp
      const waMessage = `Olá! Gostaria de falar com o Facilitador Car.\n\n` +
        `*Dados do Cliente:*\n` +
        `• Nome: ${formData.name}\n` +
        `• E-mail: ${formData.email}\n` +
        `• Telemóvel: ${formData.phone}\n\n` +
        `*Mensagem:* ${formData.message}`;

      const waUrl = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;

      // 3. Sucesso e redirecionamento
      setIsSuccess(true);
      
      // Abrir WhatsApp em nova aba
      window.open(waUrl, '_blank');

      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setFormData({ name: '', email: '', phone: '', message: '' });
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Erro ao processar pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Botão Flutuante */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-[900] w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
        aria-label={t.btn}
      >
        <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-20 group-hover:opacity-40"></div>
        <i className="fas fa-comment-dots text-2xl relative z-10"></i>
        <span className="absolute right-full mr-4 bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {t.btn}
        </span>
      </button>

      {/* Modal de Suporte */}
      {isOpen && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-blue-600 p-8 flex justify-between items-center text-white">
              <div>
                <h2 className="text-2xl font-black">{t.title}</h2>
                <p className="text-blue-100 text-xs font-medium mt-1">{t.subtitle}</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-8">
              {isSuccess ? (
                <div className="text-center py-12 animate-in fade-in zoom-in">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                    <i className="fab fa-whatsapp"></i>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">{t.success}</h3>
                  <p className="text-gray-500 font-medium">{t.successDesc}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t.fields.name}</label>
                      <input 
                        required 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t.fields.phone}</label>
                      <input 
                        required 
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t.fields.email}</label>
                    <input 
                      required 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t.fields.message}</label>
                    <textarea 
                      required 
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm resize-none"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-lg shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fab fa-whatsapp text-xl"></i>}
                    Falar via WhatsApp
                  </button>
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
