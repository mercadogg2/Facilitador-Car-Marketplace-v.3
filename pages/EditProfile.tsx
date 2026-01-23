
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Language, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

interface EditProfileProps {
  lang: Language;
  onLogout: () => Promise<void>;
}

const EditProfile: React.FC<EditProfileProps> = ({ lang, onLogout }) => {
  const t = TRANSLATIONS[lang].editProfile;
  const tc = TRANSLATIONS[lang].common;
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    newPassword: '',
    profile_image: '',
    slug: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Usar getSession para ser mais rápido na transição entre páginas
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          navigate('/login');
          return;
        }

        const role = session.user.user_metadata?.role || UserRole.VISITOR;
        setUserRole(role);

        // Buscar dados do perfil na tabela profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.warn("Erro ao carregar perfil da tabela, tentando recuperar do user_metadata.");
        }

        if (profile) {
          setFormData({
            name: profile.full_name || '',
            email: profile.email || session.user.email || '',
            phone: profile.phone || '',
            location: profile.location || '',
            stand_name: profile.stand_name || '',
            description: profile.description || '',
            newPassword: '',
            profile_image: profile.profile_image || '',
            slug: profile.slug || ''
          });
        } else {
          // Fallback se o perfil ainda não existir na tabela
          setFormData(prev => ({
            ...prev,
            name: session.user.user_metadata?.full_name || '',
            email: session.user.email || '',
            stand_name: session.user.user_metadata?.stand_name || ''
          }));
        }
      } catch (err) {
        console.error("Erro fatal ao carregar perfil:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogoutClick = async () => {
    if (!window.confirm(lang === 'pt' ? 'Tem a certeza que deseja sair?' : 'Are you sure you want to logout?')) return;
    
    setIsLoggingOut(true);
    try {
      await onLogout();
      navigate('/', { replace: true });
    } catch (err) {
      console.error("Erro ao processar logout:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError(lang === 'pt' ? 'A imagem deve ser menor que 2MB.' : 'Image must be smaller than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profile_image: reader.result as string }));
      };
      reader.readAsDataURL(file);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada ou inválida.");

      const newSlug = userRole === UserRole.STAND ? slugify(formData.stand_name) : formData.slug;

      // 1. Atualizar Metadados de Autenticação
      const authUpdates: any = {
        data: {
          full_name: formData.name,
          phone: formData.phone,
          stand_name: formData.stand_name,
          slug: newSlug
        }
      };
      
      if (formData.newPassword) {
        authUpdates.password = formData.newPassword;
      }

      const { error: authError } = await supabase.auth.updateUser(authUpdates);
      if (authError) throw authError;

      // 2. Atualizar Tabela de Perfis
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.name,
          phone: formData.phone,
          stand_name: formData.stand_name,
          description: formData.description,
          profile_image: formData.profile_image,
          location: formData.location,
          slug: newSlug
        })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      setIsSuccess(true);
      setTimeout(() => {
        if (userRole === UserRole.STAND || userRole === UserRole.ADMIN) navigate('/dashboard');
        else navigate('/cliente');
      }, 2000);

    } catch (err: any) {
      console.error("Erro ao gravar perfil:", err);
      setError(err.message || "Erro desconhecido ao gravar dados.");
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

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button 
            type="button"
            onClick={() => (userRole === UserRole.STAND || userRole === UserRole.ADMIN) ? navigate('/dashboard') : navigate('/cliente')}
            className="flex items-center text-gray-400 hover:text-blue-600 font-bold transition-all group"
          >
            <i className="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i>
            {tc.back}
          </button>
          
          <button 
            type="button"
            disabled={isLoggingOut}
            onClick={handleLogoutClick}
            className="flex items-center font-bold text-sm text-red-500 hover:text-red-700 transition-all gap-2"
          >
            {isLoggingOut ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-sign-out-alt"></i>}
            {isLoggingOut ? 'Saindo...' : 'Logout'}
          </button>
        </div>

        {isSuccess ? (
          <div className="bg-white p-12 rounded-[40px] shadow-2xl text-center animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">
              <i className="fas fa-check"></i>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.success}</h2>
            <p className="text-gray-500 font-medium">As suas alterações foram aplicadas com sucesso.</p>
          </div>
        ) : (
          <>
            <header className="mb-12">
              <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">
                {userRole === UserRole.STAND ? 'Configurações do Stand' : t.title}
              </h1>
              <p className="text-gray-500 text-lg font-medium">
                {userRole === UserRole.STAND ? 'Personalize o seu logótipo e a biografia do seu negócio.' : t.subtitle}
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
              {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm border border-red-100">{error}</div>}

              <section className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-gray-100">
                <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center">
                  <i className="fas fa-store mr-3 text-blue-600"></i>
                  Identidade e Logótipo
                </h3>

                <div className="flex flex-col items-center mb-10">
                  <div className="relative group">
                    <div className="w-40 h-40 rounded-[35px] overflow-hidden bg-gray-50 border-4 border-white shadow-xl flex items-center justify-center text-blue-600 font-black text-5xl">
                      {formData.profile_image ? (
                        <img src={formData.profile_image} className="w-full h-full object-cover" alt="Logo" />
                      ) : (
                        formData.stand_name ? formData.stand_name[0].toUpperCase() : 'S'
                      )}
                    </div>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-600 text-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors border-4 border-white"
                    >
                      <i className="fas fa-camera"></i>
                    </button>
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Clique para carregar o seu logótipo</p>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome do Stand</label>
                    <input 
                      required 
                      name="stand_name" 
                      value={formData.stand_name} 
                      onChange={handleChange} 
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold" 
                      placeholder="Nome oficial do stand"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Sobre o Stand (Descrição)</label>
                    <textarea 
                      name="description" 
                      value={formData.description} 
                      onChange={handleChange} 
                      rows={5} 
                      placeholder="Conte a história do seu stand ou destaque as suas vantagens competitivas..." 
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Localidade Principal</label>
                    <input name="location" value={formData.location} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Telefone de Contacto</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                  </div>
                </div>
              </section>

              <section className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-gray-100">
                <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center">
                  <i className="fas fa-lock mr-3 text-blue-600"></i>
                  Segurança
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nova Palavra-passe</label>
                    <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} placeholder="Deixe em branco para não alterar" className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
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
          </>
        )}
      </div>
    </div>
  );
};

export default EditProfile;
