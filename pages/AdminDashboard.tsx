
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
      const [profilesRes, adsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('cars').select('*').order('created_at', { ascending: false })
      ]);

      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*, cars(id, brand, model, image, stand_name)')
        .order('created_at', { ascending: false });

      if (leadsError) {
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

  const filteredLeads = useMemo(() => 
    leads.filter(l => {
      const search = leadSearch.toLowerCase();
      return (l.customer_name || '').toLowerCase().includes(search) || 
             (l.customer_email || '').toLowerCase().includes(search) ||
             (l.customer_phone || '').includes(search);
    }),
  [leads, leadSearch]);

  if (loading) return <div className="p-20 text-center"><i className="fas fa-circle-notch animate-spin text-indigo-600"></i></div>;

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h1 className="text-4xl font-black text-slate-900">Admin Central</h1>
          <nav className="flex bg-white p-2 rounded-[25px] shadow-sm border border-slate-100">
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
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
              <h3 className="text-2xl font-black">Histórico de Leads</h3>
              <input 
                type="text" 
                placeholder="Pesquisar cliente..." 
                className="px-4 py-2 bg-white border rounded-xl text-sm"
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                  <tr>
                    <th className="px-8 py-5">Cliente & Contacto</th>
                    <th className="px-8 py-5">Viatura / Stand</th>
                    <th className="px-8 py-5">Data</th>
                    <th className="px-8 py-5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLeads.map(l => {
                    const carData = (l as any).cars || (l as any).car;
                    return (
                      <React.Fragment key={l.id}>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="font-bold text-slate-900">{l.customer_name}</div>
                            <div className="text-xs text-indigo-600 font-bold">{l.customer_phone}</div>
                            <div className="text-[10px] text-slate-400">{l.customer_email}</div>
                          </td>
                          <td className="px-8 py-6">
                            {carData ? (
                              <div>
                                <div className="text-sm font-bold text-slate-800">{carData.brand} {carData.model}</div>
                                <div className="text-[10px] text-blue-600 uppercase font-black tracking-widest mt-1">Stand: {carData.stand_name}</div>
                              </div>
                            ) : (
                              <div className="text-xs text-blue-600 font-black uppercase tracking-widest">Stand: {l.stand_name}</div>
                            )}
                          </td>
                          <td className="px-8 py-6 text-sm text-slate-500">
                            {new Date(l.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button onClick={() => setExpandedLead(expandedLead === l.id ? null : l.id)} className="px-4 py-2 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all">
                              {expandedLead === l.id ? 'Ocultar' : 'Mensagem'}
                            </button>
                          </td>
                        </tr>
                        {expandedLead === l.id && (
                          <tr className="bg-indigo-50/30">
                            <td colSpan={4} className="px-8 py-8">
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
