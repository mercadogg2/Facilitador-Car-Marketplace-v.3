
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
  const [actionId, setActionId] = useState<string | null>(null);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  
  const [ads, setAds] = useState<Car[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  
  const [adSearch, setAdSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [leadSearch, setLeadSearch] = useState('');

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

  const fetchPlatformData = async () => {
    setLoading(true);
    try {
      console.log("Admin: Sincronizando dados...");
      
      // Busca paralela para velocidade
      const [profilesRes, adsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('cars').select('*').order('created_at', { ascending: false })
      ]);

      // Busca de leads separada com lógica de fallback
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*, cars(id, brand, model, image, stand_name)')
        .order('created_at', { ascending: false });

      if (leadsError) {
        console.warn("Erro ao buscar leads com JOIN, tentando busca simples:", leadsError);
        const { data: simpleLeads } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
        if (simpleLeads) setLeads(simpleLeads as any);
      } else if (leadsData) {
        setLeads(leadsData as any);
      }

      if (profilesRes.data) setUsers(profilesRes.data);
      if (adsRes.data) setAds(adsRes.data);

    } catch (err: any) {
      console.error("Falha Admin Fetch:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: ProfileStatus) => {
    setActionId(userId);
    try {
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
      if (error) throw error;
      setUsers(current => current.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setActionId(null);
    }
  };

  const handleVerifyAd = async (adId: string, verified: boolean) => {
    setActionId(adId);
    try {
      const { error } = await supabase.from('cars').update({ verified }).eq('id', adId);
      if (error) throw error;
      setAds(prev => prev.map(a => a.id === adId ? { ...a, verified } : a));
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setActionId(null);
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!window.confirm(tc.confirmDelete)) return;
    try {
      const { error } = await supabase.from('cars').delete().eq('id', id);
      if (error) throw error;
      setAds(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const filteredUsers = useMemo(() => 
    users.filter(u => {
      const search = userSearch.toLowerCase();
      return (u.full_name || '').toLowerCase().includes(search) || 
             (u.email || '').toLowerCase().includes(search) ||
             (u.stand_name || '').toLowerCase().includes(search);
    }),
  [users, userSearch]);

  const filteredAds = useMemo(() => 
    ads.filter(a => {
      const search = adSearch.toLowerCase();
      return (a.brand || '').toLowerCase().includes(search) ||
             (a.model || '').toLowerCase().includes(search) ||
             (a.stand_name || '').toLowerCase().includes(search);
    }),
  [ads, adSearch]);

  const filteredLeads = useMemo(() => 
    leads.filter(l => {
      const search = leadSearch.toLowerCase();
      return (l.customer_name || '').toLowerCase().includes(search) || 
             (l.customer_email || '').toLowerCase().includes(search) ||
             (l.customer_phone || '').toLowerCase().includes(search);
    }),
  [leads, leadSearch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Admin Central</h1>
            <p className="text-slate-500 font-medium">Marketplace Facilitador Car</p>
          </div>
          <nav className="flex bg-white p-2 rounded-[25px] shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Início', icon: 'fa-chart-pie' },
              { id: 'users', label: 'Utilizadores', icon: 'fa-users' },
              { id: 'ads', label: 'Anúncios', icon: 'fa-car' },
              { id: 'leads', label: 'Leads', icon: 'fa-bolt' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-2xl text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                <i className={`fas ${tab.icon}`}></i>
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4">
            {[
              { label: 'Utilizadores', value: users.length, icon: 'fa-user-friends', color: 'bg-indigo-50 text-indigo-600' },
              { label: 'Anúncios', value: ads.length, icon: 'fa-car-side', color: 'bg-blue-50 text-blue-600' },
              { label: 'Leads Totais', value: leads.length, icon: 'fa-bolt', color: 'bg-amber-50 text-amber-600' },
              { label: 'Pendentes', value: users.filter(u => u.status === 'pending').length, icon: 'fa-clock', color: 'bg-red-50 text-red-600' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-4 text-xl`}>
                  <i className={`fas ${stat.icon}`}></i>
                </div>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-4xl font-black text-slate-900 mt-1">{stat.value}</h3>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
             <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="text-2xl font-black text-slate-900">Utilizadores</h3>
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="px-6 py-3 rounded-2xl bg-slate-50 outline-none w-full md:w-80 text-sm font-bold"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Perfil</th>
                    <th className="px-8 py-5">Estado</th>
                    <th className="px-8 py-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td className="px-8 py-6">
                        <div className="font-bold text-slate-900">{u.full_name || 'Sem nome'}</div>
                        <div className="text-xs text-slate-400">{u.email} ({u.role})</div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full ${
                          u.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleUpdateUserStatus(u.id, 'approved')} className="w-9 h-9 bg-green-50 text-green-600 rounded-lg"><i className="fas fa-check"></i></button>
                          <button onClick={() => handleUpdateUserStatus(u.id, 'rejected')} className="w-9 h-9 bg-red-50 text-red-600 rounded-lg"><i className="fas fa-times"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
             <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="text-2xl font-black text-slate-900">Anúncios</h3>
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="px-6 py-3 rounded-2xl bg-slate-50 outline-none w-full md:w-80 text-sm font-bold"
                value={adSearch}
                onChange={(e) => setAdSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-50">
                  {filteredAds.map(a => (
                    <tr key={a.id}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <img src={a.image} className="w-12 h-12 rounded-xl object-cover" alt="" />
                          <div>
                            <div className="font-bold text-slate-900">{a.brand} {a.model}</div>
                            <div className="text-[10px] text-slate-400 uppercase">{a.year} • {a.stand_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                           <button onClick={() => handleVerifyAd(a.id, !a.verified)} className={`px-4 py-2 rounded-xl text-xs font-black ${a.verified ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                             {a.verified ? 'Verificado' : 'Verificar'}
                           </button>
                           <button onClick={() => handleDeleteAd(a.id)} className="w-10 h-10 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><i className="fas fa-trash-alt"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
             <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-black text-slate-900">Fluxo de Leads</h3>
                <button onClick={fetchPlatformData} className="text-xs font-black uppercase text-indigo-600 hover:underline">
                  <i className="fas fa-sync-alt mr-1"></i> Sincronizar
                </button>
              </div>
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="px-6 py-3 rounded-2xl bg-slate-50 outline-none w-full md:w-80 text-sm font-bold"
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Cliente</th>
                    <th className="px-8 py-5">Veículo / Stand</th>
                    <th className="px-8 py-5">Data</th>
                    <th className="px-8 py-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLeads.length === 0 ? (
                    <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400">Nenhum lead encontrado.</td></tr>
                  ) : filteredLeads.map(l => {
                    const carData = (l as any).cars || (l as any).car;
                    return (
                      <React.Fragment key={l.id}>
                        <tr className="hover:bg-slate-50/20 transition-colors">
                          <td className="px-8 py-6">
                            <div className="font-bold text-slate-900">{l.customer_name}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">{l.customer_email} • {l.customer_phone}</div>
                          </td>
                          <td className="px-8 py-6">
                             {carData ? (
                               <div className="flex items-center gap-3">
                                  <img src={carData.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                                  <div>
                                    <div className="text-sm font-bold text-slate-900">{carData.brand} {carData.model}</div>
                                    <div className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">{carData.stand_name}</div>
                                  </div>
                               </div>
                             ) : (
                               <span className="text-slate-300 italic text-xs">Viatura ID: {l.car_id}</span>
                             )}
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-xs font-bold text-slate-500">{new Date(l.created_at).toLocaleDateString()}</div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button 
                              onClick={() => setExpandedLead(expandedLead === l.id ? null : l.id)}
                              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                            >
                              {expandedLead === l.id ? 'Fechar' : 'Ver Mensagem'}
                            </button>
                          </td>
                        </tr>
                        {expandedLead === l.id && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={4} className="px-8 py-6">
                              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                                  {l.message}
                                </p>
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
