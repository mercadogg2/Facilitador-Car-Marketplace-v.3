
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
          .select('status, role')
          .eq('id', user.id)
          .single();
        
        const currentStatus = profile?.status || 'pending';
        setStatus(currentStatus);

        if (currentStatus === 'approved' || profile?.role === UserRole.ADMIN) {
          const { data: carsData } = await supabase
            .from('cars')
            .select('*')
            .eq('user_id', user.id);
          
          if (carsData) setMyCars(carsData);

          const myCarIds = (carsData || []).map(c => c.id);
          
          if (myCarIds.length > 0) {
            const { data: leadsData } = await supabase
              .from('leads')
              .select('*, cars(brand, model)')
              .in('car_id', myCarIds)
              .order('created_at', { ascending: false });

            if (leadsData) setMyLeads(leadsData as any);
          }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isApproved = status === 'approved' || role === UserRole.ADMIN;

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-black text-gray-900">{standName}</h1>
            <p className="text-gray-500 font-medium">
              {isApproved ? t.subtitle : (lang === 'pt' ? 'Aguardando Aprovação' : 'Awaiting Approval')}
            </p>
          </div>
          <div className="flex gap-4">
            <Link to={`/stand/${encodeURIComponent(standName)}`} className="px-6 py-3 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 transition-all text-sm">
              Ver Perfil Público
            </Link>
            {isApproved && (
              <Link to="/anunciar" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all text-sm">
                {t.newAd}
              </Link>
            )}
          </div>
        </header>

        {!isApproved ? (
          <div className="bg-amber-50 border border-amber-100 p-12 rounded-[40px] text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
              <i className="fas fa-clock"></i>
            </div>
            <h2 className="text-2xl font-black text-amber-900 mb-2">Conta Pendente de Verificação</h2>
            <p className="text-amber-700 font-medium">A sua conta de stand profissional está a ser analisada pela nossa equipa de qualidade. Este processo demora normalmente menos de 24 horas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                <h2 className="text-2xl font-black text-gray-900 mb-6">{t.myVehicles}</h2>
                <div className="space-y-4">
                  {myCars.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 font-medium italic">Nenhum veículo anunciado ainda.</div>
                  ) : myCars.map(car => (
                    <div key={car.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100">
                      <img src={car.image} className="w-20 h-20 rounded-xl object-cover" alt="" />
                      <div className="flex-grow">
                        <h4 className="font-bold text-gray-900">{car.brand} {car.model}</h4>
                        <p className="text-sm text-gray-500">{car.year} • {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(car.price)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/editar-anuncio/${car.id}`} className="w-10 h-10 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                          <i className="fas fa-edit text-xs"></i>
                        </Link>
                        <button onClick={() => handleDeleteCar(car.id)} className="w-10 h-10 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all">
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                <h2 className="text-2xl font-black text-gray-900 mb-6">{t.recentLeads}</h2>
                <div className="space-y-4">
                  {myLeads.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 font-medium italic">Ainda não recebeu mensagens de interessados.</div>
                  ) : myLeads.map(lead => (
                    <div key={lead.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex justify-between mb-4">
                        <div>
                          <p className="font-black text-gray-900">{lead.customer_name}</p>
                          <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">Interesse: {(lead.cars as any)?.brand} {(lead.cars as any)?.model}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(lead.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 italic line-clamp-2">"{lead.message}"</p>
                      <div className="flex gap-4">
                         <a href={`mailto:${lead.customer_email}`} className="text-xs font-bold text-blue-600 hover:underline"><i className="fas fa-envelope mr-1"></i> Email</a>
                         <a href={`tel:${lead.customer_phone}`} className="text-xs font-bold text-blue-600 hover:underline"><i className="fas fa-phone mr-1"></i> Ligar</a>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-8">
              <div className="bg-blue-600 p-8 rounded-[40px] text-white shadow-xl shadow-blue-100">
                <h3 className="text-xl font-black mb-6">Resumo Semanal</h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-blue-200 text-xs font-black uppercase tracking-widest mb-1">Leads Novos</p>
                    <p className="text-4xl font-black">{myLeads.length}</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-xs font-black uppercase tracking-widest mb-1">Total Viaturas</p>
                    <p className="text-4xl font-black">{myCars.length}</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandDashboard;
