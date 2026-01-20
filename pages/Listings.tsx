
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Language, Car } from '../types';
import { TRANSLATIONS } from '../constants';
import CarCard from '../components/CarCard';
import LeadForm from '../components/LeadForm';
import { supabase } from '../lib/supabase';

interface ListingsProps {
  lang: Language;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
}

const Listings: React.FC<ListingsProps> = ({ lang, onToggleFavorite, favorites }) => {
  const t = TRANSLATIONS[lang].common;
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [filters, setFilters] = useState({
    brand: '',
    category: '',
    maxPrice: 500000
  });

  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Carregar filtros únicos das marcas e categorias disponíveis no DB
  useEffect(() => {
    const fetchMetadata = async () => {
      const { data } = await supabase.from('cars').select('brand, category');
      if (data) {
        setBrands(Array.from(new Set(data.map(c => c.brand))));
        setCategories(Array.from(new Set(data.map(c => c.category))));
      }
    };
    fetchMetadata();
  }, []);

  // Buscar veículos com filtros aplicados no Supabase
  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      let query = supabase.from('cars').select('*');

      if (searchQuery) {
        query = query.or(`brand.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }
      if (filters.brand) {
        query = query.eq('brand', filters.brand);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (!error && data) {
        setCars(data);
      }
      setLoading(false);
    };

    const timer = setTimeout(fetchCars, 300); // Debounce
    return () => clearTimeout(timer);
  }, [searchQuery, filters]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val === '') {
      searchParams.delete('q');
    } else {
      searchParams.set('q', val);
    }
    setSearchParams(searchParams, { replace: true });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-80 space-y-8 shrink-0">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
            <h3 className="font-bold text-lg mb-6 flex items-center">
              <i className="fas fa-sliders-h mr-2 text-blue-600"></i>
              {t.filters}
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.search}</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder={lang === 'pt' ? 'Marca, modelo...' : 'Make, model...'}
                    className="w-full p-3 pl-10 rounded-xl bg-gray-50 border-none text-sm outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                  <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.brand}</label>
                <select 
                  className="w-full p-3 rounded-xl bg-gray-50 border-none text-sm outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 transition-all"
                  value={filters.brand}
                  onChange={(e) => setFilters({...filters, brand: e.target.value})}
                >
                  <option value="">{lang === 'pt' ? 'Todas as Marcas' : 'All Brands'}</option>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.category}</label>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer group">
                    <input 
                      type="radio" 
                      name="category"
                      checked={filters.category === ''}
                      onChange={() => setFilters({...filters, category: ''})}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
                      {lang === 'pt' ? 'Todos' : 'All'}
                    </span>
                  </label>
                  {categories.map(cat => (
                    <label key={cat} className="flex items-center cursor-pointer group">
                      <input 
                        type="radio" 
                        name="category"
                        checked={filters.category === cat}
                        onChange={() => setFilters({...filters, category: cat})}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-600 group-hover:text-blue-600 transition-colors">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.maxPrice}</label>
                <input 
                  type="range" 
                  min="5000" 
                  max="500000" 
                  step="5000"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: parseInt(e.target.value)})}
                />
                <div className="flex justify-between mt-2 font-bold text-blue-600 text-xs">
                  <span>5k €</span>
                  <span>{filters.maxPrice.toLocaleString()} €</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  setFilters({ brand: '', category: '', maxPrice: 500000 });
                  setSearchQuery('');
                  setSearchParams({});
                }}
                className="w-full py-3 text-sm font-bold text-gray-500 hover:text-red-600 transition-colors border-t border-gray-100 pt-4"
              >
                {t.clearFilters}
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-grow">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              {loading ? '...' : cars.length} {t.found}
              {searchQuery && (
                <span className="ml-2 text-blue-600 text-sm font-medium">
                  para "{searchQuery}"
                </span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
               {[1,2,3,4,5,6].map(n => (
                 <div key={n} className="bg-gray-100 animate-pulse rounded-2xl aspect-[4/5]"></div>
               ))}
            </div>
          ) : cars.length > 0 ? (
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
            <div className="text-center py-32 bg-white rounded-[40px] shadow-sm border border-gray-100">
              <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                <i className="fas fa-search-minus"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.noResults}</h3>
              <p className="text-gray-500 max-w-xs mx-auto">Tente ajustar seus filtros para encontrar o que procura.</p>
            </div>
          )}
        </div>
      </div>

      {selectedCar && <LeadForm car={selectedCar} lang={lang} onClose={() => setSelectedCar(null)} />}
    </div>
  );
};

export default Listings;
