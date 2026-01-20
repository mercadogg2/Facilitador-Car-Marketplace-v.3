
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Language, Car } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';

interface EditAdProps {
  lang: Language;
}

const EditAd: React.FC<EditAdProps> = ({ lang }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: 2024,
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
    const fetchCar = async () => {
      try {
        const { data, error: carError } = await supabase.from('cars').select('*').eq('id', id).single();
        if (carError) throw carError;
        if (data) {
          setFormData({
            brand: data.brand,
            model: data.model,
            year: data.year,
            category: data.category,
            mileage: data.mileage.toString(),
            fuel: data.fuel,
            transmission: data.transmission,
            price: data.price.toString(),
            location: data.location,
            description: data.description,
            subdomain: data.subdomain || ''
          });
          setImages(data.images || [data.image]);
        }
      } catch (err: any) {
        setError("Falha ao carregar.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCar();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Higienização para o link personalizado
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
      alert("Limite de 10 fotos.");
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setImages(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updateData = {
        ...formData,
        year: parseInt(formData.year.toString()),
        mileage: parseInt(formData.mileage) || 0,
        price: parseFloat(formData.price.replace(',', '.')) || 0,
        image: images[0],
        images: images,
        subdomain: formData.subdomain
      };
      await supabase.from('cars').update(updateData).eq('id', id);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-bold">Carregando viatura...</div>;

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Editar Viatura</h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
             <h3 className="text-xl font-black mb-8 flex items-center">
              <i className="fas fa-images mr-3 text-blue-600"></i>
              Galeria ({images.length}/10)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                  <img src={img} className="w-full h-full object-cover" alt="" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center"><i className="fas fa-times"></i></button>
                </div>
              ))}
              {images.length < 10 && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-400 transition-all">
                  <i className="fas fa-plus-circle text-2xl"></i>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" multiple onChange={handleFilesChange} className="hidden" />
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Preço (€)</label>
                <input name="price" value={formData.price} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Marca</label>
                <input name="brand" value={formData.brand} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 font-bold" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Descrição</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none resize-none" />
            </div>
          </div>

          {/* Marketing e Link Personalizado */}
          <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-gray-100">
             <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center">
              <i className="fas fa-link mr-3 text-blue-600"></i>
              Link Único do Anúncio
            </h3>
            
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
              <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase">
                Link: <span className="text-gray-900">facilitadorcar.com/#/v/{formData.subdomain || '...'}</span>
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button type="submit" disabled={isSubmitting} className="flex-grow py-6 bg-blue-600 text-white rounded-[30px] font-black text-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
              {isSubmitting ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-save"></i>}
              Guardar Alterações
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className="px-10 py-6 bg-white border border-gray-200 text-gray-500 rounded-[30px] font-bold">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAd;
