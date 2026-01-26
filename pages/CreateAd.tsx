
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Language, UserRole, ProfileStatus } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';

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
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
  });
};

interface CreateAdProps {
  lang: Language;
}

const CreateAd: React.FC<CreateAdProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang].createAd;
  const tc = TRANSLATIONS[lang].common;
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        if (!user) { navigate('/login'); return; }

        const { data: profile } = await supabase
          .from('profiles')
          .select('status, role')
          .eq('id', user.id)
          .single();

        const isAdmin = user.email === 'admin@facilitadorcar.pt' || profile?.role === UserRole.ADMIN;
        
        if (profile?.status !== 'approved' && !isAdmin) {
          alert(lang === 'pt' ? 'Conta em análise.' : 'Account under review.');
          navigate('/dashboard');
          return;
        }
      } catch (e) {
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [navigate, lang]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Fix: Explicitly cast Array.from result to File[] to avoid 'unknown' type issues in forEach
    const files = Array.from(e.target.files || []) as File[];
    if (images.length + files.length > 10) {
      alert(lang === 'pt' ? 'Máximo 10 fotos.' : 'Max 10 photos.');
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setImages(prev => [...prev, compressed]);
      };
      // Fix: 'file' is now guaranteed to be a File (which is a Blob)
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      setError(lang === 'pt' ? 'Adicione pelo menos uma foto.' : 'Add at least one photo.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");
      
      const { data: profile } = await supabase.from('profiles').select('stand_name').eq('id', user.id).single();

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
        subdomain: formData.subdomain || `${formData.brand}-${formData.model}-${Date.now()}`.toLowerCase().replace(/\s+/g, '-'),
        image: images[0],
        images: images,
        stand_name: profile?.stand_name || user.user_metadata?.stand_name || 'Particular',
        user_id: user.id,
        verified: false,
        active: true
      };

      const { error: insertError } = await supabase.from('cars').insert([carData]);
      if (insertError) throw insertError;

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">{t.title}</h1>
          <p className="text-gray-500 font-medium">{t.subtitle}</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm border border-red-100">{error}</div>}

          {/* Galeria */}
          <section className="bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center">
              <i className="fas fa-images mr-3 text-blue-600"></i>
              Galeria de Fotos ({images.length}/10)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100">
                  <img src={img} className="w-full h-full object-cover" alt="" />
                  <button type="button" onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg"><i className="fas fa-times"></i></button>
                </div>
              ))}
              {images.length < 10 && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-all text-gray-400 hover:text-blue-600">
                  <i className="fas fa-plus-circle text-2xl"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">Fotos</span>
                </button>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFilesChange} accept="image/*" multiple className="hidden" />
          </section>

          {/* Dados Principais */}
          <section className="bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center">
              <i className="fas fa-info-circle mr-3 text-blue-600"></i>
              Informações Gerais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Marca</label>
                <input required name="brand" value={formData.brand} onChange={handleChange} placeholder="Ex: BMW" className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Modelo</label>
                <input required name="model" value={formData.model} onChange={handleChange} placeholder="Ex: Série 3" className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Ano</label>
                <input required type="number" name="year" value={formData.year} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Preço (€)</label>
                <input required name="price" value={formData.price} onChange={handleChange} placeholder="0.00" className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600" />
              </div>
            </div>
          </section>

          {/* Especificações Técnicas */}
          <section className="bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center">
              <i className="fas fa-tools mr-3 text-blue-600"></i>
              Ficha Técnica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Kilometragem</label>
                <input required type="number" name="mileage" value={formData.mileage} onChange={handleChange} placeholder="Km atuais" className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Localização</label>
                <input required name="location" value={formData.location} onChange={handleChange} placeholder="Cidade, Distrito" className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Combustível</label>
                <select name="fuel" value={formData.fuel} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold">
                  <option value="Gasolina">Gasolina</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Híbrido">Híbrido</option>
                  <option value="Elétrico">Elétrico</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Transmissão</label>
                <select name="transmission" value={formData.transmission} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold">
                  <option value="Manual">Manual</option>
                  <option value="Automático">Automático</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Categoria</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold">
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Coupe">Coupe</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Utilitário">Utilitário</option>
                </select>
              </div>
            </div>
          </section>

          {/* Descrição */}
          <section className="bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center">
              <i className="fas fa-align-left mr-3 text-blue-600"></i>
              Descrição Detalhada
            </h3>
            <textarea required name="description" value={formData.description} onChange={handleChange} rows={6} placeholder="Descreva o estado do veículo, revisões e extras..." className="w-full px-6 py-5 rounded-[30px] bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-none"></textarea>
          </section>

          <button type="submit" disabled={isSubmitting} className="w-full py-7 bg-blue-600 text-white rounded-[35px] font-black text-2xl shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 disabled:opacity-50">
            {isSubmitting ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-plus-circle"></i>}
            {isSubmitting ? 'A publicar...' : 'Publicar Viatura'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAd;
