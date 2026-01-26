
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
    // Garantir valores normalizados para a DB
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
      alert("Erro ao alterar visibilidade: " + err.message);
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
                            title="Aprovar Stand"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button 
                            disabled={isUpdatingStatus === stand.id || stand.status === 'rejected'}
                            onClick={() => handleUpdateUserStatus(stand.id, 'rejected')}
                            className="w-10 h-10 rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-30 transition-all flex items-center justify-center shadow-md shadow-red-100"
                            title="Rejeitar / Bloquear"
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
                    <tr key={a.id} className={!(a.active ?? true) ? 'opacity-50' : ''}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <img src={a.image} className="w-12 h-10 object-cover rounded-lg" alt="" />
                          <p className="font-bold text-slate-900">{a.brand} {a.model}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-indigo-600">{a.stand_name}</td>
                      <td className="px-8 py-6 text-center">
                        <button 
                          onClick={() => handleToggleAdVisibility(a.id, a.active ?? true)}
                          disabled={isTogglingAd === a.id}
                          className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase ${ (a.active ?? true) ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600' }`}
                        >
                          {a.active ?? true ? 'Ativo' : 'Oculto'}
                        </button>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleDeleteCar(a.id)} 
                          disabled={isDeletingCar === a.id}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          {isDeletingCar === a.id ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-trash"></i>}
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
                Reparação de Base de Dados (Fix Leads & Status)
              </h3>
              <p className="text-slate-500 mb-8 font-medium">Execute este script para garantir que o status das leads é guardado permanentemente e as permissões estão corretas.</p>
              <div className="bg-slate-900 rounded-[30px] p-8 relative group">
                <button 
                  onClick={() => {
                    const code = document.getElementById('sql-code')?.innerText;
                    if (code) {
                      navigator.clipboard.writeText(code);
                      alert("Copiado!");
                    }
                  }}
                  className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold"
                >
                  Copiar
                </button>
                <pre id="sql-code" className="text-indigo-100 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`-- 1. GARANTIR COLUNA STATUS NAS LEADS
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pendente';

-- 2. REPARAÇÃO CASCADE (Permite apagar carro com leads)
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_car_id_fkey,
ADD CONSTRAINT leads_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE;

-- 3. PERMISSÕES DE UPDATE PARA LEADS (Fix Marcação Contactado)
DROP POLICY IF EXISTS "Permitir Update Leads" ON public.leads;
CREATE POLICY "Permitir Update Leads" ON public.leads FOR UPDATE USING (true) WITH CHECK (true);

-- 4. POLÍTICAS RLS ATUALIZADAS PARA CARROS
DROP POLICY IF EXISTS "Stands podem apagar os seus próprios carros" ON public.cars;
CREATE POLICY "Permissões de Eliminação" ON public.cars FOR DELETE USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'admin@facilitadorcar.pt');

NOTIFY pgrst, 'reload schema';`}
                </pre>
              </div>
             </div>

             <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-12">
              <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
                <i className="fas fa-pen-nib text-indigo-600"></i>
                Novos Artigos SEO (Blog Seeding)
              </h3>
              <p className="text-slate-500 mb-8 font-medium">Execute este SQL para adicionar os novos artigos focados em SEO à base de dados.</p>
              <div className="bg-slate-900 rounded-[30px] p-8 relative group">
                <button 
                  onClick={() => {
                    const code = document.getElementById('sql-blog')?.innerText;
                    if (code) {
                      navigator.clipboard.writeText(code);
                      alert("Copiado!");
                    }
                  }}
                  className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold"
                >
                  Copiar
                </button>
                <pre id="sql-blog" className="text-indigo-100 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`-- INSERÇÃO DE ARTIGOS SEO
