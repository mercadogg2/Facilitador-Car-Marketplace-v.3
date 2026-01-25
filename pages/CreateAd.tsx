
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Language, UserRole, ProfileStatus } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';

// Função otimizada para fotos de veículos
const compressImage = (base64Str: string, maxWidth = 1280, maxHeight = 1280): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onerror = () => reject(new Error("Erro ao carregar ficheiro."));
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
      // JPEG 0.75 garante ótima qualidade e ficheiros leves (essencial para múltiplos uploads)
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
  });
};

interface CreateAdProps {
  lang: Language;
}

const CreateAd: React.FC<CreateAdProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang].createAd;
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    category: 'Sedan' as any,
    mileage: '',
    fuel: 'Gasolina' as any,
    transmission: 'Automático' as any,
    price: '',
    location: '',
    description: '',
    subdomain: ''
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('status, role')
          .eq('id', user.id)
          .single();

        const isAdmin = user.email === 'admin@facilitadorcar.pt' || profile?.role === UserRole.ADMIN;
        
        if (profile?.status !== 'approved' && !isAdmin) {
          alert(lang === 'pt' 
            ? 'Infelizmente, o seu acesso de stand profissional ainda não foi aprovado.' 
            : 'Unfortunately, your stand account is not yet approved.');
          navigate('/dashboard');
          return;
        }
      } catch (e) {
        console.error("Status check error", e);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [navigate, lang]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'subdomain') {
      const sanitized = value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      setFormData(prev => ({ ...prev, [name]: sanitized }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    if (images.length + files.length > 10) {
      alert(lang === 'pt' ? 'Limite máximo de 10 imagens.' : 'Maximum limit of 10 images.');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const compressed = await compressImage(base64);
          setImages(prev => [...prev, compressed]);
          setError(null);
        } catch (err) {
          console.error("Erro no processamento da foto:", err);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      setError(lang === 'pt' ? 'Carregue pelo menos uma foto.' : 'Upload at least one photo.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");
      
      const carData = {
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year.toString()),
        category: formData.category,
        mileage: parseInt(formData.mileage.toString()) || 0,
        fuel: formData.fuel,
        transmission: formData.transmission,
        price: parseFloat(formData.price.replace(',', '.')) || 0,
        location: formData.location,
        description: formData.description,
        subdomain: formData.subdomain,
        image: images[0],
        images: images,
        stand_name: user.user_metadata?.stand_name || 'Particular',
        user_id: user.id,
        verified: false,
        active: true
      };

      const { error: insertError } = await supabase.from('cars').insert([carData]);
      if (insertError) throw insertError;

      setIsSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError(lang === 'pt' 
          ? 'Erro de rede: O conjunto de fotos é demasiado pesado. Tente remover algumas fotos ou carregue imagens menores.' 
          : 'Network error: The photo set is too heavy. Try removing some photos or upload smaller images.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">{t.title}</h1>
          <p className="text-lg text-gray-500 font-medium">As fotos serão otimizadas para garantir a estabilidade da publicação.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm border border-red-100">{error}</div>}

          <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center">
              <i className="fas fa-images mr-3 text-blue-600"></i>
              Galeria de Fotos ({images.length}/10)
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                  <img src={img} className="w-full h-full object-cover" alt="" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg"><i className="fas fa-times"></i></button>
                </div>
              ))}
              {images.length < 10 && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-all text-gray-400 hover:text-blue-600">
                  <i className="fas fa-plus-circle text-2xl"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">Adicionar</span>
                </button>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFilesChange} accept="image/*" multiple className="hidden" />
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Preço (€)</label>
                <input required name="price" value={formData.price} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Marca</label>
                <input required name="brand" value={formData.brand} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder="Ex: Audi" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-6 bg-blue-600 text-white rounded-[30px] font-black text-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
            {isSubmitting ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-rocket"></i>}
            {t.publish}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAd;
