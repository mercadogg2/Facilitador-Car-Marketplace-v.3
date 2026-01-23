
import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';

interface AboutProps {
  lang: Language;
}

const About: React.FC<AboutProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang].about;
  const [stats, setStats] = useState({ stands: 0, cars: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [standsRes, carsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'stand').eq('status', 'approved'),
        supabase.from('cars').select('id', { count: 'exact', head: true }).eq('active', true)
      ]);
      setStats({
        stands: standsRes.count || 0,
        cars: carsRes.count || 0
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-24 pb-20">
      <section className="bg-gray-50 py-24 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4 block">{t.mission}</span>
          <h1 className="text-5xl font-extrabold text-gray-900 mb-8 tracking-tight">{t.title}</h1>
          <p className="text-xl text-gray-600 leading-relaxed">{t.desc}</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {t.values.map((v, i) => (
            <div key={i} className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">
                <i className={`fas ${['fa-shield-check', 'fa-handshake', 'fa-rocket'][i]}`}></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{v.title}</h3>
              <p className="text-gray-500">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-blue-600 rounded-[50px] p-12 md:p-20 text-white flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <h2 className="text-4xl font-bold mb-6">{t.historyTitle}</h2>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">{t.historyDesc}</p>
            <div className="flex gap-4">
              <div className="bg-white/10 rounded-2xl p-6 text-center flex-1 backdrop-blur-sm">
                <div className="text-3xl font-extrabold mb-1">{stats.stands > 0 ? `${stats.stands}+` : '...'}</div>
                <div className="text-xs font-bold uppercase tracking-wider text-blue-200">{t.stats[0]}</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-6 text-center flex-1 backdrop-blur-sm">
                <div className="text-3xl font-extrabold mb-1">{stats.cars > 0 ? `${stats.cars}+` : '...'}</div>
                <div className="text-xs font-bold uppercase tracking-wider text-blue-200">{lang === 'pt' ? 'Viaturas' : 'Vehicles'}</div>
              </div>
            </div>
          </div>
          <div className="md:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800" 
              alt="Road"
              className="rounded-3xl shadow-2xl rotate-3"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
