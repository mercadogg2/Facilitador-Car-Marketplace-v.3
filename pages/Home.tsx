
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Language, Car } from '../types';
import { TRANSLATIONS, MOCK_CARS } from '../constants';
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
          .limit(4);
        
        if (!error && data && data.length > 0) {
          setFeaturedCars(data);
        } else {
          setFeaturedCars(MOCK_CARS);
        }
      } catch (err) {
        setFeaturedCars(MOCK_CARS);
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
            .or(`brand.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%`)
            .limit(5);
          
          if (!error && data) {
            setSuggestions(data);
          } else {
            setSuggestions(MOCK_CARS.filter(c => 
              c.brand.toLowerCase().includes(searchQuery.toLowerCase()) || 
              c.model.toLowerCase().includes(searchQuery.toLowerCase())
            ).slice(0, 5));
          }
        } catch (err) {
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
    navigate(`/veiculos?q=${searchQuery}`);
  };

  return (
    <div className="space-y-16">
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1920" 
            alt="Hero Background"
            className="w-full h-full object-cover brightness-[0.4]"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
            {t.hero}
          </h1>
          <p className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            {t.subHero}
          </p>
          
          <div ref={searchRef} className="relative max-w-3xl mx-auto z-50">
            <form 
              onSubmit={handleSearchSubmit}
              className="bg-white p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2 transition-all focus-within:ring-4 focus-within:ring-blue-500/20"
            >
              <div className="flex-grow flex items-center px-4 py-3 md:py-0">
                <i className={`fas ${isSearching ? 'fa-circle-notch animate-spin' : 'fa-search'} text-gray-400 mr-3`}></i>
                <input 
                  type="text" 
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-500 font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)}
                />
              </div>
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 flex items-center justify-center"
              >
                {tc.search}
              </button>
            </form>

            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {suggestions.length > 0 ? (
                  <div className="py-2">
                    {suggestions.map(car => (
                      <Link 
                        key={car.id} 
                        to={`/veiculos/${car.id}`}
                        className="flex items-center px-6 py-4 hover:bg-blue-50 transition-colors group"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden mr-4 border border-gray-100">
                          <img src={car.image} alt={car.brand} className="w-full h-full object-cover" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {car.brand} {car.model}
                          </p>
                          <p className="text-xs text-gray-500">{car.year} • {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(car.price)}</p>
                        </div>
                        <i className="fas fa-chevron-right ml-auto text-gray-300 text-xs group-hover:text-blue-600 group-hover:translate-x-1 transition-all"></i>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 font-medium">
                    <i className="fas fa-search mb-2 block text-xl opacity-20"></i>
                    {lang === 'pt' ? 'Nenhum resultado encontrado' : 'No results found'}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-center space-x-8 text-white/80 text-sm">
            <div className="flex items-center">
              <i className="fas fa-shield-alt text-blue-400 mr-2"></i>
              <span>{tc.verified}</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-check-double text-blue-400 mr-2"></i>
              <span>{lang === 'pt' ? 'Compra Segura' : 'Safe Purchase'}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{t.featured}</h2>
            <p className="text-gray-500 mt-2">{lang === 'pt' ? 'Escolhas exclusivas dos nossos stands certificados.' : 'Exclusive picks from our certified dealerships.'}</p>
          </div>
          <Link to="/veiculos" className="text-blue-600 font-bold hover:text-blue-700 flex items-center group">
            {t.viewAll}
            <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
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

      <section className="bg-white py-20 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-blue-600 font-bold uppercase tracking-widest text-sm">{t.whyUs}</span>
              <h2 className="text-4xl font-bold text-gray-900 mt-4 mb-6 leading-tight">{t.credibility}</h2>
              <p className="text-lg text-gray-600 mb-8">{t.whyUsDesc}</p>
              <ul className="space-y-4">
                {t.benefits.map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mr-4 shrink-0">
                      <i className={`fas ${['fa-certificate', 'fa-star', 'fa-comments-dollar'][idx]}`}></i>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800" 
                alt="Happy customer"
                className="rounded-3xl shadow-2xl relative z-10"
              />
            </div>
          </div>
        </div>
      </section>

      {selectedCar && <LeadForm car={selectedCar} lang={lang} onClose={() => setSelectedCar(null)} />}
    </div>
  );
};

export default Home;
