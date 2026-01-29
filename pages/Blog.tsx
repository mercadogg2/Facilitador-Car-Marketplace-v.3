
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Language, BlogPost } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';

interface BlogProps {
  lang: Language;
}

const Blog: React.FC<BlogProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang].blog;
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .order('date', { ascending: false });
        
        if (!error && data) {
          setPosts(data);
        }
      } catch (err) {
        console.error("Erro ao buscar blog posts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    setIsSubscribing(true);
    setSubscribeError(null);

    try {
      // Inserimos na tabela de leads com o identificador NEWSLETTER
      const { error } = await supabase.from('leads').insert([{
        customer_name: 'Subscritor Blog',
        customer_email: newsletterEmail.trim().toLowerCase(),
        customer_phone: 'N/A',
        message: 'Subscrição via Newsletter do Blog',
        stand_name: 'NEWSLETTER',
        status: 'Pendente'
      }]);

      if (error) throw error;

      setSubscribeSuccess(true);
      setNewsletterEmail('');
      setTimeout(() => setSubscribeSuccess(false), 5000);
    } catch (err: any) {
      setSubscribeError(lang === 'pt' ? 'Erro ao subscrever. Tente novamente.' : 'Error subscribing. Try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">{t.title}</h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">{t.subtitle}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {posts.map(post => (
            <Link to={`/blog/${post.id}`} key={post.id} className="group cursor-pointer block animate-in fade-in slide-in-from-bottom-4 duration-500">
              <article>
                <div className="relative aspect-video rounded-3xl overflow-hidden mb-6 shadow-xl">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=800';
                    }}
                  />
                  <div className="absolute top-6 left-6 flex items-center space-x-2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {lang === 'pt' ? 'Conselhos' : 'Tips'}
                    </span>
                    <span className="bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-[10px] font-bold">
                      {post.reading_time}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center text-sm text-gray-400 mb-3 space-x-4">
                    <span className="flex items-center">
                      <i className="far fa-calendar mr-2"></i>
                      {new Date(post.date).toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-US')}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-4 line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-gray-500 leading-relaxed mb-6 line-clamp-2">{post.excerpt}</p>
                  <div className="text-blue-600 font-bold flex items-center group/btn">
                    {t.readMore}
                    <i className="fas fa-arrow-right ml-2 group-hover/btn:translate-x-1 transition-transform"></i>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
          <p className="text-gray-500 font-bold">Nenhum artigo publicado ainda.</p>
        </div>
      )}

      <section className="mt-24 bg-gray-900 rounded-[40px] p-12 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto">
          {subscribeSuccess ? (
            <div className="animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                <i className="fas fa-check"></i>
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{lang === 'pt' ? 'Obrigado!' : 'Thank you!'}</h3>
              <p className="text-gray-400">{lang === 'pt' ? 'Agora faz parte da nossa comunidade.' : 'You are now part of our community.'}</p>
            </div>
          ) : (
            <>
              <h3 className="text-3xl font-bold text-white mb-4">{t.newsletterTitle}</h3>
              <p className="text-gray-400 mb-8">{t.newsletterDesc}</p>
              <form onSubmit={handleNewsletterSubscribe} className="flex flex-col sm:flex-row gap-4">
                <input 
                  required
                  type="email" 
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={t.placeholder}
                  className="flex-grow bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                />
                <button 
                  type="submit"
                  disabled={isSubscribing}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black px-10 py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
                >
                  {isSubscribing ? <i className="fas fa-circle-notch animate-spin"></i> : t.subscribe}
                </button>
              </form>
              {subscribeError && <p className="text-red-400 text-xs font-bold mt-4">{subscribeError}</p>}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Blog;
