
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
