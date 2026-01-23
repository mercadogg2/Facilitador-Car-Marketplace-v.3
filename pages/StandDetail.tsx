
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
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('slug', slug)
          .single();
        
        if (profileError || !profileData) {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-20 h-20 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center mb-6 text-3xl">
        <i className="fas fa-store-slash"></i>
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Stand não encontrado</h2>
      <p className="text-gray-500 mb-8">O parceiro que procura pode ter alterado o nome ou o link.</p>
      <Link to="/stands" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg">Ver todos os Stands</Link>
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
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1562141989-c5c79ac8f576?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover" alt="BG" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-blue-600 rounded-[35px] flex items-center justify-center text-5xl md:text-6xl font-black shadow-2xl overflow-hidden border-4 border-white/20">
              {standProfile.profile_image ? (
                <img src={standProfile.profile_image} className="w-full h-full object-cover" alt="Stand Logo" />
              ) : (
                standProfile.stand_name?.[0]
              )}
            </div>
            <div className="text-center md:text-left space-y-4 flex-grow">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <h1 className="text-4xl md:text-6xl font-black tracking-tight">{standProfile.stand_name}</h1>
                <div className="bg-blue-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                  <i className="fas fa-check-circle"></i> {lang === 'pt' ? 'STAND VERIFICADO' : 'VERIFIED DEALER'}
                </div>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-8 text-gray-400 font-bold text-xs uppercase tracking-widest">
                <span className="flex items-center gap-2"><i className="fas fa-map-marker-alt text-blue-400"></i>{standProfile.location || 'Portugal'}</span>
                <span className="flex items-center gap-2"><i className="fas fa-car text-blue-400"></i>{cars.length} {t.totalVehicles}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Descrição do Stand */}
      {standProfile.description && (
        <div className="max-w-7xl mx-auto px-4 pt-20">
          <div className="bg-gray-50 p-8 md:p-12 rounded-[40px] border border-gray-100 shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-4">{t.aboutStand}</h2>
            <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line font-medium italic">
              "{standProfile.description}"
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-black text-gray-900">Anúncios Ativos</h2>
            <p className="text-gray-400 font-bold mt-1">Listagem atualizada em tempo real</p>
          </div>
        </div>

        {cars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {cars.map(car => (
              <CarCard 
                key={car.id} car={car} lang={lang} 
                onToggleFavorite={onToggleFavorite} isFavorite={favorites.includes(car.id)}
                onSelect={setSelectedCar}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[50px] border border-dashed border-gray-200">
            <i className="fas fa-car-side text-4xl text-gray-200 mb-4"></i>
            <p className="text-gray-500 font-bold">Este stand não tem anúncios ativos no momento.</p>
          </div>
        )}
      </div>

      {selectedCar && <LeadForm car={selectedCar} lang={lang} onClose={() => setSelectedCar(null)} />}
    </div>
  );
};

export default StandDetail;
