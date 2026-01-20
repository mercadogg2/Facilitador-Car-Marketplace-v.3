
import React, { useState } from 'react';
import { Car, Language } from '../types';
import { supabase } from '../lib/supabase';

interface LeadFormProps {
  car: Car;
  lang: Language;
  onClose: () => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ car, lang }) => {
  return null; 
};

export default function FullLeadForm({ car, lang, onClose }: LeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    const fullMessage = `${formData.message}\n\n` +
      (lang === 'pt' 
        ? `Preferência de contacto: ${formData.contactPreference}\nPretende comprar: ${formData.paymentMethod}`
        : `Contact Preference: ${formData.contactPreference}\nPayment Method: ${formData.paymentMethod}`);

    try {
      const { error } = await supabase.from('leads').insert([{
        car_id: car.id,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        message: fullMessage,
        status: 'Pendente'
      }]);

      if (error) throw error;

      const whatsappMsg = encodeURIComponent(`${fullMessage}\n\nDe: ${formData.name}\nTelemóvel: ${formData.phone}`);
      window.open(`https://wa.me/351912345678?text=${whatsappMsg}`, '_blank');
      onClose();
    } catch (err) {
      console.error("Erro ao guardar lead:", err);
      alert(lang === 'pt' ? "Erro ao enviar pedido. Tente novamente." : "Error sending request. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <p className="text-blue-100 text-sm">Interesse em: {car.brand} {car.model}</p>
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
                {lang === 'pt' ? 'Pretende comprar a pronto ou financiamento?' : 'Do you intend to buy cash or financing?'}
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
            <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'pt' ? 'Mensagem Adicional' : 'Additional Message'}</label>
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
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-100 flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <i className="fas fa-circle-notch animate-spin"></i>
            ) : (
              <>
                <i className="fab fa-whatsapp text-xl"></i>
                <span>{lang === 'pt' ? 'Enviar Interesse via WhatsApp' : 'Send Interest via WhatsApp'}</span>
              </>
            )}
          </button>
          
          <p className="text-[10px] text-gray-400 text-center">
            {lang === 'pt' 
              ? 'Ao clicar em enviar, concorda com os nossos Termos de Utilização e Política de Privacidade.'
              : 'By clicking send, you agree to our Terms of Use and Privacy Policy.'}
          </p>
        </form>
      </div>
    </div>
  );
}
