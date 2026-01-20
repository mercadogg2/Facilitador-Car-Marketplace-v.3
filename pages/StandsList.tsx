
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Language, UserProfile } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';

interface StandsListProps {
  lang: Language;
}

const StandsList: React.FC<StandsListProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang].stands;
  const tc = TRANSLATIONS[lang].common;
  
  const [stands, setStands] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      window.scrollTo(0, 0);

      try {
        // Buscar perfis que são stands aprovados
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'stand')
          .eq('status', 'approved');

        if (!profileError && profiles) {
          setStands(profiles);

          // Buscar contagem de viaturas para cada stand
          const { data: carData } = await supabase
            .from('cars')
            .select('stand_name');
          
          if (carData) {
            const carCounts: Record<string, number> = {};
            carData.forEach(car => {
              carCounts[car.stand_name] = (carCounts[car.stand_name] || 0) + 1;
            });
            setCounts(carCounts);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar stands:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredStands = useMemo(() => {
    return stands.filter(s => 
      (s.stand_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stands, searchQuery]);

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header Section */}
      <section className="bg-white border-b border-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight mb-6">
            {t.title}
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            {t.subtitle}
          </p>

          <div className="max-w-2xl mx-auto relative group">
            <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors"></i>
            <input 
              type="text" 
              placeholder={t.searchPlaceholder}
              className="w-full pl-16 pr-8 py-5 rounded-[25px] bg-gray-50 border-none outline-none focus:ring-4 focus:ring-blue-500/10 text-lg font-medium shadow-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="max-w-7xl mx-auto px-4 mt-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="bg-white rounded-[40px] h-64 animate-pulse"></div>
            ))}
          </div>
        ) : filteredStands.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStands.map(stand => (
              <Link 
                key={stand.id} 
                to={`/stand/${encodeURIComponent(stand.stand_name || '')}`}
                className="group bg-white p-8 rounded-[40px] shadow-sm hover:shadow-2xl hover:-translate-y-1 border border-gray-50 transition-all duration-300"
              >
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 bg-blue-600 rounded-[24px] flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-blue-100 group-hover:scale-110 transition-transform">
                    {(stand.stand_name || 'S')[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                      {stand.stand_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {t.verifiedPartner}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-gray-50 p-4 rounded-3xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                      Stock
                    </p>
                    <p className="font-bold text-gray-900">
                      {counts[stand.stand_name || ''] || 0} Viaturas
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-3xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                      {lang === 'pt' ? 'Membro' : 'Member'}
                    </p>
                    <p className="font-bold text-gray-900">
                      2024
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-blue-600 flex items-center gap-2">
                    {t.viewStock}
                    <i className="fas fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
                  </span>
                  <div className="flex -space-x-2">
                     <i className="fas fa-check-circle text-blue-600 text-lg"></i>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[40px] border border-dashed border-gray-200">
            <i className="fas fa-store-slash text-4xl text-gray-200 mb-4"></i>
            <p className="text-gray-500 font-bold">{t.noResults}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default StandsList;
