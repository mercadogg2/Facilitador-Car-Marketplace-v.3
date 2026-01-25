
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
    profile_image: '',
    slug: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { navigate('/login'); return; }

        setUserRole(session.user.user_metadata?.role || UserRole.VISITOR);

        // Busca defensiva de colunas
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
            description: (profile as any).description || '',
            profile_image: (profile as any).profile_image || '',
            slug: profile.slug || ''
          });
        }
      } catch (err) {
        console.error("Erro no carregamento:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão inválida.");

      const newSlug = userRole === UserRole.STAND ? slugify(formData.stand_name) : formData.slug;

      await supabase.auth.updateUser({
        data: { full_name: formData.name, stand_name: formData.stand_name, slug: newSlug }
      });
      
      const payload: any = {
        id: session.user.id,
        full_name: formData.name,
        phone: formData.phone,
        stand_name: formData.stand_name,
        description: formData.description,
        profile_image: formData.profile_image,
        location: formData.location,
        slug: newSlug,
        email: formData.email,
        updated_at: new Date().toISOString()
      };

      // TENTATIVA 1: Upsert completo
      const { error: profileError } = await supabase.from('profiles').upsert(payload);

      if (profileError) {
        console.warn("Falha no salvamento completo, tentando modo de compatibilidade...", profileError.message);
        
        // TENTATIVA 2: Se falhar por causa de colunas novas (description ou updated_at), removemos e tentamos o básico
        const { description, profile_image, updated_at, ...safePayload } = payload;
        const { error: secondTryError } = await supabase.from('profiles').upsert(safePayload);
        
        if (secondTryError) throw secondTryError;

        setError('⚠️ O perfil foi guardado parcialmente. Algumas funcionalidades novas (Descrição/Data) requerem que execute o script SQL de reparação no painel administrativo.');
        setIsSuccess(true);
      } else {
        setIsSuccess(true);
      }

      if (isSuccess || !profileError) {
        setTimeout(() => {
          if (userRole === UserRole.STAND || userRole === UserRole.ADMIN) navigate('/dashboard');
          else navigate('/cliente');
        }, 3500);
      }

    } catch (err: any) {
      setError(err.message || "Erro ao guardar dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string);
          setFormData(prev => ({ ...prev, profile_image: compressed }));
        } catch (err) { setError('Erro ao processar imagem.'); }
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">Definições de Perfil</h1>
            <p className="text-gray-500 font-medium">Mantenha os seus dados atualizados.</p>
          </div>
          <button onClick={() => navigate(-1)} className="text-gray-400 font-bold hover:text-blue-600 transition-colors">
            <i className="fas fa-arrow-left mr-2"></i>{tc.back}
          </button>
        </header>

        {isSuccess && !error ? (
          <div className="bg-white p-12 rounded-[40px] shadow-2xl text-center animate-in zoom-in">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"><i className="fas fa-check"></i></div>
            <h2 className="text-2xl font-black text-gray-900">Perfil Atualizado!</h2>
            <p className="text-gray-500 mt-2">Redirecionando para o seu painel...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-8 bg-amber-50 text-amber-900 rounded-[30px] font-medium text-sm border border-amber-200 shadow-sm whitespace-pre-line animate-in shake">
                <div className="flex items-center gap-3 mb-2 text-amber-600 font-black uppercase tracking-widest text-[10px]">
                  <i className="fas fa-database"></i> Problema de Sincronização
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
                      formData.stand_name ? formData.stand_name[0].toUpperCase() : (formData.name ? formData.name[0].toUpperCase() : 'U')
                    )}
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white hover:scale-110 transition-transform">
                    <i className="fas fa-camera text-xl"></i>
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Nome Completo / Stand</label>
                  <input required value={formData.stand_name || formData.name} onChange={(e) => setFormData({...formData, stand_name: e.target.value, name: e.target.value})} className="w-full px-6 py-5 rounded-2xl bg-gray-50 border border-transparent outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Descrição (Bio)</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={4} className="w-full px-6 py-5 rounded-2xl bg-gray-50 border border-transparent outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Cidade</label>
                  <input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-6 py-5 rounded-2xl bg-gray-50 border border-transparent outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Telemóvel</label>
                  <input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-6 py-5 rounded-2xl bg-gray-50 border border-transparent outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
              </div>
            </section>

            <button type="submit" disabled={isSubmitting} className="w-full py-7 bg-blue-600 text-white rounded-[35px] font-black text-2xl shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 disabled:opacity-50">
              {isSubmitting ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-save"></i>}
              {isSubmitting ? 'A Sincronizar...' : 'Guardar Alterações'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditProfile;
