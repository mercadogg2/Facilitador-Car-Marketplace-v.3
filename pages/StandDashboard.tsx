
import React, { useEffect, useState } from 'react';
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myLeads, setMyLeads] = useState<Lead[]>([]);
  const [myCars, setMyCars] = useState<Car[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [isUpdatingLead, setIsUpdatingLead] = useState<string | null>(null);

  const fetchStandData = async () => {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }

      const currentStandName = profileData?.stand_name?.trim() || user.user_metadata?.stand_name?.trim() || 'Sem Nome';

      const { data: leadsData } = await supabase
        .from('leads')
        .select('*, cars(id, brand, model)')
        .ilike('stand_name', currentStandName)
        .order('created_at', { ascending: false });

      setMyLeads(leadsData || []);

      const { data: carsData } = await supabase
        .from('cars')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setMyCars(carsData || []);

    } catch (e: any) {
      console.error("Erro Dashboard:", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleLeadStatus = async (leadId: string, currentStatus: string) => {
    setIsUpdatingLead(leadId);
    const newStatus = currentStatus === 'Contactado' ? 'Pendente' : 'Contactado';
    
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) throw error;
      setMyLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus as any } : l));
    } catch (err: any) {
      alert(lang === 'pt' ? "Erro ao atualizar lead." : "Error updating lead.");
    } finally {
      setIsUpdatingLead(null);
    }
  };

  const handleToggleActive = async (carId: string, currentActive: boolean) => {
    setIsToggling(carId);
    const targetStatus = !currentActive;
    
    try {
      const { error } = await supabase
        .from('cars')
        .update({ active: targetStatus })
        .eq('id', carId);

      if (error) throw error;
      
      // Atualização imediata do estado local para refletir na UI
      setMyCars(prev => prev.map(c => c.id === carId ? { ...c, active: targetStatus } : c));
    } catch (err: any) {
      console.error("Erro ao alternar status:", err);
      alert(lang === 'pt' ? "Erro ao alterar visibilidade: " + err.message : "Error changing visibility.");
    } finally {
      setIsToggling(null);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    const confirmMsg = lang === 'pt' 
      ? "Deseja remover este anúncio definitivamente? Todas as leads associadas serão também removidas." 
      : "Delete this ad permanently? All associated leads will also be removed.";
    
    if (!window.confirm(confirmMsg)) return;

    setIsDeleting(carId);
    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId);

      if (error) throw error;
      
      // Remove do estado local para feedback instantâneo
      setMyCars(prev => prev.filter(c => c.id !== carId));
    } catch (err: any) {
      console.error("Erro ao eliminar car:", err);
      alert(lang === 'pt' 
        ? "Erro ao eliminar: Pode haver um problema de ligação ou permissões." 
        : "Error deleting.");
    } finally {
      setIsDeleting(null);
    }
  };

  useEffect(() => {
    fetchStandData();
  }, [role]);

  const isApproved = profile?.status === 'approved' || role === UserRole.ADMIN;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex flex-col lg:flex-row justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black overflow-hidden shadow-lg">
              {profile?.profile_image ? (
                <img src={profile.profile_image} className="w-full h-full object-cover" alt="Logo" />
              ) : (
                profile?.stand_name ? profile.stand_name[0] : 'S'
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-gray-900">{profile?.stand_name || 'Sem Nome'}</h1>
                <Link to="/cliente/editar" className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors">
                  <i className="fas fa-cog text-xs"></i>
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isApproved ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                  {isApproved ? 'Stand Verificado' : 'Conta em Análise'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex bg-gray-100 p-1.5 rounded-2xl">
            <button onClick={() => setActiveTab('leads')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'leads' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
              Leads ({myLeads.length})
            </button>
            <button onClick={() => setActiveTab('ads')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'ads' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
              {lang === 'pt' ? 'Anúncios' : 'Ads'} ({myCars.length})
            </button>
          </div>

          <div className="flex gap-4">
             <Link to="/anunciar" className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2">
               <i className="fas fa-plus"></i> Novo Anúncio
             </Link>
          </div>
        </header>

        {isApproved ? (
          <div className="animate-in fade-in duration-500">
            {activeTab === 'leads' ? (
              <div className="space-y-6">
                {myLeads.length === 0 ? (
                  <div className="bg-white p-20 rounded-[40px] text-center border border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold">Sem leads no momento.</p>
                  </div>
                ) : (
                  myLeads.map(lead => (
                    <div key={lead.id} className={`bg-white p-8 rounded-[35px] shadow-sm border border-gray-100 ${lead.status === 'Contactado' ? 'opacity-60' : ''}`}>
                      <div className="flex flex-col lg:flex-row justify-between gap-6">
                        <div className="flex gap-6">
                          <button 
                            onClick={() => handleToggleLeadStatus(lead.id, lead.status)}
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${lead.status === 'Contactado' ? 'bg-green-500 text-white' : 'bg-white text-gray-300'}`}
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <div>
                            <h3 className="text-xl font-black text-gray-900">{lead.customer_name}</h3>
                            <p className="text-sm text-blue-600 font-bold">{lead.customer_phone}</p>
                            <p className="mt-4 text-gray-500 italic bg-gray-50 p-4 rounded-2xl">"{lead.message}"</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCars.map(car => (
                  <div key={car.id} className={`bg-white rounded-[35px] overflow-hidden border border-gray-100 shadow-sm transition-all ${!(car.active ?? true) ? 'opacity-50 grayscale' : ''}`}>
                    <div className="relative h-48">
                      <img src={car.image} className="w-full h-full object-cover" alt="" />
                      <div className="absolute top-4 left-4">
                        <button 
                          onClick={(e) => { e.preventDefault(); handleToggleActive(car.id, car.active ?? true); }}
                          disabled={isToggling === car.id}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all ${ (car.active ?? true) ? 'bg-green-500 text-white' : 'bg-gray-700 text-white' }`}
                        >
                          {isToggling === car.id ? <i className="fas fa-spinner animate-spin"></i> : (car.active ?? true ? 'Visível' : 'Oculto')}
                        </button>
                      </div>
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Link to={`/editar-anuncio/${car.id}`} className="w-10 h-10 bg-white/90 rounded-xl flex items-center justify-center text-blue-600 shadow-lg"><i className="fas fa-edit"></i></Link>
                        <button 
                          onClick={() => handleDeleteCar(car.id)} 
                          disabled={isDeleting === car.id}
                          className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                        >
                          {isDeleting === car.id ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-trash"></i>}
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      <h4 className="font-black text-gray-900">{car.brand} {car.model}</h4>
                      <p className="text-blue-600 font-black">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(car.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 p-20 rounded-[40px] text-center border border-amber-100 text-amber-700">
             <i className="fas fa-clock text-4xl mb-4"></i>
             <h2 className="text-2xl font-black">Aguardando Aprovação</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandDashboard;
