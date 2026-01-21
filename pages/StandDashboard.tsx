
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
  const navigate = useNavigate();
  const [standName, setStandName] = useState('');
  const [status, setStatus] = useState<ProfileStatus>('pending');
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
      if (!user) throw new Error("Sem sessão ativa");

      // Pegamos o nome do stand do metadado do usuário ou do perfil
      const currentStandName = user.user_metadata?.stand_name;
      setStandName(currentStandName || 'O Meu Stand');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('status, role, stand_name')
        .eq('id', user.id)
        .single();
      
      const finalStandName = profile?.stand_name || currentStandName;
      if (finalStandName) setStandName(finalStandName);

      const currentStatus = profile?.status || 'pending';
      setStatus(currentStatus);

      // Se aprovado ou admin, buscamos os leads pelo NOME do stand
      if (currentStatus === 'approved' || profile?.role === UserRole.ADMIN) {
        console.log("🔍 Procurando leads para o stand:", finalStandName);
        
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .eq('stand_name', finalStandName)
          .order('created_at', { ascending: false });

        if (!leadsError && leadsData) {
          console.log("✅ Leads encontrados:", leadsData.length);
          setMyLeads(leadsData as Lead[]);
        } else if (leadsError) {
          console.error("❌ Erro ao buscar leads:", leadsError);
        }
      }
    } catch (e: any) {
      console.error("Erro Dashboard:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandData();
  }, [role]);

  const isApproved = status === 'approved' || role === UserRole.ADMIN;

  if (loading) return (
    <div className="p-20 text-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="font-black text-blue-600 animate-pulse">A carregar o seu painel...</p>
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
              <h1 className="text-3xl font-black text-gray-900">{standName}</h1>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isApproved ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                <p className="text-gray-400 text-sm font-bold">{isApproved ? 'Conta Verificada' : 'Aguardando Aprovação'}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
             <button onClick={fetchStandData} className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all hover:bg-blue-50">
               <i className="fas fa-sync-alt"></i>
             </button>
             {isApproved && (
               <Link to="/anunciar" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-3">
                 <i className="fas fa-plus"></i> {t.newAd}
               </Link>
             )}
          </div>
        </header>

        {isApproved ? (
          <div className="space-y-6">
            <div className="flex justify-between items-end px-4">
              <h2 className="text-2xl font-black text-gray-900">Pedidos de Contacto ({myLeads.length})</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Atualizado agora</p>
            </div>
            
            {myLeads.length === 0 ? (
              <div className="bg-white p-24 rounded-[40px] text-center border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200 text-3xl">
                  <i className="fas fa-ghost"></i>
                </div>
                <p className="text-gray-400 font-bold text-lg">Ainda sem pedidos.</p>
                <p className="text-gray-300 text-sm mt-1">Os contactos dos clientes aparecerão aqui assim que demonstrarem interesse.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {myLeads.map(lead => (
                  <div key={lead.id} className={`bg-white p-6 rounded-[30px] shadow-sm border transition-all ${expandedLead === lead.id ? 'border-blue-400 ring-4 ring-blue-50' : 'border-gray-100 hover:border-blue-200'}`}>
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-xl text-gray-900">{lead.customer_name}</span>
                          <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Pendente</span>
                        </div>
                        <div className="flex flex-wrap gap-6 text-sm font-bold text-gray-500">
                           <span className="flex items-center gap-2"><i className="fas fa-phone text-blue-500"></i>{lead.customer_phone}</span>
                           <span className="flex items-center gap-2"><i className="fas fa-envelope text-blue-500"></i>{lead.customer_email}</span>
                           <span className="text-gray-300 font-medium bg-gray-50 px-2 py-0.5 rounded-lg">Ref: {lead.car_id.slice(0,8)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Recebido em</p>
                          <p className="text-sm font-bold text-gray-600">{new Date(lead.created_at).toLocaleDateString()}</p>
                        </div>
                        <button 
                          onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                          className={`px-8 py-3 rounded-xl font-black text-xs transition-all ${expandedLead === lead.id ? 'bg-gray-100 text-gray-500' : 'bg-gray-900 text-white shadow-lg'}`}
                        >
                          {expandedLead === lead.id ? 'Fechar' : 'Ver Mensagem'}
                        </button>
                      </div>
                    </div>

                    {expandedLead === lead.id && (
                      <div className="mt-6 p-8 bg-blue-50/50 rounded-3xl border border-blue-100 animate-in slide-in-from-top-4 duration-300">
                        <div className="mb-6">
                          <p className="text-blue-900 font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                            <i className="fas fa-comment-alt"></i> Mensagem do Cliente:
                          </p>
                          <p className="text-gray-700 whitespace-pre-line text-base leading-relaxed italic bg-white p-6 rounded-2xl shadow-sm">
                            "{lead.message}"
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                           <a href={`https://wa.me/${lead.customer_phone.replace(/\D/g, '')}`} target="_blank" className="bg-[#25D366] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 shadow-lg hover:brightness-110 transition-all">
                             <i className="fab fa-whatsapp text-lg"></i> Responder via WhatsApp
                           </a>
                           <a href={`mailto:${lead.customer_email}`} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 shadow-lg hover:bg-blue-700 transition-all">
                             <i className="fas fa-reply"></i> Responder via Email
                           </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 p-20 rounded-[40px] text-center border border-amber-100">
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
              <i className="fas fa-user-clock"></i>
            </div>
            <h2 className="text-3xl font-black text-amber-900">Perfil em Verificação</h2>
            <p className="text-amber-700 mt-4 max-w-md mx-auto font-medium">
              Obrigado por se juntar ao Facilitador Car! A nossa equipa está a analisar os dados do seu stand. Receberá acesso total assim que for aprovado.
            </p>
            <div className="mt-8 flex justify-center gap-4">
               <span className="text-amber-600 text-xs font-bold uppercase tracking-widest bg-amber-100/50 px-4 py-2 rounded-full">Status: {status}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandDashboard;
