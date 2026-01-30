
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Language, Car } from '../types';
import { TRANSLATIONS } from '../constants';
import CarCard from '../components/CarCard';
import LeadForm from '../components/LeadForm';
import HelpCard from '../components/HelpCard';
import { supabase } from '../lib/supabase';

type SortOption = 'recent' | 'price_asc' | 'price_desc' | 'year_desc' | 'km_asc';

interface ListingsProps {
  lang: Language;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
}

const Listings: React.FC<ListingsProps> = ({ lang, onToggleFavorite, favorites }) => {
  const t = TRANSLATIONS[lang].common;
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Estados dos Filtros
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'recent');
  
  const [filters, setFilters] = useState({
    brand: searchParams.get('brand') || '',
    category: searchParams.get('category') || '',
    maxPrice: parseInt(searchParams.get('maxPrice') || '1000000'),
    minYear: parseInt(searchParams.get('minYear') || '1980'),
    maxKM: parseInt(searchParams.get('maxKM') || '500000'),
  });

  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchMetadata = async () => {
      const { data } = await supabase.from('cars').select('brand, category').eq('active', true);
      if (data) {
        setBrands(Array.from(new Set(data.map(c => c.brand).filter(Boolean))));
        setCategories(Array.from(new Set(data.map(c => c.category).filter(Boolean))));
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      let query = supabase.from('cars').select('*').eq('active', true);

      if (searchQuery) {
        // Busca expandida para incluir o reference_code
        query = query.or(`brand.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,reference_code.ilike.%${searchQuery}%`);
      }
      
      if (filters.brand) query = query.eq('brand', filters.brand);
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.maxPrice < 1000000) query = query.lte('price', filters.maxPrice);
      if (filters.minYear > 1980) query = query.gte('year', filters.minYear);
      if (filters.maxKM < 500000) query = query.lte('mileage', filters.maxKM);

      switch (sortBy) {
        case 'price_asc': query = query.order('price', { ascending: true }); break;
        case 'price_desc': query = query.order('price', { ascending: false }); break;
        case 'year_desc': query = query.order('year', { ascending: false }); break;
        case 'km_asc': query = query.order('mileage', { ascending: true }); break;
        default: query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (!error && data) setCars(data);
      setLoading(false);
    };

    const timer = setTimeout(fetchCars, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, filters, sortBy]);

  useEffect(() => {
    const params: any = {};
    if (searchQuery) params.q = searchQuery;
    if (filters.brand) params.brand = filters.brand;
    if (filters.category) params.category = filters.category;
    if (filters.maxPrice < 1000000) params.maxPrice = filters.maxPrice;
    if (filters.minYear > 1980) params.minYear = filters.minYear;
    if (filters.maxKM < 500000) params.maxKM = filters.maxKM;
    if (sortBy !== 'recent') params.sort = sortBy;
    setSearchParams(params, { replace: true });
  }, [searchQuery, filters, sortBy]);

  const resetFilters = () => {
    setFilters({ brand: '', category: '', maxPrice: 1000000, minYear: 1980, maxKM: 500000 });
    setSearchQuery('');
    setSortBy('recent');
    setSearchParams({});
  };

  const FilterSidebar = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-8">
           <h3 className="font-black text-xl flex items-center gap-3">
             <i className="fas fa-sliders-h text-blue-600"></i>
             {t.filters}
           </h3>
           <button onClick={resetFilters} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors">
             {t.clearFilters}
           </button>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t.search}</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder={lang === 'pt' ? 'Marca, modelo ou REF...' : 'Brand, model or REF...'}
                className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border-none text-sm font-bold outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-600 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t.brand}</label>
            <select 
              className="w-full p-4 rounded-2xl bg-gray-50 border-none text-sm font-bold outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-600 transition-all appearance-none cursor-pointer"
              value={filters.brand}
              onChange={(e) => setFilters({...filters, brand: e.target.value})}
            >
              <option value="">{lang === 'pt' ? 'Todas as Marcas' : 'All Brands'}</option>
              {brands.sort().map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3 ml-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.maxPrice}</label>
              <span className="text-xs font-black text-blue-600">{filters.maxPrice >= 1000000 ? 'Ilimitado' : `${filters.maxPrice.toLocaleString()} €`}</span>
            </div>
            <input 
              type="range" min="5000" max="250000" step="5000"
              className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              value={filters.maxPrice > 250000 ? 250000 : filters.maxPrice}
              onChange={(e) => setFilters({...filters, maxPrice: parseInt(e.target.value)})}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3 ml-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ano Mínimo</label>
              <span className="text-xs font-black text-blue-600">{filters.minYear}</span>
            </div>
            <input 
              type="range" min="1990" max="2025" step="1"
              className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              value={filters.minYear}
              onChange={(e) => setFilters({...filters, minYear: parseInt(e.target.value)})}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">{t.category}</label>
            <div className="grid grid-cols-2 gap-2">
               <button 
                  onClick={() => setFilters({...filters, category: ''})}
                  className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${!filters.category ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200'}`}
               >
                 Todas
               </button>
               {categories.map(cat => (
                 <button 
                   key={cat}
                   onClick={() => setFilters({...filters, category: cat})}
                   className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filters.category === cat ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200'}`}
                 >
                   {cat}
                 </button>
               ))}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block">
        <HelpCard />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        <div>
           <h2 className="text-2xl font-black text-gray-900">
             {loading ? 'A procurar...' : `${cars.length} ${t.found}`}
           </h2>
           <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Stands Certificados em Portugal</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
           <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 flex-grow md:flex-grow-0">
              <i className="fas fa-sort-amount-down text-blue-600 text-sm"></i>
              <select 
                className="bg-transparent text-sm font-black text-gray-900 outline-none cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="recent">{t.recent}</option>
                <option value="price_asc">{t.priceAsc}</option>
                <option value="price_desc">{t.priceDesc}</option>
                <option value="year_desc">{t.yearDesc}</option>
                <option value="km_asc">{t.kmAsc}</option>
              </select>
           </div>

           <button 
             onClick={() => setIsMobileFiltersOpen(true)}
             className="lg:hidden flex items-center gap-3 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm transition-all shadow-xl shadow-blue-100 active:scale-95"
           >
             <i className="fas fa-filter"></i>
             Filtros
           </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        <aside className="hidden lg:block w-80 shrink-0">
          <FilterSidebar />
        </aside>

        <div className="flex-grow">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
               {[1,2,3,4,5,6].map(n => (
                 <div key={n} className="bg-gray-100 animate-pulse rounded-[40px] aspect-[4/5]"></div>
               ))}
            </div>
          ) : cars.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in duration-700">
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
            <div className="text-center py-32 bg-white rounded-[60px] shadow-sm border border-gray-100 animate-in zoom-in">
              <div className="w-24 h-24 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">
                <i className="fas fa-search-minus"></i>
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4">{t.noResults}</h3>
              <p className="text-gray-500 max-w-sm mx-auto font-medium">Não encontramos viaturas com estes filtros. Tente alargar a sua pesquisa ou limpar os filtros.</p>
              <button 
                onClick={resetFilters}
                className="mt-8 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-blue-100"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-[2000] lg:hidden animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)}></div>
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-gray-50 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500">
             <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-2xl font-black text-gray-900">Filtros</h2>
                   <button onClick={() => setIsMobileFiltersOpen(false)} className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                     <i className="fas fa-times text-gray-400"></i>
                   </button>
                </div>
                <FilterSidebar />
                <button 
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black mt-10 shadow-xl"
                >
                  Ver Resultados
                </button>
             </div>
          </div>
        </div>
      )}

      {selectedCar && <LeadForm car={selectedCar} lang={lang} onClose={() => setSelectedCar(null)} />}
    </div>
  );
};

export default Listings;
