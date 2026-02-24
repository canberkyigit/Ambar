export interface BarMenuItem {
  cocktailId: string;
  cocktailName: string;
  price?: string;
}

export interface Bar {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  address?: string;
  menu: BarMenuItem[];
  rating: number;
  reviewCount: number;
  imageUrl?: string;
}
