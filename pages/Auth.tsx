
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Language, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';

interface AuthProps {
  lang: Language;
  mode: 'login' | 'register';
  onLogin: (role: UserRole) => void;
}

const Auth: React.FC<AuthProps> = ({ lang, mode: initialMode, onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [userType, setUserType] = useState<UserRole>(UserRole.VISITOR);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const t = TRANSLATIONS[lang].auth;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '', standName: '', email: '', password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // MASTER BYPASS: Permite que o admin entre pelo login comum
      if (mode === 'login' && formData.email === 'admin@facilitadorcar.pt' && formData.password === 'admin123') {
        const adminSession = {
          email: formData.email,
          role: UserRole.ADMIN,
          timestamp: new Date().getTime()
        };
        localStorage.setItem('fc_session', JSON.stringify(adminSession));
        setIsSuccess(true);
        onLogin(UserRole.ADMIN);
        setTimeout(() => navigate('/admin'), 1000);
        return;
      }

      if (mode === 'register') {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
              stand_name: userType === UserRole.STAND ? formData.standName : null,
              role: userType,
              status: userType === UserRole.STAND ? 'pending' : 'approved'
            }
          }
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          await supabase.from('profiles').insert([{
            id: signUpData.user.id,
            full_name: formData.name,
            email: formData.email,
            role: userType,
            stand_name: userType === UserRole.STAND ? formData.standName : null,
            status: userType === UserRole.STAND ? 'pending' : 'approved',
            created_at: new Date().toISOString()
          }]);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email, 
          password: formData.password,
        });
        if (signInError) throw signInError;
      }

      setIsSuccess(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const roleToSet: UserRole = user?.user_metadata?.role || userType;
      
      // Se for login comum mas com email de admin (via Supabase)
      const finalRole = user?.email === 'admin@facilitadorcar.pt' ? UserRole.ADMIN : roleToSet;
      
      onLogin(finalRole);

      setTimeout(() => {
        if (finalRole === UserRole.ADMIN) navigate('/admin');
        else if (finalRole === UserRole.STAND) navigate('/dashboard');
        else navigate('/cliente');
      }, 1500);

    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' 
        ? (lang === 'pt' ? 'Dados incorretos. Verifique e-mail e senha.' : 'Invalid email or password.') 
        : err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center mb-10">
          <img src="https://facilitadorcar.com/wp-content/uploads/2026/01/logo-facilitador.png" alt="Logo" className="h-24 w-auto" />
        </Link>
        <h2 className="text-center text-3xl font-black text-gray-900 tracking-tight">
          {mode === 'login' ? t.loginTitle : t.registerTitle}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-8 shadow-2xl rounded-[40px] border border-gray-100">
          {isSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                <i className="fas fa-check"></i>
              </div>
              <p className="font-black text-gray-900">{lang === 'pt' ? 'Autenticação bem-sucedida!' : 'Authentication successful!'}</p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100"><i className="fas fa-exclamation-triangle mr-2"></i>{error}</div>}

              {mode === 'register' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Sou um...</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setUserType(UserRole.VISITOR)} className={`py-3 rounded-2xl border-2 font-bold text-sm transition-all ${userType === UserRole.VISITOR ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-400'}`}>Particular</button>
                      <button type="button" onClick={() => setUserType(UserRole.STAND)} className={`py-3 rounded-2xl border-2 font-bold text-sm transition-all ${userType === UserRole.STAND ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-400'}`}>Profissional</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nome Completo</label>
                    <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                  </div>
                  {userType === UserRole.STAND && (
                    <div className="animate-in slide-in-from-top-2">
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nome do Stand</label>
                      <input required type="text" value={formData.standName} onChange={(e) => setFormData({...formData, standName: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">E-mail</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Senha</label>
                <input required type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-blue-700 transition-all">
                {isSubmitting ? <i className="fas fa-circle-notch animate-spin"></i> : (mode === 'login' ? 'Entrar' : 'Criar Conta')}
              </button>
            </form>
          )}

          <div className="mt-8 text-center flex flex-col gap-3">
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-sm font-bold text-blue-600">{mode === 'login' ? 'Criar nova conta' : 'Já tenho conta'}</button>
            {mode === 'login' && (
              <div className="flex flex-col gap-2 mt-2">
                <Link to="/esqueci-senha" title="Esqueci senha" className="text-xs text-gray-400">Recuperar acesso</Link>
                <div className="pt-4 mt-2 border-t border-gray-50">
                  <Link to="/admin/login" className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-indigo-500 transition-colors">
                    Acesso Administrativo
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
