
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Language, Car } from '../types';
import { TRANSLATIONS } from '../constants';
import LeadForm from '../components/LeadForm';
import CarCard from '../components/CarCard';
import { supabase } from '../lib/supabase';
import { slugify, formatCurrency } from '../lib/utils';

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
      if (!id) return;
      setLoading(true);
      window.scrollTo(0, 0);
      
      try {
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('id', id)
          .eq('active', true)
          .single();
        
        if (!error && data) {
          setCar(data);
          setActiveImage(0);

          // Tenta incrementar via RPC, se falhar usa update normal (Fallback seguro)
          try {
            const { error: rpcError } = await supabase.rpc('increment_car_views', { car_id: id });
            if (rpcError) {
              await supabase.from('cars').update({ views: (data.views || 0) + 1 }).eq('id', id);
            }
          } catch (rpcCatch) {
            await supabase.from('cars').update({ views: (data.views || 0) + 1 }).eq('id', id);
          }
          
          const { data: related } = await supabase
            .from('cars')
            .select('*')
            .eq('category', data.category)
            .eq('active', true)
            .neq('id', data.id)
            .limit(3);
          
          if (related) setRelatedCars(related);
        }
      } catch (err) {
        console.error("Erro ao carregar detalhes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">A carregar viatura...</p>
        </div>
      </div>
    );
  }

  if (!car) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-20 text-center gap-6">
      <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-3xl shadow-inner">
        <i className="fas fa-eye-slash"></i>
      </div>
      <div>
        <h2 className="text-2xl font-black text-gray-900">Viatura Indisponível</h2>
        <p className="text-gray-500 mt-2">Este anúncio foi removido ou está temporariamente oculto pelo stand.</p>
      </div>
      <Link to="/veiculos" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-100 transition-all hover:scale-105">
        {tc.back} aos Veículos
      </Link>
    </div>
  );

  const isFavorite = favorites.includes(car.id);
  const gallery = car.images && car.images.length > 0 ? car.images : [car.image];
  const standSlug = car.stand_slug || (car.stand_name ? slugify(car.stand_name) : '');

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center text-sm text-gray-500 font-medium">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <i className="fas fa-chevron-right mx-3 text-[10px] opacity-30"></i>
          <Link to="/veiculos" className="hover:text-blue-600 transition-colors">{tc.found}</Link>
          <i className="fas fa-chevron-right mx-3 text-[10px] opacity-30"></i>
          <span className="text-gray-900 font-bold">{car.brand} {car.model}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-10">
            <div className="space-y-6">
              <div className="relative rounded-[50px] overflow-hidden shadow-2xl bg-gray-100 group border border-gray-100">
                <img 
                  src={gallery[activeImage]} 
                  alt={car.brand} 
                  className="w-full aspect-[16/10] object-cover animate-in fade-in duration-700" 
                />
                
                {gallery.length > 1 && (
                  <>
                    <button 
                      onClick={() => setActiveImage(prev => prev === 0 ? gallery.length - 1 : prev - 1)}
                      className="absolute left-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-900 shadow-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <button 
                      onClick={() => setActiveImage(prev => (prev + 1) % gallery.length)}
                      className="absolute right-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-900 shadow-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </>
                )}

                <button 
                  onClick={() => onToggleFavorite(car.id)}
                  className={`absolute top-8 right-8 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-md transition-all active:scale-90 ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600 hover:bg-white'}`}
                >
                  <i className={`${isFavorite ? 'fas' : 'far'} fa-heart text-2xl`}></i>
                </button>
                
                <div className="absolute bottom-8 right-10 bg-black/60 backdrop-blur-md text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                  {activeImage + 1} / {gallery.length}
                </div>
              </div>

              {gallery.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {gallery.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative shrink-0 w-28 aspect-square rounded-[25px] overflow-hidden border-4 transition-all ${activeImage === idx ? 'border-blue-600 shadow-xl scale-95' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={img} className="w-full h-full object-cover" alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: tc.year, value: car.year, icon: 'fa-calendar' },
                { label: tc.km, value: `${car.mileage.toLocaleString()} km`, icon: 'fa-road' },
                { label: tc.fuel, value: car.fuel, icon: 'fa-gas-pump' },
                { label: car.transmission, icon: 'fa-cog' }
              ].map((stat, i) => (
                <div key={i} className="bg-gray-50 p-8 rounded-[35px] border border-gray-100 text-center transition-all hover:bg-white hover:shadow-lg group">
                  <i className={`fas ${stat.icon} text-blue-600 mb-4 text-xl group-hover:scale-110 transition-transform`}></i>
                  <p className="font-black text-gray-900 text-sm tracking-tight">{stat.value || stat.label}</p>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{stat.label === car.transmission ? 'Transmissão' : stat.label}</p>
                </div>
              ))}
            </div>

            <section className="space-y-6 bg-gray-50 p-10 rounded-[50px] border border-gray-100">
              <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
                {t.description}
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line font-medium">
                {car.description || "Este stand não forneceu uma descrição detalhada para esta viatura."}
              </p>
            </section>
          </div>

          <aside className="space-y-8">
            <div className="sticky top-28 space-y-8">
              <div className="space-y-4">
                {car.reference_code && (
                  <span className="inline-block bg-blue-100 text-blue-700 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-200">
                    REF: {car.reference_code}
                  </span>
                )}
                <h1 className="text-4xl font-black text-gray-900 leading-tight tracking-tight">{car.brand} {car.model}</h1>
                <div className="text-5xl font-black text-blue-600 tracking-tighter">
                  {formatCurrency(car.price, lang)}
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-blue-50/50 border border-gray-100 space-y-6">
                <button 
                  onClick={() => setContactingCar(car)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-[25px] transition-all shadow-xl shadow-blue-200 flex items-center justify-center text-lg gap-3 group active:scale-95"
                >
                  <i className="fas fa-paper-plane group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"></i>
                  {tc.contact}
                </button>
                
                <p className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-widest">
                  Processado pela equipa Facilitador Car
                </p>
              </div>

              <Link to={`/${standSlug}`} className="bg-gray-900 p-8 rounded-[40px] shadow-2xl block hover:bg-black transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform"></div>
                <div className="relative z-10 flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                    {car.stand_name?.[0]}
                  </div>
                  <div>
                    <p className="font-black text-white text-lg">{car.stand_name}</p>
                    <div className="flex items-center gap-2 text-blue-400">
                      <i className="fas fa-check-circle text-xs"></i>
                      <p className="text-[10px] font-black uppercase tracking-widest">Stand Certificado</p>
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-gray-700 ml-auto group-hover:text-white transition-colors"></i>
                </div>
              </Link>

              <div className="bg-blue-50 p-8 rounded-[40px] border border-blue-100">
                 <h4 className="font-black text-blue-900 text-xs uppercase tracking-widest mb-3">Garantia Facilitador</h4>
                 <p className="text-blue-700 text-sm font-medium leading-relaxed">
                   Todas as viaturas apresentadas passam por um rigoroso filtro de credibilidade. Compre com confiança.
                 </p>
              </div>
            </div>
          </aside>
        </div>

        {relatedCars.length > 0 && (
          <section className="mt-32 pt-20 border-t border-gray-100">
            <h3 className="text-3xl font-black text-gray-900 mb-12 tracking-tight">{t.relatedTitle}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
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
