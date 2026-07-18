import type { Product } from '@/types';

export interface ProductSearchResponse {
  products: Product[];
  source: 'local' | 'off' | 'none';
}

export async function searchProducts(query: string): Promise<ProductSearchResponse> {
  const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Unable to search products');
  return response.json() as Promise<ProductSearchResponse>;
}

export interface PersonalProductInput {
  id?: string;
  baseProductId?: string | null;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  source?: 'manual' | 'ai';
}

export async function getPersonalProducts(): Promise<Product[]> {
  const response = await fetch('/api/products/personal');
  if (!response.ok) throw new Error('Unable to load products');
  return response.json() as Promise<Product[]>;
}

export async function savePersonalProduct(input: PersonalProductInput): Promise<Product> {
  const response = await fetch('/api/products/personal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Unable to save product');
  return response.json() as Promise<Product>;
}

export async function deletePersonalProduct(id: string): Promise<void> {
  const response = await fetch(`/api/products/personal?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Unable to delete product');
}
