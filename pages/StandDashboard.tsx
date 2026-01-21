
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Language, Car, Lead, UserRole, ProfileStatus } from '../types';
import { TRANSLATIONS } from '../constants';
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
  const [status, setStatus] = useState<ProfileStatus>('pending');
  const [myCars, setMyCars] = useState<Car[]>([]);
  const [myLeads, setMyLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  const fetchStandData = async () => {
    if (role !== UserRole.STAND && role !== UserRole.ADMIN) {
       navigate('/login');
       return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const profileName = user.user_metadata?.stand_name || 'Stand';
        setStandName(profileName);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('status, role')
          .eq('id', user.id)
          .single();
        
        const currentStatus = profile?.status || 'pending';
        setStatus(currentStatus);

        if (currentStatus === 'approved' || profile?.role === UserRole.ADMIN) {
          // 1. Buscar os carros do stand
          const { data: carsData } = await supabase
            .from('cars')
            .select('*')
            .eq('user_id', user.id);
          
          if (carsData) {
            setMyCars(carsData);
            const myCarIds = carsData.map(c => c.id);
            
            if (myCarIds.length > 0) {
              // 2. Buscar os leads associados a esses carros
              const { data: leadsData, error: leadsError } = await supabase
                .from('leads')
                .select('*, cars(id, brand, model, image)')
                .in('car_id', myCarIds)
                .order('created_at', { ascending: false });

              if (leadsData) {
                setMyLeads(leadsData as any);
              } else if (leadsError) {
                console.error("Erro ao buscar leads:", leadsError);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Erro crítico no fetch do Dashboard:", e);
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
      // Refresh leads to ensure consistency
      fetchStandData();
    } catch (err: any) {
      alert('Erro ao remover: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 font-bold animate-pulse">Carregando Painel...</p>
        </div>
      </div>
    );
  }

  const isApproved = status === 'approved' || role === UserRole.ADMIN;

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-gray-900">{standName}</h1>
              {isApproved && (
                <span className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase px-2 py-1 rounded-lg">Verificado</span>
              )}
            </div>
            <p className="text-gray-500 font-medium">
              {isApproved ? t.subtitle : (lang === 'pt' ? 'Aguardando Aprovação' : 'Awaiting Approval')}
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to={`/stand/${encodeURIComponent(standName)}`} className="px-6 py-3 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 transition-all text-sm">
              <i className="fas fa-external-link-alt mr-2"></i> Perfil Público
            </Link>
            {isApproved && (
              <Link to="/anunciar" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all text-sm">
                <i className="fas fa-plus mr-2"></i> {t.newAd}
              </Link>
            )}
          </div>
        </header>

        {!isApproved ? (
          <div className="bg-amber-50 border border-amber-100 p-12 rounded-[40px] text-center max-w-2xl mx-auto animate-in zoom-in">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl shadow-inner">
              <i className="fas fa-clock"></i>
            </div>
            <h2 className="text-2xl font-black text-amber-900 mb-2">Conta em Verificação</h2>
            <p className="text-amber-700 font-medium leading-relaxed">A sua conta profissional está sob análise. Em breve poderá publicar anúncios e receber leads diretamente no seu painel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Inventário */}
              <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-gray-900">{t.myVehicles}</h2>
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{myCars.length} Ativos</span>
                </div>
                <div className="space-y-4">
                  {myCars.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 font-medium italic border-2 border-dashed border-gray-50 rounded-3xl">
                      Ainda não publicou nenhuma viatura.
                    </div>
                  ) : myCars.map(car => (
                    <div key={car.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100 group">
                      <img src={car.image} className="w-20 h-20 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" alt="" />
                      <div className="flex-grow">
                        <h4 className="font-bold text-gray-900">{car.brand} {car.model}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-500 font-medium">{car.year}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span className="text-sm text-blue-600 font-bold">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(car.price)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/editar-anuncio/${car.id}`} className="w-10 h-10 bg-white text-gray-400 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                          <i className="fas fa-edit text-xs"></i>
                        </Link>
                        <button onClick={() => handleDeleteCar(car.id)} className="w-10 h-10 bg-white text-gray-400 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm">
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Fluxo de Mensagens/Leads */}
              <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-gray-900">{t.recentLeads}</h2>
                  <button onClick={fetchStandData} className="text-[10px] font-black uppercase text-blue-600 hover:underline">
                    <i className="fas fa-sync-alt mr-1"></i> Atualizar
                  </button>
                </div>
                <div className="space-y-4">
                  {myLeads.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 font-medium italic border-2 border-dashed border-gray-50 rounded-3xl">
                      Aguardando as suas primeiras solicitações de clientes.
                    </div>
                  ) : myLeads.map(lead => {
                    const carInfo = lead.cars || lead.car;
                    return (
                      <div key={lead.id} className="p-6 bg-gray-50 rounded-[30px] border border-gray-100 animate-in slide-in-from-bottom-2">
                        <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 font-black shadow-sm">
                              {lead.customer_name[0]}
                            </div>
                            <div>
                              <p className="font-black text-gray-900 text-lg leading-tight">{lead.customer_name}</p>
                              <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Interesse: {carInfo?.brand} {carInfo?.model}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block">{new Date(lead.created_at).toLocaleDateString()}</span>
                            <span className="text-[9px] text-gray-300 font-bold">{new Date(lead.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        </div>
                        
                        <div className={`mt-4 overflow-hidden transition-all duration-300 ${expandedLead === lead.id ? 'max-h-[500px]' : 'max-h-20'}`}>
                          <p className={`text-sm text-gray-600 italic font-medium bg-white p-4 rounded-2xl border border-gray-100 ${expandedLead === lead.id ? '' : 'line-clamp-2'}`}>
                            "{lead.message}"
                          </p>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200/50 pt-4">
                          <div className="flex gap-4">
                             <a href={`mailto:${lead.customer_email}`} className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-2">
                               <i className="fas fa-envelope"></i> E-mail
                             </a>
                             <a href={`tel:${lead.customer_phone}`} className="text-xs font-bold text-green-600 hover:underline flex items-center gap-2">
                               <i className="fas fa-phone"></i> Ligar
                             </a>
                             <a href={`https://wa.me/${lead.customer_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-2">
                               <i className="fab fa-whatsapp"></i> WhatsApp
                             </a>
                          </div>
                          <button 
                            onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900"
                          >
                            {expandedLead === lead.id ? 'Ocultar' : 'Ver Mensagem Completa'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <aside className="space-y-8">
              <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                <h3 className="text-xl font-black mb-8 relative z-10">Performance Geral</h3>
                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-end border-b border-white/10 pb-4">
                    <div>
                      <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Total de Leads</p>
                      <p className="text-4xl font-black">{myLeads.length}</p>
                    </div>
                    <i className="fas fa-bolt text-indigo-300 text-2xl opacity-50"></i>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Em Stock</p>
                      <p className="text-4xl font-black">{myCars.length}</p>
                    </div>
                    <i className="fas fa-car-side text-indigo-300 text-2xl opacity-50"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <h4 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">Suporte Stand</h4>
                <p className="text-xs text-gray-500 leading-relaxed mb-6 font-medium">Precisa de ajuda com os seus anúncios ou com o processo de verificação?</p>
                <button className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-xl font-bold text-sm transition-all">
                  Contactar Gestor
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandDashboard;
