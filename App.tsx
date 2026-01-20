
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserRole, Language } from './types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Listings from './pages/Listings';
import About from './pages/About';
import Blog from './pages/Blog';
import Article from './pages/Article';
import CarDetail from './pages/CarDetail';
import VanityCarDetail from './pages/VanityCarDetail';
import StandDashboard from './pages/StandDashboard';
import CreateAd from './pages/CreateAd';
import EditAd from './pages/EditAd';
import UserArea from './pages/UserArea';
import EditProfile from './pages/EditProfile';
import AdminDashboard from './pages/AdminDashboard';
import Auth from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminLogin from './pages/AdminLogin';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import CookiePolicy from './pages/CookiePolicy';
import StandDetail from './pages/StandDetail';
import StandsList from './pages/StandsList';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('pt');
  const [role, setRole] = useState<UserRole>(UserRole.VISITOR);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      // 1. Tentar recuperar sessão mock
      const localSession = localStorage.getItem('fc_session');
      if (localSession) {
        try {
          const sessionData = JSON.parse(localSession);
          setRole(sessionData.role);
          setIsLoggedIn(true);
          setIsLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem('fc_session');
        }
      }

      // 2. Tentar recuperar sessão real Supabase
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userRole = session.user.user_metadata?.role || UserRole.VISITOR;
          setRole(userRole);
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.warn("Supabase session check failed.");
      }
      setIsLoading(false);
    };
    
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        window.location.hash = '/redefinir-senha';
      }

      if (session?.user) {
        const userRole = session.user.user_metadata?.role || UserRole.VISITOR;
        setRole(userRole);
        setIsLoggedIn(true);
      } else if (!localStorage.getItem('fc_session')) {
        setRole(UserRole.VISITOR);
        setIsLoggedIn(false);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const toggleLanguage = () => setLanguage(prev => prev === 'pt' ? 'en' : 'pt');
  
  const handleToggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
  };

  const handleLogin = (userRole: UserRole) => {
    setRole(userRole);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    // A limpeza forçada via recarregamento é a única forma de garantir 100% de sucesso
    // em ambientes de marketplace com múltiplas sessões (Supabase + Mock)
    localStorage.clear();
    sessionStorage.clear();
    
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Erro ao fazer signOut:", e);
    }

    // Redireciona e recarrega para limpar o estado do React
    window.location.href = '/#/';
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar 
          lang={language} 
          role={role} 
          isLoggedIn={isLoggedIn}
          onToggleLang={toggleLanguage} 
          onLogout={handleLogout}
        />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home lang={language} onToggleFavorite={handleToggleFavorite} favorites={favorites} />} />
            <Route path="/veiculos" element={<Listings lang={language} onToggleFavorite={handleToggleFavorite} favorites={favorites} />} />
            <Route path="/veiculos/:id" element={<CarDetail lang={language} onToggleFavorite={handleToggleFavorite} favorites={favorites} />} />
            <Route path="/v/:slug" element={<VanityCarDetail lang={language} onToggleFavorite={handleToggleFavorite} favorites={favorites} />} />
            <Route path="/sobre" element={<About lang={language} />} />
            <Route path="/blog" element={<Blog lang={language} />} />
            <Route path="/blog/:id" element={<Article lang={language} />} />
            <Route path="/stands" element={<StandsList lang={language} />} />
            <Route path="/stand/:standName" element={<StandDetail lang={language} onToggleFavorite={handleToggleFavorite} favorites={favorites} />} />
            
            <Route 
              path="/dashboard" 
              element={isLoggedIn && (role === UserRole.STAND || role === UserRole.ADMIN) ? <StandDashboard lang={language} role={role} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/anunciar" 
              element={isLoggedIn && role === UserRole.STAND ? <CreateAd lang={language} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/editar-anuncio/:id" 
              element={isLoggedIn && (role === UserRole.STAND || role === UserRole.ADMIN) ? <EditAd lang={language} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/admin" 
              element={isLoggedIn && role === UserRole.ADMIN ? <AdminDashboard lang={language} role={role} /> : <Navigate to="/admin/login" />} 
            />
            <Route 
              path="/cliente" 
              element={isLoggedIn ? <UserArea lang={language} favorites={favorites} onLogout={handleLogout} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/cliente/editar" 
              element={isLoggedIn ? <EditProfile lang={language} onLogout={handleLogout} /> : <Navigate to="/login" />} 
            />

            <Route path="/admin/login" element={<AdminLogin lang={language} onLogin={handleLogin} />} />
            <Route path="/login" element={<Auth lang={language} mode="login" onLogin={handleLogin} />} />
            <Route path="/registo" element={<Auth lang={language} mode="register" onLogin={handleLogin} />} />
            <Route path="/esqueci-senha" element={<ForgotPassword lang={language} />} />
            <Route path="/redefinir-senha" element={<ResetPassword lang={language} />} />
            <Route path="/privacidade" element={<PrivacyPolicy lang={language} />} />
            <Route path="/termos" element={<TermsOfUse lang={language} />} />
            <Route path="/cookies" element={<CookiePolicy lang={language} />} />
          </Routes>
        </main>

        <Footer lang={language} />
      </div>
    </HashRouter>
  );
};

export default App;
