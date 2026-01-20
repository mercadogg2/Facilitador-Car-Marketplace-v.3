
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface CarCardProps {
  car: Car;
  lang: Language;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
  onSelect: (car: Car) => void;
}

const CarCard: React.FC<CarCardProps> = ({ car, lang, onToggleFavorite, isFavorite, onSelect }) => {
  const t = TRANSLATIONS[lang].common;
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/veiculos/${car.id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col h-full cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img 
          src={car.image} 
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800';
          }}
        />
        <div className="absolute top-4 right-4 flex flex-col space-y-2 items-end">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(car.id); }}
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md backdrop-blur-sm transition-all ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600 hover:bg-white'}`}
          >
            <i className={`${isFavorite ? 'fas' : 'far'} fa-heart text-sm`}></i>
          </button>
          {car.verified && (
            <div className="bg-blue-600 text-white px-2.5 py-1 rounded shadow-lg flex items-center space-x-1.5 animate-in fade-in slide-in-from-top-2">
              <i className="fas fa-check-circle text-[10px]"></i>
              <span className="text-[10px] font-bold uppercase tracking-wider">Verified</span>
            </div>
          )}
        </div>
        <div className="absolute bottom-4 left-4">
          <span className="bg-gray-900/80 backdrop-blur-md text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight">
            {car.category}
          </span>
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-4">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-[17px] text-gray-900 leading-tight flex-grow">
              {car.brand} {car.model}
            </h3>
            <span className="font-bold text-blue-600 text-[17px] whitespace-nowrap">
              {new Intl.NumberFormat(lang === 'pt' ? 'pt-PT' : 'en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(car.price)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 font-medium">{car.year} • {car.fuel}</p>
        </div>

        <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-6 text-[13px] text-gray-600 font-medium">
          <div className="flex items-center">
            <i className="fas fa-road mr-2.5 text-gray-400 w-4 text-center"></i>
            {car.mileage.toLocaleString()} km
          </div>
          <div className="flex items-center">
            <i className="fas fa-cog mr-2.5 text-gray-400 w-4 text-center"></i>
            {car.transmission}
          </div>
          <div className="flex items-center">
            <i className="fas fa-map-marker-alt mr-2.5 text-gray-400 w-4 text-center"></i>
            {car.location}
          </div>
          <Link 
            to={`/stand/${encodeURIComponent(car.stand_name)}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center hover:text-blue-600 transition-colors"
          >
            <i className="fas fa-store mr-2.5 text-gray-400 w-4 text-center"></i>
            <span className="truncate underline underline-offset-4 decoration-gray-200">{car.stand_name}</span>
          </Link>
        </div>

        <div className="mt-auto">
          <button 
            onClick={(e) => { e.stopPropagation(); onSelect(car); }}
            className="w-full bg-gray-50 hover:bg-blue-50 text-gray-900 hover:text-blue-700 font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center border border-gray-100 hover:border-blue-200"
          >
            {t.contact}
            <i className="fab fa-whatsapp ml-2.5 text-green-500 text-lg"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarCard;
