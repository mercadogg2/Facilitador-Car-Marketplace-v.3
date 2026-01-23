
import { Car, BlogPost } from './types';

export const MOCK_CARS: Car[] = [
  {
    id: '1',
    brand: 'BMW',
    model: '320i M Sport',
    year: 2024,
    price: 320000,
    mileage: 0,
    fuel: 'Gasolina',
    transmission: 'Automático',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800',
    description: 'Sedã de luxo com performance desportiva e tecnologia de ponta. Inclui Pack M Sport, teto de abrir panorâmico e sistema de som Harman Kardon.',
    stand_name: 'Auto Premium Lisboa',
    verified: true,
    location: 'Lisboa',
    category: 'Sedan',
    subdomain: 'bmw-320i-lisboa'
  }
];

export const MOCK_BLOG: BlogPost[] = [
  {
    id: 'b1',
    title: 'Como comprar carro usado com segurança em 2026',
    excerpt: 'Dicas essenciais para evitar fraudes e garantir o melhor negócio no mercado de usados.',
    content: `Comprar um carro usado pode ser um desafio, mas em 2026 a tecnologia está do nosso lado. A primeira regra é verificar o histórico de manutenção digital. No Facilitador Car, todos os nossos stands parceiros fornecem relatórios transparentes. Verifique sempre o estado das baterias em veículos eletrificados e não hesite em solicitar um test-drive em diferentes condições de estrada.`,
    author: 'Equipa Facilitador Car',
    date: '2024-05-15',
    image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=800',
    reading_time: '5 min'
  }
];

