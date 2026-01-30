
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
  
  // Blog Editor State
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [adSearch, setAdSearch] = useState('');
  const [standSearch, setStandSearch] = useState('');

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
    const confirm1 = lang === 'pt' 
      ? "🔥 PURGA TOTAL ATÓMICA!\nDeseja apagar TUDO (Stands, Carros, Leads) agora? Não há volta atrás." 
      : "🔥 ATOMIC TOTAL PURGE!\nDo you want to wipe EVERYTHING (Dealers, Cars, Leads) now? No turning back.";
    
    if (!window.confirm(confirm1)) return;
    
    const confirm2 = lang === 'pt' 
      ? "CONFIRMAÇÃO FINAL: Escreva 'APAGAR' para confirmar a destruição permanente de todos os dados comerciais." 
      : "FINAL CONFIRMATION: Type 'DELETE' to confirm permanent destruction of all commercial data.";
    
    const userInput = window.prompt(confirm2);
    if (userInput?.toUpperCase() !== (lang === 'pt' ? 'APAGAR' : 'DELETE')) return;

    setRefreshing(true);
    try {
      await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('cars').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('profiles').delete().neq('role', UserRole.ADMIN).neq('email', 'admin@facilitadorcar.pt');

      setAds([]);
      setLeads([]);
      setUsers(prev => prev.filter(u => u.role === UserRole.ADMIN));
      
      alert(lang === 'pt' ? "A plataforma foi completamente limpa." : "Platform completely purged.");
    } catch (err: any) {
      alert("Erro crítico na purga: " + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  // Blog Handlers
  const handleOpenBlogModal = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
    } else {
      setEditingPost({
        title: '',
        excerpt: '',
        content: '',
        author: 'Admin Facilitador',
        date: new Date().toISOString().split('T')[0],
        reading_time: '5 min',
        image: ''
      });
    }
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

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Eliminar este artigo permanentemente?")) return;
    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', postId);
      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err: any) {
      alert("Erro ao eliminar: " + err.message);
    }
  };

  const filteredStands = useMemo(() => 
    users.filter(u => u.role === UserRole.STAND && (u.stand_name || u.full_name || '').toLowerCase().includes(standSearch.toLowerCase())),
    [users, standSearch]
  );

  const filteredAds = useMemo(() => 
    ads.filter(a => `${a.brand} ${a.model}`.toLowerCase().includes(adSearch.toLowerCase())),
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-500">
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

        {/* TAB STANDS - APROVAÇÃO E GESTÃO */}
        {activeTab === 'stands' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Gestão de Parceiros</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Aprovação de novos utilizadores</p>
              </div>
              <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input 
                  type="text" 
                  placeholder="Pesquisar stand..." 
                  className="pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-100 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                  value={standSearch}
                  onChange={(e) => setStandSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                  <tr>
                    <th className="px-8 py-5">Stand / Responsável</th>
                    <th className="px-8 py-5">Contacto</th>
                    <th className="px-8 py-5">Estado</th>
                    <th className="px-8 py-5">Data Registo</th>
                    <th className="px-8 py-5 text-right">Moderação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStands.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/50">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-indigo-600 font-black overflow-hidden border border-slate-200">
                              {user.profile_image ? <img src={user.profile_image} className="w-full h-full object-cover" alt="" /> : (user.stand_name?.[0] || user.full_name?.[0] || 'S')}
                           </div>
                           <div>
                              <p className="font-black text-slate-900">{user.stand_name || 'Individual'}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user.full_name}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-slate-600">{user.email}</p>
                        <p className="text-[10px] text-indigo-600 font-black">{user.phone || 'Sem telemóvel'}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          user.status === 'approved' ? 'bg-green-100 text-green-700' : 
                          user.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                          'bg-amber-100 text-amber-700 animate-pulse'
                        }`}>
                          {user.status === 'pending' ? 'Pendente' : user.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-xs text-slate-400 font-medium">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleUpdateUserStatus(user.id, 'approved')}
                            title="Aprovar"
                            className="w-10 h-10 rounded-xl bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button 
                            onClick={() => handleUpdateUserStatus(user.id, 'pending')}
                            title="Colocar Pendente"
                            className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all"
                          >
                            <i className="fas fa-clock"></i>
                          </button>
                          <button 
                            onClick={() => handleUpdateUserStatus(user.id, 'rejected')}
                            title="Rejeitar"
                            className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                          >
                            <i className="fas fa-ban"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStands.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold uppercase text-xs">Nenhum utilizador encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                    placeholder="Pesquisar viatura..." 
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
                      <th className="px-8 py-5">Stand</th>
                      <th className="px-8 py-5">Preço</th>
                      <th className="px-8 py-5">Estado</th>
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
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{car.year} • {car.fuel}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-xs font-bold text-indigo-600">{car.stand_name}</span>
                        </td>
                        <td className="px-8 py-6">
                           <span className="font-black text-slate-900">{formatCurrency(car.price, lang)}</span>
                        </td>
                        <td className="px-8 py-6">
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${car.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                              {car.active ? 'Ativo' : 'Oculto'}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <button 
                             onClick={() => handleDeleteCar(car.id)}
                             className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                           >
                             <i className="fas fa-trash"></i>
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {/* Tab Leads */}
        {activeTab === 'leads' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
            <div className="p-8 border-b bg-slate-50/50">
              <h3 className="text-2xl font-black text-slate-900">Gestão de Leads</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Interesses registados pelos clientes</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                  <tr>
                    <th className="px-8 py-5">Cliente</th>
                    <th className="px-8 py-5">Viatura</th>
                    <th className="px-8 py-5">Stand Alvo</th>
                    <th className="px-8 py-5">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {leads.map(lead => (
                    <tr key={lead.id} className="hover:bg-slate-50/50">
                      <td className="px-8 py-6">
                        <p className="font-black text-slate-900">{lead.customer_name}</p>
                        <p className="text-xs text-indigo-600 font-bold">{lead.customer_email}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-slate-700">
                          {lead.cars ? `${lead.cars.brand} ${lead.cars.model}` : 'Viatura Removida'}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lead.stand_name}</p>
                      </td>
                      <td className="px-8 py-6 text-xs text-slate-400 font-medium">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-bold uppercase text-xs">Nenhuma lead registada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB BLOG - LISTAGEM E EDITOR */}
        {activeTab === 'blog' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Gestão do Blog</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Artigos e Dicas Facilitador</p>
              </div>
              <button 
                onClick={() => handleOpenBlogModal()}
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-xl shadow-indigo-100"
              >
                <i className="fas fa-plus"></i>
                Novo Artigo
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                  <tr>
                    <th className="px-8 py-5">Artigo</th>
                    <th className="px-8 py-5">Data</th>
                    <th className="px-8 py-5">Autor</th>
                    <th className="px-8 py-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {posts.map(post => (
                    <tr key={post.id} className="hover:bg-slate-50/50">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <img src={post.image} className="w-20 h-14 rounded-xl object-cover border border-slate-200" alt="" />
                           <div className="max-w-xs">
                              <p className="font-black text-slate-900 truncate">{post.title}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{post.excerpt}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-600">
                        {new Date(post.date).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6 text-xs text-indigo-600 font-black">
                        {post.author}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleOpenBlogModal(post)}
                            className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            onClick={() => handleDeletePost(post.id)}
                            className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {posts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-bold uppercase text-xs">Nenhum artigo publicado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Infra - Nuclear Zone */}
        {activeTab === 'infra' && (
           <div className="space-y-8 animate-in fade-in">
             <div className="bg-white rounded-[40px] shadow-sm border-4 border-red-50 p-12 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-80 h-80 bg-red-50 rounded-full -mr-40 -mt-40 opacity-40"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-6 mb-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 text-white rounded-3xl flex items-center justify-center text-4xl shadow-2xl shadow-red-200 animate-pulse">
                       <i className="fas fa-radiation"></i>
                    </div>
                    <div>
                      <h3 className="text-4xl font-black text-slate-900">Zona de Perigo (Purga Permanente)</h3>
                      <p className="text-red-600 font-black uppercase text-xs tracking-[0.2em] mt-1">Limpeza definitiva de Stands e Veículos</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-red-600 p-8 rounded-[40px] text-white shadow-2xl shadow-red-200 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <h4 className="text-xl font-black mb-2">Purga Total Atómica</h4>
                      <p className="text-red-100 text-sm mb-6 font-bold">Limpa SIMULTANEAMENTE todos os Stands, Anúncios e Leads. Estado Zero.</p>
                      <button 
                        onClick={handleTotalPurge}
                        disabled={refreshing}
                        className="w-full py-5 bg-white text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl active:scale-95 disabled:opacity-50"
                      >
                        {refreshing ? <i className="fas fa-spinner animate-spin"></i> : 'EXECUTAR PURGA TOTAL'}
                      </button>
                    </div>
                  </div>
                </div>
             </div>
           </div>
        )}

      </div>

      {/* MODAL DO EDITOR DE BLOG */}
      {isBlogModalOpen && editingPost && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[50px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
            <div className="bg-indigo-600 p-8 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-2xl font-black">{editingPost.id ? 'Editar Artigo' : 'Novo Artigo'}</h3>
                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mt-1">Editor Facilitador Car</p>
              </div>
              <button onClick={() => setIsBlogModalOpen(false)} className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-10 overflow-y-auto space-y-8">
              <form id="blogForm" onSubmit={handleSaveBlogPost} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Título do Artigo</label>
                  <input 
                    required 
                    type="text" 
                    value={editingPost.title} 
                    onChange={(e) => setEditingPost({...editingPost, title: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-600 font-black text-lg" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Imagem Principal</label>
                  <div className="relative group aspect-video rounded-3xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center">
                     {editingPost.image ? (
                       <>
                         <img src={editingPost.image} className="w-full h-full object-cover" alt="" />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-900 px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest">Alterar</button>
                         </div>
                       </>
                     ) : (
                       <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 text-slate-400">
                          <i className="fas fa-image text-3xl"></i>
                          <span className="text-[10px] font-black uppercase tracking-widest">Upload Imagem</span>
                       </button>
                     )}
                     <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleBlogImageChange} />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Excerto (Resumo)</label>
                    <textarea 
                      required 
                      rows={4} 
                      value={editingPost.excerpt}
                      onChange={(e) => setEditingPost({...editingPost, excerpt: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-600 font-medium text-sm resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Data</label>
                       <input type="date" value={editingPost.date} onChange={(e) => setEditingPost({...editingPost, date: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-xs font-bold" />
                     </div>
                     <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Leitura</label>
                       <input type="text" value={editingPost.reading_time} onChange={(e) => setEditingPost({...editingPost, reading_time: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-xs font-bold" />
                     </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Conteúdo do Artigo</label>
                  <textarea 
                    required 
                    rows={12} 
                    value={editingPost.content}
                    onChange={(e) => setEditingPost({...editingPost, content: e.target.value})}
                    className="w-full px-8 py-6 rounded-[40px] bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-600 font-medium text-base leading-relaxed"
                  />
                </div>
              </form>
            </div>

            <div className="p-8 border-t bg-slate-50 flex justify-end gap-4 shrink-0">
              <button 
                onClick={() => setIsBlogModalOpen(false)}
                className="px-10 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600"
              >
                Cancelar
              </button>
              <button 
                form="blogForm"
                type="submit"
                disabled={refreshing}
                className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
              >
                {refreshing ? <i className="fas fa-spinner animate-spin"></i> : 'Publicar Artigo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {refreshing && (
        <div className="fixed inset-0 z-[3000] bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center text-white">
           <div className="w-20 h-20 border-8 border-white border-t-transparent rounded-full animate-spin mb-8"></div>
           <h2 className="text-4xl font-black uppercase tracking-widest animate-pulse">A Processar...</h2>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
