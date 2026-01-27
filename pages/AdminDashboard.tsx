
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
  
  const [ads, setAds] = useState<Car[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  
  const [adSearch, setAdSearch] = useState('');
  const [standSearch, setStandSearch] = useState('');

  const fetchPlatformData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      // 1. Verificar quem está a tentar ler
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email;

      // 2. Busca direta sem filtros complexos para evitar bloqueio RLS
      const [profilesRes, adsRes, leadsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('cars').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('*, cars(*)').order('created_at', { ascending: false })
      ]);

      if (profilesRes.error) console.error("Erro Perfis:", profilesRes.error);
      if (adsRes.error) console.error("Erro Carros:", adsRes.error);
      if (leadsRes.error) console.error("Erro Leads:", leadsRes.error);

      setUsers(profilesRes.data || []);
      setAds(adsRes.data || []);
      setLeads(leadsRes.data || []);

      if (!profilesRes.data && !adsRes.data && !leadsRes.data) {
        setError("As listas voltaram vazias. Isto indica que o RLS do Supabase está a bloquear a leitura para o seu utilizador.");
      }

    } catch (err: any) {
      setError(`Erro de Sistema: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const handleUpdateUserStatus = async (userId: string, newStatus: ProfileStatus) => {
    try {
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      alert("Erro ao atualizar stand: " + err.message);
    }
  };

  const handleToggleAdVisibility = async (carId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase.from('cars').update({ active: !currentActive }).eq('id', carId);
      if (error) throw error;
      setAds(prev => prev.map(a => a.id === carId ? { ...a, active: !currentActive } : a));
    } catch (err: any) {
      alert("Erro ao alterar visibilidade: " + err.message);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    if (!window.confirm("🚨 APAGAR DEFINITIVAMENTE?\nEste comando removerá a viatura e todos os contactos associados.")) return;
    
    try {
      const { error } = await supabase.from('cars').delete().eq('id', carId);
      
      if (error) {
        // Se der erro 23503, é porque o CASCADE DELETE não está ativo no SQL
        if (error.code === '23503') {
          throw new Error("Não é possível apagar porque existem LEADS associadas. Por favor, execute o SQL V8 na aba 'Reparação' para ativar a eliminação automática.");
        }
        throw error;
      }
      
      // Sucesso: Atualizar UI local
      setAds(prev => prev.filter(a => a.id !== carId));
      setLeads(prev => prev.filter(l => l.car_id !== carId));
      alert("Viatura removida com sucesso.");

    } catch (err: any) {
      alert(`ERRO: ${err.message}`);
    }
  };

  const filteredAds = useMemo(() => 
    ads.filter(a => (a.brand || '').toLowerCase().includes(adSearch.toLowerCase()) || (a.model || '').toLowerCase().includes(adSearch.toLowerCase())), 
    [ads, adSearch]
  );

  const filteredStands = useMemo(() => 
    users.filter(u => u.role === UserRole.STAND && (u.stand_name || '').toLowerCase().includes(standSearch.toLowerCase())),
    [users, standSearch]
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 font-bold">A aceder à infraestrutura...</p>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Central */}
        <header className="flex flex-col lg:flex-row justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 gap-6">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-xl">
                <i className="fas fa-shield-check"></i>
             </div>
             <div>
                <h1 className="text-3xl font-black text-slate-900 leading-tight">Painel Admin</h1>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Controlo de Infraestrutura</p>
             </div>
          </div>
          <nav className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar w-full lg:w-auto">
            {[
              { id: 'overview', label: 'Dashboard', icon: 'fa-chart-pie' },
              { id: 'leads', label: `Leads (${leads.length})`, icon: 'fa-paper-plane' },
              { id: 'stands', label: `Stands (${filteredStands.length})`, icon: 'fa-store' },
              { id: 'ads', label: 'Stock', icon: 'fa-car' },
              { id: 'infra', label: 'Reparação', icon: 'fa-bolt' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <i className={`fas ${tab.icon}`}></i>
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        {/* Diagnóstico de Dados (Visível para ajudar o utilizador) */}
        <div className="grid grid-cols-3 gap-4">
           <div className="bg-white p-4 rounded-3xl border border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase">Leads no DB</p>
              <p className="text-xl font-black text-indigo-600">{leads.length}</p>
           </div>
           <div className="bg-white p-4 rounded-3xl border border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase">Stands no DB</p>
              <p className="text-xl font-black text-indigo-600">{users.filter(u => u.role === 'stand').length}</p>
           </div>
           <div className="bg-white p-4 rounded-3xl border border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase">Carros no DB</p>
              <p className="text-xl font-black text-indigo-600">{ads.length}</p>
           </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[30px] flex items-center gap-4 text-red-700">
            <i className="fas fa-exclamation-triangle text-2xl"></i>
            <div>
              <p className="font-black">Erro de Visibilidade!</p>
              <p className="text-xs opacity-80">{error}</p>
            </div>
            <button onClick={fetchPlatformData} className="ml-auto bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Refresh</button>
          </div>
        )}

        {/* TAB: LEADS */}
        {activeTab === 'leads' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
            <div className="p-8 border-b bg-slate-50/50">
              <h3 className="text-2xl font-black text-slate-900">Listagem de Contactos</h3>
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
                        <p className="text-sm font-bold text-slate-700">
                          {lead.cars ? `${lead.cars.brand} ${lead.cars.model}` : 'Viatura Removida'}
                        </p>
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
                  {leads.length === 0 && (
                    <tr><td colSpan={4} className="p-24 text-center text-slate-400 font-bold">Nenhum contacto listado. Verifique as permissões RLS.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: STANDS */}
        {activeTab === 'stands' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900">Parceiros</h3>
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-sm"
                value={standSearch}
                onChange={(e) => setStandSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                  <tr>
                    <th className="px-8 py-5">Stand</th>
                    <th className="px-8 py-5">Email</th>
                    <th className="px-8 py-5">Estado</th>
                    <th className="px-8 py-5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStands.map(stand => (
                    <tr key={stand.id} className="hover:bg-slate-50/50">
                      <td className="px-8 py-6">
                        <p className="font-black text-slate-900">{stand.stand_name || stand.full_name}</p>
                        <p className="text-[10px] text-slate-400 uppercase">{stand.location || 'Localização Pendente'}</p>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-600">{stand.email}</td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${stand.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {stand.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleUpdateUserStatus(stand.id, stand.status === 'approved' ? 'pending' : 'approved')}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${stand.status === 'approved' ? 'bg-red-50 text-red-600' : 'bg-green-600 text-white'}`}
                        >
                          {stand.status === 'approved' ? 'Suspender' : 'Aprovar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: STOCK */}
        {activeTab === 'ads' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900">Stock Global</h3>
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-sm"
                value={adSearch}
                onChange={(e) => setAdSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                  <tr>
                    <th className="px-8 py-5">Viatura</th>
                    <th className="px-8 py-5">Stand</th>
                    <th className="px-8 py-5 text-right">Acção</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAds.map(a => (
                    <tr key={a.id}>
                      <td className="px-8 py-6">
                        <p className="font-black text-slate-900">{a.brand} {a.model}</p>
                        <p className="text-[10px] text-slate-400 uppercase">{a.year} • {formatCurrency(a.price, lang)}</p>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-indigo-600">{a.stand_name}</td>
                      <td className="px-8 py-6 text-right">
                        <button onClick={() => handleDeleteCar(a.id)} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: INFRA (SQL V8) */}
        {activeTab === 'infra' && (
           <div className="space-y-8 animate-in fade-in">
             <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-12">
              <div className="flex items-center gap-4 mb-8 text-red-600">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-2xl">
                   <i className="fas fa-atom"></i>
                </div>
                <div>
                  <h3 className="text-2xl font-black">Reparação Crítica V8 (Final)</h3>
                  <p className="text-slate-500 font-medium">Este script FORÇA a eliminação em cascata e abre o RLS para o admin.</p>
                </div>
              </div>
              
              <div className="bg-slate-900 rounded-[30px] p-8 relative border-4 border-red-500/20">
                <button 
                  onClick={() => {
                    const code = document.getElementById('sql-code-v8')?.innerText;
                    if (code) {
                      navigator.clipboard.writeText(code);
                      alert("SQL V8 Copiado! Cole no Editor do Supabase.");
                    }
                  }}
                  className="absolute top-6 right-6 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase transition-all shadow-xl active:scale-95"
                >
                  <i className="fas fa-copy mr-2"></i> Copiar SQL V8
                </button>
                <pre id="sql-code-v8" className="text-indigo-100 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`-- 1. CORREÇÃO DE INTEGRIDADE (Permitir apagar carros com leads)
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_car_id_fkey;
ALTER TABLE public.leads 
ADD CONSTRAINT leads_car_id_fkey 
FOREIGN KEY (car_id) 
REFERENCES public.cars(id) 
ON DELETE CASCADE;

-- 2. DESATIVAÇÃO TEMPORÁRIA DE RLS PARA TESTE DE VISIBILIDADE
ALTER TABLE public.cars DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. REMOÇÃO DE POLÍTICAS CONFLITUOSAS ANTIGAS
DROP POLICY IF EXISTS "V7_Admin_All_Cars" ON public.cars;
DROP POLICY IF EXISTS "V7_Admin_All_Leads" ON public.leads;
DROP POLICY IF EXISTS "V7_Admin_All_Profiles" ON public.profiles;

-- 4. REATIVAÇÃO COM BYPASS TOTAL PARA ADMIN@FACILITADORCAR.PT
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin_Bypass_Cars" ON public.cars FOR ALL USING (auth.jwt() ->> 'email' = 'admin@facilitadorcar.pt');
CREATE POLICY "Admin_Bypass_Leads" ON public.leads FOR ALL USING (auth.jwt() ->> 'email' = 'admin@facilitadorcar.pt');
CREATE POLICY "Admin_Bypass_Profiles" ON public.profiles FOR ALL USING (auth.jwt() ->> 'email' = 'admin@facilitadorcar.pt');

-- 5. PERMISSÕES PÚBLICAS BÁSICAS
CREATE POLICY "Public_Select_Cars" ON public.cars FOR SELECT USING (active = true);
CREATE POLICY "Public_Insert_Leads" ON public.leads FOR INSERT WITH CHECK (true);

-- 6. REFRESH SCHEMA
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
