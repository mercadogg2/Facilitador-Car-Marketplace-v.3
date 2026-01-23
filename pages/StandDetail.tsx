
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
        // Tenta buscar pelo slug amigável
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('slug', slug)
          .single();
        
        if (profileError || !profileData) {
          // Fallback: buscar pelo nome formatado
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
        console.error("Erro ao buscar stand:", err);
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!standProfile) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <div className="w-20 h-20 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center mb-6 text-3xl"><i className="fas fa-store-slash"></i></div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Stand não encontrado</h2>
      <Link to="/stands" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg">Ver todos os Stands</Link>
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      <section className="bg-gray-900 text-white py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src="https://images.unsplash.com/photo-1562141989-c5c79ac8f576?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover" alt="Background" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-44 h-44 md:w-56 md:h-56 bg-blue-600 rounded-[50px] flex items-center justify-center text-6xl md:text-7xl font-black shadow-2xl overflow-hidden border-8 border-white/10">
              {standProfile.profile_image ? (
                <img src={standProfile.profile_image} className="w-full h-full object-cover" alt="Stand Logo" />
              ) : (
                standProfile.stand_name?.[0]
              )}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">{standProfile.stand_name}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-8 text-gray-400 font-bold text-sm uppercase tracking-widest">
                <span className="flex items-center gap-2"><i className="fas fa-map-marker-alt text-blue-400"></i>{standProfile.location || 'Portugal'}</span>
                <span className="flex items-center gap-2"><i className="fas fa-car text-blue-400"></i>{cars.length} Viaturas</span>
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-[10px] flex items-center gap-2 shadow-lg"><i className="fas fa-check-circle"></i> VERIFICADO</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pt-20">
        <div className="bg-gray-50 p-10 md:p-16 rounded-[60px] border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 text-blue-600 opacity-5 pointer-events-none"><i className="fas fa-quote-right text-9xl"></i></div>
          <div className="relative z-10">
            <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-blue-600 mb-6">Sobre o Stand</h2>
            <p className="text-gray-700 leading-relaxed text-xl md:text-2xl whitespace-pre-line font-medium italic max-w-4xl">
              {standProfile.description || "Bem-vindo ao nosso stand. Comprometemo-nos com a transparência e qualidade em todos os veículos que entregamos aos nossos clientes."}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-24">
        <h2 className="text-4xl font-black text-gray-900 mb-12">Stock Disponível</h2>
        {cars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {cars.map(car => (
              <CarCard key={car.id} car={car} lang={lang} onToggleFavorite={onToggleFavorite} isFavorite={favorites.includes(car.id)} onSelect={setSelectedCar} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[50px] border border-dashed border-gray-200">
            <p className="text-gray-500 font-bold">Sem anúncios ativos no momento.</p>
          </div>
        )}
      </div>

      {selectedCar && <LeadForm car={selectedCar} lang={lang} onClose={() => setSelectedCar(null)} />}
    </div>
  );
};

export default StandDetail;
