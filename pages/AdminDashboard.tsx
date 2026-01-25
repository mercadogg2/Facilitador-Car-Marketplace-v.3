
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Language, Car, UserProfile, UserRole, ProfileStatus, Lead } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';

interface AdminDashboardProps {
  lang: Language;
  role: UserRole;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ lang, role }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'stands' | 'users' | 'ads' | 'leads'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [isTogglingAd, setIsTogglingAd] = useState<string | null>(null);
  
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
        supabase.from('leads').select('*, car:cars(*)').order('created_at', { ascending: false })
      ]);

      if (profilesRes.data) setUsers(profilesRes.data as UserProfile[]);
      if (adsRes.data) setAds(adsRes.data as Car[]);
      if (leadsRes.data) setLeads(leadsRes.data as any[]);

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
    const confirmMsg = newStatus === 'approved' 
      ? "Aprovar este stand profissional?" 
      : newStatus === 'rejected' ? "Rejeitar este stand?" : "Voltar este stand para pendente?";
      
    if (!window.confirm(confirmMsg)) return;

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

  const handleToggleAdVisibility = async (carId: string, currentActive: boolean) => {
    setIsTogglingAd(carId);
    const targetStatus = !currentActive;
    
    try {
      const { error } = await supabase
        .from('cars')
        .update({ active: targetStatus })
        .eq('id', carId);

      if (error) {
        if (error.message.includes('column "active" of relation "cars" does not exist') || error.message.includes('schema cache')) {
          throw new Error('A coluna "active" não existe na sua tabela "cars". Por favor, execute o script SQL no ficheiro lib/supabase.ts no seu painel Supabase para corrigir isto.');
        }
        throw error;
      }
      
      setAds(prev => prev.map(a => a.id === carId ? { ...a, active: targetStatus } : a));
    } catch (err: any) {
      console.error("Erro toggle visibility:", err);
      alert(err.message);
    } finally {
      setIsTogglingAd(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("🚨 PERIGO: Eliminar este utilizador permanentemente? Esta ação não pode ser desfeita.")) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      alert("Erro ao eliminar utilizador: " + err.message);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    if (!window.confirm("Apagar este anúncio permanentemente?")) return;
    try {
      const { error } = await supabase.from('cars').delete().eq('id', carId);
      if (error) throw error;
      setAds(prev => prev.filter(a => a.id !== carId));
    } catch (err: any) {
      alert("Erro ao eliminar anúncio.");
    }
  };

  const filteredStands = useMemo(() => 
    users.filter(u => u.role === UserRole.STAND).filter(u => 
      (u.stand_name || '').toLowerCase().includes(standSearch.toLowerCase()) || 
      (u.email || '').toLowerCase().includes(standSearch.toLowerCase())
    ), [users, standSearch]);

  const filteredUsers = useMemo(() => 
    users.filter(u => u.role !== UserRole.STAND).filter(u => 
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
      ((l as any).stand_name || '').toLowerCase().includes(leadSearch.toLowerCase())
    ), [leads, leadSearch]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <div>
            <h1 className="text-4xl font-black text-slate-900">Admin Central</h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Gestão da Plataforma</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchPlatformData} disabled={refreshing} className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
               <i className={`fas fa-sync-alt ${refreshing ? 'animate-spin' : ''}`}></i>
            </button>
            <nav className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
              {[
                { id: 'overview', label: 'Dashboard' },
                { id: 'stands', label: 'Stands' },
                { id: 'users', label: 'Utilizadores' },
                { id: 'ads', label: 'Anúncios' },
                { id: 'leads', label: 'Leads' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Utilizadores', val: users.length, icon: 'fa-users', color: 'bg-blue-500' },
              { label: 'Stands Aprovados', val: users.filter(u => u.role === UserRole.STAND && u.status === 'approved').length, icon: 'fa-store', color: 'bg-green-500' },
              { label: 'Anúncios Ativos', val: ads.filter(a => a.active).length, icon: 'fa-car', color: 'bg-indigo-500' },
              { label: 'Leads Captadas', val: leads.length, icon: 'fa-comment-alt', color: 'bg-amber-500' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-8 rounded-[35px] shadow-sm border border-slate-100 flex items-center gap-6">
                <div className={`w-16 h-16 ${stat.color} text-white rounded-2xl flex items-center justify-center text-2xl`}>
                  <i className={`fas ${stat.icon}`}></i>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-900">{stat.val}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'stands' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-8 border-b flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
               <h3 className="text-2xl font-black">Lista de Stands Profissionais</h3>
               <div className="relative w-full md:w-96">
                 <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                 <input 
                   type="text" 
                   placeholder="Pesquisar stand ou email..." 
                   className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                   value={standSearch}
                   onChange={(e) => setStandSearch(e.target.value)}
                 />
               </div>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                   <tr>
                     <th className="px-8 py-5">Nome do Stand / Contacto</th>
                     <th className="px-8 py-5">Localização</th>
                     <th className="px-8 py-5 text-center">Status Atual</th>
                     <th className="px-8 py-5 text-right">Gestão de Aprovação</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {filteredStands.map(s => (
                     <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-8 py-6">
                         <p className="font-bold text-slate-900">{s.stand_name}</p>
                         <p className="text-xs text-slate-400">{s.email}</p>
                       </td>
                       <td className="px-8 py-6 text-sm font-medium text-slate-600">
                         {s.location || 'N/A'}
                       </td>
                       <td className="px-8 py-6 text-center">
                          <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                            s.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : 
                            s.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {s.status}
                          </span>
                       </td>
                       <td className="px-8 py-6 text-right">
                         <div className="flex justify-end gap-2">
                           {s.status !== 'approved' && (
                             <button 
                              onClick={() => handleUpdateStatus(s.id, 'approved')} 
                              disabled={isUpdatingStatus === s.id}
                              className="bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all"
                             >
                               Aprovar
                             </button>
                           )}
                           {s.status !== 'rejected' && (
                             <button 
                              onClick={() => handleUpdateStatus(s.id, 'rejected')} 
                              disabled={isUpdatingStatus === s.id}
                              className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                             >
                               Rejeitar
                             </button>
                           )}
                           <button onClick={() => handleDeleteUser(s.id)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all ml-4"><i className="fas fa-trash"></i></button>
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
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-8 border-b flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
               <h3 className="text-2xl font-black">Gestão de Anúncios</h3>
               <input 
                 type="text" 
                 placeholder="Marca, modelo ou stand..." 
                 className="w-full md:w-96 px-6 py-3.5 bg-white border border-slate-100 rounded-2xl text-sm outline-none"
                 value={adSearch}
                 onChange={(e) => setAdSearch(e.target.value)}
               />
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                   <tr>
                     <th className="px-8 py-5">Veículo</th>
                     <th className="px-8 py-5">Stand</th>
                     <th className="px-8 py-5">Preço</th>
                     <th className="px-8 py-5 text-center">Status</th>
                     <th className="px-8 py-5 text-right">Ação</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {filteredAds.map(a => (
                     <tr key={a.id} className={!(a.active ?? true) ? 'opacity-60 grayscale' : ''}>
                       <td className="px-8 py-6 flex items-center gap-4">
                         <img src={a.image} className="w-12 h-10 rounded-lg object-cover" alt="" />
                         <div>
                           <p className="font-bold text-slate-900">{a.brand} {a.model}</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase">{a.year}</p>
                         </div>
                       </td>
                       <td className="px-8 py-6 text-sm font-bold text-indigo-600">{a.stand_name}</td>
                       <td className="px-8 py-6 font-black text-slate-900">{formatCurrency(a.price, lang)}</td>
                       <td className="px-8 py-6 text-center">
                         <button 
                           onClick={() => handleToggleAdVisibility(a.id, a.active ?? true)}
                           disabled={isTogglingAd === a.id}
                           className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${
                             (a.active ?? true) ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                           }`}
                         >
                           {isTogglingAd === a.id ? <i className="fas fa-spinner animate-spin"></i> : (a.active ?? true ? 'Ativo' : 'Oculto')}
                         </button>
                       </td>
                       <td className="px-8 py-6 text-right">
                         <div className="flex justify-end gap-2">
                           <button onClick={() => handleToggleAdVisibility(a.id, a.active ?? true)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600">
                             <i className={`fas ${(a.active ?? true) ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                           </button>
                           <button onClick={() => handleDeleteCar(a.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50"><i className="fas fa-trash"></i></button>
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
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-8 border-b flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
               <h3 className="text-2xl font-black">Histórico de Leads Central</h3>
               <div className="relative w-full md:w-96">
                 <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                 <input 
                   type="text" 
                   placeholder="Pesquisar por cliente ou stand..." 
                   className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                   value={leadSearch}
                   onChange={(e) => setLeadSearch(e.target.value)}
                 />
               </div>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                   <tr>
                     <th className="px-8 py-5">Cliente & Contacto</th>
                     <th className="px-8 py-5">Stand Destino</th>
                     <th className="px-8 py-5">Viatura & Mensagem</th>
                     <th className="px-8 py-5">Data</th>
                     <th className="px-8 py-5 text-center">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {filteredLeads.map(l => (
                     <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-8 py-6">
                         <p className="font-bold text-slate-900">{l.customer_name}</p>
                         <p className="text-xs text-slate-400">{l.customer_phone}</p>
                         <p className="text-[10px] text-blue-500 font-bold">{l.customer_email}</p>
                       </td>
                       <td className="px-8 py-6">
                         <span className="text-sm font-bold text-indigo-600">{(l as any).stand_name}</span>
                       </td>
                       <td className="px-8 py-6 max-w-md">
                         <p className="text-xs text-slate-600 font-black uppercase mb-2">
                           {l.car ? `${l.car.brand} ${l.car.model} (${l.car.year})` : 'Viatura N/A'}
                         </p>
                         <div className="bg-slate-100/50 p-4 rounded-2xl border border-slate-100">
                           <p className="text-xs text-slate-500 italic leading-relaxed">
                             "{l.message}"
                           </p>
                         </div>
                       </td>
                       <td className="px-8 py-6">
                         <p className="text-xs text-slate-400 font-medium">
                           {new Date(l.created_at).toLocaleDateString('pt-PT')}
                         </p>
                         <p className="text-[10px] text-slate-300">
                           {new Date(l.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                         </p>
                       </td>
                       <td className="px-8 py-6 text-center">
                         <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                           l.status === 'Contactado' ? 'bg-indigo-100 text-indigo-600' : 
                           l.status === 'Vendido' ? 'bg-green-100 text-green-600' :
                           'bg-slate-100 text-slate-400'
                         }`}>
                           {l.status}
                         </span>
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
