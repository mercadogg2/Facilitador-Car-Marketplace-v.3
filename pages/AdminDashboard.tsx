
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Language, Car, UserProfile, UserRole, ProfileStatus, BlogPost } from '../types';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';

interface AdminDashboardProps {
  lang: Language;
  role: UserRole;
}

const compressImage = (base64Str: string, maxWidth = 1200, maxHeight = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
  });
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ lang, role }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'stands' | 'ads' | 'blog' | 'infra'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [ads, setAds] = useState<Car[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [adSearch, setAdSearch] = useState('');
  const [standSearch, setStandSearch] = useState('');
  const [showSqlRepair, setShowSqlRepair] = useState(false);

  const sqlRepairScript = `ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS reference_code TEXT;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
NOTIFY pgrst, 'reload schema';`;

  const fetchPlatformData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [profilesRes, adsRes, leadsRes, blogRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('cars').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('*, cars(*)').order('created_at', { ascending: false }),
        supabase.from('blog_posts').select('*').order('date', { ascending: false })
      ]);

      setUsers(profilesRes.data || []);
      setAds(adsRes.data || []);
      setLeads(leadsRes.data || []);
      setPosts(blogRes.data || []);

    } catch (err: any) {
      setError(`Erro de Rede: ${err.message}`);
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
      setRefreshing(true);
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      alert("Erro ao atualizar status: " + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    if (!window.confirm("🚨 ELIMINAR AGORA?\nIsto apagará o carro e todas as leads associadas de forma permanente.")) return;
    setRefreshing(true);
    try {
      await supabase.from('leads').delete().eq('car_id', carId);
      const { error: carError } = await supabase.from('cars').delete().eq('id', carId);
      if (carError) throw carError;
      setAds(prev => prev.filter(a => a.id !== carId));
      alert("Viatura removida.");
    } catch (err: any) {
      alert(`Falha crítica: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTotalPurge = async () => {
    if (!window.confirm("🔥 PURGA TOTAL ATÓMICA!\nDeseja apagar TUDO (Stands, Carros, Leads) agora? Não há volta atrás.")) return;
    const userInput = window.prompt("CONFIRMAÇÃO FINAL: Escreva 'APAGAR' para confirmar a destruição permanente de todos os dados comerciais.");
    if (userInput?.toUpperCase() !== 'APAGAR') return;

    setRefreshing(true);
    try {
      await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('cars').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('profiles').delete().neq('role', UserRole.ADMIN).neq('email', 'admin@facilitadorcar.pt');
      setAds([]);
      setLeads([]);
      setUsers(prev => prev.filter(u => u.role === UserRole.ADMIN));
      alert("A plataforma foi completamente limpa.");
    } catch (err: any) {
      alert("Erro crítico na purga: " + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenBlogModal = (post?: BlogPost) => {
    if (post) setEditingPost(post);
    else setEditingPost({ title: '', excerpt: '', content: '', author: 'Admin Facilitador', date: new Date().toISOString().split('T')[0], reading_time: '5 min', image: '' });
    setIsBlogModalOpen(true);
  };

  const handleSaveBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    setRefreshing(true);
    try {
      if (editingPost.id) {
        const { error } = await supabase.from('blog_posts').update(editingPost).eq('id', editingPost.id);
        if (error) throw error;
        setPosts(prev => prev.map(p => p.id === editingPost.id ? (editingPost as BlogPost) : p));
      } else {
        const { data, error } = await supabase.from('blog_posts').insert([editingPost]).select();
        if (error) throw error;
        if (data) setPosts(prev => [data[0], ...prev]);
      }
      setIsBlogModalOpen(false);
      setEditingPost(null);
    } catch (err: any) {
      alert("Erro ao salvar post: " + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleBlogImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingPost) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setEditingPost({ ...editingPost, image: compressed });
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredStands = useMemo(() => 
    users.filter(u => u.role === UserRole.STAND && (u.stand_name || u.full_name || '').toLowerCase().includes(standSearch.toLowerCase())),
    [users, standSearch]
  );

  const filteredAds = useMemo(() => 
    ads.filter(a => 
      `${a.brand} ${a.model}`.toLowerCase().includes(adSearch.toLowerCase()) || 
      (a.reference_code || '').toLowerCase().includes(adSearch.toLowerCase())
    ),
    [ads, adSearch]
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 font-bold uppercase text-[10px]">A aceder à central...</p>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8 pb-32 relative">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex flex-col lg:flex-row justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 gap-6">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-xl">
                <i className="fas fa-shield-alt"></i>
             </div>
             <div>
                <h1 className="text-3xl font-black text-slate-900 leading-tight">Admin Central</h1>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Infraestrutura Facilitador Car</p>
             </div>
          </div>
          <nav className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar w-full lg:w-auto">
            {[
              { id: 'overview', label: 'Dashboard', icon: 'fa-chart-pie' },
              { id: 'leads', label: `Leads`, icon: 'fa-paper-plane' },
              { id: 'stands', label: `Stands`, icon: 'fa-store' },
              { id: 'ads', label: 'Stock', icon: 'fa-car' },
              { id: 'blog', label: 'Blog', icon: 'fa-pen-nib' },
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

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             {[
              { label: 'Stock Ativo', val: ads.length, color: 'bg-indigo-600', icon: 'fa-car' },
              { label: 'Total Leads', val: leads.length, color: 'bg-blue-600', icon: 'fa-bolt' },
              { label: 'Artigos Blog', val: posts.length, color: 'bg-pink-600', icon: 'fa-newspaper' },
              { label: 'Parceiros', val: filteredStands.length, color: 'bg-slate-900', icon: 'fa-store' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg`}>
                  <i className={`fas ${stat.icon}`}></i>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                <h4 className="text-4xl font-black text-slate-900">{stat.val}</h4>
              </div>
            ))}
          </div>
        )}

        {/* TAB STOCK - GESTÃO DE ANÚNCIOS */}
        {activeTab === 'ads' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
             <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Gestão de Stock</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Todos os anúncios da plataforma</p>
                </div>
                <div className="relative">
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                  <input 
                    type="text" 
                    placeholder="Pesquisar por SKU ou Modelo..." 
                    className="pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-100 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                    value={adSearch}
                    onChange={(e) => setAdSearch(e.target.value)}
                  />
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                    <tr>
                      <th className="px-8 py-5">Viatura</th>
                      <th className="px-8 py-5">SKU / Ref</th>
                      <th className="px-8 py-5">Stand</th>
                      <th className="px-8 py-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredAds.map(car => (
                      <tr key={car.id} className="hover:bg-slate-50/50">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <img src={car.image} className="w-16 h-12 rounded-xl object-cover border border-slate-200" alt="" />
                              <div>
                                 <p className="font-black text-slate-900">{car.brand} {car.model}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{car.year}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
                              {car.reference_code || 'Sem SKU'}
                           </span>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-xs font-bold text-indigo-600">{car.stand_name}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex justify-end gap-2">
                              <button onClick={() => navigate(`/editar-anuncio/${car.id}`)} className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"><i className="fas fa-edit"></i></button>
                              <button onClick={() => handleDeleteCar(car.id)} className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all"><i className="fas fa-trash"></i></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {/* Tab Infra - Reparação de Erros */}
        {activeTab === 'infra' && (
           <div className="space-y-8 animate-in fade-in">
             <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-12 overflow-hidden relative">
                <div className="flex items-center gap-6 mb-12">
                    <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-4xl shadow-2xl">
                       <i className="fas fa-wrench"></i>
                    </div>
                    <div>
                      <h3 className="text-4xl font-black text-slate-900">Assistente de Reparação</h3>
                      <p className="text-blue-600 font-black uppercase text-xs tracking-widest mt-1">Sincronização de Esquema de Dados</p>
                    </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[40px] text-white">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-xl font-black">Script SQL de Reparação (Erro SKU)</h4>
                        <button 
                           onClick={() => { navigator.clipboard.writeText(sqlRepairScript); alert("Copiado!"); }}
                           className="bg-blue-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase"
                        >
                           Copiar Script
                        </button>
                    </div>
                    <p className="text-slate-400 text-sm mb-6 font-medium leading-relaxed">
                       Se estiver a receber o erro <strong>"Could not find column reference_code"</strong>, cole este script no seu painel Supabase:
                    </p>
                    <div className="bg-black/50 p-6 rounded-2xl border border-white/10">
                       <pre className="font-mono text-xs text-blue-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                          {sqlRepairScript}
                       </pre>
                    </div>
                </div>

                <div className="mt-8">
                   <button 
                      onClick={handleTotalPurge}
                      className="w-full py-6 bg-red-50 text-red-600 rounded-[30px] font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                   >
                      <i className="fas fa-radiation mr-3"></i>
                      Purga Total de Dados (Cuidado!)
                   </button>
                </div>
             </div>
           </div>
        )}
      </div>

      {refreshing && (
        <div className="fixed inset-0 z-[3000] bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center text-white">
           <div className="w-20 h-20 border-8 border-white border-t-transparent rounded-full animate-spin mb-8"></div>
           <h2 className="text-4xl font-black uppercase tracking-widest">A Sincronizar...</h2>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
