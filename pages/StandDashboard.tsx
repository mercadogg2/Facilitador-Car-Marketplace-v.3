
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Language, Car, UserRole, UserProfile, Lead } from '../types';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  lang: Language;
  role: UserRole;
}

const StandDashboard: React.FC<DashboardProps> = ({ lang, role }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'stock' | 'analytics'>('stock');
  const [adsFilter, setAdsFilter] = useState<'active' | 'hidden'>('active');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myCars, setMyCars] = useState<Car[]>([]);
  const [leadsStats, setLeadsStats] = useState<Record<string, number>>({});
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const fetchStandData = async () => {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData) setProfile(profileData);

      const { data: carsRes } = await supabase
        .from('cars')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const carList = carsRes || [];
      setMyCars(carList);

      // Fetch leads count per car (without data, only count for stats)
      if (carList.length > 0) {
        const carIds = carList.map(c => c.id);
        const { data: leadsData } = await supabase
          .from('leads')
          .select('car_id')
          .in('car_id', carIds);
        
        const stats: Record<string, number> = {};
        leadsData?.forEach(l => {
          stats[l.car_id] = (stats[l.car_id] || 0) + 1;
        });
        setLeadsStats(stats);
      }
    } catch (e: any) {
      console.error("Erro Dashboard:", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredMyCars = useMemo(() => {
    return adsFilter === 'active' 
      ? myCars.filter(c => (c.active ?? true) === true)
      : myCars.filter(c => (c.active ?? true) === false);
  }, [myCars, adsFilter]);

  const totalMetrics = useMemo(() => {
    const views = myCars.reduce((acc, c) => acc + (c.views || 0), 0);
    const leads = Object.values(leadsStats).reduce((acc, val) => acc + val, 0);
    const conv = views > 0 ? ((leads / views) * 100).toFixed(1) : "0";
    return { views, leads, conv };
  }, [myCars, leadsStats]);

  const handleToggleActive = async (carId: string, currentActive: boolean) => {
    setIsToggling(carId);
    const targetStatus = !currentActive;
    try {
      const { error } = await supabase
        .from('cars')
        .update({ active: targetStatus })
        .eq('id', carId);

      if (error) {
        alert(`Não foi possível alterar: ${error.message}`);
        return;
      }
      
      setMyCars(prev => prev.map(c => c.id === carId ? { ...c, active: targetStatus } : c));
    } catch (err: any) {
      alert("Erro inesperado: " + err.message);
    } finally {
      setIsToggling(null);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    if (!window.confirm("ELIMINAR DEFINITIVAMENTE?\nA viatura e todos os contactos serão apagados.")) return;

    setIsDeleting(carId);
    try {
      await supabase.from('leads').delete().eq('car_id', carId);
      const { error } = await supabase.from('cars').delete().eq('id', carId);
      if (error) throw error;
      
      setMyCars(prev => prev.filter(c => c.id !== carId));
      alert("Viatura removida com sucesso.");
    } catch (err: any) {
      alert("Erro ao remover: " + err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  useEffect(() => {
    fetchStandData();
  }, [role]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const isApproved = profile?.status === 'approved' || role === UserRole.ADMIN || profile?.email === 'admin@facilitadorcar.pt';

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        <header className="flex flex-col lg:flex-row justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black overflow-hidden shadow-lg">
              {profile?.profile_image ? <img src={profile.profile_image} className="w-full h-full object-cover" alt="" /> : (profile?.stand_name?.[0] || 'S')}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">{profile?.stand_name || 'Meu Stand'}</h1>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isApproved ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`}></span>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  {isApproved ? 'Stand Verificado' : 'Aguardando Aprovação'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            <button onClick={() => setActiveTab('stock')} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'stock' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Stock</button>
            <button onClick={() => setActiveTab('analytics')} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'analytics' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Analítica</button>
          </div>
          <Link to="/anunciar" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all flex items-center gap-2">
            <i className="fas fa-plus"></i> Novo Anúncio
          </Link>
        </header>

        {isApproved ? (
          <div className="animate-in fade-in duration-500 space-y-8">
            
            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Visitas</p>
                      <h3 className="text-4xl font-black text-slate-900">{totalMetrics.views.toLocaleString()}</h3>
                      <div className="mt-4 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-600" style={{width: '100%'}}></div>
                      </div>
                   </div>
                   <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Interesses (Leads)</p>
                      <h3 className="text-4xl font-black text-indigo-600">{totalMetrics.leads.toLocaleString()}</h3>
                      <p className="text-[10px] text-indigo-400 font-bold mt-2 italic">* Geridas centralmente pelo Facilitador Car</p>
                   </div>
                   <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conversão Média</p>
                      <h3 className="text-4xl font-black text-green-600">{totalMetrics.conv}%</h3>
                      <p className="text-[10px] text-slate-400 font-bold mt-2">Leads por cada visualização</p>
                   </div>
                </div>

                <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-8">
                   <h3 className="text-xl font-black text-slate-900 mb-8">Performance por Viatura</h3>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                         <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                               <th className="pb-4">Viatura</th>
                               <th className="pb-4">Visitas</th>
                               <th className="pb-4">Interesses</th>
                               <th className="pb-4 text-right">Popularidade</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {myCars.sort((a,b) => (b.views || 0) - (a.views || 0)).map(car => (
                               <tr key={car.id} className="group">
                                  <td className="py-6">
                                     <div className="flex items-center gap-4">
                                        <img src={car.image} className="w-12 h-10 rounded-xl object-cover" alt="" />
                                        <div>
                                           <p className="font-black text-slate-900 text-sm">{car.brand} {car.model}</p>
                                           <p className="text-[9px] text-slate-400 font-bold uppercase">{car.price.toLocaleString()}€</p>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="py-6 font-bold text-slate-600 text-sm">
                                     {car.views || 0}
                                  </td>
                                  <td className="py-6">
                                     <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black">
                                        {leadsStats[car.id] || 0}
                                     </span>
                                  </td>
                                  <td className="py-6 text-right">
                                     <div className="inline-flex items-center gap-1">
                                        {[1,2,3,4,5].map(star => (
                                           <div key={star} className={`w-2 h-2 rounded-full ${ (car.views || 0) > (star * 100) ? 'bg-amber-400' : 'bg-slate-100' }`}></div>
                                        ))}
                                     </div>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'stock' && (
              <>
                <div className="flex gap-4 border-b border-slate-100">
                  <button onClick={() => setAdsFilter('active')} className={`pb-4 px-2 text-xs font-black uppercase tracking-widest relative transition-all ${adsFilter === 'active' ? 'text-blue-600' : 'text-slate-400'}`}>
                    Online ({myCars.filter(c => (c.active ?? true)).length})
                    {adsFilter === 'active' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
                  </button>
                  <button onClick={() => setAdsFilter('hidden')} className={`pb-4 px-2 text-xs font-black uppercase tracking-widest relative transition-all ${adsFilter === 'hidden' ? 'text-blue-600' : 'text-slate-400'}`}>
                    Ocultos ({myCars.filter(c => !(c.active ?? true)).length})
                    {adsFilter === 'hidden' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredMyCars.map(car => (
                    <div key={car.id} className={`bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-sm transition-all group ${!(car.active ?? true) ? 'opacity-70' : ''}`}>
                      <div className="relative h-56 bg-slate-100">
                        <img src={car.image} className="w-full h-full object-cover" alt="" />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                           <div className="flex gap-4 text-white">
                              <div className="flex items-center gap-1.5">
                                 <i className="fas fa-eye text-xs opacity-70"></i>
                                 <span className="text-xs font-black">{car.views || 0}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                 <i className="fas fa-bolt text-xs text-amber-400"></i>
                                 <span className="text-xs font-black">{leadsStats[car.id] || 0}</span>
                              </div>
                           </div>
                        </div>

                        <div className="absolute top-5 left-5">
                          <button onClick={() => handleToggleActive(car.id, car.active ?? true)} disabled={isToggling === car.id} className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all ${ (car.active ?? true) ? 'bg-green-600 text-white' : 'bg-slate-900 text-white' }`}>
                            {isToggling === car.id ? <i className="fas fa-spinner animate-spin"></i> : (car.active ?? true ? 'Online' : 'Oculto')}
                          </button>
                        </div>
                        <div className="absolute top-5 right-5 flex gap-2">
                          <Link to={`/editar-anuncio/${car.id}`} className="w-10 h-10 bg-white/90 rounded-xl flex items-center justify-center text-blue-600 shadow-lg"><i className="fas fa-edit"></i></Link>
                          <button onClick={() => handleDeleteCar(car.id)} disabled={isDeleting === car.id} className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg">
                            {isDeleting === car.id ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-trash"></i>}
                          </button>
                        </div>
                      </div>
                      <div className="p-8">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-black text-slate-900 text-lg truncate mr-4">{car.brand} {car.model}</h4>
                          <span className="font-black text-blue-600">{(car.price || 0).toLocaleString()}€</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{car.year} • {car.mileage.toLocaleString()} KM</p>
                      </div>
                    </div>
                  ))}
                  {filteredMyCars.length === 0 && (
                    <div className="col-span-full py-24 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Sem viaturas em stock nesta categoria</div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 p-24 rounded-[60px] text-center border-4 border-dashed border-amber-100">
             <i className="fas fa-user-clock text-4xl text-amber-600 mb-6"></i>
             <h2 className="text-3xl font-black text-amber-900 mb-4">Em Verificação</h2>
             <p className="text-amber-700 max-w-md mx-auto">A sua conta de stand profissional está a ser analisada. Poderá gerir o seu stock assim que for aprovado pela nossa equipa.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandDashboard;
