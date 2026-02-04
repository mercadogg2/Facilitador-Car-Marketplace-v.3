
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

  const sqlRepairScript = `
-- 1. Colunas essenciais
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS reference_code TEXT;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- 2. Extensão para criptografia (Necessária para mudar senhas)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. Função segura para Admin resetar senha (RPC) - VERSÃO ATUALIZADA
-- Remove versões anteriores para evitar conflitos
DROP FUNCTION IF EXISTS public.admin_reset_password(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.admin_reset_password(target_user_id UUID, new_password TEXT, secret_key TEXT DEFAULT '')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verifica permissão: 
  -- 1. Admin Autenticado no Supabase
  -- 2. OU Chave Mestra (para Admin Hardcoded/Bypass)
  IF NOT (
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'admin' OR email = 'admin@facilitadorcar.pt')
    ))
    OR
    (secret_key = 'admin123') 
  ) THEN
    RAISE EXCEPTION 'Acesso Negado: Apenas administradores podem resetar senhas.';
  END IF;

  -- Atualiza a senha na tabela de auth
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = target_user_id;
END;
$$;

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
      setError(`Erro ao carregar dados: ${err.message}`);
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

  const handleForcePasswordReset = async (userId: string, userName: string) => {
    const newPassword = prompt(`Introduza a nova senha para "${userName}":`);
    if (!newPassword || newPassword.trim() === "") return;
    if (newPassword.length < 6) {
      alert("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setRefreshing(true);
    try {
      // Enviamos a secret_key para garantir que o Admin Bypass consiga alterar
      const { error } = await supabase.rpc('admin_reset_password', { 
        target_user_id: userId, 
        new_password: newPassword,
        secret_key: 'admin123' 
      });

      if (error) throw error;
      alert(`Senha alterada com sucesso para: ${newPassword}\nPor favor, informe o utilizador.`);
    } catch (err: any) {
      // Verifica erros comuns para dar feedback melhor
      const msg = err.message || '';
      if (msg.includes('function public.admin_reset_password') || msg.includes('Acesso Negado')) {
        alert("⚠️ AÇÃO NECESSÁRIA:\n\nO banco de dados precisa ser atualizado para permitir esta ação.\n\n1. Vá à aba 'Reparação' (ícone raio/ferramenta);\n2. Copie o Script SQL;\n3. Execute-o no SQL Editor do Supabase.");
      } else {
        alert("Erro ao alterar senha: " + msg);
      }
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
    } catch (err: any) {
      alert(`Falha crítica: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

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
    } catch (err: any) {
      alert("Erro ao salvar artigo: " + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Apagar este artigo definitivamente?")) return;
    setRefreshing(true);
    try {
      await supabase.from('blog_posts').delete().eq('id', id);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert("Erro ao apagar: " + err.message);
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

  const handleTotalPurge = async () => {
    if (!window.confirm("🔥 PURGA TOTAL ATÓMICA!\nDeseja apagar TUDO agora? Não há volta atrás.")) return;
    const userInput = window.prompt("Escreva 'APAGAR' para confirmar.");
    if (userInput?.toUpperCase() !== 'APAGAR') return;

    setRefreshing(true);
    try {
      await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('cars').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('profiles').delete().neq('role', UserRole.ADMIN).neq('email', 'admin@facilitadorcar.pt');
      setAds([]);
      setLeads([]);
      setUsers(prev => prev.filter(u => u.role === UserRole.ADMIN));
      alert("Plataforma limpa.");
    } catch (err: any) {
      alert("Erro na purga: " + err.message);
    } finally {
      setRefreshing(false);
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
        <p className="text-slate-400 font-bold uppercase text-[10px]">Acedendo à Central...</p>
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

        {/* ABA LEADS */}
        {activeTab === 'leads' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
             <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="text-2xl font-black">Interessados (Leads)</h3>
                <span className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-600 px-4 py-1.5 rounded-full">Gestão Central</span>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <tr>
                      <th className="px-8 py-4">Cliente</th>
                      <th className="px-8 py-4">Viatura / Stand</th>
                      <th className="px-8 py-4">Email / SKU</th>
                      <th className="px-8 py-4">Pref. Contacto</th>
                      <th className="px-8 py-4">Pagamento</th>
                      <th className="px-8 py-4">Data</th>
                      <th className="px-8 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {leads.map(lead => {
                      // Verifica se o email do lead corresponde a um usuário registado
                      const matchedUser = users.find(u => u.email?.toLowerCase() === lead.customer_email?.toLowerCase());

                      return (
                      <tr key={lead.id} className="hover:bg-slate-50/50">
                        <td className="px-8 py-6">
                           <p className="font-black text-slate-900">{lead.customer_name}</p>
                           <p className="text-xs text-slate-400">{lead.customer_phone}</p>
                        </td>
                        <td className="px-8 py-6">
                           <p className="text-sm font-bold text-slate-700">{lead.cars?.brand} {lead.cars?.model}</p>
                           <p className="text-[10px] text-indigo-600 font-black uppercase">{lead.stand_name}</p>
                        </td>
                        <td className="px-8 py-6">
                           <p className="text-sm font-bold text-slate-600 mb-1">{lead.customer_email}</p>
                           <span className="bg-slate-100 text-slate-400 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                              {lead.cars?.reference_code || 'S/ SKU'}
                           </span>
                        </td>
                        <td className="px-8 py-6">
                           <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-purple-100">
                             {lead.message?.match(/(?:Contacto|Contact):\s*(.*?)(?:\n|$)/i)?.[1] || 'N/A'}
                           </span>
                        </td>
                        <td className="px-8 py-6">
                           <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                             {lead.message?.match(/(?:Pagamento|Payment):\s*(.*?)(?:\n|$)/i)?.[1] || 'N/A'}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-xs text-slate-400">
                           {new Date(lead.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-6 text-right">
                           <button
                             onClick={() => matchedUser ? handleForcePasswordReset(matchedUser.id, lead.customer_name) : alert("Este lead não tem uma conta registada associada a este email.")}
                             disabled={!matchedUser}
                             title={matchedUser ? "Resetar Senha do Cliente" : "Sem conta registada"}
                             className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ml-auto ${matchedUser ? 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                           >
                             <i className="fas fa-key"></i>
                           </button>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {/* ABA STANDS */}
        {activeTab === 'stands' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
             <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="text-2xl font-black">Aprovação de Stands</h3>
                <input 
                  type="text" placeholder="Filtrar stand..." 
                  className="px-4 py-2 rounded-xl border text-sm font-bold"
                  value={standSearch} onChange={e => setStandSearch(e.target.value)}
                />
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <tr>
                      <th className="px-8 py-4">Stand / Contactos</th>
                      <th className="px-8 py-4">Estado</th>
                      <th className="px-8 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredStands.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50/50">
                        <td className="px-8 py-6">
                           <div className="flex flex-col">
                               <span className="font-black text-slate-900 text-sm">{user.stand_name || 'Particular'}</span>
                               <span className="text-xs text-slate-500 font-medium mb-2">{user.full_name}</span>
                               
                               <div className="flex flex-col gap-1.5 mt-1">
                                   <div className="flex items-center gap-2 bg-slate-50 w-fit px-2 py-1 rounded-md border border-slate-100">
                                       <i className="fas fa-envelope text-slate-400 text-[10px]"></i>
                                       <span className="text-[10px] font-bold text-slate-600">{user.email}</span>
                                   </div>
                                   {user.phone && (
                                       <div className="flex items-center gap-2 bg-green-50 w-fit px-2 py-1 rounded-md border border-green-100">
                                           <i className="fab fa-whatsapp text-green-600 text-[10px]"></i>
                                           <span className="text-[10px] font-bold text-green-700">{user.phone}</span>
                                       </div>
                                   )}
                               </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                             user.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                           }`}>
                             {user.status}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex items-center justify-end gap-2">
                             <button onClick={() => handleForcePasswordReset(user.id, user.stand_name || user.full_name)} title="Resetar Senha" className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all"><i className="fas fa-key"></i></button>
                             <div className="w-px h-6 bg-slate-200 mx-2"></div>
                             <button onClick={() => handleUpdateUserStatus(user.id, 'approved')} title="Aprovar" className="w-10 h-10 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"><i className="fas fa-check"></i></button>
                             <button onClick={() => handleUpdateUserStatus(user.id, 'rejected')} title="Rejeitar" className="w-10 h-10 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><i className="fas fa-times"></i></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {/* ABA STOCK */}
        {activeTab === 'ads' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
             <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="text-2xl font-black">Stock Global</h3>
                <input 
                  type="text" placeholder="Filtrar viatura ou SKU..." 
                  className="px-4 py-2 rounded-xl border text-sm font-bold"
                  value={adSearch} onChange={e => setAdSearch(e.target.value)}
                />
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <tr>
                      <th className="px-8 py-4">Viatura</th>
                      <th className="px-8 py-4">REF / SKU</th>
                      <th className="px-8 py-4">Preço</th>
                      <th className="px-8 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredAds.map(car => (
                      <tr key={car.id} className="hover:bg-slate-50/50">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <img src={car.image} className="w-14 h-10 rounded-lg object-cover" />
                              <p className="font-black text-slate-900">{car.brand} {car.model}</p>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-lg uppercase">{car.reference_code || 'S/ SKU'}</span>
                        </td>
                        <td className="px-8 py-6 font-bold">{formatCurrency(car.price, lang)}</td>
                        <td className="px-8 py-6 text-right">
                           <button onClick={() => handleDeleteCar(car.id)} className="w-10 h-10 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><i className="fas fa-trash"></i></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {/* ABA BLOG - EDITOR */}
        {activeTab === 'blog' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
             <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="text-2xl font-black">Blog Facilitador</h3>
                <button 
                  onClick={() => handleOpenBlogModal()}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100"
                >
                  Novo Artigo
                </button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
                {posts.map(post => (
                   <div key={post.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group">
                      <div className="relative h-48">
                         <img src={post.image} className="w-full h-full object-cover" alt="" />
                         <div className="absolute top-4 right-4 flex gap-2">
                            <button onClick={() => handleOpenBlogModal(post)} className="w-10 h-10 bg-white/90 rounded-xl text-indigo-600 shadow-lg"><i className="fas fa-edit"></i></button>
                            <button onClick={() => handleDeletePost(post.id)} className="w-10 h-10 bg-red-500 text-white rounded-xl shadow-lg"><i className="fas fa-trash"></i></button>
                         </div>
                      </div>
                      <div className="p-6">
                         <h4 className="font-black text-slate-900 mb-2 line-clamp-1">{post.title}</h4>
                         <p className="text-xs text-slate-400 line-clamp-2">{post.excerpt}</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* ABA INFRA - REPARAÇÃO */}
        {activeTab === 'infra' && (
           <div className="space-y-8 animate-in fade-in">
             <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-12">
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
                        <h4 className="text-xl font-black">Script SQL de Reparação</h4>
                        <button 
                           onClick={() => { navigator.clipboard.writeText(sqlRepairScript); alert("Copiado!"); }}
                           className="bg-blue-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase"
                        >
                           Copiar Script
                        </button>
                    </div>
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

      {/* MODAL BLOG EDITOR */}
      {isBlogModalOpen && editingPost && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[50px] shadow-2xl overflow-y-auto animate-in zoom-in">
              <div className="p-10 border-b flex justify-between items-center bg-slate-50">
                 <h2 className="text-3xl font-black">{editingPost.id ? 'Editar Artigo' : 'Novo Artigo'}</h2>
                 <button onClick={() => setIsBlogModalOpen(false)} className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 hover:text-red-500"><i className="fas fa-times text-xl"></i></button>
              </div>
              <form onSubmit={handleSaveBlogPost} className="p-10 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Título do Artigo</label>
                       <input required value={editingPost.title} onChange={e => setEditingPost({...editingPost, title: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-600 font-black" />
                    </div>
                    <div className="md:col-span-2">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Resumo Curto (Excerpt)</label>
                       <input required value={editingPost.excerpt} onChange={e => setEditingPost({...editingPost, excerpt: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-600 font-bold" />
                    </div>
                    <div className="md:col-span-2">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Imagem de Capa</label>
                       <div className="flex flex-col items-center gap-6 p-10 bg-slate-50 rounded-[35px] border-2 border-dashed border-slate-200">
                          {editingPost.image && <img src={editingPost.image} className="w-64 h-40 object-cover rounded-3xl shadow-xl" />}
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Selecionar Imagem</button>
                          <input ref={fileInputRef} type="file" hidden onChange={handleBlogImageChange} />
                       </div>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Autor</label>
                       <input value={editingPost.author} onChange={e => setEditingPost({...editingPost, author: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-600 font-bold" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Tempo de Leitura</label>
                       <input value={editingPost.reading_time} onChange={e => setEditingPost({...editingPost, reading_time: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-600 font-bold" />
                    </div>
                    <div className="md:col-span-2">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Conteúdo Completo</label>
                       <textarea required rows={12} value={editingPost.content} onChange={e => setEditingPost({...editingPost, content: e.target.value})} className="w-full px-8 py-6 rounded-[35px] bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-600 font-medium leading-relaxed resize-none" />
                    </div>
                 </div>
                 <button type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-[30px] font-black text-xl shadow-2xl hover:bg-indigo-700 transition-all">Salvar Artigo</button>
              </form>
           </div>
        </div>
      )}

      {refreshing && (
        <div className="fixed inset-0 z-[5000] bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center text-white">
           <div className="w-20 h-20 border-8 border-white border-t-transparent rounded-full animate-spin mb-8"></div>
           <h2 className="text-4xl font-black uppercase tracking-widest">A Sincronizar...</h2>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
