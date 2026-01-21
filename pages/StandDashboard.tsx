
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
  const [refreshing, setRefreshing] = useState(false);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const fetchStandData = async () => {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // 1. Obter Perfil
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileErr) throw profileErr;

      const currentStandName = profile.stand_name || user.user_metadata?.stand_name || 'Sem Nome';
      const currentStatus = profile.status || 'pending';
      
      setStandName(currentStandName);
      setStatus(currentStatus);

      // 2. Buscar Leads
      // Se for ADMIN, busca tudo. Se for STAND, filtra pelo nome.
      let query = supabase.from('leads').select('*');
      
      if (role !== UserRole.ADMIN) {
        query = query.eq('stand_name', currentStandName);
      }

      const { data: leadsData, error: leadsErr } = await query.order('created_at', { ascending: false });

      if (leadsErr) throw leadsErr;
      
      setMyLeads(leadsData || []);
      console.log(`📊 Dashboard atualizado. Encontrados ${leadsData?.length} leads para "${currentStandName}"`);

    } catch (e: any) {
      console.error("❌ Erro no Dashboard:", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStandData();
  }, [role]);

  const isApproved = status === 'approved' || role === UserRole.ADMIN;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="font-black text-gray-400 animate-pulse uppercase tracking-widest text-xs">Sincronizando Dados...</p>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Debug Panel (Opcional, ajuda a ver por que não aparece) */}
        {showDebug && (
          <div className="bg-black text-green-400 p-6 rounded-3xl font-mono text-[10px] space-y-1 shadow-2xl animate-in slide-in-from-top-4">
            <div className="flex justify-between border-b border-green-900 pb-2 mb-2">
              <span className="font-bold">MODO DIAGNÓSTICO</span>
              <button onClick={() => setShowDebug(false)} className="text-white hover:text-red-500">[FECHAR]</button>
            </div>
            <p>> STAND_NAME_ATUAL: "{standName}"</p>
            <p>> ROLE: {role}</p>
            <p>> STATUS: {status}</p>
            <p>> LEADS_COUNT: {myLeads.length}</p>
            <p>> INFO: Certifique-se de que o nome do stand no anúncio é exatamente igual ao acima.</p>
          </div>
        )}

        <header className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-100">
              {standName[0]}
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">{standName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${isApproved ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                  {isApproved ? 'Conta Verificada' : 'Aguardando Aprovação'}
                </p>
                <button onClick={() => setShowDebug(!showDebug)} className="ml-4 text-[9px] text-gray-300 hover:text-blue-500 font-bold uppercase">Diagnóstico</button>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
             <button 
               onClick={fetchStandData} 
               disabled={refreshing}
               className={`w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all ${refreshing ? 'animate-spin' : 'hover:bg-blue-50'}`}
             >
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
            <div className="flex justify-between items-center px-4">
              <h2 className="text-2xl font-black text-gray-900">Pedidos de Contacto ({myLeads.length})</h2>
              {refreshing && <span className="text-[10px] font-black text-blue-500 animate-pulse uppercase tracking-widest">Atualizando...</span>}
            </div>
            
            {myLeads.length === 0 ? (
              <div className="bg-white p-24 rounded-[40px] text-center border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200 text-3xl">
                  <i className="fas fa-ghost"></i>
                </div>
                <p className="text-gray-400 font-bold text-lg">Nenhum lead encontrado para "{standName}"</p>
                <p className="text-gray-300 text-sm mt-2 max-w-sm mx-auto font-medium">
                  Certifique-se de que os anúncios têm exatamente este nome de stand. Caso contrário, os leads não serão vinculados a esta conta.
                </p>
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
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block mr-4">
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
                           <a href={`https://wa.me/${lead.customer_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 shadow-lg hover:brightness-110 transition-all">
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
              A nossa equipa está a analisar os dados do seu stand. Receberá acesso aos leads assim que for aprovado.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandDashboard;
