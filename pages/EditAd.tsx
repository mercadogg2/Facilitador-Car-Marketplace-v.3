
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Language, Car } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';

const compressImage = (base64Str: string, maxWidth = 1600, maxHeight = 1600): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
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
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
  });
};

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
    subdomain: '',
    active: true
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
            subdomain: data.subdomain || '',
            active: data.active ?? true
          });
          setImages(data.images || [data.image]);
        }
      } catch (err: any) {
        setError("Falha ao carregar anúncio.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCar();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Fix: Explicitly cast Array.from result to File[] to avoid 'unknown' type issues in forEach
    const files = Array.from(e.target.files || []) as File[];
    if (images.length + files.length > 10) {
      alert("Máximo 10 fotos.");
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
    setIsSubmitting(true);
    setError(null);
    try {
      const updateData = {
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year.toString()),
        category: formData.category,
        mileage: parseInt(formData.mileage) || 0,
        fuel: formData.fuel,
        transmission: formData.transmission,
        price: parseFloat(formData.price.replace(',', '.')) || 0,
        location: formData.location,
        description: formData.description,
        subdomain: formData.subdomain,
        image: images[0],
        images: images,
        active: formData.active
      };
      const { error: updateError } = await supabase.from('cars').update(updateData).eq('id', id);
      if (updateError) throw updateError;
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-bold">A carregar viatura...</div>;

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex justify-between items-center">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Editar Viatura</h1>
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
            <span className={`text-[10px] font-black uppercase tracking-widest ${formData.active ? 'text-green-600' : 'text-gray-400'}`}>
              {formData.active ? 'Público' : 'Oculto'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl font-bold">{error}</div>}

          {/* Galeria */}
          <section className="bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black mb-8 flex items-center">
              <i className="fas fa-images mr-3 text-blue-600"></i>
              Fotos ({images.length}/10)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100">
                  <img src={img} className="w-full h-full object-cover" alt="" />
                  <button type="button" onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center"><i className="fas fa-times"></i></button>
                </div>
              ))}
              {images.length < 10 && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600">
                  <i className="fas fa-plus-circle text-2xl"></i>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" multiple onChange={handleFilesChange} className="hidden" />
          </section>

          {/* Dados Técnicos Replicados da Criação */}
          <section className="bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Marca</label>
                <input required name="brand" value={formData.brand} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Modelo</label>
                <input required name="model" value={formData.model} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ano</label>
                <input required type="number" name="year" value={formData.year} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Preço (€)</label>
                <input required name="price" value={formData.price} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Kilometragem</label>
                <input required type="number" name="mileage" value={formData.mileage} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Localização</label>
                <input required name="location" value={formData.location} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
            </div>
          </section>

          <section className="bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-gray-100">
            <textarea required name="description" value={formData.description} onChange={handleChange} rows={6} className="w-full px-6 py-5 rounded-[30px] bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-none"></textarea>
          </section>

          <button type="submit" disabled={isSubmitting} className="w-full py-7 bg-blue-600 text-white rounded-[35px] font-black text-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
            {isSubmitting ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-save"></i>}
            Guardar Alterações
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditAd;
