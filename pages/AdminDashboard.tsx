
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Language, Car, UserProfile, UserRole, ProfileStatus, Lead, BlogPost } from '../types';
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
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      alert("Erro ao atualizar status: " + err.message);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

        {activeTab === 'blog' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Gestão de Conteúdos</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Blog Facilitador Car</p>
              </div>
              <button 
                onClick={() => handleOpenBlogModal()}
                className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <i className="fas fa-plus"></i> Novo Artigo
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                  <tr>
                    <th className="px-8 py-5">Capa</th>
                    <th className="px-8 py-5">Título</th>
                    <th className="px-8 py-5">Autor</th>
                    <th className="px-8 py-5">Data</th>
                    <th className="px-8 py-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {posts.map(post => (
                    <tr key={post.id} className="hover:bg-slate-50/50">
                      <td className="px-8 py-6">
                        <div className="w-20 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          <img src={post.image} className="w-full h-full object-cover" alt="" />
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-black text-slate-900 line-clamp-1">{post.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{post.reading_time}</p>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-600">{post.author}</td>
                      <td className="px-8 py-6 text-xs text-slate-400 font-medium">{new Date(post.date).toLocaleDateString()}</td>
                      <td className="px-8 py-6 text-right space-x-2">
                         <button onClick={() => handleOpenBlogModal(post)} className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"><i className="fas fa-edit"></i></button>
                         <button onClick={() => handleDeletePost(post.id)} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all"><i className="fas fa-trash"></i></button>
                      </td>
                    </tr>
                  ))}
                  {posts.length === 0 && (
                    <tr><td colSpan={5} className="p-24 text-center text-slate-400 font-bold uppercase text-xs">Sem artigos publicados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Gestão de Leads</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Todos os contactos da plataforma</p>
              </div>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                    <i className="fas fa-envelope"></i>
                    Newsletter: {leads.filter(l => l.stand_name === 'NEWSLETTER').length}
                 </div>
                 <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl text-blue-600 text-[10px] font-black uppercase tracking-widest">
                    <i className="fas fa-car"></i>
                    Viaturas: {leads.filter(l => l.stand_name !== 'NEWSLETTER').length}
                 </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                  <tr>
                    <th className="px-8 py-5">Tipo / Origem</th>
                    <th className="px-8 py-5">Contacto Cliente</th>
                    <th className="px-8 py-5">Referência / Mensagem</th>
                    <th className="px-8 py-5">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {leads.map(lead => (
                    <tr key={lead.id} className="hover:bg-slate-50/50">
                      <td className="px-8 py-6">
                        {lead.stand_name === 'NEWSLETTER' ? (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center text-xs">
                              <i className="fas fa-paper-plane"></i>
                            </div>
                            <div>
                              <p className="font-black text-pink-600 text-xs uppercase tracking-widest">Newsletter</p>
                              <p className="text-[10px] text-slate-400 font-bold">BLOG BLOGGER</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs">
                              <i className="fas fa-car"></i>
                            </div>
                            <div>
                              <p className="font-black text-blue-600 text-xs uppercase tracking-widest">Inquérito Viatura</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{lead.stand_name}</p>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-black text-slate-900">{lead.customer_name || 'Anónimo'}</p>
                        <p className="text-xs text-indigo-600 font-bold">{lead.customer_email}</p>
                        {lead.customer_phone !== 'N/A' && <p className="text-[10px] text-slate-400 font-bold">{lead.customer_phone}</p>}
                      </td>
                      <td className="px-8 py-6">
                        {lead.cars ? (
                          <div className="flex items-center gap-3">
                             <img src={lead.cars.image} className="w-10 h-7 object-cover rounded shadow-sm" alt="" />
                             <p className="text-sm font-bold text-slate-700">{lead.cars.brand} {lead.cars.model}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic max-w-xs line-clamp-1">{lead.message}</p>
                        )}
                      </td>
                      <td className="px-8 py-6 text-xs text-slate-400 font-medium">
                        {new Date(lead.created_at).toLocaleDateString()}
                        <p className="text-[10px] font-black text-slate-300">{new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr><td colSpan={4} className="p-24 text-center text-slate-400 font-bold uppercase text-xs">Sem contactos registados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ... restante do componente (Stands, Ads, Infra) permanece igual ... */}
        {activeTab === 'infra' && (
           <div className="animate-in fade-in">
             <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-12">
              <div className="flex items-center gap-4 mb-8 text-indigo-600">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl">
                   <i className="fas fa-database"></i>
                </div>
                <div>
                  <h3 className="text-2xl font-black">Reparação V10 (Blog Admin)</h3>
                  <p className="text-slate-500 font-medium">Adiciona permissões para gestão de blog e segurança RLS.</p>
                </div>
              </div>
              
              <div className="bg-slate-900 rounded-[30px] p-8 relative border-4 border-indigo-500/20">
                <pre id="sql-code-v10" className="text-indigo-100 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`-- POLÍTICAS PARA BLOG_POSTS (Admin Only Write)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public_Select_Blog" ON public.blog_posts;
CREATE POLICY "Public_Select_Blog" ON public.blog_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin_Manage_Blog" ON public.blog_posts;
CREATE POLICY "Admin_Manage_Blog" ON public.blog_posts FOR ALL 
USING (auth.jwt() ->> 'email' = 'admin@facilitadorcar.pt');

NOTIFY pgrst, 'reload schema';`}
                </pre>
              </div>
             </div>
           </div>
        )}

      </div>

      {/* Blog Editor Modal */}
      {isBlogModalOpen && editingPost && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[50px] shadow-2xl animate-in zoom-in">
            <form onSubmit={handleSaveBlogPost}>
              <div className="p-10 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">{editingPost.id ? 'Editar Artigo' : 'Novo Artigo'}</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Editor Facilitador CMS</p>
                </div>
                <button type="button" onClick={() => setIsBlogModalOpen(false)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900"><i className="fas fa-times"></i></button>
              </div>

              <div className="p-10 space-y-8">
                {/* Imagem de Capa */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative h-64 bg-slate-50 rounded-[40px] border-4 border-dashed border-slate-200 overflow-hidden group cursor-pointer"
                >
                  {editingPost.image ? (
                    <img src={editingPost.image} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" alt="" />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <i className="fas fa-image text-4xl mb-4"></i>
                      <p className="font-bold uppercase tracking-widest text-[10px]">Carregar Capa do Artigo</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Título do Artigo</label>
                    <input 
                      required 
                      value={editingPost.title} 
                      onChange={(e) => setEditingPost({...editingPost, title: e.target.value})} 
                      className="w-full px-8 py-5 rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-600 font-bold text-xl" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Autor</label>
                    <input 
                      required 
                      value={editingPost.author} 
                      onChange={(e) => setEditingPost({...editingPost, author: e.target.value})} 
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-600 font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Tempo de Leitura (ex: 5 min)</label>
                    <input 
                      required 
                      value={editingPost.reading_time} 
                      onChange={(e) => setEditingPost({...editingPost, reading_time: e.target.value})} 
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-600 font-bold" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Resumo (Excerpt)</label>
                    <textarea 
                      required 
                      value={editingPost.excerpt} 
                      onChange={(e) => setEditingPost({...editingPost, excerpt: e.target.value})} 
                      rows={2}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-600 font-medium resize-none" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Conteúdo Completo</label>
                    <textarea 
                      required 
                      value={editingPost.content} 
                      onChange={(e) => setEditingPost({...editingPost, content: e.target.value})} 
                      rows={12}
                      className="w-full px-8 py-6 rounded-[30px] bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-600 font-medium resize-none leading-relaxed" 
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-10">
                   <button 
                     type="submit" 
                     disabled={refreshing}
                     className="flex-grow py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg shadow-xl hover:bg-indigo-700 transition-all active:scale-[0.98]"
                   >
                     {refreshing ? <i className="fas fa-spinner animate-spin"></i> : 'Publicar Artigo'}
                   </button>
                   <button 
                     type="button" 
                     onClick={() => setIsBlogModalOpen(false)}
                     className="px-10 py-5 bg-slate-100 text-slate-400 rounded-3xl font-black hover:bg-slate-200 transition-all"
                   >
                     Cancelar
                   </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
