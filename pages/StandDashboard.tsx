
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'leads' | 'stock'>('leads');
  const [standName, setStandName] = useState('');
  const [status, setStatus] = useState<ProfileStatus>('pending');
  const [myLeads, setMyLeads] = useState<Lead[]>([]);
  const [myCars, setMyCars] = useState<Car[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  const fetchStandData = async () => {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      const currentStandName = profile?.stand_name?.trim() || user.user_metadata?.stand_name?.trim() || 'Sem Nome';
      const currentStatus = profile?.status || 'pending';
      
      setStandName(currentStandName);
      setStatus(currentStatus);

      // Buscar Meus Leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
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

  const handleDeleteCar = async (carId: string) => {
    const confirmMsg = lang === 'pt' 
      ? "Deseja remover este anúncio definitivamente? Esta ação não pode ser desfeita." 
      : "Do you want to delete this ad permanently? This action cannot be undone.";
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId);

      if (error) throw error;
      
      // Atualiza estado local
      setMyCars(prev => prev.filter(c => c.id !== carId));
      alert(lang === 'pt' ? "Anúncio removido com sucesso." : "Ad removed successfully.");
    } catch (err: any) {
      alert("Erro ao eliminar: " + err.message);
    }
  };

  useEffect(() => {
    fetchStandData();
  }, [role]);

  const isApproved = status === 'approved' || role === UserRole.ADMIN;

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
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black">
              {standName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">{standName}</h1>
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
            <button onClick={() => setActiveTab('stock')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'stock' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
              Stock ({myCars.length})
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
                    <div key={lead.id} className="bg-white p-8 rounded-[35px] shadow-sm border border-gray-100 hover:border-blue-200 transition-all">
                      <div className="flex flex-col lg:flex-row justify-between gap-6">
                        <div>
                          <h3 className="text-xl font-black text-gray-900">{lead.customer_name}</h3>
                          <p className="text-sm text-blue-600 font-bold">{lead.customer_phone} • {lead.customer_email}</p>
                          <p className="mt-4 text-gray-500 italic">"{lead.message}"</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <a href={`tel:${lead.customer_phone}`} className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-600"><i className="fas fa-phone"></i></a>
                          <a href={`https://wa.me/${lead.customer_phone.replace(/\D/g, '')}`} target="_blank" className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-500"><i className="fab fa-whatsapp"></i></a>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCars.map(car => (
                  <div key={car.id} className="bg-white rounded-[35px] overflow-hidden border border-gray-100 shadow-sm group">
                    <div className="relative h-48">
                      <img src={car.image} className="w-full h-full object-cover" alt="" />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Link to={`/editar-anuncio/${car.id}`} className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-blue-600 shadow-lg"><i className="fas fa-edit"></i></Link>
                        <button onClick={() => handleDeleteCar(car.id)} className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"><i className="fas fa-trash"></i></button>
                      </div>
                    </div>
                    <div className="p-6">
                      <h4 className="font-black text-gray-900 truncate">{car.brand} {car.model}</h4>
                      <p className="text-blue-600 font-black mt-1">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(car.price)}</p>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                        <span>{car.year} • {car.mileage.toLocaleString()} km</span>
                        <Link to={`/veiculos/${car.id}`} className="text-blue-500 hover:underline">Ver no Site</Link>
                      </div>
                    </div>
                  </div>
                ))}
                {myCars.length === 0 && (
                  <div className="col-span-full bg-white p-20 rounded-[40px] text-center border border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold">Ainda não tem veículos anunciados.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 p-20 rounded-[40px] text-center border border-amber-100 text-amber-700">
             <i className="fas fa-clock text-4xl mb-4"></i>
             <h2 className="text-2xl font-black">Aguardando Aprovação</h2>
             <p className="mt-2 font-medium">A sua conta de stand profissional está a ser verificada pela nossa equipa.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandDashboard;
