
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Language, Car, Lead, UserRole, ProfileStatus } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  lang: Language;
  role: UserRole;
}

const StandDashboard: React.FC<DashboardProps> = ({ lang, role }) => {
  const t = TRANSLATIONS[lang].dashboard;
  const tc = TRANSLATIONS[lang].common;
  const navigate = useNavigate();
  const [standName, setStandName] = useState('');
  const [status, setStatus] = useState<ProfileStatus>('pending');
  const [myCars, setMyCars] = useState<Car[]>([]);
  const [myLeads, setMyLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStandData = async () => {
    if (role !== UserRole.STAND && role !== UserRole.ADMIN) {
       navigate('/login');
       return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const profileName = user.user_metadata?.stand_name || 'Stand';
        setStandName(profileName);
        
        // Busca status real da tabela profiles para garantir a regra de negócio
        const { data: profile } = await supabase
          .from('profiles')
          .select('status, role')
          .eq('id', user.id)
          .single();
        
        const currentStatus = profile?.status || 'pending';
        setStatus(currentStatus);

        // Apenas stands aprovados ou admins podem ver dados e stock
        if (currentStatus === 'approved' || profile?.role === UserRole.ADMIN) {
          const { data: carsData } = await supabase
            .from('cars')
            .select('*')
            .eq('user_id', user.id);
          
          if (carsData) setMyCars(carsData);

          const { data: leadsData } = await supabase
            .from('leads')
            .select('*, cars(brand, model)')
            .order('created_at', { ascending: false });

          if (leadsData) setMyLeads(leadsData as any);
        }
      }
    } catch (e) {
      console.error("Dashboard data fetch error", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStandData();
  }, [role, navigate]);

  const handleDeleteCar = async (id: string) => {
    if (!window.confirm(tc.confirmDelete)) return;
    try {
      await supabase.from('cars').delete().eq('id', id);
      setMyCars(prev => prev.filter(car => car.id !== id));
    } catch (err: any) {
      alert('Erro ao remover: ' + err.message);
    }
  };

  const handleCopyLink = (subdomain: string) => {
    const url = `${window.location.origin}/#/v/${subdomain}`;
    navigator.clipboard.writeText(url);
    alert(lang === 'pt' ? 'Link copiado com sucesso!' : 'Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isApproved = status === 'approved' || role === UserRole.ADMIN;

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Banner de Status - Regra de Negócio Crucial */}
        {!isApproved && (
          <div className={`p-6 rounded-[30px] border flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-top duration-500 shadow-sm ${
            status === 'pending' 
              ? 'bg-amber-50 border-amber-100 text-amber-800' 
              : 'bg-red-50 border-red-100 text-red-800'
          }`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
              status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
            }`}>
              <i className={`fas ${status === 'pending' ? 'fa-hourglass-half' : 'fa-ban'}`}></i>
            </div>
            <div className="flex-grow text-center md:text-left">
              <h3 className="text-lg font-black tracking-tight">
                {status === 'pending' 
                  ? (lang === 'pt' ? 'Conta em Análise' : 'Account Under Review')
                  : (lang === 'pt' ? 'Acesso Restrito' : 'Restricted Access')}
              </h3>
              <p className="text-sm font-medium opacity-90 leading-relaxed">
                {status === 'pending'
                  ? (lang === 'pt' ? 'A sua conta de stand profissional está a ser validada pela nossa equipa. Receberá um e-mail em breve com o resultado da análise.' : 'Your professional stand account is being validated by our team. You will receive an email soon.')
                  : (lang === 'pt' ? 'Infelizmente, o seu acesso de stand profissional não foi aprovado. Contacte o suporte para habilitar a criação de anuncios.' : 'Unfortunately, your professional stand access was not approved. Contact support to enable listing creation.')}
              </p>
            </div>
          </div>
        )}

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">{t.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-gray-500 font-bold">{standName}</span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                status === 'approved' ? 'bg-green-100 text-green-700' : 
                status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {status}
              </span>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/cliente/editar')}
              className="px-6 py-4 rounded-2xl border border-gray-200 font-black text-gray-600 bg-white hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <i className="fas fa-user-cog"></i>
              {lang === 'pt' ? 'Editar Perfil' : 'Edit Profile'}
            </button>
            <button 
              onClick={() => isApproved && navigate('/anunciar')}
              disabled={!isApproved}
              className={`px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all ${
                isApproved 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed grayscale'
              }`}
            >
              <i className={`fas ${isApproved ? 'fa-plus' : 'fa-lock'}`}></i>
              {t.newAd}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black">{t.myVehicles}</h3>
                <span className="text-xs font-bold text-gray-400">{myCars.length} viaturas</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] uppercase font-black tracking-widest text-gray-400 border-b border-gray-50">
                    <tr>
                      <th className="px-4 py-4">Veículo</th>
                      <th className="px-4 py-4">Preço</th>
                      <th className="px-4 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {!isApproved ? (
                       <tr>
                        <td colSpan={3} className="px-4 py-20 text-center text-gray-400">
                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-lock text-2xl opacity-20"></i>
                          </div>
                          <p className="font-bold">Conteúdo bloqueado até à aprovação da conta.</p>
                        </td>
                      </tr>
                    ) : myCars.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-16 text-center text-gray-400 font-bold italic">
                          Ainda não possui anúncios publicados.
                        </td>
                      </tr>
                    ) : myCars.map(car => (
                      <tr key={car.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-6">
                          <div className="flex items-center gap-4">
                            <img src={car.image} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="" />
                            <div>
                              <p className="font-bold text-gray-900 leading-tight">{car.brand} {car.model}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{car.year} • {car.fuel}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-6">
                          <span className="font-bold text-blue-600">
                            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(car.price)}
                          </span>
                        </td>
                        <td className="px-4 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            <Link to={`/veiculos/${car.id}`} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:text-blue-600 flex items-center justify-center transition-all"><i className="fas fa-eye"></i></Link>
                            <Link to={`/editar-anuncio/${car.id}`} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:text-amber-600 flex items-center justify-center transition-all"><i className="fas fa-edit"></i></Link>
                            <button onClick={() => handleDeleteCar(car.id)} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:text-red-600 flex items-center justify-center transition-all"><i className="fas fa-trash-alt"></i></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside className="space-y-8">
             <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
               <h3 className="text-xl font-black mb-6">{t.recentLeads}</h3>
               <div className="space-y-4">
                 {!isApproved ? (
                   <div className="p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                     <i className="fas fa-shield-alt text-slate-300 mb-2 block"></i>
                     <p className="text-slate-400 text-xs font-bold leading-relaxed">
                       {status === 'pending' ? 'Os leads serão desbloqueados após a validação.' : 'Acesso a leads negado.'}
                     </p>
                   </div>
                 ) : myLeads.length === 0 ? (
                   <p className="text-gray-400 text-sm font-medium">Sem novos leads.</p>
                 ) : myLeads.slice(0, 5).map(lead => (
                   <div key={lead.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <p className="font-bold text-sm text-gray-900">{lead.customer_name}</p>
                     <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase">
                       { (lead.cars as any)?.brand } { (lead.cars as any)?.model }
                     </p>
                   </div>
                 ))}
               </div>
             </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default StandDashboard;
