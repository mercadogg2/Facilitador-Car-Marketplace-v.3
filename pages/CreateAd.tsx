
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Language, UserRole, ProfileStatus } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';

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

        // Admin tem bypass, mas Stand precisa de status 'approved'
        const isAdmin = user.email === 'admin@facilitadorcar.pt' || profile?.role === UserRole.ADMIN;
        
        if (profile?.status !== 'approved' && !isAdmin) {
          alert(lang === 'pt' 
            ? 'Infelizmente, o seu acesso de stand profissional ainda não foi aprovado. Contacte o suporte para habilitar a criação de anúncios.' 
            : 'Unfortunately, your stand account is not yet approved. Please contact support.');
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
      const sanitized = value
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
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
      if (file.size > 2 * 1024 * 1024) {
        setError(lang === 'pt' ? 'Cada imagem deve ter menos de 2MB.' : 'Each image must be under 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    setError(null);
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
        active: true // Importante: Garante que o anúncio seja criado visível
      };

      const { error: insertError } = await supabase.from('cars').insert([carData]);
      if (insertError) throw insertError;

      setIsSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-12 rounded-[40px] shadow-2xl text-center max-w-md w-full animate-in zoom-in">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            <i className="fas fa-check"></i>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">{t.success}</h2>
          <p className="text-gray-500 font-medium">Anúncio publicado e pronto a receber leads.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">{t.title}</h1>
          <p className="text-lg text-gray-500 font-medium">{t.subtitle}</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm border border-red-100">{error}</div>}

          {/* Galeria */}
          <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center">
              <i className="fas fa-images mr-3 text-blue-600"></i>
              Galeria de Fotos ({images.length}/10)
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                  <img src={img} className="w-full h-full object-cover" alt="" />
                  <button 
                    type="button" 
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                  {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-[8px] text-white text-center py-1 font-black uppercase tracking-widest">Capa</div>}
                </div>
              ))}
              
              {images.length < 10 && (
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-all text-gray-400 hover:text-blue-600"
                >
                  <i className="fas fa-plus-circle text-2xl"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">Adicionar</span>
                </button>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFilesChange} 
              accept="image/*" 
              multiple 
              className="hidden" 
            />
          </div>

          {/* Informação Geral */}
          <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-gray-100">
             <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center">
              <i className="fas fa-car mr-3 text-blue-600"></i>
              Informação Geral
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Preço (€)</label>
                <input required name="price" value={formData.price} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Marca</label>
                <input required name="brand" value={formData.brand} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder="Ex: Audi" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Modelo</label>
                <input required name="model" value={formData.model} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder="Ex: A3" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Cidade</label>
                <input required name="location" value={formData.location} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder="Ex: Porto" />
              </div>
            </div>
          </div>

          {/* Detalhes Técnicos */}
          <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-gray-100">
             <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center">
              <i className="fas fa-tools mr-3 text-blue-600"></i>
              Detalhes Técnicos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Ano</label>
                <input required type="number" name="year" value={formData.year} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Quilometragem (KM)</label>
                <input required type="number" name="mileage" value={formData.mileage} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder="Ex: 50000" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Categoria</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold appearance-none">
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Coupe">Coupe</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Utilitário">Utilitário</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Combustível</label>
                <select name="fuel" value={formData.fuel} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold appearance-none">
                  <option value="Gasolina">Gasolina</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Elétrico">Elétrico</option>
                  <option value="Híbrido">Híbrido</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Transmissão</label>
                <select name="transmission" value={formData.transmission} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold appearance-none">
                  <option value="Automático">Automático</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-gray-100">
             <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center">
              <i className="fas fa-align-left mr-3 text-blue-600"></i>
              Descrição Detalhada
            </h3>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              rows={6} 
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-none" 
              placeholder="Descreva o estado do veículo, extras, revisões..."
            />
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-gray-100">
             <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center">
              <i className="fas fa-link mr-3 text-blue-600"></i>
              Link Único do Anúncio
            </h3>
            <p className="text-sm text-gray-400 font-medium mb-8">Crie uma URL exclusiva para partilhar o veículo diretamente.</p>
            
            <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Slug do Link</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-bold text-sm hidden md:inline">facilitadorcar.com/#/v/</span>
                <input 
                  name="subdomain" 
                  value={formData.subdomain} 
                  onChange={handleChange} 
                  placeholder="ex: bmw-m3-sport-2024"
                  className="flex-grow bg-white px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-6 bg-blue-600 text-white rounded-[30px] font-black text-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSubmitting ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-rocket"></i>}
            {t.publish}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAd;
