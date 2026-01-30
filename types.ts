
export enum UserRole {
  VISITOR = 'visitor',
  STAND = 'stand',
  ADMIN = 'admin'
}

export type ProfileStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  stand_name?: string;
  slug?: string;
  description?: string;
  created_at: string;
  last_sign_in?: string;
  phone?: string;
  status: ProfileStatus;
  location?: string;
  profile_image?: string;
}

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel: 'Gasolina' | 'Diesel' | 'Elétrico' | 'Híbrido';
  transmission: 'Manual' | 'Automático';
  image: string;
  images?: string[];
  description: string;
  stand_name: string;
  stand_slug?: string;
  verified: boolean;
  location: string;
  category: 'SUV' | 'Sedan' | 'Coupe' | 'Hatchback' | 'Utilitário';
  subdomain?: string;
  created_at?: string;
  user_id?: string;
  active?: boolean;
  is_featured?: boolean;
  views?: number; // Novo campo para análise
}

export interface Lead {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  car_id: string;
  stand_name?: string;
  message: string;
  status: 'Pendente' | 'Contactado' | 'Vendido' | 'Cancelado';
  created_at: string;
  car?: Car;
  cars?: Car; 
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  image: string;
  reading_time: string;
}

export type Language = 'pt' | 'en';

export interface AppState {
  language: Language;
  userRole: UserRole;
  favorites: string[];
}
