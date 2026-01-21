
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

    // Estruturação da mensagem completa para salvar todos os dados do formulário
    const fullMessage = `${formData.message}\n\n` +
      (lang === 'pt' 
        ? `--- DADOS DO FORMULÁRIO ---\nPreferência de Contacto: ${formData.contactPreference}\nMétodo de Pagamento: ${formData.paymentMethod}\nOrigem: Marketplace Web`
        : `--- FORM DATA ---\nContact Preference: ${formData.contactPreference}\nPayment Method: ${formData.paymentMethod}\nSource: Web Marketplace`);

    try {
      console.log("Iniciando gravação de lead para car_id:", car.id);
      
      const { data, error } = await supabase.from('leads').insert([{
        car_id: car.id,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        message: fullMessage,
        status: 'Pendente'
      }]).select();

      if (error) {
        console.error("Erro Supabase:", error);
        throw error;
      }

      console.log("Lead gravado com sucesso no BD:", data);
      setIsSuccess(true);
      
      // Fecha o modal após 3 segundos
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (err: any) {
      console.error("Erro crítico ao salvar lead:", err);
      alert(lang === 'pt' 
        ? `Não foi possível guardar o seu interesse: ${err.message || 'Erro de conexão'}` 
        : `Could not save your interest: ${err.message || 'Connection error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            <i className="fas fa-check"></i>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            {lang === 'pt' ? 'Pedido Registado!' : 'Request Registered!'}
          </h2>
          <p className="text-gray-500 font-medium">
            {lang === 'pt' 
              ? 'O seu interesse foi guardado no nosso sistema. O vendedor entrará em contacto em breve.' 
              : 'Your interest has been saved in our system. The seller will contact you shortly.'}
          </p>
          <button 
            onClick={onClose}
            className="mt-8 text-sm font-bold text-blue-600 hover:underline"
          >
            {lang === 'pt' ? 'Fechar' : 'Close'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="relative h-32 bg-blue-600 p-8 flex flex-col justify-center">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
          <h2 className="text-2xl font-bold text-white">{lang === 'pt' ? 'Demonstrar Interesse' : 'Show Interest'}</h2>
          <p className="text-blue-100 text-sm">Viatura: {car.brand} {car.model}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'pt' ? 'Nome Completo' : 'Full Name'}</label>
            <input 
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: João Silva"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail</label>
              <input 
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="email@exemplo.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'pt' ? 'Telemóvel' : 'Phone'}</label>
              <input 
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+351 900 000 000"
                className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                {lang === 'pt' ? 'Como prefere ser contactado?' : 'How do you prefer to be contacted?'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['WhatsApp', lang === 'pt' ? 'Ligação' : 'Call'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFormData({...formData, contactPreference: option})}
                    className={`py-2 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
                      formData.contactPreference === option 
                        ? 'border-blue-600 bg-blue-50 text-blue-700' 
                        : 'border-gray-100 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                {lang === 'pt' ? 'Método de Pagamento' : 'Payment Method'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  lang === 'pt' ? 'Pronto Pagamento' : 'Cash',
                  lang === 'pt' ? 'Financiamento' : 'Financing'
                ].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFormData({...formData, paymentMethod: option})}
                    className={`py-2 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
                      formData.paymentMethod === option 
                        ? 'border-blue-600 bg-blue-50 text-blue-700' 
                        : 'border-gray-100 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'pt' ? 'Mensagem' : 'Message'}</label>
            <textarea 
              rows={2}
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <i className="fas fa-circle-notch animate-spin"></i>
            ) : (
              <i className="fas fa-paper-plane"></i>
            )}
            <span>{lang === 'pt' ? 'Enviar Interesse' : 'Send Interest'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
