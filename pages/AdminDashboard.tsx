
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
      // 🚀 Garantir que buscamos TODOS os perfis, sem filtros iniciais no select para gerir status no código
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

  const handleUpdateStatus = async (userId: string, newStatus: ProfileStatus) => {
    setIsUpdatingStatus(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;
      
      // Atualizar localmente
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      
      if (newStatus === 'approved') {
        alert("Stand aprovado com sucesso!");
      }
    } catch (err: any) {
      alert("Erro ao atualizar status: " + err.message);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

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
      ? "⚠️ ATENÇÃO: Deseja eliminar este ANÚNCIO definitivamente?" 
      : "⚠️ WARNING: Delete this AD permanently?";
    
    if (!window.confirm(confirmMsg)) return;

    setIsDeletingId(adId);
    try {
      const { error } = await supabase.from('cars').delete().match({ id: adId });
      if (error) throw error;
      setAds(prev => prev.filter(a => a.id !== adId));
    } catch (err: any) {
      console.error("Delete Ad Error:", err);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("🚨 PERIGO: Eliminar este utilizador permanentemente?")) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      alert("Erro ao eliminar utilizador: " + err.message);
    }
  };

  const filteredStands = useMemo(() => 
    users.filter(u => u.role === UserRole.STAND).filter(u => 
      (u.stand_name || '').toLowerCase().includes(standSearch.toLowerCase()) || 
      (u.email || '').toLowerCase().includes(standSearch.toLowerCase())
    ), [users, standSearch]);

  const filteredUsers = useMemo(() => 
    users.filter(u => u.role === UserRole.VISITOR).filter(u => 
      (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) || 
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
    ), [users, userSearch]);

  const filteredAds = useMemo(() => 
    ads.filter(a => 
      (a.brand || '').toLowerCase().includes(adSearch.toLowerCase()) || 
      (a.model || '').toLowerCase().includes(adSearch.toLowerCase())
    ), [ads, adSearch]);

  const filteredLeads = useMemo(() => 
    leads.filter(l => 
      (l.customer_name || '').toLowerCase().includes(leadSearch.toLowerCase()) || 
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
                          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-black overflow-hidden border border-amber-100">
                            {u.profile_image ? <img src={u.profile_image} className="w-full h-full object-cover" /> : (u.stand_name ? u.stand_name[0] : '?')}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.stand_name || u.full_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleUpdateStatus(u.id, 'approved')}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-sm transition-all"
                          >
                            Aprovar
                          </button>
                        </div>
                      </div>
                    ))}
                    {users.filter(u => u.role === UserRole.STAND && u.status === 'pending').length === 0 && (
                      <div className="text-center py-12">
                        <i className="fas fa-check-circle text-green-400 text-4xl mb-4"></i>
                        <p className="text-slate-300 text-sm italic font-medium">Tudo em dia! Sem novos stands para aprovar.</p>
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
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px]">
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
              <h3 className="text-2xl font-black">Lista de Stands</h3>
              <input 
                type="text" 
                placeholder="Pesquisar stand..." 
                className="w-full md:w-96 pl-6 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm"
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
                    <th className="px-8 py-5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStands.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black overflow-hidden">
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
                          s.status === 'approved' ? 'bg-green-100 text-green-700' :
                          s.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3">
                          {s.status === 'pending' && <button onClick={() => handleUpdateStatus(s.id, 'approved')} className="text-xs font-black text-green-600">Aprovar</button>}
                          <button onClick={() => handleDeleteUser(s.id)} className="text-slate-300 hover:text-red-500"><i className="fas fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
