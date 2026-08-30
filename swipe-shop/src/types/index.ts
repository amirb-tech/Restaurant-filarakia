export type Category =
  | 'Ηλεκτρονικά'
  | 'Gaming'
  | 'Ρούχα'
  | 'Σπίτι'
  | 'Αθλητισμός'
  | 'Ομορφιά';

export interface Product {
  id: string;
  title: string;
  brand: string;
  price: number;
  originalPrice?: number;
  category: Category;
  image: string;
  rating: number;
  reviews: number;
}
