
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
  const [allLeadsRaw, setAllLeadsRaw] = useState<any[]>([]);
  
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      const currentStandName = profile?.stand_name?.trim() || user.user_metadata?.stand_name?.trim() || 'Sem Nome';
      const currentStatus = profile?.status || 'pending';
      
      setStandName(currentStandName);
      setStatus(currentStatus);

      // 2. Busca de Diagnóstico
      const { data: rawLeads } = await supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(5);
      setAllLeadsRaw(rawLeads || []);

      // 3. Buscar Meus Leads (Filtro Inteligente)
      let query = supabase.from('leads').select('*');
      
      if (role !== UserRole.ADMIN) {
        query = query.ilike('stand_name', currentStandName);
      }

      const { data: leadsData, error: leadsErr } = await query.order('created_at', { ascending: false });

      if (leadsErr) throw leadsErr;
      setMyLeads(leadsData || []);

    } catch (e: any) {
      console.error("❌ Erro Dashboard:", e.message);
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
        <div className="w-16 h-16 border-b-4 border-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
        <p className="font-black text-gray-400 uppercase tracking-widest text-[10px]">A ler base de dados...</p>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Painel de Diagnóstico */}
        {showDebug && (
          <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl border-4 border-indigo-500/30 animate-in slide-in-from-top-4 duration-500">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black text-indigo-400">Diagnóstico de Leads</h3>
                <p className="text-slate-400 text-sm">Verifique se os dados abaixo coincidem com os leads recebidos.</p>
              </div>
              <button onClick={() => setShowDebug(false)} className="bg-white/10 p-3 rounded-2xl hover:bg-red-500 transition-all">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-4">A sua Identidade</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-black/20 rounded-xl">
                    <span className="text-xs text-slate-400">Nome no Sistema:</span>
                    <span className="text-xs font-mono font-bold text-green-400">"{standName}"</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-4">Últimos Leads Globais (Referência)</h4>
                <div className="space-y-2">
                  {allLeadsRaw.length > 0 ? allLeadsRaw.map((l, i) => (
                    <div key={i} className="flex justify-between text-[10px] p-2 bg-black/20 rounded-lg">
                      <span className="text-slate-400">{l.customer_name}</span>
                      <span className={`font-mono ${l.stand_name?.toLowerCase() === standName.toLowerCase() ? 'text-green-400' : 'text-red-400'}`}>
                        Para: "{l.stand_name}"
                      </span>
                    </div>
                  )) : <p className="text-[10px] text-slate-500">Nenhum dado.</p>}
                </div>
              </div>
            </div>
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
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                  {isApproved ? 'Conta Ativa' : 'Em Verificação'}
                </p>
                <button onClick={() => setShowDebug(!showDebug)} className="ml-4 text-[9px] text-blue-500 font-black uppercase hover:underline">Apoio Técnico</button>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
             <button onClick={fetchStandData} disabled={refreshing} className={`w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 ${refreshing ? 'animate-spin' : 'hover:text-blue-600 hover:bg-blue-50'}`}>
               <i className="fas fa-sync-alt"></i>
             </button>
             {isApproved && (
               <Link to="/anunciar" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-3">
                 <i className="fas fa-plus"></i> Novo Anúncio
               </Link>
             )}
          </div>
        </header>

        {isApproved ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-900 px-4">Pedidos de Contacto ({myLeads.length})</h2>
            
            {myLeads.length === 0 ? (
              <div className="bg-white p-24 rounded-[40px] text-center border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200 text-3xl">
                  <i className="fas fa-envelope-open"></i>
                </div>
                <p className="text-gray-400 font-bold text-lg">Ainda não recebeu leads.</p>
                <p className="text-gray-300 text-sm mt-2 max-w-sm mx-auto font-medium">Os novos pedidos de informação aparecerão aqui instantaneamente.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {myLeads.map(lead => (
                  <div key={lead.id} className={`bg-white rounded-[35px] shadow-sm border transition-all ${expandedLead === lead.id ? 'border-blue-500 ring-8 ring-blue-50' : 'border-gray-100 hover:border-blue-200'}`}>
                    <div className="p-8">
                      <div className="flex flex-col lg:flex-row justify-between gap-8">
                        {/* Informação do Cliente */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <span className="font-black text-2xl text-gray-900">{lead.customer_name}</span>
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Novo Contacto</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-4">
                             {/* STAND NAME EM DESTAQUE */}
                             <div className="flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl border border-gray-800 transition-all shadow-md">
                               <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                                 <i className="fas fa-store text-xs"></i>
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Stand Destino</span>
                                 <span className="font-black text-sm tracking-tight">{lead.stand_name}</span>
                               </div>
                             </div>

                             {/* TELEFONE EM DESTAQUE */}
                             <a 
                               href={`tel:${lead.customer_phone}`} 
                               className="flex items-center gap-3 bg-gray-50 hover:bg-blue-50 text-blue-700 px-5 py-3 rounded-2xl border border-gray-100 transition-all group"
                             >
                               <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                 <i className="fas fa-phone-alt text-xs"></i>
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-[8px] font-black uppercase tracking-widest opacity-60 text-gray-400">Telemóvel</span>
                                 <span className="font-black text-sm tracking-tight">{lead.customer_phone}</span>
                               </div>
                             </a>

                             {/* EMAIL EM DESTAQUE */}
                             <a 
                               href={`mailto:${lead.customer_email}`} 
                               className="flex items-center gap-3 bg-gray-50 hover:bg-indigo-50 text-indigo-700 px-5 py-3 rounded-2xl border border-gray-100 transition-all group"
                             >
                               <div className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                 <i className="fas fa-envelope text-xs"></i>
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-[8px] font-black uppercase tracking-widest opacity-60 text-gray-400">E-mail</span>
                                 <span className="font-black text-sm tracking-tight lowercase">{lead.customer_email}</span>
                               </div>
                             </a>
                          </div>
                        </div>

                        {/* Ações e Data */}
                        <div className="flex flex-col md:flex-row items-center gap-6">
                          <div className="text-right hidden lg:block border-r border-gray-100 pr-6">
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Recebido</p>
                            <p className="text-sm font-bold text-gray-700">{new Date(lead.created_at).toLocaleDateString()}</p>
                          </div>
                          
                          <div className="flex gap-3">
                            <button 
                              onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                              className={`px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-xl ${expandedLead === lead.id ? 'bg-gray-100 text-gray-500 shadow-none' : 'bg-gray-900 text-white shadow-gray-200'}`}
                            >
                              {expandedLead === lead.id ? 'Fechar' : 'Ler Mensagem'}
                            </button>
                            <a 
                              href={`https://wa.me/${lead.customer_phone.replace(/\D/g, '')}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="w-14 h-14 bg-[#25D366] text-white rounded-2xl flex items-center justify-center text-xl shadow-xl shadow-green-100 hover:scale-105 transition-all"
                            >
                              <i className="fab fa-whatsapp"></i>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Conteúdo Expandido */}
                      {expandedLead === lead.id && (
                        <div className="mt-8 pt-8 border-t border-gray-50 animate-in slide-in-from-top-4 duration-500">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                             <div className="md:col-span-2 space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                  <i className="fas fa-quote-left text-blue-500"></i> Mensagem do Interessado
                                </h4>
                                <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 italic text-gray-600 leading-relaxed text-lg">
                                  "{lead.message}"
                                </div>
                             </div>
                             <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resumo do Lead</h4>
                                <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-100">
                                   <p className="text-xs opacity-70 mb-1">ID da Viatura</p>
                                   <p className="font-black text-sm mb-4">#{lead.car_id.slice(0, 8)}</p>
                                   <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase transition-all">Ver Anúncio</button>
                                </div>
                             </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 p-20 rounded-[40px] text-center border border-amber-100">
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
              <i className="fas fa-lock"></i>
            </div>
            <h2 className="text-3xl font-black text-amber-900">Acesso Restrito</h2>
            <p className="text-amber-700 mt-4 max-w-md mx-auto font-medium">Aguarde a ativação oficial do seu stand para gerir os pedidos de contacto.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandDashboard;
