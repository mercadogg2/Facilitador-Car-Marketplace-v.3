
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Language, Car } from '../types';
import { TRANSLATIONS } from '../constants';
import CarCard from '../components/CarCard';
import LeadForm from '../components/LeadForm';
import { supabase } from '../lib/supabase';

interface HomeProps {
  lang: Language;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
}

const Home: React.FC<HomeProps> = ({ lang, onToggleFavorite, favorites }) => {
  const t = TRANSLATIONS[lang].home;
  const tc = TRANSLATIONS[lang].common;
  const navigate = useNavigate();
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Car[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [featuredCars, setFeaturedCars] = useState<Car[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('active', true)
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(8);
        
        if (!error && data && data.length > 0) {
          setFeaturedCars(data);
        } else {
          const { data: fallbackData } = await supabase
            .from('cars')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false })
            .limit(8);
          if (fallbackData) setFeaturedCars(fallbackData);
        }
      } catch (err) {
        console.error("Error fetching featured cars:", err);
      }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        try {
          const { data, error } = await supabase
            .from('cars')
            .select('*')
            .eq('active', true)
            .or(`brand.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%,stand_name.ilike.%${searchQuery}%`)
            .limit(6);
          
          if (!error && data) {
            setSuggestions(data);
          }
        } catch (err) {
          console.error("Error fetching suggestions:", err);
          setSuggestions([]);
        }
        setIsSearching(false);
        setShowSuggestions(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/veiculos?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleQuickFilter = (category: string) => {
    navigate(`/veiculos?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="space-y-16">
      <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1920" 
            alt="Hero Background"
            className="w-full h-full object-cover brightness-[0.3]"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto w-full">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
            {t.hero}
          </h1>
          <p className="text-xl text-gray-200 mb-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 font-medium">
            {t.subHero}
          </p>
          
          <div ref={searchRef} className="relative max-w-3xl mx-auto z-50 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <form 
              onSubmit={handleSearchSubmit}
              className="bg-white/95 backdrop-blur-xl p-3 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col md:flex-row gap-2 transition-all ring-1 ring-white/20"
            >
              <div className="flex-grow flex items-center px-6 py-4 md:py-0">
                <i className={`fas ${isSearching ? 'fa-circle-notch animate-spin' : 'fa-search'} text-blue-600 mr-4 text-xl`}></i>
                <input 
                  type="text" 
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-400 font-bold text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)}
                />
              </div>
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-[20px] font-black transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center text-lg active:scale-95"
              >
                {tc.search}
              </button>
            </form>

            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                {suggestions.length > 0 ? (
                  <div className="py-4">
                    <div className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 mb-2">Sugestões em Destaque</div>
                    {suggestions.map(car => (
                      <Link 
                        key={car.id} 
                        to={`/veiculos/${car.id}`}
                        className="flex items-center px-6 py-4 hover:bg-blue-50 transition-all group"
                      >
                        <div className="w-16 h-12 rounded-xl overflow-hidden mr-5 border border-gray-100 shrink-0">
                          <img src={car.image} alt={car.brand} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-left flex-grow">
                          <p className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                            {car.brand} {car.model}
                          </p>
                          <p className="text-xs text-gray-400 font-bold">{car.year} • {car.stand_name}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-blue-600 font-black text-sm">{(car.price || 0).toLocaleString()}€</p>
                           <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest">{car.category}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-gray-400 font-bold">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                       <i className="fas fa-search-minus text-2xl opacity-20"></i>
                    </div>
                    {lang === 'pt' ? 'Nenhuma viatura encontrada' : 'No vehicles found'}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            {t.quickFilters?.map((filter, idx) => (
              <button 
                key={idx}
                onClick={() => handleQuickFilter(filter.val)}
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white hover:text-blue-600 hover:border-white transition-all flex items-center gap-3 active:scale-95"
              >
                <i className={`fas ${filter.icon} text-sm`}></i>
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {featuredCars.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">{t.featured}</h2>
              <p className="text-gray-500 mt-2 font-medium">{lang === 'pt' ? 'As melhores oportunidades dos nossos stands certificados.' : 'Top deals from our certified dealers.'}</p>
            </div>
            <Link to="/veiculos" className="bg-gray-100 text-gray-900 px-8 py-3 rounded-2xl font-black text-sm hover:bg-blue-600 hover:text-white transition-all active:scale-95">
              {t.viewAll}
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredCars.map(car => (
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
        </section>
      )}

      {selectedCar && <LeadForm car={selectedCar} lang={lang} onClose={() => setSelectedCar(null)} />}
    </div>
  );
};

export default Home;
