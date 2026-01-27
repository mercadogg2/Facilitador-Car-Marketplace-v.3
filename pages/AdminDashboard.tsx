
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
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'stands' | 'ads' | 'infra'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [isTogglingAd, setIsTogglingAd] = useState<string | null>(null);
  const [isDeletingCar, setIsDeletingCar] = useState<string | null>(null);
  const [isUpdatingLead, setIsUpdatingLead] = useState<string | null>(null);
  
  const [ads, setAds] = useState<Car[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  
  const [adSearch, setAdSearch] = useState('');
  const [standSearch, setStandSearch] = useState('');

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

  const handleUpdateLeadStatus = async (leadId: string, currentStatus: string) => {
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
      alert("Erro ao persistir status do lead: " + err.message);
    } finally {
      setIsUpdatingLead(null);
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: ProfileStatus) => {
    setIsUpdatingStatus(userId);
    try {
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
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
      const { error } = await supabase.from('cars').update({ active: targetStatus }).eq('id', carId);
      if (error) throw error;
      setAds(prev => prev.map(a => a.id === carId ? { ...a, active: targetStatus } : a));
    } catch (err: any) {
      alert("Erro ao alterar visibilidade: " + err.message + "\nCertifique-se que o RLS está correto via aba 'Infra'.");
    } finally {
      setIsTogglingAd(null);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    if (!window.confirm("🚨 ELIMINAÇÃO PERMANENTE: Apagar este anúncio definitivamente?")) return;
    setIsDeletingCar(carId);
    try {
      const { error } = await supabase.from('cars').delete().eq('id', carId);
      if (error) throw error;
      setAds(prev => prev.filter(a => a.id !== carId));
    } catch (err: any) {
      alert("Erro ao apagar: " + err.message);
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
      (u.stand_name || '').toLowerCase().includes(standSearch.toLowerCase())
    ), [users, standSearch]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 gap-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg">
                <i className="fas fa-user-shield"></i>
             </div>
             <div>
                <h1 className="text-4xl font-black text-slate-900 leading-tight">Admin Central</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Painel de Gestão Facilitador</p>
             </div>
          </div>
          <nav className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
            {['overview', 'leads', 'stands', 'ads', 'infra'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                {tab === 'ads' ? 'Anúncios' : tab}
              </button>
            ))}
          </nav>
        </header>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {[
              { label: 'Total Leads', val: leads.length, color: 'bg-blue-600', icon: 'fa-paper-plane' },
              { label: 'Anúncios Ativos', val: ads.filter(a => a.active).length, color: 'bg-green-600', icon: 'fa-car' },
              { label: 'Stands Verificados', val: users.filter(u => u.role === UserRole.STAND && u.status === 'approved').length, color: 'bg-indigo-600', icon: 'fa-store' },
              { label: 'Pendentes', val: users.filter(u => u.status === 'pending').length, color: 'bg-amber-500', icon: 'fa-clock' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                <div className={`${stat.color} w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm mb-4`}>
                  <i className={`fas ${stat.icon}`}></i>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <h4 className="text-3xl font-black text-slate-900 mt-1">{stat.val}</h4>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
              <h3 className="text-2xl font-black">Anúncios da Plataforma</h3>
              <input 
                type="text" 
                placeholder="Pesquisar anúncios..." 
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
                    <th className="px-8 py-5">Stand</th>
                    <th className="px-8 py-5 text-center">Status</th>
                    <th className="px-8 py-5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAds.map(a => (
                    <tr key={a.id} className={`${!(a.active ?? true) ? 'bg-slate-50 opacity-60' : ''} transition-all`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <img src={a.image} className="w-12 h-10 object-cover rounded-lg" alt="" />
                          <div>
                            <p className="font-bold text-slate-900">{a.brand} {a.model}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{a.year} • {formatCurrency(a.price, lang)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-indigo-600">{a.stand_name}</td>
                      <td className="px-8 py-6 text-center">
                        <button 
                          onClick={() => handleToggleAdVisibility(a.id, a.active ?? true)}
                          disabled={isTogglingAd === a.id}
                          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm transition-all active:scale-95 ${ (a.active ?? true) ? 'bg-green-100 text-green-700 hover:bg-green-500 hover:text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-700 hover:text-white' }`}
                        >
                          {isTogglingAd === a.id ? <i className="fas fa-spinner animate-spin"></i> : (a.active ?? true ? 'Ativo' : 'Oculto')}
                        </button>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleDeleteCar(a.id)} 
                          disabled={isDeletingCar === a.id}
                          className="w-10 h-10 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"
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
           <div className="space-y-8 animate-in fade-in duration-500">
             <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-12">
              <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
                <i className="fas fa-tools text-indigo-600"></i>
                Reparação Total de Permissões (Fix Admin & Hide)
              </h3>
              <p className="text-slate-500 mb-8 font-medium">Este script garante que o Administrador (`admin@facilitadorcar.pt`) e os donos de anúncios consigam ocultar/ativar viaturas sem erros de permissão.</p>
              <div className="bg-slate-900 rounded-[30px] p-8 relative group">
                <button 
                  onClick={() => {
                    const code = document.getElementById('sql-code-admin')?.innerText;
                    if (code) {
                      navigator.clipboard.writeText(code);
                      alert("Copiado!");
                    }
                  }}
                  className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold"
                >
                  Copiar SQL
                </button>
                <pre id="sql-code-admin" className="text-indigo-100 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`-- 1. GARANTIR COLUNA ACTIVE E VALORES PADRÃO
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
UPDATE public.cars SET active = true WHERE active IS NULL;

-- 2. RESET DE POLÍTICAS PARA CARROS (Admin tem poder total)
DROP POLICY IF EXISTS "Gestão de Anúncios" ON public.cars;
DROP POLICY IF EXISTS "Dono pode atualizar carro" ON public.cars;
DROP POLICY IF EXISTS "Admin pode gerir tudo" ON public.cars;

-- Política de UPDATE (Permite ao Dono e ao Admin ocultar/ativar)
CREATE POLICY "Gestão de Anúncios" 
ON public.cars 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() = user_id OR 
  (auth.jwt() ->> 'email' = 'admin@facilitadorcar.pt')
)
WITH CHECK (
  auth.uid() = user_id OR 
  (auth.jwt() ->> 'email' = 'admin@facilitadorcar.pt')
);

-- Política de DELETE (Permite ao Dono e ao Admin apagar)
DROP POLICY IF EXISTS "Eliminação de Anúncios" ON public.cars;
CREATE POLICY "Eliminação de Anúncios"
ON public.cars
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id OR 
  (auth.jwt() ->> 'email' = 'admin@facilitadorcar.pt')
);

-- Política de SELECT (Público vê apenas Ativos, Admin vê tudo)
DROP POLICY IF EXISTS "Public can see cars" ON public.cars;
CREATE POLICY "Visualização de Anúncios"
ON public.cars
FOR SELECT
USING (
  active = true OR 
  (auth.jwt() ->> 'email' = 'admin@facilitadorcar.pt') OR
  auth.uid() = user_id
);

NOTIFY pgrst, 'reload schema';`}
                </pre>
              </div>
             </div>
           </div>
        )}

        {activeTab === 'leads' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
             <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-2xl font-black">Histórico de Leads</h3>
              <div className="text-xs font-bold text-slate-400">Total: {leads.length} contactos</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                  <tr>
                    <th className="px-8 py-5">Cliente</th>
                    <th className="px-8 py-5">Interesse / Viatura</th>
                    <th className="px-8 py-5">Stand Destino</th>
                    <th className="px-8 py-5">Data</th>
                    <th className="px-8 py-5 text-right">Status / Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {leads.map(lead => (
                    <tr key={lead.id} className={`hover:bg-slate-50/50 transition-colors ${lead.status === 'Contactado' ? 'opacity-70' : ''}`}>
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-900">{lead.customer_name}</p>
                        <p className="text-xs text-indigo-600 font-bold">{lead.customer_phone}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-8 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                            {lead.car?.image && <img src={lead.car.image} className="w-full h-full object-cover" alt="" />}
                          </div>
                          <p className="text-sm font-bold text-slate-700">
                            {lead.car ? `${lead.car.brand} ${lead.car.model}` : 'Viatura removida'}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-black uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full text-slate-600">
                          {lead.stand_name || 'Particular'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-xs text-slate-400 font-bold">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleUpdateLeadStatus(lead.id, lead.status)}
                          disabled={isUpdatingLead === lead.id}
                          className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full transition-all active:scale-95 ${lead.status === 'Contactado' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                        >
                          {isUpdatingLead === lead.id ? <i className="fas fa-spinner animate-spin"></i> : lead.status}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'stands' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
             <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-2xl font-black">Gestão de Stands</h3>
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
                    <th className="px-8 py-5">Localização / E-mail</th>
                    <th className="px-8 py-5 text-center">Status Atual</th>
                    <th className="px-8 py-5 text-right">Ações de Aprovação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStands.map(stand => (
                    <tr key={stand.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                            {stand.stand_name?.[0] || 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{stand.stand_name}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-black">Membro desde {new Date(stand.created_at).getFullYear()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm">
                        <p className="font-bold text-slate-600">{stand.location || 'Sem Localização'}</p>
                        <p className="text-xs text-slate-400">{stand.email}</p>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${
                          stand.status === 'approved' ? 'bg-green-100 text-green-700' : 
                          stand.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {stand.status === 'approved' ? 'Verificado' : stand.status === 'pending' ? 'Em Análise' : 'Rejeitado'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            disabled={isUpdatingStatus === stand.id || stand.status === 'approved'}
                            onClick={() => handleUpdateUserStatus(stand.id, 'approved')}
                            className="w-10 h-10 rounded-xl bg-green-500 text-white hover:bg-green-600 disabled:opacity-30 transition-all flex items-center justify-center shadow-md shadow-green-100"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button 
                            disabled={isUpdatingStatus === stand.id || stand.status === 'rejected'}
                            onClick={() => handleUpdateUserStatus(stand.id, 'rejected')}
                            className="w-10 h-10 rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-30 transition-all flex items-center justify-center shadow-md shadow-red-100"
                          >
                            <i className="fas fa-times"></i>
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
      </div>
    </div>
  );
};

export default AdminDashboard;