export const TRANSLATIONS = {
  pt: {
    nav: { home: 'Início', vehicles: 'Veículos', stands: 'Stands', about: 'Sobre', blog: 'Blog', dashboard: 'Stand', client: 'Área Cliente', admin: 'Admin', login: 'Entrar', logout: 'Sair' },
    home: {
      hero: 'O Facilitador Car simplifica a sua compra.',
      subHero: 'Compre com segurança em stands verificados e com o apoio de quem percebe do assunto. De Portugal aos portugueses.',
      searchPlaceholder: 'Marca, modelo ou ano...',
      featured: 'Veículos em Destaque',
      viewAll: 'Ver Todos',
      whyUs: 'Porquê nós?',
      credibility: 'Credibilidade que faz a diferença na sua escolha.',
      whyUsDesc: 'No Facilitador Car, não somos apenas mais um marketplace. Filtramos rigorosamente os nossos parceiros para garantir que cada negócio seja transparente e seguro.',
      benefits: [
        { title: 'Certificação de Stands', desc: 'Apenas lojistas com histórico impecável.' },
        { title: 'Apoio de Influenciadores', desc: 'Parceiros que testam e aprovam os veículos.' },
        { title: 'Negociação Transparente', desc: 'Canal direto via WhatsApp para maior agilidade.' }
      ]
    },
    stands: {
      title: 'Stands Certificados',
      subtitle: 'Conheça a nossa rede de parceiros rigorosamente selecionados.',
      searchPlaceholder: 'Pesquisar por nome ou cidade...',
      viewStock: 'Ver Stock',
      verifiedPartner: 'Parceiro Certificado',
      noResults: 'Nenhum stand encontrado.'
    },
    standDetail: {
      viewStock: 'Ver Stock Completo',
      totalVehicles: 'veículos disponíveis',
      since: 'Parceiro desde',
      location: 'Localização',
      contactStand: 'Falar com suporte',
      aboutStand: 'Sobre o Stand',
      verifiedReason: 'Este stand passou pelo rigoroso processo de auditoria Facilitador Car.'
    },
    auth: {
      loginTitle: 'Bem-vindo de volta',
      registerTitle: 'Crie a sua conta',
      email: 'Endereço de E-mail',
      password: 'Palavra-passe',
      forgotPasswordTitle: 'Recuperar Acesso',
      forgotPasswordSubtitle: 'Introduza o seu e-mail para receber o link de recuperação.',
      sendResetLink: 'Enviar Link de Recuperação',
      checkEmail: 'Verifique o seu E-mail',
      resetPasswordTitle: 'Nova Palavra-passe',
      resetPasswordSubtitle: 'Escolha uma nova senha segura para a sua conta.',
      updatePassword: 'Atualizar Palavra-passe',
      resetSuccess: 'Palavra-passe Atualizada!'
    },
    blog: {
      title: 'Blog Facilitador',
      subtitle: 'As últimas novidades do mundo automóvel e dicas exclusivas.',
      readMore: 'Ler Artigo',
      newsletterTitle: 'Fique por dentro',
      newsletterDesc: 'Receba as melhores ofertas e novidades diretamente no seu e-mail.',
      subscribe: 'Subscrever',
      placeholder: 'O seu melhor e-mail...',
      related: 'Artigos Relacionados'
    },
    about: {
      title: 'A Nossa Missão',
      mission: 'Transparência e Confiança',
      desc: 'O Facilitador Car nasceu para revolucionar a forma como os portugueses compram carros, unindo tecnologia à credibilidade de stands certificados.',
      values: [
        { title: 'Segurança', desc: 'Processos de auditoria rigorosos em todos os parceiros.' },
        { title: 'Proximidade', desc: 'Apoio real em cada etapa da sua negociação.' },
        { title: 'Inovação', desc: 'Uma plataforma ágil pensada para o utilizador moderno.' }
      ],
      historyTitle: 'A Nossa História',
      historyDesc: 'Começámos com um objetivo simples: eliminar o medo de comprar carros usados. Hoje, somos a ponte de confiança entre milhares de clientes e os melhores profissionais do setor.',
      stats: ['Parceiros', 'Satisfação'],
    },
    userArea: {
      greeting: 'Olá, Bem-vindo!',
      memberSince: 'Membro desde',
      myFavorites: 'Meus Favoritos',
      editProfile: 'Editar Perfil',
      logout: 'Terminar Sessão',
      emptyTitle: 'Sem favoritos ainda',
      emptyDesc: 'Explore as nossas viaturas e guarde as suas preferidas aqui.',
      explore: 'Explorar Veículos'
    },
    editProfile: {
      title: 'Meu Perfil',
      subtitle: 'Mantenha os seus dados atualizados para uma melhor experiência.',
      personalInfo: 'Dados Pessoais',
      security: 'Segurança da Conta',
      saveChanges: 'Guardar Alterações',
      success: 'Perfil Atualizado!',
      fields: {
        name: 'Nome Completo',
        phone: 'Telemóvel',
        location: 'Localização',
        newPassword: 'Nova Palavra-passe'
      }
    },
    createAd: {
      title: 'Publicar Viatura',
      subtitle: 'Preencha os detalhes e comece a receber leads qualificadas.',
      publish: 'Publicar Anúncio Agora',
      success: 'Viatura Publicada!'
    },
    common: {
      price: 'Preço',
      year: 'Ano',
      km: 'Km',
      fuel: 'Combustível',
      contact: 'Tenho interesse',
      verified: 'Stand Verificado',
      leads: 'Gestão de Leads',
      search: 'Pesquisar',
      filters: 'Filtros',
      brand: 'Marca',
      category: 'Tipo de Veículo',
      maxPrice: 'Preço Máximo',
      clearFilters: 'Limpar Filtros',
      noResults: 'Nenhum veículo encontrado',
      found: 'Veículos encontrados',
      sortBy: 'Ordenar por',
      recent: 'Mais recentes',
      back: 'Voltar',
      share: 'Partilhar',
      delete: 'Remover',
      confirmDelete: 'Tem a certeza?',
      actions: 'Ações'
    },
    detail: {
      characteristics: 'Características',
      description: 'Descrição do Veículo',
      dealerInfo: 'Informações do Stand',
      contactTitle: 'Fale com o Stand Agora',
      callButton: 'Ligar para o Stand',
      location: 'Localização',
      relatedTitle: 'Veículos Relacionados',
      verifiedReason: 'Stand verificado com 12 pontos de auditoria.'
    },
    footer: {
      desc: 'Segurança e credibilidade na compra do seu próximo veículo através de stands verificados.',
      links: 'Links',
      legal: 'Legal',
      rights: 'Todos os direitos reservados. 2026.'
    }
  },
  en: {
    nav: { home: 'Home', vehicles: 'Vehicles', stands: 'Dealers', about: 'About', blog: 'Blog', dashboard: 'Stand', client: 'Client', admin: 'Admin', login: 'Login', logout: 'Logout' },
    home: {
      hero: 'Facilitador Car simplifies your purchase.',
      subHero: 'Buy safely in verified dealerships with expert support.',
      searchPlaceholder: 'Make, model or year...',
      featured: 'Featured Vehicles',
      viewAll: 'View All',
      whyUs: 'Why us?',
      credibility: 'Credibility that makes the difference.',
      whyUsDesc: 'We filter partners to ensure every deal is transparent and safe.',
      benefits: [
        { title: 'Dealership Certification', desc: 'Only top-tier retailers.' },
        { title: 'Expert Support', desc: 'Approved and tested vehicles.' },
        { title: 'WhatsApp Direct', desc: 'Agile communication channel.' }
      ]
    },
    stands: {
      title: 'Certified Dealers',
      subtitle: 'Our network of strictly selected partners.',
      searchPlaceholder: 'Search name or city...',
      viewStock: 'View Stock',
      verifiedPartner: 'Certified Partner',
      noResults: 'No dealers found.'
    },
    standDetail: {
      viewStock: 'View Full Stock',
      totalVehicles: 'vehicles available',
      since: 'Partner since',
      location: 'Location',
      contactStand: 'Talk to Support',
      aboutStand: 'About Dealership',
      verifiedReason: 'Passed Facilitador Car audit.'
    },
    auth: {
      loginTitle: 'Welcome back',
      registerTitle: 'Create your account',
      email: 'Email Address',
      password: 'Password',
      forgotPasswordTitle: 'Recover Access',
      forgotPasswordSubtitle: 'Enter your email to receive a recovery link.',
      sendResetLink: 'Send Recovery Link',
      checkEmail: 'Check your Email',
      resetPasswordTitle: 'New Password',
      resetPasswordSubtitle: 'Choose a new secure password for your account.',
      updatePassword: 'Update Password',
      resetSuccess: 'Password Updated!'
    },
    blog: {
      title: 'Facilitator Blog',
      subtitle: 'The latest automotive news and exclusive tips.',
      readMore: 'Read Article',
      newsletterTitle: 'Stay Updated',
      newsletterDesc: 'Get the best deals and news directly in your inbox.',
      subscribe: 'Subscribe',
      placeholder: 'Your best email...',
      related: 'Related Articles'
    },
    about: {
      title: 'Our Mission',
      mission: 'Transparency and Trust',
      desc: 'Facilitador Car was born to revolutionize how people buy cars, combining technology with the credibility of certified dealerships.',
      values: [
        { title: 'Security', desc: 'Rigorous audit processes for all partners.' },
        { title: 'Proximity', desc: 'Real support in every stage of your negotiation.' },
        { title: 'Innovation', desc: 'An agile platform designed for the modern user.' }
      ],
      historyTitle: 'Our History',
      historyDesc: 'We started with a simple goal: to eliminate the fear of buying used cars. Today, we are the bridge of trust between thousands of clients and the best professionals.',
      stats: ['Partners', 'Satisfaction'],
    },
    userArea: {
      greeting: 'Hi, Welcome!',
      memberSince: 'Member since',
      myFavorites: 'My Favorites',
      editProfile: 'Edit Profile',
      logout: 'Logout',
      emptyTitle: 'No favorites yet',
      emptyDesc: 'Explore our vehicles and save your favorites here.',
      explore: 'Explore Vehicles'
    },
    editProfile: {
      title: 'My Profile',
      subtitle: 'Keep your data updated for a better experience.',
      personalInfo: 'Personal Information',
      security: 'Account Security',
      saveChanges: 'Save Changes',
      success: 'Profile Updated!',
      fields: {
        name: 'Full Name',
        phone: 'Phone Number',
        location: 'Location',
        newPassword: 'New Password'
      }
    },
    createAd: {
      title: 'Post Vehicle',
      subtitle: 'Fill in the details and start receiving qualified leads.',
      publish: 'Publish Ad Now',
      success: 'Vehicle Published!'
    },
    common: {
      price: 'Price',
      year: 'Year',
      km: 'Km',
      fuel: 'Fuel',
      contact: 'I am interested',
      verified: 'Verified Dealer',
      leads: 'Lead Management',
      search: 'Search',
      filters: 'Filters',
      brand: 'Brand',
      category: 'Type',
      maxPrice: 'Max Price',
      clearFilters: 'Clear Filters',
      noResults: 'No vehicles found',
      found: 'Vehicles found',
      sortBy: 'Sort by',
      recent: 'Recent',
      back: 'Back',
      share: 'Share',
      delete: 'Delete',
      confirmDelete: 'Are you sure?',
      actions: 'Actions'
    },
    detail: {
      characteristics: 'Key Features',
      description: 'Vehicle Description',
      dealerInfo: 'Dealership Information',
      contactTitle: 'Contact Dealer Now',
      callButton: 'Call Dealer',
      location: 'Location',
      relatedTitle: 'Related Vehicles',
      verifiedReason: '12-point verified dealership.'
    },
    footer: {
      desc: 'Security and credibility for your next vehicle purchase.',
      links: 'Links',
      legal: 'Legal',
      rights: 'All rights reserved. 2026.'
    }
  }
};
