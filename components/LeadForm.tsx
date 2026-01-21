
import React, { useState } from 'react';
import { Car, Language } from '../types';
import { supabase } from '../lib/supabase';

interface LeadFormProps {
  car: Car;
  lang: Language;
  onClose: () => void;
}

export default function LeadForm({ car, lang, onClose }: LeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contactPreference: 'WhatsApp',
    paymentMethod: 'Pronto Pagamento',
    message: lang === 'pt' 
      ? `Olá! Estou interessado no ${car.brand} ${car.model} (${car.year}). Poderia dar-me mais informações?`
      : `Hi! I'm interested in the ${car.brand} ${car.model} (${car.year}). Could you provide more information?`
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorDetails(null);

    const fullMessage = `${formData.message}\n\n` +
      (lang === 'pt' 
        ? `PREFERÊNCIAS:\n- Contacto: ${formData.contactPreference}\n- Pagamento: ${formData.paymentMethod}`
        : `PREFERENCES:\n- Contact: ${formData.contactPreference}\n- Payment: ${formData.paymentMethod}`);

    // Salvamos o stand_name explicitamente para o dashboard encontrar o lead facilmente
    const leadPayload = {
      customer_name: formData.name,
      customer_email: formData.email,
      customer_phone: formData.phone,
      car_id: car.id, 
      stand_name: car.stand_name, // CAMPO CRUCIAL ADICIONADO
      message: fullMessage,
      status: 'Pendente'
    };

    try {
      console.log("📤 Enviando Lead:", leadPayload);

      const { error, status } = await supabase
        .from('leads')
        .insert([leadPayload]);

      if (error) {
        console.error("❌ Erro Supabase:", error);
        setErrorDetails(error.message);
        return;
      }

      console.log("✅ Lead salvo! Status:", status);
      setIsSuccess(true);
      setTimeout(onClose, 2500);

    } catch (err: any) {
      console.error("💥 Falha Crítica:", err);
      setErrorDetails(err.message || "Erro de rede.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-sm p-12 text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            <i className="fas fa-check"></i>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Enviado!</h2>
          <p className="text-gray-500 font-medium">O stand recebeu o seu contacto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-blue-600 p-8 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-white">{lang === 'pt' ? 'Demonstrar Interesse' : 'Show Interest'}</h2>
            <p className="text-blue-100 text-xs font-bold">{car.brand} {car.model}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {errorDetails && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-[11px] font-bold leading-relaxed">
              <i className="fas fa-bug mr-2"></i> Erro ao guardar: {errorDetails}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Nome</label>
              <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Telemóvel</label>
              <input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">E-mail</label>
            <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Contacto</label>
              <select value={formData.contactPreference} onChange={(e) => setFormData({...formData, contactPreference: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-bold text-xs">
                <option value="WhatsApp">WhatsApp</option>
                <option value="Chamada">Chamada</option>
                <option value="Email">Email</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Pagamento</label>
              <select value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-bold text-xs">
                <option value="Pronto Pagamento">Pronto</option>
                <option value="Financiamento">Crédito</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSubmitting ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-paper-plane"></i>}
            {lang === 'pt' ? 'Enviar Mensagem' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}
