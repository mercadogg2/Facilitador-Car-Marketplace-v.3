
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Language, Car, Lead, UserRole, ProfileStatus } from '../types';
import { TRANSLATIONS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  lang: Language;
  role: UserRole;
}

const StandDashboard: React.FC<DashboardProps> = ({ lang, role }) => {
  const t = TRANSLATIONS[lang].dashboard;
  const tc = TRANSLATIONS[lang].common;
  const navigate = useNavigate();
  const [standName, setStandName] = useState('');
  const [status, setStatus] = useState<ProfileStatus>('approved');
  const [myCars, setMyCars] = useState<Car[]>([]);
  const [myLeads, setMyLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStandData = async () => {
    if (role !== UserRole.STAND && role !== UserRole.ADMIN) {
       navigate('/login');
       return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const profileName = user.user_metadata?.stand_name || 'Stand';
        setStandName(profileName);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', user.id)
          .single();
        
        const currentStatus = profile?.status || user.user_metadata?.status || 'pending';
        setStatus(currentStatus);

        if (currentStatus === 'approved') {
          const { data: carsData } = await supabase
            .from('cars')
            .select('*')
            .eq('user_id', user.id);
          
          if (carsData) setMyCars(carsData);

          const { data: leadsData } = await supabase
            .from('leads')
            .select('*, cars(brand, model)')
            .order('created_at', { ascending: false });

          if (leadsData) setMyLeads(leadsData as any);
        }
      }
    } catch (e) {
      console.error("Dashboard data fetch error", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStandData();
  }, [role, navigate]);

  const handleDeleteCar = async (id: string) => {
    if (!window.confirm(tc.confirmDelete)) return;
    try {
      await supabase.from('cars').delete().eq('id', id);
      setMyCars(prev => prev.filter(car => car.id !== id));
    } catch (err: any) {
      alert('Erro ao remover: ' + err.message);
    }
  };

  const handleCopyLink = (subdomain: string) => {
    const url = `${window.location.origin}/#/v/${subdomain}`;
    navigator.clipboard.writeText(url);
    alert(lang === 'pt' ? 'Link copiado com sucesso!' : 'Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-gray-500 font-medium">{standName}</span>
              <Link 
                to={`/stand/${encodeURIComponent(standName)}`}
                className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 underline"
              >
                Ver Perfil Público
              </Link>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/cliente/editar')}
              className="px-6 py-4 rounded-2xl border border-gray-200 font-black text-gray-600 bg-white hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <i className="fas fa-user-cog"></i>
              {lang === 'pt' ? 'Editar Perfil' : 'Edit Profile'}
            </button>
            <button 
              onClick={() => navigate('/anunciar')}
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              {t.newAd}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black">{t.myVehicles}</h3>
                <span className="text-xs font-bold text-gray-400">{myCars.length} viaturas ativas</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] uppercase font-black tracking-widest text-gray-400 border-b border-gray-50">
                    <tr>
                      <th className="px-4 py-4">Veículo</th>
                      <th className="px-4 py-4">Preço</th>
                      <th className="px-4 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {myCars.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-10 text-center text-gray-400 font-bold">Ainda não tem veículos anunciados.</td>
                      </tr>
                    ) : myCars.map(car => (
                      <tr key={car.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-6">
                          <div className="flex items-center gap-4">
                            <img src={car.image} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="" />
                            <div>
                              <p className="font-bold text-gray-900 leading-tight">{car.brand} {car.model}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{car.year} • {car.fuel}</p>
                              {car.subdomain && (
                                <p className="text-[8px] font-black text-blue-600 uppercase tracking-tighter mt-1">
                                  Link: /v/{car.subdomain}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-6">
                          <span className="font-bold text-blue-600">
                            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(car.price)}
                          </span>
                        </td>
                        <td className="px-4 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            {car.subdomain && (
                              <button 
                                onClick={() => handleCopyLink(car.subdomain!)}
                                className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm flex items-center justify-center transition-all hover:bg-blue-600 hover:text-white"
                                title="Copiar Link Único"
                              >
                                <i className="fas fa-link"></i>
                              </button>
                            )}
                            <Link 
                              to={`/veiculos/${car.id}`}
                              className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-100 shadow-sm flex items-center justify-center transition-all"
                              title="Ver Anúncio"
                            >
                              <i className="fas fa-eye"></i>
                            </Link>
                            <Link 
                              to={`/editar-anuncio/${car.id}`}
                              className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-amber-600 hover:border-amber-100 shadow-sm flex items-center justify-center transition-all"
                              title="Editar Anúncio"
                            >
                              <i className="fas fa-edit"></i>
                            </Link>
                            <button 
                              onClick={() => handleDeleteCar(car.id)}
                              className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-red-600 hover:border-red-100 shadow-sm flex items-center justify-center transition-all"
                              title="Eliminar"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside className="space-y-8">
             <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
               <h3 className="text-xl font-black mb-6">{t.recentLeads}</h3>
               <div className="space-y-4">
                 {myLeads.length === 0 ? (
                   <p className="text-gray-400 text-sm font-medium">Nenhum lead recebido recentemente.</p>
                 ) : myLeads.slice(0, 5).map(lead => (
                   <div key={lead.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <p className="font-bold text-sm text-gray-900">{lead.customer_name}</p>
                     <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase">
                       Interesse: {(lead.cars as any)?.brand} {(lead.cars as any)?.model}
                     </p>
                   </div>
                 ))}
               </div>
             </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default StandDashboard;
