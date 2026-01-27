
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Language, Car, Lead, UserRole, ProfileStatus, UserProfile } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  lang: Language;
  role: UserRole;
}

const StandDashboard: React.FC<DashboardProps> = ({ lang, role }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'leads' | 'ads'>('leads');
  const [adsFilter, setAdsFilter] = useState<'active' | 'hidden'>('active');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myLeads, setMyLeads] = useState<Lead[]>([]);
  const [myCars, setMyCars] = useState<Car[]>([]);
  
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

      const currentStandName = profileData?.stand_name?.trim() || user.user_metadata?.stand_name?.trim() || 'Sem Nome';

      const [leadsRes, carsRes] = await Promise.all([
        supabase.from('leads').select('*, cars(id, brand, model)').ilike('stand_name', currentStandName).order('created_at', { ascending: false }),
        supabase.from('cars').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      setMyLeads(leadsRes.data || []);
      setMyCars(carsRes.data || []);
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

  const handleToggleActive = async (carId: string, currentActive: boolean) => {
    setIsToggling(carId);
    const targetStatus = !currentActive;
    try {
      const { error } = await supabase
        .from('cars')
        .update({ active: targetStatus })
        .eq('id', carId);

      if (error) {
        alert(`Não foi possível alterar: ${error.message} (Código: ${error.code})`);
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
    if (!window.confirm("ELIMINAR DEFINITIVAMENTE? Esta viatura e todos os seus pedidos de contacto serão apagados.")) return;

    setIsDeleting(carId);
    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId);

      if (error) {
        console.error("Delete detailed error:", error);
        alert(`ERRO AO APAGAR (${error.code}): ${error.message}\n\nSe o erro for '23503', contacte o administrador para ativar o CASCADE DELETE.`);
        return;
      }
      
      setMyCars(prev => prev.filter(c => c.id !== carId));
      setMyLeads(prev => prev.filter(l => l.car_id !== carId));
    } catch (err: any) {
      alert("Erro ao processar remoção: " + err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  useEffect(() => {
    fetchStandData();
  }, [role]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const isApproved = profile?.status === 'approved' || role === UserRole.ADMIN || profile?.email === 'admin@facilitadorcar.pt';

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
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
            <button onClick={() => setActiveTab('leads')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'leads' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Leads ({myLeads.length})</button>
            <button onClick={() => setActiveTab('ads')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'ads' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Stock ({myCars.length})</button>
          </div>
          <Link to="/anunciar" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all flex items-center gap-2"><i className="fas fa-plus"></i> Novo Anúncio</Link>
        </header>

        {isApproved ? (
          <div className="animate-in fade-in duration-500">
            {activeTab === 'ads' ? (
              <div className="space-y-8">
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
                          <span className="font-black text-blue-600">{formatCurrency(car.price, lang)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{car.year} • {car.mileage.toLocaleString()} KM</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                 {myLeads.length === 0 ? <div className="bg-white p-24 rounded-[40px] text-center border-2 border-dashed border-slate-200 text-gray-400 font-bold">Sem leads no momento.</div> : 
                   myLeads.map(lead => (
                    <div key={lead.id} className={`bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 transition-all ${lead.status === 'Contactado' ? 'bg-slate-50/50 grayscale opacity-60' : ''}`}>
                      <div className="flex flex-col lg:flex-row justify-between gap-8">
                        <div className="flex gap-8 w-full">
                          <div className="w-16 h-16 shrink-0 rounded-[25px] flex items-center justify-center bg-blue-50 text-blue-600 shadow-inner">
                            <i className="fas fa-user"></i>
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-xl font-black text-slate-900">{lead.customer_name}</h3>
                                <p className="text-sm text-blue-600 font-bold">{lead.customer_phone}</p>
                              </div>
                              <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full ${lead.status === 'Contactado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {lead.status}
                              </span>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[30px] border border-slate-100">
                              <p className="text-slate-600 text-sm italic">"{lead.message}"</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                   ))
                 }
              </div>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 p-24 rounded-[60px] text-center border-4 border-dashed border-amber-100">
             <i className="fas fa-user-clock text-4xl text-amber-600 mb-6"></i>
             <h2 className="text-3xl font-black text-amber-900 mb-4">Verificação em Curso</h2>
             <p className="text-amber-700 max-w-md mx-auto">A sua conta está a ser analisada. Poderá gerir o stock assim que for aprovado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const formatCurrency = (amount: number, lang: string) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);

export default StandDashboard;
