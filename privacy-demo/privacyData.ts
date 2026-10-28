export type ClosetItem = { id: string; name: string; category: string; color: string };
export type MockData = {
  closet: ClosetItem[];
  bodyPhotos: string[];
  tryOns: string[];
  chats: string[];
  outfits: { name: string; itemIds: string[] }[];
  memory: { style: string; size: string; budget: string };
};
export const initialMockData: MockData = { closet: [], bodyPhotos: [], tryOns: [], chats: [], outfits: [], memory: { style: '', size: '', budget: '' } };
export const emptyMockData: MockData = { closet: [], bodyPhotos: [], tryOns: [], chats: [], outfits: [], memory: { style: '', size: '', budget: '' } };
export function countMockRecords(data: MockData) {
  return data.closet.length + data.bodyPhotos.length + data.tryOns.length + data.chats.length + data.outfits.length + Object.values(data.memory).filter(Boolean).length;
}
