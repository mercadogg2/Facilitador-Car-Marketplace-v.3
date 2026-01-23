
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Language, Car, UserProfile, UserRole, ProfileStatus, Lead } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';

interface AdminDashboardProps {
  lang: Language;
  role: UserRole;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ lang, role }) => {
  const navigate = useNavigate();
  const tc = TRANSLATIONS[lang].common;

  const [activeTab, setActiveTab] = useState<'overview' | 'ads' | 'users' | 'leads'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  
  const [ads, setAds] = useState<Car[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  
  const [adSearch, setAdSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [leadSearch, setLeadSearch] = useState('');

  const fetchPlatformData = async () => {
    setRefreshing(true);
    try {
      const [profilesRes, adsRes, leadsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('cars').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('*, cars(id, brand, model, image, stand_name)').order('created_at', { ascending: false })
      ]);

      if (profilesRes.data) setUsers(profilesRes.data);
      if (adsRes.data) setAds(adsRes.data);
      if (leadsRes.data) setLeads(leadsRes.data as any);

    } catch (err: any) {
      console.error("Erro Admin Dashboard:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const isAdmin = role === UserRole.ADMIN || session?.user?.email === 'admin@facilitadorcar.pt';

      if (!isAdmin) {
        navigate('/admin/login');
        return;
      }
      fetchPlatformData();
    };
    checkAuth();
  }, [role, navigate]);

  // --- Handlers de Remoção Definitiva ---

  const handleDeleteAd = async (adId: string) => {
    const confirmMsg = lang === 'pt' 
      ? "⚠️ ATENÇÃO: Deseja eliminar este ANÚNCIO definitivamente do sistema? Esta ação é irreversível." 
      : "⚠️ WARNING: Do you want to delete this AD permanently from the system? This action cannot be undone.";
    
    if (!window.confirm(confirmMsg)) return;

    setIsDeletingId(adId);

    try {
      // Deletar usando match explícito
      const { error } = await supabase
        .from('cars')
        .delete()
        .match({ id: adId });

      if (error) throw error;
      
      // Atualizar estado local para refletir a mudança
      setAds(prev => prev.filter(a => a.id !== adId));
      console.log(`Anúncio ${adId} removido com sucesso.`);
    } catch (err: any) {
      console.error("Admin Delete Ad Error:", err);
      alert(lang === 'pt' ? "Falha ao eliminar anúncio no servidor." : "Failed to delete ad on server.");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmMsg = lang === 'pt' 
      ? "🚨 PERIGO: Eliminar este UTILIZADOR/STAND apagará o seu perfil permanentemente. Continuar?" 
      : "🚨 DANGER: Deleting this USER/STAND will remove their profile permanently. Continue?";

    if (!window.confirm(confirmMsg)) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      alert("Erro ao eliminar utilizador: " + err.message);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    const confirmMsg = lang === 'pt' 
      ? "Deseja remover este registo de lead definitivamente?" 
      : "Do you want to remove this lead record permanently?";

    if (!window.confirm(confirmMsg)) return;

    try {
      const { error } = await supabase.from('leads').delete().eq('id', leadId);
      if (error) throw error;
      setLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (err: any) {
      alert("Erro ao eliminar lead: " + err.message);
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: ProfileStatus) => {
    try {
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      alert("Erro ao atualizar status: " + err.message);
    }
  };

  // --- Filtros ---
  const filteredUsers = useMemo(() => 
    users.filter(u => 
      (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) || 
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.stand_name || '').toLowerCase().includes(userSearch.toLowerCase())
    ), [users, userSearch]);

  const filteredAds = useMemo(() => 
    ads.filter(a => 
      (a.brand || '').toLowerCase().includes(adSearch.toLowerCase()) || 
      (a.model || '').toLowerCase().includes(adSearch.toLowerCase()) ||
      (a.stand_name || '').toLowerCase().includes(adSearch.toLowerCase())
    ), [ads, adSearch]);

  const filteredLeads = useMemo(() => 
    leads.filter(l => 
      (l.customer_name || '').toLowerCase().includes(leadSearch.toLowerCase()) || 
      (l.customer_email || '').toLowerCase().includes(leadSearch.toLowerCase()) ||
      (l.customer_phone || '').includes(leadSearch)
    ), [leads, leadSearch]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <div>
            <h1 className="text-4xl font-black text-slate-900">Admin Central</h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Gestão Global da Plataforma</p>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={fetchPlatformData} disabled={refreshing} className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 ${refreshing ? 'animate-spin' : 'hover:text-indigo-600'}`}>
               <i className="fas fa-sync-alt"></i>
             </button>
             <nav className="flex bg-slate-100 p-1.5 rounded-2xl">
              {['overview', 'users', 'ads', 'leads'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all capitalize ${
                    activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab === 'ads' ? 'Anúncios' : tab === 'users' ? 'Utilizadores' : tab}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* --- OVERVIEW TAB --- */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Utilizadores', val: users.length, icon: 'fa-users', color: 'bg-blue-500' },
                { label: 'Stands Ativos', val: users.filter(u => u.role === UserRole.STAND && u.status === 'approved').length, icon: 'fa-store', color: 'bg-green-500' },
                { label: 'Anúncios Ativos', val: ads.length, icon: 'fa-car', color: 'bg-indigo-500' },
                { label: 'Leads Totais', val: leads.length, icon: 'fa-comment-alt', color: 'bg-amber-500' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-[35px] shadow-sm border border-slate-100 flex items-center gap-6">
                  <div className={`w-16 h-16 ${stat.color} text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg`}>
                    <i className={`fas ${stat.icon}`}></i>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-3xl font-black text-slate-900">{stat.val}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                  <h3 className="text-xl font-black mb-6">Aprovação Pendente (Stands)</h3>
                  <div className="space-y-4">
                    {users.filter(u => u.role === UserRole.STAND && u.status === 'pending').map(u => (
                      <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div>
                          <p className="font-bold text-slate-900">{u.stand_name || u.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{u.email}</p>
                        </div>
                        <button onClick={() => setActiveTab('users')} className="text-xs font-black text-indigo-600 hover:underline">Ver Perfil</button>
                      </div>
                    ))}
                    {users.filter(u => u.role === UserRole.STAND && u.status === 'pending').length === 0 && (
                      <p className="text-center text-slate-300 py-8 text-sm italic">Tudo em dia! Sem stands pendentes.</p>
                    )}
                  </div>
               </div>
               
               <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                  <h3 className="text-xl font-black mb-6">Atividade Recente (Leads)</h3>
                  <div className="space-y-4">
                    {leads.slice(0, 5).map(l => (
                      <div key={l.id} className="flex items-center justify-between p-4 border-b border-slate-50">
                        <p className="text-sm font-bold text-slate-700">{l.customer_name} interessado em <span className="text-indigo-600">{l.stand_name}</span></p>
                        <span className="text-[10px] text-slate-300 font-bold">{new Date(l.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* --- USERS TAB --- */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 border-b flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
              <h3 className="text-2xl font-black">Utilizadores & Parceiros</h3>
              <div className="relative w-full md:w-96">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input 
                  type="text" 
                  placeholder="Nome, e-mail ou stand..." 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                  <tr>
                    <th className="px-8 py-5">Perfil / Stand</th>
                    <th className="px-8 py-5">Contacto</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${u.role === UserRole.STAND ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                            {u.role === UserRole.STAND ? 'S' : 'P'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.stand_name || u.full_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{u.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-medium text-slate-600">{u.email}</p>
                        <p className="text-[10px] text-slate-400">{u.phone || 'Sem telemóvel'}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${
                          u.status === 'approved' ? 'bg-green-100 text-green-700' : 
                          u.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          {u.status === 'pending' && (
                            <button onClick={() => handleUpdateUserStatus(u.id, 'approved')} className="w-8 h-8 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm">
                              <i className="fas fa-check"></i>
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="w-8 h-8 bg-white text-slate-300 border border-slate-100 rounded-lg hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all shadow-sm"
                            title="Remover Definitivamente"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- ADS TAB --- */}
        {activeTab === 'ads' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 border-b flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
              <h3 className="text-2xl font-black">Stock Global</h3>
              <input 
                type="text" 
                placeholder="Marca, modelo ou stand..." 
                className="w-full md:w-96 pl-6 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm"
                value={adSearch}
                onChange={(e) => setAdSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                  <tr>
                    <th className="px-8 py-5">Viatura</th>
                    <th className="px-8 py-5">Stand / Lojista</th>
                    <th className="px-8 py-5">Preço</th>
                    <th className="px-8 py-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAds.map(ad => (
                    <tr key={ad.id} className={`hover:bg-slate-50/50 transition-opacity ${isDeletingId === ad.id ? 'opacity-40' : 'opacity-100'}`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <img src={ad.image} className="w-14 h-10 object-cover rounded-lg border border-slate-100" />
                          <div>
                            <p className="font-bold text-slate-900">{ad.brand} {ad.model}</p>
                            <p className="text-[10px] text-slate-400">{ad.year} • {ad.mileage.toLocaleString()} km</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-indigo-600 uppercase tracking-tight">{ad.stand_name}</p>
                        <p className="text-[10px] text-slate-400">{ad.location}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-black text-slate-900">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(ad.price)}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => navigate(`/veiculos/${ad.id}`)} className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                            <i className="fas fa-eye text-xs"></i>
                          </button>
                          <button 
                            disabled={isDeletingId !== null}
                            onClick={() => handleDeleteAd(ad.id)} 
                            className="w-8 h-8 bg-white text-slate-300 border border-slate-100 rounded-lg hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all shadow-sm"
                            title="Apagar Anúncio"
                          >
                            {isDeletingId === ad.id ? <i className="fas fa-circle-notch animate-spin text-xs"></i> : <i className="fas fa-trash text-xs"></i>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- LEADS TAB --- */}
        {activeTab === 'leads' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 border-b flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
              <h3 className="text-2xl font-black">Gestão de Leads</h3>
              <input 
                type="text" 
                placeholder="Pesquisar cliente ou telemóvel..." 
                className="w-full md:w-96 pl-6 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm"
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                  <tr>
                    <th className="px-8 py-5">Cliente & Contacto</th>
                    <th className="px-8 py-5">Destino (Stand)</th>
                    <th className="px-8 py-5">Viatura</th>
                    <th className="px-8 py-5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLeads.map(l => {
                    const carData = (l as any).cars || (l as any).car;
                    return (
                      <React.Fragment key={l.id}>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="font-bold text-slate-900">{l.customer_name}</div>
                            <div className="text-xs text-indigo-600 font-bold">{l.customer_phone}</div>
                            <div className="text-[10px] text-slate-400 lowercase">{l.customer_email}</div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">{l.stand_name}</span>
                          </td>
                          <td className="px-8 py-6">
                            {carData ? (
                              <div>
                                <div className="text-sm font-bold text-slate-800">{carData.brand} {carData.model}</div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Ref: {carData.id.slice(0, 8)}</div>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-300 italic">Viatura Removida</div>
                            )}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setExpandedLead(expandedLead === l.id ? null : l.id)} className="px-4 py-2 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all shadow-sm">
                                {expandedLead === l.id ? 'Ocultar' : 'Mensagem'}
                              </button>
                              <button 
                                onClick={() => handleDeleteLead(l.id)} 
                                className="w-8 h-8 bg-white text-slate-300 border border-slate-100 rounded-lg hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
                                title="Remover Registo"
                              >
                                <i className="fas fa-trash-alt text-xs"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedLead === l.id && (
                          <tr className="bg-indigo-50/20">
                            <td colSpan={4} className="px-8 py-8 animate-in slide-in-from-top-2 duration-300">
                              <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm whitespace-pre-line text-sm text-slate-600 italic">
                                "{l.message}"
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
