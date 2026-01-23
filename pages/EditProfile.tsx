
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
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          navigate('/login');
          return;
        }

        const role = session.user.user_metadata?.role || UserRole.VISITOR;
        setUserRole(role);

        // Buscar dados do perfil na tabela profiles (Fonte da Verdade)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

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
          // Fallback se perfil não existir na tabela
          setFormData(prev => ({
            ...prev,
            name: session.user.user_metadata?.full_name || '',
            email: session.user.email || '',
            stand_name: session.user.user_metadata?.stand_name || ''
          }));
        }
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

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
      if (!session?.user) throw new Error("Sessão inválida.");

      const newSlug = userRole === UserRole.STAND ? slugify(formData.stand_name) : formData.slug;

      // 1. Atualizar Metadados (Para Sessão Atual)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.name,
          stand_name: formData.stand_name,
          profile_image: formData.profile_image,
          slug: newSlug
        },
        password: formData.newPassword || undefined
      });
      if (authError) throw authError;

      // 2. Atualizar Tabela Profiles (Para Páginas Públicas)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          full_name: formData.name,
          phone: formData.phone,
          stand_name: formData.stand_name,
          description: formData.description,
          profile_image: formData.profile_image,
          location: formData.location,
          slug: newSlug,
          email: formData.email
        });

      if (profileError) throw profileError;

      setIsSuccess(true);
      setTimeout(() => {
        if (userRole === UserRole.STAND || userRole === UserRole.ADMIN) navigate('/dashboard');
        else navigate('/cliente');
      }, 2000);

    } catch (err: any) {
      console.error("Erro ao gravar:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">{userRole === UserRole.STAND ? 'Perfil do Stand' : 'Meu Perfil'}</h1>
            <p className="text-gray-500 font-medium">Configure a sua identidade visual e informações públicas.</p>
          </div>
          <button onClick={() => navigate(-1)} className="text-gray-400 font-bold hover:text-blue-600 transition-colors"><i className="fas fa-arrow-left mr-2"></i>{tc.back}</button>
        </header>

        {isSuccess ? (
          <div className="bg-white p-12 rounded-[40px] shadow-2xl text-center animate-in zoom-in">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"><i className="fas fa-check"></i></div>
            <h2 className="text-2xl font-black text-gray-900">{t.success}</h2>
            <p className="text-gray-500 mt-2">Os seus dados foram guardados com sucesso.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm border border-red-100">{error}</div>}

            <section className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-gray-100">
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
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-4">Clique para alterar o logótipo</p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome do Stand</label>
                  <input required name="stand_name" value={formData.stand_name} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Descrição / Bio</label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    rows={5} 
                    placeholder="Fale sobre o seu stand, anos de experiência, especialidades..." 
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Cidade</label>
                  <input name="location" value={formData.location} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Telefone</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
              </div>
            </section>

            <button type="submit" disabled={isSubmitting} className="w-full py-6 bg-blue-600 text-white rounded-[30px] font-black text-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {isSubmitting ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-save"></i>}
              {t.saveChanges}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditProfile;
