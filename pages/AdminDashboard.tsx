
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Language, Car, UserProfile, UserRole, ProfileStatus, Lead } from '../types';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';

interface AdminDashboardProps {
  lang: Language;
  role: UserRole;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ lang, role }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'stands' | 'ads' | 'infra'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [isTogglingAd, setIsTogglingAd] = useState<string | null>(null);
  const [isDeletingCar, setIsDeletingCar] = useState<string | null>(null);
  
  const [ads, setAds] = useState<Car[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  
  const [adSearch, setAdSearch] = useState('');
  const [standSearch, setStandSearch] = useState('');

  const fetchPlatformData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      // Busca direta de perfis, carros e leads
      const [profilesRes, adsRes, leadsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('cars').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('*, car:cars(*)').order('created_at', { ascending: false })
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (adsRes.error) throw adsRes.error;
      if (leadsRes.error) throw leadsRes.error;

      setUsers(profilesRes.data as UserProfile[]);
      setAds(adsRes.data as Car[]);
      setLeads(leadsRes.data as any[]);

    } catch (err: any) {
      console.error("Erro Admin Dashboard:", err);
      setError(`Erro ao carregar dados: ${err.message}. Verifique as permissões RLS no Supabase.`);
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

  const handleUpdateUserStatus = async (userId: string, newStatus: ProfileStatus) => {
    setIsUpdatingStatus(userId);
    try {
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      alert("Erro ao atualizar stand: " + err.message);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleToggleAdVisibility = async (carId: string, currentActive: boolean) => {
    setIsTogglingAd(carId);
    const targetStatus = !currentActive;
    try {
      const { error } = await supabase.from('cars').update({ active: targetStatus }).eq('id', carId);
      if (error) throw error;
      setAds(prev => prev.map(a => a.id === carId ? { ...a, active: targetStatus } : a));
    } catch (err: any) {
      alert("Erro ao ocultar anúncio: " + err.message);
    } finally {
      setIsTogglingAd(null);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    if (!window.confirm("🚨 APAGAR DEFINITIVAMENTE? Esta ação remove o carro e todos os seus leads.")) return;
    setIsDeletingCar(carId);
    try {
      const { error } = await supabase.from('cars').delete().eq('id', carId);
      if (error) throw error;
      setAds(prev => prev.filter(a => a.id !== carId));
      setLeads(prev => prev.filter(l => l.car_id !== carId));
    } catch (err: any) {
      alert(`Erro ao eliminar (${err.code}): ${err.message}. Execute o SQL de reparação.`);
    } finally {
      setIsDeletingCar(null);
    }
  };

  const filteredAds = useMemo(() => 
    ads.filter(a => 
      (a.brand || '').toLowerCase().includes(adSearch.toLowerCase()) || 
      (a.model || '').toLowerCase().includes(adSearch.toLowerCase())
    ), [ads, adSearch]);

  const filteredStands = useMemo(() => 
    users.filter(u => 
      u.role === UserRole.STAND && 
      (u.stand_name || u.full_name || '').toLowerCase().includes(standSearch.toLowerCase())
    ), [users, standSearch]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 font-bold animate-pulse">A carregar plataforma...</p>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header com Navegação */}
        <header className="flex flex-col lg:flex-row justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 gap-6">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-indigo-100">
                <i className="fas fa-user-shield"></i>
             </div>
             <div>
                <h1 className="text-3xl font-black text-slate-900 leading-tight">Admin Central</h1>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Gestão Facilitador Car</p>
             </div>
          </div>
          <nav className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar w-full lg:w-auto">
            {[
              { id: 'overview', label: 'Dashboard', icon: 'fa-chart-pie' },
              { id: 'leads', label: 'Leads', icon: 'fa-paper-plane' },
              { id: 'stands', label: 'Stands', icon: 'fa-store' },
              { id: 'ads', label: 'Stock', icon: 'fa-car' },
              { id: 'infra', label: 'Reparação', icon: 'fa-tools' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <i className={`fas ${tab.icon} text-[10px]`}></i>
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        {error && (
          <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[30px] flex items-center gap-4 text-red-700 animate-in shake">
            <i className="fas fa-exclamation-triangle text-2xl"></i>
            <p className="font-bold">{error}</p>
          </div>
        )}

        {/* CONTEÚDO DAS ABAS */}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-500">
             {[
              { label: 'Stock Ativo', val: ads.filter(a => a.active).length, color: 'bg-indigo-600', icon: 'fa-car' },
              { label: 'Leads Totais', val: leads.length, color: 'bg-blue-600', icon: 'fa-paper-plane' },
              { label: 'Stands Parceiros', val: users.filter(u => u.role === UserRole.STAND).length, color: 'bg-slate-900', icon: 'fa-store' },
              { label: 'Aguardando Aprovação', val: users.filter(u => u.status === 'pending' && u.role === UserRole.STAND).length, color: 'bg-amber-500', icon: 'fa-clock' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-100`}>
                  <i className={`fas ${stat.icon}`}></i>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                <h4 className="text-4xl font-black text-slate-900">{stat.val}</h4>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
            <div className="p-8 border-b bg-slate-50/50">
              <h3 className="text-2xl font-black text-slate-900">Histórico de Contactos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Cliente</th>
                    <th className="px-8 py-5">Viatura / Stand</th>
                    <th className="px-8 py-5">Mensagem</th>
                    <th className="px-8 py-5">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {leads.map(lead => (
                    <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <p className="font-black text-slate-900">{lead.customer_name}</p>
                        <p className="text-xs text-indigo-600 font-bold">{lead.customer_phone}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-slate-700">{lead.cars?.brand || 'Viatura Removida'} {lead.cars?.model}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase">{lead.stand_name}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs text-slate-500 italic line-clamp-1">"{lead.message}"</p>
                      </td>
                      <td className="px-8 py-6 text-xs text-slate-400 font-medium">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-bold">Nenhum lead encontrado.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'stands' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900">Gestão de Parceiros</h3>
              <input 
                type="text" 
                placeholder="Pesquisar stand..." 
                className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                value={standSearch}
                onChange={(e) => setStandSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                  <tr>
                    <th className="px-8 py-5">Stand</th>
                    <th className="px-8 py-5">Localização</th>
                    <th className="px-8 py-5">Estado</th>
                    <th className="px-8 py-5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStands.map(stand => (
                    <tr key={stand.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                            {stand.profile_image ? <img src={stand.profile_image} className="w-full h-full object-cover rounded-xl" /> : (stand.stand_name?.[0] || 'S')}
                          </div>
                          <div>
                            <p className="font-black text-slate-900">{stand.stand_name}</p>
                            <p className="text-xs text-slate-400">{stand.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-600">{stand.location || 'Não definida'}</td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${stand.status === 'approved' ? 'bg-green-100 text-green-700' : stand.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {stand.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right space-x-2">
                        {stand.status !== 'approved' && (
                          <button 
                            onClick={() => handleUpdateUserStatus(stand.id, 'approved')}
                            className="bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-green-700 transition-all"
                          >
                            Aprovar
                          </button>
                        )}
                        {stand.status === 'approved' && (
                          <button 
                            onClick={() => handleUpdateUserStatus(stand.id, 'rejected')}
                            className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all"
                          >
                            Suspender
                          </button>
                        )}
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
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900">Controlo de Stock Global</h3>
              <input 
                type="text" 
                placeholder="Pesquisar viatura..." 
                className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                value={adSearch}
                onChange={(e) => setAdSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                  <tr>
                    <th className="px-8 py-5">Viatura</th>
                    <th className="px-8 py-5">Stand Responsável</th>
                    <th className="px-8 py-5 text-center">Estado</th>
                    <th className="px-8 py-5 text-right">Acções</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAds.map(a => (
                    <tr key={a.id} className={`${!(a.active ?? true) ? 'opacity-40 grayscale' : ''} transition-all`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <img src={a.image} className="w-14 h-10 object-cover rounded-xl shadow-sm" alt="" />
                          <div>
                            <p className="font-black text-slate-900">{a.brand} {a.model}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{a.year} • {formatCurrency(a.price, lang)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-indigo-600">{a.stand_name}</td>
                      <td className="px-8 py-6 text-center">
                        <button 
                          onClick={() => handleToggleAdVisibility(a.id, a.active ?? true)}
                          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${ (a.active ?? true) ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600' }`}
                        >
                          {a.active ?? true ? 'Online' : 'Oculto'}
                        </button>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleDeleteCar(a.id)} 
                          disabled={isDeletingCar === a.id}
                          className="w-10 h-10 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center ml-auto"
                        >
                          {isDeletingCar === a.id ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-trash-alt"></i>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'infra' && (
           <div className="space-y-8 animate-in fade-in">
             <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-12">
              <div className="flex items-center gap-4 mb-8 text-red-600">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-2xl">
                   <i className="fas fa-biohazard"></i>
                </div>
                <div>
                  <h3 className="text-2xl font-black">Reset Total de Permissões (V6)</h3>
                  <p className="text-slate-500 font-medium italic">Execute este script se não conseguir ver os leads, stands ou se a eliminação falhar.</p>
                </div>
              </div>
              
              <div className="bg-slate-900 rounded-[30px] p-8 relative border-4 border-red-500/20">
                <button 
                  onClick={() => {
                    const code = document.getElementById('sql-code-v6')?.innerText;
                    if (code) {
                      navigator.clipboard.writeText(code);
                      alert("Copiado! Cole no SQL Editor do Supabase.");
                    }
                  }}
                  className="absolute top-6 right-6 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase transition-all shadow-xl active:scale-95"
                >
                  <i className="fas fa-copy mr-2"></i> Copiar SQL V6
                </button>
                <pre id="sql-code-v6" className="text-indigo-100 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`-- 1. DESATIVAÇÃO NUCLEAR DE RLS (Para resolver visibilidade zero)
ALTER TABLE public.cars DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. RESET DE INTEGRIDADE (Garante CASCADE DELETE em todas as tabelas)
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_car_id_fkey;
ALTER TABLE public.leads 
ADD CONSTRAINT leads_car_id_fkey 
FOREIGN KEY (car_id) 
REFERENCES public.cars(id) 
ON DELETE CASCADE;

-- 3. REATIVAÇÃO COM POLÍTICAS DE BYPASS TOTAL PARA ADMIN
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. LIMPEZA DE POLÍTICAS ANTIGAS
DROP POLICY IF EXISTS "Super_Update_V5" ON public.cars;
DROP POLICY IF EXISTS "Super_Delete_V5" ON public.cars;
DROP POLICY IF EXISTS "Super_Select_V5" ON public.cars;
DROP POLICY IF EXISTS "Leads_Public_Insert" ON public.leads;
DROP POLICY IF EXISTS "Leads_Admin_Control" ON public.leads;
DROP POLICY IF EXISTS "Admin_Full_Control" ON public.profiles;

-- 5. NOVAS POLÍTICAS V6 (Acesso Incondicional para Admin)
-- Admin pode fazer TUDO em TUDO
CREATE POLICY "Admin_God_Mode_Cars" ON public.cars FOR ALL USING (auth.jwt() ->> 'email' = 'admin@facilitadorcar.pt');
CREATE POLICY "Admin_God_Mode_Leads" ON public.leads FOR ALL USING (auth.jwt() ->> 'email' = 'admin@facilitadorcar.pt');
CREATE POLICY "Admin_God_Mode_Profiles" ON public.profiles FOR ALL USING (auth.jwt() ->> 'email' = 'admin@facilitadorcar.pt');

-- Outras permissões necessárias para o funcionamento básico
CREATE POLICY "Public_View_Cars" ON public.cars FOR SELECT USING (active = true);
CREATE POLICY "Public_Insert_Leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Stand_Manage_Own_Cars" ON public.cars FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Stand_View_Own_Leads" ON public.leads FOR SELECT USING (
  stand_name = (SELECT stand_name FROM profiles WHERE id = auth.uid())
);

-- RECARREGAR
NOTIFY pgrst, 'reload schema';`}
                </pre>
              </div>
             </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
