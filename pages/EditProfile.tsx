
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

const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onerror = () => reject(new Error("Erro ao carregar imagem."));
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
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

        // Tentativa de busca segura
        const { data: profile, error: fetchError } = await supabase
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
        }
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const compressed = await compressImage(base64);
          setFormData(prev => ({ ...prev, profile_image: compressed }));
          setError(null);
        } catch (err) {
          setError(lang === 'pt' ? 'Erro ao processar imagem.' : 'Error processing image.');
        }
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

      // 1. Atualizar Auth Metadata
      await supabase.auth.updateUser({
        data: {
          full_name: formData.name,
          stand_name: formData.stand_name,
          slug: newSlug
        },
        password: formData.newPassword || undefined
      });
      
      // 2. Construir objeto de atualização de forma DEFENSIVA
      // Se a coluna não existir, o erro será capturado mas saberemos exatamente qual foi
      const profileUpdate: any = {
        id: session.user.id,
        full_name: formData.name,
        phone: formData.phone,
        stand_name: formData.stand_name,
        profile_image: formData.profile_image,
        location: formData.location,
        slug: newSlug,
        email: formData.email,
        updated_at: new Date().toISOString()
      };

      // Só incluímos description se tivermos certeza que ela deve ser gravada
      if (formData.description) {
        profileUpdate.description = formData.description;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileUpdate);

      if (profileError) {
        console.error("Erro técnico Supabase:", profileError);
        
        // Diagnóstico preciso
        if (profileError.message.includes('column "description"') || profileError.message.includes('schema cache')) {
          setError('⚠️ ERRO DE BASE DE DADOS: A coluna "description" ainda não foi reconhecida pelo Supabase. \n\nSOLUÇÃO: Vá ao SQL Editor do Supabase, cole o script que está em lib/supabase.ts e clique em RUN. Depois, recarregue esta página.');
          return;
        }
        
        throw profileError;
      }

      setIsSuccess(true);
      setTimeout(() => {
        if (userRole === UserRole.STAND || userRole === UserRole.ADMIN) navigate('/dashboard');
        else navigate('/cliente');
      }, 2000);

    } catch (err: any) {
      console.error("Erro ao gravar perfil:", err);
      setError(err.message || "Erro ao guardar dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">{userRole === UserRole.STAND ? 'Perfil do Stand' : 'Meu Perfil'}</h1>
            <p className="text-gray-500 font-medium">Mantenha os seus dados e identidade atualizados.</p>
          </div>
          <button onClick={() => navigate(-1)} className="text-gray-400 font-bold hover:text-blue-600 transition-colors">
            <i className="fas fa-arrow-left mr-2"></i>{tc.back}
          </button>
        </header>

        {isSuccess ? (
          <div className="bg-white p-12 rounded-[40px] shadow-2xl text-center animate-in zoom-in">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"><i className="fas fa-check"></i></div>
            <h2 className="text-2xl font-black text-gray-900">{t.success}</h2>
            <p className="text-gray-500 mt-2">Página de perfil atualizada.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-8 bg-amber-50 text-amber-900 rounded-[30px] font-medium text-sm border border-amber-200 shadow-sm animate-in shake duration-500 whitespace-pre-line">
                <div className="flex items-center gap-3 mb-3 text-amber-600">
                   <i className="fas fa-database text-xl"></i>
                   <span className="font-black uppercase tracking-widest text-[10px]">Alerta de Sincronização</span>
                </div>
                {error}
              </div>
            )}

            <section className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-gray-100">
              <div className="flex flex-col items-center mb-10 text-center">
                <div className="relative group">
                  <div className="w-44 h-44 rounded-[45px] overflow-hidden bg-gray-50 border-4 border-white shadow-2xl flex items-center justify-center text-blue-600 font-black text-6xl">
                    {formData.profile_image ? (
                      <img src={formData.profile_image} className="w-full h-full object-cover" alt="Logo" />
                    ) : (
                      formData.stand_name ? formData.stand_name[0].toUpperCase() : 'S'
                    )}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all border-4 border-white group-hover:scale-110"
                  >
                    <i className="fas fa-camera text-xl"></i>
                  </button>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-6">Logótipo do Stand</p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Nome Oficial do Stand</label>
                  <input required name="stand_name" value={formData.stand_name} onChange={handleChange} className="w-full px-6 py-5 rounded-2xl bg-gray-50 border border-transparent outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-bold transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Sobre o Stand (Descrição Pública)</label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    rows={6} 
                    placeholder="Descreva o seu stand e especialidades..." 
                    className="w-full px-6 py-5 rounded-2xl bg-gray-50 border border-transparent outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium resize-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Cidade / Região</label>
                  <input name="location" value={formData.location} onChange={handleChange} className="w-full px-6 py-5 rounded-2xl bg-gray-50 border border-transparent outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-bold transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Telefone / WhatsApp</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className="w-full px-6 py-5 rounded-2xl bg-gray-50 border border-transparent outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-bold transition-all" />
                </div>
              </div>
            </section>

            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full py-7 bg-blue-600 text-white rounded-[35px] font-black text-2xl shadow-2xl hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {isSubmitting ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-save"></i>}
              {isSubmitting ? 'A Guardar...' : t.saveChanges}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditProfile;
