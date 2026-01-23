
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Language, Car, UserProfile } from '../types';
import { TRANSLATIONS } from '../constants';
import CarCard from '../components/CarCard';
import LeadForm from '../components/LeadForm';
import { supabase } from '../lib/supabase';

interface StandDetailProps {
  lang: Language;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
}

const StandDetail: React.FC<StandDetailProps> = ({ lang, onToggleFavorite, favorites }) => {
  const { slug } = useParams<{ slug: string }>();
  const [cars, setCars] = useState<Car[]>([]);
  const [standProfile, setStandProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  
  const t = TRANSLATIONS[lang].standDetail;
  const tc = TRANSLATIONS[lang].common;

  useEffect(() => {
    const fetchStandData = async () => {
      if (!slug) return;
      setLoading(true);
      window.scrollTo(0, 0);
      
      try {
        // 1. Tentar procurar pelo slug exato
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('slug', slug)
          .single();
        
        if (profileError || !profileData) {
          // 2. Fallback: procurar pelo nome se o slug falhar
          const { data: fallbackData } = await supabase
            .from('profiles')
            .select('*')
            .ilike('stand_name', slug.replace(/-/g, ' '))
            .single();
          
          if (fallbackData) {
            setStandProfile(fallbackData);
            await fetchCars(fallbackData.stand_name || '');
          }
        } else {
          setStandProfile(profileData);
          await fetchCars(profileData.stand_name || '');
        }
      } catch (err) {
        console.error("Erro ao buscar dados do stand:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchCars = async (name: string) => {
      const { data: carsData } = await supabase
        .from('cars')
        .select('*')
        .eq('stand_name', name)
        .eq('active', true);
      if (carsData) setCars(carsData);
    };

    fetchStandData();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!standProfile) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <div className="w-20 h-20 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center mb-6 text-3xl">
        <i className="fas fa-store-slash"></i>
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Stand não encontrado</h2>
      <p className="text-gray-500 mb-8">Pode ter alterado o nome ou o link de acesso.</p>
      <Link to="/stands" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all">Ver todos os Stands</Link>
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
          <Link to="/" className="hover:text-blue-600 transition-colors">Início</Link>
          <i className="fas fa-chevron-right mx-3 text-[8px]"></i>
          <Link to="/stands" className="hover:text-blue-600 transition-colors">Stands</Link>
          <i className="fas fa-chevron-right mx-3 text-[8px]"></i>
          <span className="text-blue-600">{standProfile.stand_name}</span>
        </div>
      </div>

      <section className="bg-gray-900 text-white py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 grayscale">
          <img src="https://images.unsplash.com/photo-1562141989-c5c79ac8f576?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover" alt="Background" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            {/* LOGÓTIPO */}
            <div className="w-40 h-40 md:w-52 md:h-52 bg-blue-600 rounded-[50px] flex items-center justify-center text-6xl md:text-7xl font-black shadow-2xl overflow-hidden border-8 border-white/10 shrink-0">
              {standProfile.profile_image ? (
                <img src={standProfile.profile_image} className="w-full h-full object-cover" alt="Stand Logo" />
              ) : (
                standProfile.stand_name?.[0]
              )}
            </div>
            
            <div className="text-center md:text-left space-y-6 flex-grow">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">{standProfile.stand_name}</h1>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-8">
                <div className="bg-blue-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                  <i className="fas fa-check-circle"></i> {lang === 'pt' ? 'STAND VERIFICADO' : 'VERIFIED DEALER'}
                </div>
                <div className="flex items-center gap-8 text-gray-400 font-bold text-xs uppercase tracking-widest">
                  <span className="flex items-center gap-2"><i className="fas fa-map-marker-alt text-blue-400"></i>{standProfile.location || 'Portugal'}</span>
                  <span className="flex items-center gap-2"><i className="fas fa-car text-blue-400"></i>{cars.length} Viaturas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DESCRIÇÃO DO STAND - VISIBILIDADE GARANTIDA */}
      <div className="max-w-7xl mx-auto px-4 pt-20">
        <div className="bg-gray-50 p-10 md:p-16 rounded-[60px] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 text-blue-600 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
             <i className="fas fa-quote-right text-9xl"></i>
          </div>
          <div className="relative z-10">
            <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-blue-600 mb-6 flex items-center gap-3">
              <span className="w-8 h-[2px] bg-blue-600"></span>
              {t.aboutStand}
            </h2>
            <p className="text-gray-700 leading-relaxed text-xl md:text-2xl whitespace-pre-line font-medium italic max-w-4xl">
              {standProfile.description || (lang === 'pt' ? "Bem-vindo ao nosso stand. Oferecemos transparência e confiança em todos os nossos negócios." : "Welcome to our dealership. We offer transparency and trust in all our deals.")}
            </p>
          </div>
        </div>
      </div>

      {/* LISTAGEM DE STOCK */}
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="flex justify-between items-end mb-16">
          <div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Stock Disponível</h2>
            <p className="text-gray-400 font-bold mt-2 uppercase text-[10px] tracking-widest">Listagem de viaturas em tempo real</p>
          </div>
          <div className="hidden md:block">
             <div className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-blue-100">
               {cars.length} {t.totalVehicles}
             </div>
          </div>
        </div>

        {cars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {cars.map(car => (
              <CarCard 
                key={car.id} car={car} lang={lang} 
                onToggleFavorite={onToggleFavorite} isFavorite={favorites.includes(car.id)}
                onSelect={setSelectedCar}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-gray-50 rounded-[50px] border border-dashed border-gray-200">
            <i className="fas fa-car-side text-5xl text-gray-200 mb-6"></i>
            <p className="text-gray-500 font-bold text-xl">Este stand não tem anúncios ativos no momento.</p>
          </div>
        )}
      </div>

      {selectedCar && <LeadForm car={selectedCar} lang={lang} onClose={() => setSelectedCar(null)} />}
    </div>
  );
};

export default StandDetail;