INSERT INTO public.blog_posts (id, title, excerpt, content, author, date, image, reading_time)
VALUES
(
  gen_random_uuid(), 
  'Guia Definitivo: Como verificar o histórico de um carro usado em Portugal', 
  'Evite surpresas desagradáveis com o nosso guia completo de verificação mecânica e documental antes da compra.', 
  'Comprar um carro usado pode ser uma experiência excitante, mas também repleta de incertezas. Em Portugal, existem diversas ferramentas que permitem ao comprador verificar a veracidade das informações fornecidas pelo vendedor.\\n\\nPrimeiro, solicite a Certidão de Inspeção Técnica de Veículo. Este documento revela se o carro teve reprovações anteriores e, crucialmente, se os quilómetros registados seguem uma linha lógica.\\n\\nSegundo, utilize o portal Automóvel Online para verificar se existem ónus or encargos sobre a viatura. Um carro com penhoras pendentes não pode ser transferido legalmente.\\n\\nTerceiro, verifique o histórico de sinistros. Existem bases de dados que, através da matrícula, indicam se o veículo já esteve envolvido em acidentes graves que possam ter afetado a estrutura do chassis.\\n\\nNo Facilitador Car, garantimos que todos os nossos stands parceiros passam por uma auditoria de 12 pontos para que não tenha de se preocupar com estes detalhes.', 
  'Equipa Facilitador', 
  CURRENT_DATE, 
  'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=1200', 
  '6 min'
),
(
  gen_random_uuid(), 
  'Diesel, Híbrido ou Elétrico? Qual a melhor escolha para o mercado português em 2026', 
  'Analisamos as tendências de mercado, custos de manutenção e valor de revenda para ajudar na sua decisão.', 
  'A escolha do combustível ideal nunca foi tão complexa em Portugal. Com as zonas de emissões reduzidas (ZER) a expandirem-se em Lisboa e Porto, a decisão entre combustão e eletrificação tornou-se estratégica.\\n\\nOs carros a Diesel continuam a ser os reis das autoestradas. Para quem faz mais de 20.000 km por ano, a economia de combustível e a autonomia ainda são imbatíveis, embora o valor de revenda a longo prazo comece a ser uma preocupação.\\n\\nOs Híbridos (PHEV) surgem como a "ponte" perfeita. Oferecem as vantagens fiscais e a suavidade do elétrico na cidade, sem a ansiedade da autonomia em viagens longas.\\n\\nOs Elétricos (EV) são agora uma realidade sólida no mercado de usados. Com a rede Mobi.E a expandir-se, o custo por quilómetro é drasticamente inferior. Se tem possibilidade de carregar em casa ou no trabalho, o elétrico é a escolha mais racional para 2026.\\n\\nNo nosso marketplace, pode filtrar por tipo de combustível para encontrar a solução que melhor se adapta ao seu estilo de vida.', 
  'Carlos Silva', 
  CURRENT_DATE, 
  'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=1200', 
  '8 min'
),
(
  gen_random_uuid(), 
  'Manutenção Preventiva: 5 Dicas para valorizar o seu carro na hora da revenda', 
  'Saiba como pequenos cuidados diários podem significar mais mil euros na sua conta quando decidir trocar de viatura.', 
  'O valor de um carro usado não depende apenas do ano e dos quilómetros. O estado de conservação e o histórico de manutenção são os fatores que realmente determinam o preço final numa negociação.\\n\\n1. Guarde todas as faturas: Um livro de revisões completo e faturas detalhadas de todas as intervenções transmitem uma confiança inabalável ao comprador.\\n\\n2. Cuide da pintura e interior: Pequenos toques e estofos sujos desvalorizam o carro de imediato. Um detalhe automóvel profissional antes da venda pode aumentar o valor percebido em centenas de euros.\\n\\n3. Verifique os pneus: Pneus de marca e com bom rasto indicam que o dono não poupou na segurança.\\n\\n4. Não ignore luzes no painel: Uma luz de "Check Engine" acesa é o maior repelente de compradores. Resolva pequenos problemas eletrónicos antes de anunciar.\\n\\n5. Documentação em dia: IUC pago e inspeção sem anotações são obrigatórios para uma venda rápida.\\n\\nSeguir estes passos garante que o seu carro será o primeiro a ser vendido no Facilitador Car.', 
  'Ana Martins', 
  CURRENT_DATE, 
  'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=1200', 
  '5 min'
);`}
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
