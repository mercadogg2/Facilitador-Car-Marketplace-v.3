
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

      // Buscar Meus Leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*, cars(id, brand, model)')
        .ilike('stand_name', currentStandName)
        .order('created_at', { ascending: false });

      setMyLeads(leadsData || []);

      // Buscar Meus Anúncios
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
    try {
      const { error } = await supabase
        .from('cars')
        .update({ active: !currentActive })
        .eq('id', carId);

      if (error) throw error;
      
      setMyCars(prev => prev.map(c => c.id === carId ? { ...c, active: !currentActive } : c));
    } catch (err: any) {
      alert(lang === 'pt' ? "Erro ao alterar visibilidade: " : "Error toggling visibility: " + err.message);
    } finally {
      setIsToggling(null);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    const confirmMsg = lang === 'pt' 
      ? "Deseja remover este anúncio definitivamente? Esta ação não pode ser desfeita." 
      : "Do you want to delete this ad permanently? This action cannot be undone.";
    
    if (!window.confirm(confirmMsg)) return;

    setIsDeleting(carId);

    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .match({ id: carId });

      if (error) throw error;
      
      setMyCars(prev => prev.filter(c => c.id !== carId));
    } catch (err: any) {
      console.error("Erro ao eliminar car:", err);
      alert(lang === 'pt' 
        ? "Erro ao eliminar: Verifique se tem permissões." 
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
        
        <header className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black overflow-hidden">
              {profile?.profile_image ? (
                <img src={profile.profile_image} className="w-full h-full object-cover" alt="Logo" />
              ) : (
                profile?.stand_name ? profile.stand_name[0] : 'S'
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">{profile?.stand_name || 'Sem Nome'}</h1>
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
                  myLeads.map(lead => {
                    const isContacted = lead.status === 'Contactado';
                    const carData = (lead as any).cars || (lead as any).car;
                    return (
                      <div key={lead.id} className={`bg-white p-8 rounded-[35px] shadow-sm border border-gray-100 hover:border-blue-200 transition-all ${isContacted ? 'opacity-60 grayscale-[0.5]' : 'opacity-100'}`}>
                        <div className="flex flex-col lg:flex-row justify-between gap-6">
                          <div className="flex gap-6">
                            <button 
                              onClick={() => handleToggleLeadStatus(lead.id, lead.status)}
                              disabled={isUpdatingLead === lead.id}
                              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border shrink-0 ${
                                isContacted 
                                  ? 'bg-green-500 text-white border-green-600' 
                                  : 'bg-white text-gray-300 border-gray-100 hover:border-green-400 hover:text-green-500'
                              } shadow-sm`}
                            >
                              {isUpdatingLead === lead.id ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-check text-xl"></i>}
                            </button>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-xl font-black text-gray-900">{lead.customer_name}</h3>
                                {isContacted && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Contactado</span>}
                              </div>
                              <p className="text-sm text-blue-600 font-bold">{lead.customer_phone} • {lead.customer_email}</p>
                              <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <span><i className="far fa-calendar-alt mr-1"></i> {new Date(lead.created_at).toLocaleDateString('pt-PT')}</span>
                                {carData && <span><i className="fas fa-car mr-1"></i> {carData.brand} {carData.model}</span>}
                              </div>
                              <p className="mt-4 text-gray-500 italic bg-gray-50 p-4 rounded-2xl border border-gray-100">"{lead.message}"</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 lg:flex-col lg:justify-center">
                            <a href={`tel:${lead.customer_phone}`} className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-600 border border-gray-100 transition-all"><i className="fas fa-phone"></i></a>
                            <a href={`https://wa.me/${lead.customer_phone.replace(/\D/g, '')}`} target="_blank" className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-500 border border-green-100 transition-all"><i className="fab fa-whatsapp"></i></a>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCars.map(car => (
                  <div key={car.id} className={`bg-white rounded-[35px] overflow-hidden border border-gray-100 shadow-sm group transition-all ${!(car.active ?? true) ? 'opacity-70 bg-gray-50/50' : 'opacity-100'}`}>
                    <div className="relative h-48">
                      <img src={car.image} className={`w-full h-full object-cover transition-all ${!(car.active ?? true) ? 'grayscale' : ''}`} alt="" />
                      
                      <div className="absolute top-4 left-4">
                        <button 
                          onClick={(e) => { e.preventDefault(); handleToggleActive(car.id, car.active ?? true); }}
                          disabled={isToggling === car.id}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 ${ (car.active ?? true) ? 'bg-green-500 text-white' : 'bg-gray-400 text-white' }`}
                        >
                          {isToggling === car.id ? <i className="fas fa-circle-notch animate-spin"></i> : <i className={`fas ${(car.active ?? true) ? 'fa-eye' : 'fa-eye-slash'}`}></i>}
                          {(car.active ?? true) ? (lang === 'pt' ? 'Ativo' : 'Active') : (lang === 'pt' ? 'Inativo' : 'Inactive')}
                        </button>
                      </div>

                      <div className="absolute top-4 right-4 flex gap-2">
                        <Link to={`/editar-anuncio/${car.id}`} className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-blue-600 shadow-lg"><i className="fas fa-edit"></i></Link>
                        <button 
                          disabled={isDeleting !== null}
                          onClick={(e) => { e.preventDefault(); handleDeleteCar(car.id); }} 
                          className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                        >
                          {isDeleting === car.id ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-trash"></i>}
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                         <h4 className="font-black text-gray-900 truncate">{car.brand} {car.model}</h4>
                         {!(car.active ?? true) && <span className="text-[8px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded font-black uppercase">Oculto</span>}
                      </div>
                      <p className="text-blue-600 font-black mt-1">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(car.price)}</p>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                        <span>{car.year} • {car.mileage.toLocaleString()} km</span>
                        <Link to={`/veiculos/${car.id}`} className="text-blue-500 hover:underline">Ver no Site</Link>
                      </div>
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
             <p className="mt-2 font-medium">A sua conta de stand profissional está a ser verificada.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandDashboard;
