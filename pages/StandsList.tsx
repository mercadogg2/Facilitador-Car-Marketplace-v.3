
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Language, UserProfile } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

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
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'stand')
          .eq('status', 'approved');

        if (!profileError && profiles) {
          setStands(profiles);

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
      (s.location || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stands, searchQuery]);

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header Section */}
      <section className="bg-white border-b border-gray-100 py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight mb-8">
            {t.title}
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-12 font-medium">
            {t.subtitle}
          </p>

          <div className="max-w-3xl mx-auto relative group">
            <i className="fas fa-search absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors text-xl"></i>
            <input 
              type="text" 
              placeholder={t.searchPlaceholder}
              className="w-full pl-20 pr-10 py-6 rounded-[35px] bg-gray-50 border-none outline-none focus:ring-8 focus:ring-blue-500/5 text-xl font-bold shadow-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="max-w-7xl mx-auto px-4 mt-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="bg-white rounded-[50px] h-80 animate-pulse"></div>
            ))}
          </div>
        ) : filteredStands.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredStands.map(stand => {
              const standUrlSlug = stand.slug || slugify(stand.stand_name || '');
              return (
                <Link 
                  key={stand.id} 
                  to={`/stands/${standUrlSlug}`}
                  className="group bg-white p-10 rounded-[50px] shadow-sm hover:shadow-2xl hover:-translate-y-2 border border-gray-100 transition-all duration-500"
                >
                  <div className="flex items-center gap-8 mb-10">
                    <div className="w-24 h-24 bg-blue-600 rounded-[30px] flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-blue-100 group-hover:scale-110 transition-transform">
                      {(stand.stand_name || 'S')[0]}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {stand.stand_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          {t.verifiedPartner}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-10">
                    <div className="bg-gray-50 p-6 rounded-[30px] border border-gray-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                        Viaturas
                      </p>
                      <p className="text-xl font-black text-gray-900">
                        {counts[stand.stand_name || ''] || 0}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-[30px] border border-gray-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                        Membro
                      </p>
                      <p className="text-xl font-black text-gray-900">
                        2024
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <span className="text-sm font-black text-blue-600 flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                      {t.viewStock}
                      <i className="fas fa-arrow-right text-xs"></i>
                    </span>
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                       <i className="fas fa-map-marker-alt"></i>
                       {stand.location || 'Portugal'}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-40 bg-white rounded-[50px] border border-dashed border-gray-200">
            <i className="fas fa-store-slash text-5xl text-gray-200 mb-6"></i>
            <p className="text-gray-500 font-black text-2xl">{t.noResults}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default StandsList;
