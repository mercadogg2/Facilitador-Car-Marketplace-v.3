
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
      
      const [profilesRes, adsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('cars').select('*').order('created_at', { ascending: false })
      ]);

      // Tenta buscar leads com join de carros
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*, cars(id, brand, model, image, stand_name)')
        .order('created_at', { ascending: false });

      if (leadsError) {
        console.warn("Join falhou, tentando busca simples:", leadsError.message);
        const { data: fallbackLeads } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
        if (fallbackLeads) setLeads(fallbackLeads as any);
      } else if (leadsData) {
        setLeads(leadsData as any);
      }

      if (profilesRes.data) setUsers(profilesRes.data);
      if (adsRes.data) setAds(adsRes.data);

    } catch (err: any) {
      console.error("Erro Admin Dashboard:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: ProfileStatus) => {
    try {
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
      if (error) throw error;
      setUsers(current => current.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleVerifyAd = async (adId: string, verified: boolean) => {
    try {
      const { error } = await supabase.from('cars').update({ verified }).eq('id', adId);
      if (error) throw error;
      setAds(prev => prev.map(a => a.id === adId ? { ...a, verified } : a));
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const filteredUsers = useMemo(() => 
    users.filter(u => {
      const search = userSearch.toLowerCase();
      return (u.full_name || '').toLowerCase().includes(search) || 
             (u.email || '').toLowerCase().includes(search);
    }),
  [users, userSearch]);

  const filteredAds = useMemo(() => 
    ads.filter(a => {
      const search = adSearch.toLowerCase();
      return (a.brand || '').toLowerCase().includes(search) ||
             (a.model || '').toLowerCase().includes(search);
    }),
  [ads, adSearch]);

  const filteredLeads = useMemo(() => 
    leads.filter(l => {
      const search = leadSearch.toLowerCase();
      return (l.customer_name || '').toLowerCase().includes(search) || 
             (l.customer_email || '').toLowerCase().includes(search);
    }),
  [leads, leadSearch]);

  if (loading) return <div className="p-20 text-center"><i className="fas fa-circle-notch animate-spin"></i></div>;

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900">Admin Central</h1>
          </div>
          <nav className="flex bg-white p-2 rounded-[25px] shadow-sm border border-slate-100 overflow-x-auto">
            {['overview', 'users', 'ads', 'leads'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-3 rounded-2xl text-sm font-black transition-all capitalize ${
                  activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </header>

        {activeTab === 'leads' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b flex justify-between items-center">
              <h3 className="text-2xl font-black">Fluxo de Leads</h3>
              <button onClick={fetchPlatformData} className="text-xs font-black text-indigo-600"><i className="fas fa-sync mr-2"></i>Sincronizar</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                  <tr>
                    <th className="px-8 py-5">Cliente</th>
                    <th className="px-8 py-5">Interesse</th>
                    <th className="px-8 py-5">Data</th>
                    <th className="px-8 py-5 text-right">Acção</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLeads.map(l => {
                    const carData = (l as any).cars || (l as any).car;
                    return (
                      <React.Fragment key={l.id}>
                        <tr className="hover:bg-slate-50">
                          <td className="px-8 py-6">
                            <div className="font-bold">{l.customer_name}</div>
                            <div className="text-xs text-slate-400">{l.customer_email}</div>
                          </td>
                          <td className="px-8 py-6">
                            {carData ? (
                              <span className="text-sm font-bold">{carData.brand} {carData.model}</span>
                            ) : (
                              <span className="text-xs text-slate-300 italic">ID Viatura: {l.car_id}</span>
                            )}
                          </td>
                          <td className="px-8 py-6 text-sm text-slate-500">
                            {new Date(l.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button onClick={() => setExpandedLead(expandedLead === l.id ? null : l.id)} className="text-xs font-black text-indigo-600">
                              {expandedLead === l.id ? 'Fechar' : 'Ler Mensagem'}
                            </button>
                          </td>
                        </tr>
                        {expandedLead === l.id && (
                          <tr className="bg-slate-50">
                            <td colSpan={4} className="px-8 py-6">
                              <div className="bg-white p-4 rounded-xl border whitespace-pre-line text-sm text-slate-600">
                                {l.message}
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
        
        {/* Outras abas permanecem iguais, focando na correção de leads */}
      </div>
    </div>
  );
};

export default AdminDashboard;
