
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
    paymentMethod: 'A pronto',
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

    const targetStand = car.stand_name?.trim() || "Particular";

    const leadPayload = {
      customer_name: formData.name.trim(),
      customer_email: formData.email.trim().toLowerCase(),
      customer_phone: formData.phone.trim(),
      car_id: car.id, 
      stand_name: targetStand, 
      message: fullMessage,
      status: 'Pendente'
    };

    try {
      const { error } = await supabase
        .from('leads')
        .insert([leadPayload]);

      if (error) {
        setErrorDetails(error.message);
        return;
      }

      setIsSuccess(true);
      setTimeout(onClose, 5000);

    } catch (err: any) {
      setErrorDetails(err.message || "Erro de conexão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-[50px] shadow-2xl w-full max-w-sm p-12 text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner animate-pulse">
            <i className="fas fa-check"></i>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">{lang === 'pt' ? 'Recebido!' : 'Received!'}</h2>
          <p className="text-gray-500 font-medium text-sm mb-8">
            {lang === 'pt' 
              ? 'A equipa Facilitador Car recebeu o seu contacto e irá processá-lo brevemente.' 
              : 'The Facilitador Car team has received your contact and will process it shortly.'}
          </p>
          
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl"
          >
            {lang === 'pt' ? 'Fechar' : 'Close'}
          </button>
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
            <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mt-1">Interesse via Facilitador Car</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
            title="Fechar"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {errorDetails && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-[11px] font-bold">
              <i className="fas fa-exclamation-triangle mr-2"></i> {errorDetails}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Nome</label>
              <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 outline-none font-bold text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Telemóvel</label>
              <input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 outline-none font-bold text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">E-mail</label>
            <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 outline-none font-bold text-sm" />
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
                <option value="A pronto">A pronto</option>
                <option value="Financiamento">Financiamento</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-paper-plane"></i>}
              Enviar Agora
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="w-full py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
