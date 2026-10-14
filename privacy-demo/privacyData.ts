export type ClosetItem = { id: string; name: string; category: string; color: string };
export type MockData = {
  closet: ClosetItem[];
  bodyPhotos: string[];
  tryOns: string[];
  chats: string[];
  outfits: { name: string; itemIds: string[] }[];
  memory: { style: string; size: string; budget: string };
};
export const initialMockData: MockData = {
  closet: [
    { id: '1', name: 'Lavender knit', category: 'Top', color: 'Lavender' },
    { id: '2', name: 'Everyday denim', category: 'Bottom', color: 'Indigo' },
    { id: '3', name: 'White sneakers', category: 'Shoes', color: 'White' },
  ],
  bodyPhotos: ['body-photo-demo.jpg'],
  tryOns: ['weekend-try-on-demo.jpg'],
  chats: ['Suggest a casual weekend outfit.'],
  outfits: [{ name: 'Weekend casual', itemIds: ['1', '2', '3'] }],
  memory: { style: 'Minimal, casual', size: 'M', budget: '100' },
};
export const emptyMockData: MockData = { closet: [], bodyPhotos: [], tryOns: [], chats: [], outfits: [], memory: { style: '', size: '', budget: '' } };
export function countMockRecords(data: MockData) {
  return data.closet.length + data.bodyPhotos.length + data.tryOns.length + data.chats.length + data.outfits.length + Object.values(data.memory).filter(Boolean).length;
}
