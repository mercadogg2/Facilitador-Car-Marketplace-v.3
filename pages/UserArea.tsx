
import React, { useEffect, useState } from 'react';
// Added Link to the imports from react-router-dom
import { useNavigate, Link } from 'react-router-dom';
import { Language, Car, UserProfile } from '../types';
import { TRANSLATIONS } from '../constants';
import CarCard from '../components/CarCard';
import { supabase } from '../lib/supabase';

interface UserAreaProps {
  lang: Language;
  favorites: string[];
  onLogout: () => Promise<void>;
}

const UserArea: React.FC<UserAreaProps> = ({ lang, favorites, onLogout }) => {
  const t = TRANSLATIONS[lang].userArea;
  const navigate = useNavigate();
  const [favoriteCars, setFavoriteCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (favorites.length === 0) {
        setFavoriteCars([]);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .in('id', favorites);
      
      if (!error && data) {
        setFavoriteCars(data);
      }
      setLoading(false);
    };
    fetchFavorites();
  }, [favorites]);

  const handleLogout = async () => {
    try {
      await onLogout();
      navigate('/');
    } catch (err) {
      console.error("Erro ao sair:", err);
      navigate('/');
    }
  };

  const memberDate = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-US', { month: 'long', year: 'numeric' })
    : '...';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-12 flex flex-col md:flex-row items-center gap-8">
        <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
          {(profile?.full_name || 'U')[0]}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{profile?.full_name || t.greeting}</h1>
          <p className="text-gray-500">{t.memberSince} {memberDate}</p>
        </div>
        <div className="md:ml-auto flex gap-4">
          <button 
            onClick={() => navigate('/cliente/editar')}
            className="px-6 py-3 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 transition-all text-sm"
          >
            {t.editProfile}
          </button>
          <button 
            onClick={handleLogout}
            className="px-6 py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all text-sm"
          >
            {t.logout}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
          <i className="fas fa-heart text-red-500 mr-3"></i>
          {t.myFavorites} ({favoriteCars.length})
        </h2>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1,2,3,4].map(n => <div key={n} className="bg-gray-100 animate-pulse h-80 rounded-2xl"></div>)}
          </div>
        ) : favoriteCars.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {favoriteCars.map(car => (
              <CarCard 
                key={car.id} car={car} lang={lang} 
                onToggleFavorite={() => {}} isFavorite={true} onSelect={() => {}} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t.emptyTitle}</h3>
            <p className="text-gray-500">{t.emptyDesc}</p>
            {/* Fixed: Link component now has access to its definition via top-level import */}
            <Link to="/veiculos" className="inline-block mt-6 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
              {t.explore}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserArea;
