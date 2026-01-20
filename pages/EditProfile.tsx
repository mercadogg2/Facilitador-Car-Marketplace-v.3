
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Language, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';

interface EditProfileProps {
  lang: Language;
  onLogout: () => Promise<void>;
}

const EditProfile: React.FC<EditProfileProps> = ({ lang, onLogout }) => {
  const t = TRANSLATIONS[lang].editProfile;
  const tc = TRANSLATIONS[lang].common;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.VISITOR);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    stand_name: '',
    description: '',
    newPassword: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const role = user.user_metadata?.role || UserRole.VISITOR;
        setUserRole(role);

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setFormData({
            name: profile.full_name || '',
            email: profile.email || '',
            phone: profile.phone || '',
            location: profile.location || '',
            stand_name: profile.stand_name || '',
            description: profile.description || '',
            newPassword: ''
          });
        } else {
          setFormData({
            name: user.user_metadata?.full_name || '',
            email: user.email || '',
            phone: user.user_metadata?.phone || '',
            location: user.user_metadata?.location || '',
            stand_name: user.user_metadata?.stand_name || '',
            description: user.user_metadata?.description || '',
            newPassword: ''
          });
        }
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogoutClick = async () => {
    const confirmMsg = lang === 'pt' ? 'Tem a certeza que deseja sair?' : 'Are you sure you want to logout?';
    if (!window.confirm(confirmMsg)) return;
    
    setIsLoggingOut(true);
    try {
      await onLogout();
      // O App.tsx já mudará o estado de isLoggedIn para false, o que fará este componente desmontar
      // O navigate aqui é um fallback de segurança
      navigate('/', { replace: true });
    } catch (err) {
      console.error("Erro ao processar logout:", err);
      localStorage.clear();
      window.location.href = '/#/';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado.");

      const updates: any = {
        data: {
          full_name: formData.name,
          phone: formData.phone,
          stand_name: formData.stand_name,
          description: formData.description,
        }
      };
      
      if (formData.newPassword) {
        updates.password = formData.newPassword;
      }

      const { error: authError } = await supabase.auth.updateUser(updates);
      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.name,
          phone: formData.phone,
          stand_name: formData.stand_name,
          description: formData.description
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setIsSuccess(true);
      setTimeout(() => {
        if (userRole === UserRole.STAND) navigate('/dashboard');
        else navigate('/cliente');
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-12 rounded-[40px] shadow-2xl text-center max-w-md w-full animate-in zoom-in duration-300">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">
            <i className="fas fa-check"></i>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.success}</h2>
          <p className="text-gray-500 font-medium">Os seus dados foram guardados com sucesso.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button 
            type="button"
            onClick={() => userRole === UserRole.STAND ? navigate('/dashboard') : navigate('/cliente')}
            className="flex items-center text-gray-400 hover:text-blue-600 font-bold transition-all group"
          >
            <i className="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i>
            {tc.back}
          </button>
          
          <button 
            type="button"
            disabled={isLoggingOut}
            onClick={handleLogoutClick}
            className={`flex items-center font-bold text-sm transition-all gap-2 px-4 py-2 rounded-xl border shadow-sm ${
              isLoggingOut 
                ? 'bg-gray-100 text-gray-400 border-gray-200' 
                : 'text-red-500 hover:text-red-700 bg-white border-red-100 hover:bg-red-50'
            }`}
          >
            {isLoggingOut ? (
              <i className="fas fa-circle-notch animate-spin"></i>
            ) : (
              <i className="fas fa-sign-out-alt"></i>
            )}
            {isLoggingOut 
              ? (lang === 'pt' ? 'Saindo...' : 'Logging out...') 
              : (lang === 'pt' ? 'Sair da Conta' : 'Logout')
            }
          </button>
        </div>

        <header className="mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">{t.title}</h1>
          <p className="text-gray-500 text-lg font-medium">{t.subtitle}</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm border border-red-100">
              {error}
            </div>
          )}

          <section className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center">
              <i className="fas fa-user-circle mr-3 text-blue-600"></i>
              {t.personalInfo}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t.fields.name}</label>
                <input required name="name" value={formData.name} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" />
              </div>
              
              {userRole === UserRole.STAND && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome do Stand</label>
                    <input required name="stand_name" value={formData.stand_name} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Descrição / História do Stand</label>
                    <textarea 
                      name="description" 
                      value={formData.description} 
                      onChange={handleChange} 
                      rows={5} 
                      placeholder="Conte um pouco sobre o seu stand, anos de experiência e diferenciais..." 
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all resize-none"
                    />
                  </div>
                </>
              )}
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t.fields.location}</label>
                <input name="location" value={formData.location} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t.fields.phone}</label>
                <input name="phone" value={formData.phone} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" />
              </div>
            </div>
          </section>

          <section className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center">
              <i className="fas fa-shield-alt mr-3 text-blue-600"></i>
              {t.security}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t.fields.newPassword}</label>
                <input 
                  type="password" 
                  name="newPassword" 
                  value={formData.newPassword} 
                  onChange={handleChange} 
                  placeholder="Deixe em branco para manter a atual"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" 
                />
              </div>
            </div>
          </section>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-6 bg-blue-600 text-white rounded-[30px] font-black text-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSubmitting ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-save"></i>}
            {t.saveChanges}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
