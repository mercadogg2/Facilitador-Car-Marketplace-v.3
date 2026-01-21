
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';

interface ResetPasswordProps {
  lang: Language;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ lang }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const t = TRANSLATIONS[lang].auth;
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError(lang === 'pt' ? 'Sessão expirada ou link inválido.' : 'Session expired or invalid link.');
      }
    };
    checkSession();
  }, [lang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError(lang === 'pt' ? 'As palavras-passe não coincidem.' : 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError(lang === 'pt' ? 'A palavra-passe deve ter pelo menos 6 caracteres.' : 'Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });
      if (updateError) throw updateError;
      
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return 0;
    if (password.length < 6) return 1;
    if (password.length >= 10 && /[0-9]/.test(password) && /[A-Z]/.test(password)) return 3;
    return 2;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center mb-10">
          <img 
            src="https://facilitadorcar.com/wp-content/uploads/2026/01/logotipo-centralizado-colorido-sobre-claro-scaled.png" 
            alt="Facilitador Car" 
            className="h-32 w-auto"
          />
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          {t.resetPasswordTitle}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 font-medium">
          {t.resetPasswordSubtitle}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-2xl sm:rounded-[40px] border border-gray-100 sm:px-12 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50 rounded-full -ml-16 -mb-16 opacity-50"></div>
          
          {isSuccess ? (
            <div className="text-center relative z-10 animate-in fade-in zoom-in">
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner">
                <i className="fas fa-check"></i>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">{t.resetSuccess}</h3>
              <p className="text-gray-500 mb-4 font-medium">A sua segurança é a nossa prioridade. <br/>Redirecionando para o login...</p>
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
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t.password}</label>
                <div className="relative">
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
                    placeholder="••••••••"
                  />
                  <i className="fas fa-lock absolute right-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
                </div>
                {password && (
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3].map((level) => (
                      <div 
                        key={level} 
                        className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                          getPasswordStrength() >= level 
                            ? (getPasswordStrength() === 1 ? 'bg-red-400' : getPasswordStrength() === 2 ? 'bg-amber-400' : 'bg-green-400') 
                            : 'bg-gray-100'
                        }`}
                      ></div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  {lang === 'pt' ? 'Confirmar Palavra-passe' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <input
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
                    placeholder="••••••••"
                  />
                  <i className="fas fa-shield-alt absolute right-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || !!error && error.includes('expirada')}
                  className={`w-full flex justify-center py-5 px-4 rounded-2xl shadow-xl font-black text-lg text-white transition-all ${
                    isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                  }`}
                >
                  {isSubmitting ? <i className="fas fa-circle-notch animate-spin"></i> : t.updatePassword}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
