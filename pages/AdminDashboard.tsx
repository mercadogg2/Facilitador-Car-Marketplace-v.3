
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

  const handleToggleAdVisibility = async (carId: string, currentActive: boolean) => {
    setIsTogglingAd(carId);
    const targetStatus = !currentActive;
    try {
      const { error } = await supabase
        .from('cars')
        .update({ active: targetStatus })
        .eq('id', carId);

      if (error) {
        alert(`❌ ERRO TÉCNICO (${error.code}): ${error.message}\n\nIsto indica que as políticas RLS não foram atualizadas. Use o script na aba REPARAÇÃO.`);
        return;
      }

      setAds(prev => prev.map(a => a.id === carId ? { ...a, active: targetStatus } : a));
    } catch (err: any) {
      alert("Erro crítico: " + err.message);
    } finally {
      setIsTogglingAd(null);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    if (!window.confirm("🚨 ELIMINAÇÃO NUCLEAR: Deseja apagar permanentemente este anúncio e todos os seus leads?")) return;
    
    setIsDeletingCar(carId);
    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId);

      if (error) {
        console.error("Full Error Object:", error);
        alert(`❌ FALHA NA ELIMINAÇÃO (Código: ${error.code})\n\nMensagem: ${error.message}\n\nSe o código for 23503, o CASCADE DELETE falhou.\nSe for 42501, é falta de permissão Admin.`);
        return;
      }

      setAds(prev => prev.filter(a => a.id !== carId));
      setLeads(prev => prev.filter(l => l.car_id !== carId));
    } catch (err: any) {
      alert("Erro ao apagar: " + err.message);
    } finally {
      setIsDeletingCar(null);
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: ProfileStatus) => {
    setIsUpdatingStatus(userId);
    try {
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      alert("Erro no status do utilizador: " + err.message);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const filteredAds = useMemo(() => 
    ads.filter(a => 
      (a.brand || '').toLowerCase().includes(adSearch.toLowerCase()) || 
      (a.model || '').toLowerCase().includes(adSearch.toLowerCase())
    ), [ads, adSearch]);

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
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Controlo de Infraestrutura V5</p>
             </div>
          </div>
          <nav className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
            {['overview', 'leads', 'stands', 'ads', 'infra'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                {tab === 'ads' ? 'Stock' : tab === 'infra' ? 'Reparação SQL' : tab}
              </button>
            ))}
          </nav>
        </header>

        {activeTab === 'ads' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 border-b flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
              <h3 className="text-2xl font-black text-slate-900">Gestão de Anúncios</h3>
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="w-full md:w-80 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
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
                    <th className="px-8 py-5 text-center">Visibilidade</th>
                    <th className="px-8 py-5 text-right">Eliminar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAds.map(a => (
                    <tr key={a.id} className={`${!(a.active ?? true) ? 'opacity-40 grayscale' : ''} transition-all`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <img src={a.image} className="w-14 h-10 object-cover rounded-xl" alt="" />
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
                          disabled={isTogglingAd === a.id}
                          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${ (a.active ?? true) ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600' }`}
                        >
                          {isTogglingAd === a.id ? <i className="fas fa-spinner animate-spin"></i> : (a.active ?? true ? 'Online' : 'Oculto')}
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
           <div className="space-y-8 animate-in fade-in duration-500">
             <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-12">
              <div className="flex items-center gap-4 mb-8 text-red-600">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-2xl">
                   <i className="fas fa-radiation"></i>
                </div>
                <div>
                  <h3 className="text-2xl font-black">Script de Reparação Nuclear (V5)</h3>
                  <p className="text-slate-500 font-medium">Este script remove todas as restrições e políticas anteriores para garantir integridade total.</p>
                </div>
              </div>
              
              <div className="bg-slate-900 rounded-[30px] p-8 relative group border-4 border-red-500/20">
                <button 
                  onClick={() => {
                    const code = document.getElementById('sql-code-v5')?.innerText;
                    if (code) {
                      navigator.clipboard.writeText(code);
                      alert("Copiado! Siga para o SQL Editor no Supabase.");
                    }
                  }}
                  className="absolute top-6 right-6 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase transition-all shadow-xl active:scale-95"
                >
                  <i className="fas fa-copy mr-2"></i> Copiar SQL V5
                </button>
                <pre id="sql-code-v5" className="text-indigo-100 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`-- 1. DESATIVAR TODA A SEGURANÇA PARA LIMPEZA
ALTER TABLE public.cars DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. RESET TOTAL DE CHAVES ESTRANGEIRAS (Garante que apagar carro apaga leads)
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_car_id_fkey;
ALTER TABLE public.leads 
ADD CONSTRAINT leads_car_id_fkey 
FOREIGN KEY (car_id) 
REFERENCES public.cars(id) 
ON DELETE CASCADE;

-- 3. REMOVER TODAS AS POLÍTICAS EXISTENTES (Limpeza de cache)
DROP POLICY IF EXISTS "Global Update Policy" ON public.cars;
DROP POLICY IF EXISTS "Global Delete Policy" ON public.cars;
DROP POLICY IF EXISTS "Global Select Policy" ON public.cars;
DROP POLICY IF EXISTS "Gestão de Anúncios" ON public.cars;
DROP POLICY IF EXISTS "Eliminação de Anúncios" ON public.cars;
DROP POLICY IF EXISTS "Visualização de Anúncios" ON public.cars;
DROP POLICY IF EXISTS "Admin Leads Control" ON public.leads;
DROP POLICY IF EXISTS "Public leads" ON public.leads;

-- 4. CRIAR NOVAS POLÍTICAS DE "SUPER-PODER" (V5)
-- Política de Gestão (Update)
CREATE POLICY "Super_Update_V5" 
ON public.cars FOR UPDATE 
TO authenticated 
USING (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'email' = 'admin@facilitadorcar.pt'
);

-- Política de Eliminação (Delete)
CREATE POLICY "Super_Delete_V5" 
ON public.cars FOR DELETE 
TO authenticated 
USING (
  auth.uid() = user_id OR 
  auth.jwt() -> { 'email' } ->> 'email' = 'admin@facilitadorcar.pt' OR
  auth.jwt() ->> 'email' = 'admin@facilitadorcar.pt'
);

-- Política de Visualização (Select)
CREATE POLICY "Super_Select_V5" 
ON public.cars FOR SELECT 
USING (true);

-- Política de Leads (Permitir inserção pública e gestão admin)
CREATE POLICY "Leads_Public_Insert" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Leads_Admin_Control" ON public.leads FOR ALL TO authenticated USING (
  auth.jwt() ->> 'email' = 'admin@facilitadorcar.pt' OR
  stand_name = (SELECT stand_name FROM profiles WHERE id = auth.uid())
);

-- 5. REATIVAR SEGURANÇA E RECARREGAR
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';`}
                </pre>
              </div>
             </div>
           </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-500">
             {[
              { label: 'Stock Ativo', val: ads.filter(a => a.active).length, color: 'bg-indigo-600', icon: 'fa-car' },
              { label: 'Leads Totais', val: leads.length, color: 'bg-blue-600', icon: 'fa-paper-plane' },
              { label: 'Stands', val: users.filter(u => u.role === UserRole.STAND).length, color: 'bg-slate-900', icon: 'fa-store' },
              { label: 'Ocultos', val: ads.filter(a => !(a.active ?? true)).length, color: 'bg-amber-500', icon: 'fa-eye-slash' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-100`}>
                  <i className={`fas ${stat.icon}`}></i>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                <h4 className="text-4xl font-black text-slate-900">{stat.val}</h4>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
