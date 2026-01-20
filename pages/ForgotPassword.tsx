
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';

interface ForgotPasswordProps {
  lang: Language;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ lang }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const t = TRANSLATIONS[lang].auth;
  const tc = TRANSLATIONS[lang].common;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Usamos a origem do site. O Supabase anexará o token à URL.
      // O App.tsx detectará o evento de recuperação.
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (resetError) throw resetError;
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center mb-10">
          <img 
            src="https://facilitadorcar.com/wp-content/uploads/2026/01/logo-facilitador.png" 
            alt="Facilitador Car" 
            className="h-32 w-auto"
          />
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          {t.forgotPasswordTitle}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 font-medium">
          {t.forgotPasswordSubtitle}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-2xl sm:rounded-[40px] border border-gray-100 sm:px-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
          
          {isSuccess ? (
            <div className="text-center relative z-10 animate-in fade-in zoom-in">
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner">
                <i className="fas fa-paper-plane"></i>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">{t.checkEmail}</h3>
              <p className="text-gray-500 mb-8 font-medium">Enviámos as instruções para <br/><span className="text-blue-600 font-bold">{email}</span></p>
              <Link to="/login" className="inline-block bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg">
                {tc.back} ao Login
              </Link>
            </div>
          ) : (
            <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 flex items-center animate-in slide-in-from-top-2">
                  <i className="fas fa-exclamation-circle mr-2"></i>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t.email}</label>
                <div className="relative">
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
                    placeholder="email@exemplo.com"
                  />
                  <i className="fas fa-envelope absolute right-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center py-5 px-4 rounded-2xl shadow-xl font-black text-lg text-white transition-all ${
                    isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                  }`}
                >
                  {isSubmitting ? <i className="fas fa-circle-notch animate-spin"></i> : t.sendResetLink}
                </button>
              </div>

              <div className="text-center pt-4">
                <Link to="/login" className="text-sm font-bold text-gray-400 hover:text-blue-600 transition-colors">
                  <i className="fas fa-chevron-left mr-2 text-[10px]"></i>
                  {tc.back} ao Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
