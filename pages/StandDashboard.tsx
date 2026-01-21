
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
      if (!user) throw new Error("Sem sessão");

      setStandName(user.user_metadata?.stand_name || 'Stand');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('status, role')
        .eq('id', user.id)
        .single();
      
      const currentStatus = profile?.status || 'pending';
      setStatus(currentStatus);

      if (currentStatus === 'approved' || profile?.role === UserRole.ADMIN) {
        // 1. Busca os carros do stand
        const { data: carsData } = await supabase.from('cars').select('*').eq('user_id', user.id);
        
        if (carsData && carsData.length > 0) {
          setMyCars(carsData);
          const myCarIds = carsData.map(c => c.id);
          
          // 2. Busca leads com join de fallback
          const { data: leadsData, error: leadsError } = await supabase
            .from('leads')
            .select('*, cars(id, brand, model, image)')
            .in('car_id', myCarIds)
            .order('created_at', { ascending: false });

          if (leadsError) {
             console.warn("Stand: Join falhou, tentando busca direta");
             const { data: directLeads } = await supabase.from('leads').select('*').in('car_id', myCarIds).order('created_at', { ascending: false });
             if (directLeads) setMyLeads(directLeads as any);
          } else if (leadsData) {
            setMyLeads(leadsData as any);
          }
        }
      }
    } catch (e: any) {
      console.error("Erro dashboard:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandData();
  }, [role]);

  const isApproved = status === 'approved' || role === UserRole.ADMIN;

  if (loading) return <div className="p-20 text-center animate-pulse font-black">A carregar dados...</div>;

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border">
          <div>
            <h1 className="text-3xl font-black">{standName}</h1>
            <p className="text-gray-500">{isApproved ? 'Painel de Gestão' : 'Aguardando Aprovação'}</p>
          </div>
          <div className="flex gap-4">
             <button onClick={fetchStandData} className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-black uppercase"><i className="fas fa-sync"></i></button>
             {isApproved && <Link to="/anunciar" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">{t.newAd}</Link>}
          </div>
        </header>

        {isApproved ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
               <section className="bg-white p-8 rounded-[40px] shadow-sm border">
                 <h2 className="text-2xl font-black mb-6">Leads Recebidos</h2>
                 <div className="space-y-4">
                   {myLeads.length === 0 ? (
                     <p className="text-gray-400 italic">Nenhuma mensagem recebida ainda.</p>
                   ) : myLeads.map(lead => {
                     const carData = (lead as any).cars || (lead as any).car;
                     return (
                       <div key={lead.id} className="p-6 bg-gray-50 rounded-3xl border">
                         <div className="flex justify-between mb-2">
                           <div>
                             <p className="font-black text-gray-900">{lead.customer_name}</p>
                             <p className="text-xs text-blue-600 font-bold">{lead.customer_phone}</p>
                           </div>
                           <div className="text-right">
                             <p className="text-[10px] text-gray-400 font-black">{new Date(lead.created_at).toLocaleDateString()}</p>
                             <p className="text-xs font-bold text-gray-800">{carData ? `${carData.brand} ${carData.model}` : `Viatura ID: ${lead.car_id}`}</p>
                           </div>
                         </div>
                         <div className="mt-4 pt-4 border-t border-gray-200">
                           <button onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)} className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                             {expandedLead === lead.id ? 'Ocultar Detalhes' : 'Ver Mensagem'}
                           </button>
                           {expandedLead === lead.id && (
                             <div className="mt-4 p-4 bg-white rounded-xl text-sm text-gray-600 leading-relaxed whitespace-pre-line border">
                               {lead.message}
                             </div>
                           )}
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </section>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 p-12 rounded-[40px] text-center">
            <h2 className="text-2xl font-black text-amber-900">Em Aprovação</h2>
            <p className="text-amber-700">Assim que a sua conta for validada pela equipa, poderá ver os leads aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandDashboard;
