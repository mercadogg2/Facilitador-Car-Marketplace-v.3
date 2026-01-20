
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Language, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface AdminLoginProps {
  lang: Language;
  onLogin: (role: UserRole) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ lang, onLogin }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // MASTER BYPASS: Admin Local
      if (formData.email === 'admin@facilitadorcar.pt' && formData.password === 'admin123') {
        const adminSession = {
          email: formData.email,
          role: UserRole.ADMIN,
          timestamp: new Date().getTime()
        };
        localStorage.setItem('fc_session', JSON.stringify(adminSession));
        onLogin(UserRole.ADMIN);
        navigate('/admin');
        return;
      }

      // Tentativa via Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (authError) throw authError;

      if (data.user?.email !== 'admin@facilitadorcar.pt' && data.user?.user_metadata?.role !== UserRole.ADMIN) {
        throw new Error(lang === 'pt' ? 'Acesso restrito a administradores.' : 'Restricted access for admins only.');
      }

      const adminSession = {
        email: data.user.email,
        role: UserRole.ADMIN,
        timestamp: new Date().getTime()
      };
      localStorage.setItem('fc_session', JSON.stringify(adminSession));
      
      onLogin(UserRole.ADMIN);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' 
        ? (lang === 'pt' ? 'Acesso negado. Credenciais inválidas.' : 'Access denied. Invalid credentials.')
        : err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16"></div>
        
        <div className="relative">
          <div className="flex justify-center flex-col items-center">
            <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-xl shadow-indigo-200 mb-6">
              <i className="fas fa-shield-alt text-3xl"></i>
            </div>
            <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight">
              {lang === 'pt' ? 'Painel de Controlo' : 'Control Panel'}
            </h2>
            <p className="mt-2 text-center text-sm text-slate-500 font-medium">
              {lang === 'pt' ? 'Acesso Administrativo Reservado' : 'Reserved administrator access'}
            </p>
          </div>

          <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Email Admin
                </label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                  placeholder="admin@facilitadorcar.pt"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Senha
                </label>
                <input
                  required
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex justify-center py-5 px-4 rounded-2xl shadow-xl font-black text-lg text-white transition-all ${
                isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
              }`}
            >
              {isSubmitting ? (
                <i className="fas fa-circle-notch animate-spin"></i>
              ) : (
                lang === 'pt' ? 'Entrar no Sistema' : 'Login'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <Link to="/login" className="text-xs font-bold text-slate-400 hover:text-indigo-600">
              <i className="fas fa-arrow-left mr-2"></i>
              Voltar ao site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
