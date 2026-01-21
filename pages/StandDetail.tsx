
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
  const { standName } = useParams<{ standName: string }>();
  const [cars, setCars] = useState<Car[]>([]);
  const [standProfile, setStandProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  
  const t = TRANSLATIONS[lang].standDetail;
  const tc = TRANSLATIONS[lang].common;

  useEffect(() => {
    const fetchStandStockAndProfile = async () => {
      setLoading(true);
      window.scrollTo(0, 0);
      
      try {
        const decodedName = decodeURIComponent(standName || '');
        
        // Buscar viaturas do stock
        const { data: carsData, error: carsError } = await supabase
          .from('cars')
          .select('*')
          .eq('stand_name', decodedName);
        
        if (!carsError && carsData) {
          setCars(carsData);
        }

        // Buscar perfil do stand para obter a descrição personalizada
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('stand_name', decodedName)
          .single();
        
        if (profileData) {
          setStandProfile(profileData);
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user && (user.user_metadata?.stand_name === decodedName || user.email === 'admin@facilitadorcar.pt')) {
          setIsOwner(true);
        }
      } catch (err) {
        console.error("Erro ao buscar stock do stand:", err);
      } finally {
        setLoading(false);
      }
    };

    if (standName) fetchStandStockAndProfile();
  }, [standName]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const standLocation = cars.length > 0 ? cars[0].location : (standProfile?.location || 'Portugal');

  return (
    <div className="bg-white min-h-screen">
      {isOwner && (
        <div className="bg-blue-600 py-3 text-center text-white text-xs font-bold animate-in slide-in-from-top duration-500">
          Esta é a sua página pública. 
          <Link to="/dashboard" className="ml-3 underline decoration-white/50 hover:decoration-white transition-all">
            Ir para o Painel de Gestão
          </Link>
        </div>
      )}

      {/* Stand Hero Section */}
      <section className="bg-gray-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1562141989-c5c79ac8f576?auto=format&fit=crop&q=80&w=1920" 
            className="w-full h-full object-cover"
            alt="Dealership BG"
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 bg-blue-600 rounded-[30px] flex items-center justify-center text-4xl font-black shadow-2xl border-4 border-white/10">
              {decodeURIComponent(standName || '')[0]}
            </div>
            <div className="text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">{decodeURIComponent(standName || '')}</h1>
                <div className="bg-blue-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                  <i className="fas fa-check-circle"></i>
                  {tc.verified}
                </div>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-gray-400 font-medium">
                <span><i className="fas fa-map-marker-alt mr-2 text-blue-400"></i>{standLocation}</span>
                <span><i className="fas fa-car mr-2 text-blue-400"></i>{cars.length} {t.totalVehicles}</span>
                <span><i className="fas fa-certificate mr-2 text-blue-400"></i>{t.since} 2024</span>
              </div>
            </div>
            <div className="md:ml-auto">
              <button 
                onClick={() => window.open(`https://wa.me/351${standProfile?.phone || '912345678'}`, '_blank')}
                className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-black hover:bg-blue-50 transition-all shadow-xl flex items-center justify-center"
              >
                {t.contactStand}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stand Content */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Main Stock Area */}
          <div className="flex-grow">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black text-gray-900">{t.viewStock}</h2>
              <div className="text-sm font-bold text-gray-400">{cars.length} Resultados</div>
            </div>

            {cars.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {cars.map(car => (
                  <CarCard 
                    key={car.id} 
                    car={car} 
                    lang={lang} 
                    onToggleFavorite={onToggleFavorite} 
                    isFavorite={favorites.includes(car.id)}
                    onSelect={setSelectedCar}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-gray-100">
                <i className="fas fa-car-side text-4xl text-gray-200 mb-4"></i>
                <p className="text-gray-500 font-bold">{lang === 'pt' ? 'Este stand não tem viaturas ativas no momento.' : 'This dealer has no active vehicles at the moment.'}</p>
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="sticky top-28 space-y-8">
              <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100">
                <h3 className="text-xl font-black text-gray-900 mb-4">{t.aboutStand}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6 whitespace-pre-line">
                  {standProfile?.description || t.verifiedReason}
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-900">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                      <i className="fas fa-clock"></i>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">Aberto até</p>
                      <p>19:00h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-900">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                      <i className="fas fa-phone"></i>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">Telemóvel</p>
                      <p>{standProfile?.phone || '+351 912 345 678'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-600 p-8 rounded-[40px] text-white shadow-xl shadow-blue-100">
                <h4 className="font-black text-xl mb-2">Compre com Confiança</h4>
                <p className="text-blue-100 text-xs leading-relaxed">
                  Todos os negócios realizados através da plataforma Facilitador Car são monitorizados para garantir a sua satisfação total.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {selectedCar && <LeadForm car={selectedCar} lang={lang} onClose={() => setSelectedCar(null)} />}
    </div>
  );
};

export default StandDetail;
