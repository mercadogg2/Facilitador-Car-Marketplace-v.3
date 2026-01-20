
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Language, Car } from '../types';
import { TRANSLATIONS } from '../constants';
import LeadForm from '../components/LeadForm';
import CarCard from '../components/CarCard';
import { supabase } from '../lib/supabase';

interface CarDetailProps {
  lang: Language;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
}

const CarDetail: React.FC<CarDetailProps> = ({ lang, onToggleFavorite, favorites }) => {
  const { id } = useParams<{ id: string }>();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactingCar, setContactingCar] = useState<Car | null>(null);
  const [relatedCars, setRelatedCars] = useState<Car[]>([]);
  
  const [activeImage, setActiveImage] = useState(0);
  
  const t = TRANSLATIONS[lang].detail;
  const tc = TRANSLATIONS[lang].common;

  useEffect(() => {
    const fetchCar = async () => {
      setLoading(true);
      window.scrollTo(0, 0);
      
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        setCar(data);
        setActiveImage(0);
        
        // Buscar relacionados
        const { data: related } = await supabase
          .from('cars')
          .select('*')
          .eq('category', data.category)
          .neq('id', data.id)
          .limit(3);
        
        if (related) setRelatedCars(related);
      }
      setLoading(false);
    };

    if (id) fetchCar();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!car) return <div className="p-20 text-center">Viatura não encontrada.</div>;

  const isFavorite = favorites.includes(car.id);
  const gallery = car.images && car.images.length > 0 ? car.images : [car.image];

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center text-sm text-gray-500">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <i className="fas fa-chevron-right mx-3 text-[10px]"></i>
          <Link to="/veiculos" className="hover:text-blue-600 transition-colors">{tc.found}</Link>
          <i className="fas fa-chevron-right mx-3 text-[10px]"></i>
          <span className="text-gray-900 font-medium">{car.brand} {car.model}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            {/* Galeria Principal */}
            <div className="space-y-4">
              <div className="relative rounded-[40px] overflow-hidden shadow-2xl bg-gray-100 group">
                <img 
                  src={gallery[activeImage]} 
                  alt={car.brand} 
                  className="w-full aspect-[16/10] object-cover animate-in fade-in duration-500" 
                />
                
                {/* Controles de Navegação */}
                {gallery.length > 1 && (
                  <>
                    <button 
                      onClick={() => setActiveImage(prev => prev === 0 ? gallery.length - 1 : prev - 1)}
                      className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-900 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <button 
                      onClick={() => setActiveImage(prev => (prev + 1) % gallery.length)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-900 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </>
                )}

                <button 
                  onClick={() => onToggleFavorite(car.id)}
                  className={`absolute top-8 right-8 w-14 h-14 rounded-full flex items-center justify-center shadow-xl backdrop-blur-md transition-all ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600 hover:bg-white'}`}
                >
                  <i className={`${isFavorite ? 'fas' : 'far'} fa-heart text-xl`}></i>
                </button>
                
                <div className="absolute bottom-6 right-8 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {activeImage + 1} / {gallery.length}
                </div>
              </div>

              {/* Thumbnails */}
              {gallery.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                  {gallery.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative shrink-0 w-24 aspect-square rounded-2xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-blue-600 shadow-lg scale-95' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={img} className="w-full h-full object-cover" alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
              {[
                { label: tc.year, value: car.year, icon: 'fa-calendar' },
                { label: tc.km, value: `${car.mileage.toLocaleString()} km`, icon: 'fa-road' },
                { label: tc.fuel, value: car.fuel, icon: 'fa-gas-pump' },
                { label: car.transmission, icon: 'fa-cog' }
              ].map((stat, i) => (
                <div key={i} className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center">
                  <i className={`fas ${stat.icon} text-blue-600 mb-3 text-lg`}></i>
                  <p className="font-bold text-gray-900">{stat.value || stat.label}</p>
                </div>
              ))}
            </div>

            <section className="space-y-6 py-8">
              <h3 className="text-2xl font-bold text-gray-900">{t.description}</h3>
              <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">{car.description}</p>
            </section>
          </div>

          <aside className="space-y-8">
            <div className="sticky top-28 space-y-8">
              <div className="space-y-2">
                <h1 className="text-4xl font-extrabold text-gray-900">{car.brand} {car.model}</h1>
                <div className="text-4xl font-black text-blue-600">
                  {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(car.price)}
                </div>
              </div>

              <button 
                onClick={() => setContactingCar(car)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-blue-200 flex items-center justify-center text-lg group"
              >
                <i className="fab fa-whatsapp mr-3 text-2xl group-hover:scale-110 transition-transform"></i>
                {tc.contact}
              </button>

              <Link to={`/stand/${encodeURIComponent(car.stand_name)}`} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 block hover:border-blue-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-xl font-bold">{car.stand_name?.[0]}</div>
                  <div>
                    <p className="font-extrabold text-gray-900">{car.stand_name}</p>
                    <p className="text-sm text-gray-400"><i className="fas fa-map-marker-alt mr-1"></i>{car.location}</p>
                  </div>
                </div>
              </Link>
            </div>
          </aside>
        </div>

        {relatedCars.length > 0 && (
          <section className="mt-24">
            <h3 className="text-3xl font-bold text-gray-900 mb-12">{t.relatedTitle}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedCars.map(c => (
                <CarCard key={c.id} car={c} lang={lang} onToggleFavorite={onToggleFavorite} isFavorite={favorites.includes(c.id)} onSelect={setContactingCar} />
              ))}
            </div>
          </section>
        )}
      </div>

      {contactingCar && <LeadForm car={contactingCar} lang={lang} onClose={() => setContactingCar(null)} />}
    </div>
  );
};

export default CarDetail;
