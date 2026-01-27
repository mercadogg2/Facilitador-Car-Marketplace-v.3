
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Language, Car } from '../types';
import { supabase } from '../lib/supabase';

interface VanityCarDetailProps {
  lang: Language;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
}

const VanityCarDetail: React.FC<VanityCarDetailProps> = ({ lang, onToggleFavorite, favorites }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBySlug = async () => {
      try {
        const { data, error } = await supabase
          .from('cars')
          .select('id')
          .eq('subdomain', slug)
          .eq('active', true) // FILTRO CRÍTICO
          .single();
        
        if (data && !error) {
          navigate(`/veiculos/${data.id}`, { replace: true });
        } else {
          navigate('/veiculos');
        }
      } catch (err) {
        navigate('/veiculos');
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchBySlug();
  }, [slug, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400 font-bold animate-pulse">
        {lang === 'pt' ? 'A carregar landing page exclusiva...' : 'Loading exclusive landing page...'}
      </p>
    </div>
  );
};

export default VanityCarDetail;
