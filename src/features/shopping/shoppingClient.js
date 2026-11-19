import { safeHttps, validateSearch } from './shoppingModel';

export async function searchShopping(input, signal) {
  const base = process.env.EXPO_PUBLIC_SHOPPING_API_URL;
  if (!base) throw new Error('Live shopping is not connected yet. You can still browse your wardrobe.');
  const search = validateSearch(input);
  const url = new URL(`${base.replace(/\/$/, '')}/shopping`);
  Object.entries(search).forEach(([key, value]) => {
    if (value !== null) url.searchParams.set(key, String(value));
  });
  const response = await fetch(url.toString(), { signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Shopping could not be loaded. Please try again.');
  if (!Array.isArray(data.products) || data.products.some((product) =>
    !product || typeof product.id !== 'string' || typeof product.title !== 'string' ||
    typeof product.retailer !== 'string' || !Number.isFinite(product.price) || product.price < 0 ||
    product.currency !== 'USD' || !safeHttps(product.url) ||
    (product.image !== null && !safeHttps(product.image))) ||
    !Number.isFinite(Date.parse(data.fetchedAt))) throw new Error('Shopping returned an unexpected response. Please try again.');
  return data;
}
