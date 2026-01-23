
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

  const [activeTab, setActiveTab] = useState<'overview' | 'stands' | 'users' | 'ads' | 'leads'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isUpdatingLead, setIsUpdatingLead] = useState<string | null>(null);
  const [isUpdatingFeatured, setIsUpdatingFeatured] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  
  const [ads, setAds] = useState<Car[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  
  const [adSearch, setAdSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [standSearch, setStandSearch] = useState('');
  const [leadSearch, setLeadSearch] = useState('');

  const fetchPlatformData = async () => {
    setRefreshing(true);
    try {
      const [profilesRes, adsRes, leadsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('cars').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('*, cars(id, brand, model, image, stand_name)').order('created_at', { ascending: false })
      ]);

      if (profilesRes.data) setUsers(profilesRes.data as UserProfile[]);
      if (adsRes.data) setAds(adsRes.data as Car[]);
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

  const handleToggleFeatured = async (adId: string, currentFeatured: boolean) => {
    setIsUpdatingFeatured(adId);
    try {
      const { error } = await supabase
        .from('cars')
        .update({ is_featured: !currentFeatured })
        .eq('id', adId);

      if (error) throw error;
      setAds(prev => prev.map(a => a.id === adId ? { ...a, is_featured: !currentFeatured } : a));
    } catch (err: any) {
      alert("Erro ao destacar anúncio: " + err.message);
    } finally {
      setIsUpdatingFeatured(null);
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: ProfileStatus) => {
    setIsUpdatingStatus(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      alert("Erro ao atualizar status: " + err.message);
    } finally {
      setIsUpdatingStatus(null);
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
      
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus as any } : l));
    } catch (err: any) {
      alert("Erro ao atualizar status do lead: " + err.message);
    } finally {
      setIsUpdatingLead(null);
    }
  };

  const handleDeleteAd = async (adId: string) => {
    const confirmMsg = lang === 'pt' 
      ? "⚠️ ATENÇÃO: Deseja eliminar este ANÚNCIO definitivamente do sistema? Esta ação é irreversível." 
      : "⚠️ WARNING: Do you want to delete this AD permanently from the system? This action cannot be undone.";
    
    if (!window.confirm(confirmMsg)) return;

    setIsDeletingId(adId);

    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .match({ id: adId });

      if (error) throw error;
      setAds(prev => prev.filter(a => a.id !== adId));
    } catch (err: any) {
      console.error("Admin Delete Ad Error:", err);
      alert(lang === 'pt' ? "Falha ao eliminar anúncio no servidor." : "Failed to delete ad on server.");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmMsg = lang === 'pt' 
      ? "🚨 PERIGO: Eliminar este UTILIZADOR apagará o seu perfil permanentemente. Continuar?" 
      : "🚨 DANGER: Deleting this USER will remove their profile permanently. Continue?";

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

  const filteredStands = useMemo(() => 
    users.filter(u => u.role === UserRole.STAND).filter(u => 
      (u.stand_name || '').toLowerCase().includes(standSearch.toLowerCase()) || 
      (u.email || '').toLowerCase().includes(standSearch.toLowerCase()) ||
      (u.location || '').toLowerCase().includes(standSearch.toLowerCase())
    ), [users, standSearch]);

  const filteredUsers = useMemo(() => 
    users.filter(u => u.role === UserRole.VISITOR).filter(u => 
      (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) || 
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
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
        
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <div>
            <h1 className="text-4xl font-black text-slate-900">Admin Central</h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Gestão Global da Plataforma</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
             <button onClick={fetchPlatformData} disabled={refreshing} className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 ${refreshing ? 'animate-spin' : 'hover:text-indigo-600'}`}>
               <i className="fas fa-sync-alt"></i>
             </button>
             <nav className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
              {[
                { id: 'overview', label: 'Dashboard' },
                { id: 'stands', label: 'Gestão Stands' },
                { id: 'users', label: 'Clientes' },
                { id: 'ads', label: 'Anúncios' },
                { id: 'leads', label: 'Leads' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                    activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

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
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 font-black">
                            {u.stand_name ? u.stand_name[0] : '?'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.stand_name || u.full_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleUpdateStatus(u.id, 'approved')}
                            className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase"
                          >
                            Aprovar
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(u.id, 'rejected')}
                            className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase"
                          >
                            Rejeitar
                          </button>
                        </div>
                      </div>
                    ))}
                    {users.filter(u => u.role === UserRole.STAND && u.status === 'pending').length === 0 && (
                      <div className="text-center py-8">
                        <i className="fas fa-check-circle text-green-500 text-3xl mb-2"></i>
                        <p className="text-slate-300 text-sm italic">Tudo em dia! Sem stands pendentes.</p>
                      </div>
                    )}
                  </div>
               </div>
               
               <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                  <h3 className="text-xl font-black mb-6">Atividade Recente (Leads)</h3>
                  <div className="space-y-4">
                    {leads.slice(0, 5).map(l => (
                      <div key={l.id} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                            <i className="fas fa-user"></i>
                          </div>
                          <p className="text-sm font-bold text-slate-700">{l.customer_name} interessado em <span className="text-indigo-600">{l.stand_name}</span></p>
                        </div>
                        <span className="text-[10px] text-slate-300 font-bold">{new Date(l.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'stands' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 border-b flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
              <h3 className="text-2xl font-black">Gestão de Stands</h3>
              <input 
                type="text" 
                placeholder="Nome, email ou localidade..." 
                className="w-full md:w-96 pl-6 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                value={standSearch}
                onChange={(e) => setStandSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                  <tr>
                    <th className="px-8 py-5">Stand</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5">Localidade</th>
                    <th className="px-8 py-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStands.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black overflow-hidden border border-indigo-100">
                            {s.profile_image ? <img src={s.profile_image} className="w-full h-full object-cover" /> : (s.stand_name ? s.stand_name[0] : '?')}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{s.stand_name}</p>
                            <p className="text-[10px] text-slate-400">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          s.status === 'approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                          s.status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-sm text-slate-500">{s.location || 'N/D'}</td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3">
                          {s.status === 'pending' && (
                            <button onClick={() => handleUpdateStatus(s.id, 'approved')} className="text-xs font-black text-green-600 hover:text-green-700">Aprovar</button>
                          )}
                          {s.status === 'approved' && (
                            <button onClick={() => handleUpdateStatus(s.id, 'pending')} className="text-xs font-black text-amber-600 hover:text-amber-700">Suspender</button>
                          )}
                          <button onClick={() => handleDeleteUser(s.id)} className="text-slate-300 hover:text-red-600 transition-colors"><i className="fas fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mantidas abas users, ads e leads conforme implementação prévia */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 border-b flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
              <h3 className="text-2xl font-black">Lista de Clientes</h3>
              <input 
                type="text" 
                placeholder="Nome ou email..." 
                className="w-full md:w-96 pl-6 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                  <tr>
                    <th className="px-8 py-5">Utilizador</th>
                    <th className="px-8 py-5">Email</th>
                    <th className="px-8 py-5">Criado em</th>
                    <th className="px-8 py-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <i className="fas fa-user"></i>
                          </div>
                          <p className="font-bold text-slate-900">{u.full_name}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-slate-500">{u.email}</td>
                      <td className="px-8 py-6 text-sm text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-8 py-6 text-right">
                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-300 hover:text-red-600"><i className="fas fa-trash"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 border-b flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
              <h3 className="text-2xl font-black">Gestão de Anúncios</h3>
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
                    <th className="px-8 py-5">Destaque</th>
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
                        <button 
                          onClick={() => handleToggleFeatured(ad.id, ad.is_featured || false)}
                          disabled={isUpdatingFeatured === ad.id}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${ad.is_featured ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-300 border border-slate-200 hover:text-amber-500'}`}
                        >
                          {isUpdatingFeatured === ad.id ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-star"></i>}
                        </button>
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
                    <th className="px-8 py-5">Data</th>
                    <th className="px-8 py-5">Viatura & Stand</th>
                    <th className="px-8 py-5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLeads.map(l => {
                    const carData = (l as any).cars || (l as any).car;
                    const isContacted = l.status === 'Contactado';
                    return (
                      <React.Fragment key={l.id}>
                        <tr className={`hover:bg-slate-50/50 transition-all ${isContacted ? 'opacity-60 bg-slate-50/30' : 'opacity-100'}`}>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => handleToggleLeadStatus(l.id, l.status)}
                                disabled={isUpdatingLead === l.id}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${
                                  isContacted 
                                    ? 'bg-green-500 text-white border-green-600' 
                                    : 'bg-white text-slate-300 border-slate-100 hover:border-green-400 hover:text-green-500'
                                } shadow-sm`}
                                title={isContacted ? 'Marcar como Pendente' : 'Marcar como Contactado'}
                              >
                                {isUpdatingLead === l.id ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-check"></i>}
                              </button>
                              <div>
                                <div className="font-bold text-slate-900">{l.customer_name}</div>
                                <div className="text-xs text-indigo-600 font-bold">{l.customer_phone}</div>
                                <div className="text-[10px] text-slate-400 lowercase">{l.customer_email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-xs font-bold text-slate-500">{new Date(l.created_at).toLocaleDateString('pt-PT')}</p>
                            <p className="text-[10px] text-slate-300">{new Date(l.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</p>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{l.stand_name}</span>
                            {carData ? (
                              <div className="text-xs font-bold text-slate-800">{carData.brand} {carData.model}</div>
                            ) : (
                              <div className="text-xs text-slate-300 italic">Viatura Removida</div>
                            )}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setExpandedLead(expandedLead === l.id ? null : l.id)} className="px-4 py-2 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all shadow-sm">
                                {expandedLead === l.id ? 'Ocultar' : 'Ver Mensagem'}
                              </button>
                              <button 
                                onClick={() => handleDeleteLead(l.id)} 
                                className="w-8 h-8 bg-white text-slate-300 border border-slate-100 rounded-lg hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
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
