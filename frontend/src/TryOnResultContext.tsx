import React, { createContext, useContext, useState } from 'react';
import { TryOnResult } from './tryOnApi';
const Context = createContext<{ result: TryOnResult | null; setResult: (value: TryOnResult | null) => void } | null>(null);
export function TryOnResultProvider({ children }: { children: React.ReactNode }) {
  const [result, setResult] = useState<TryOnResult | null>(null);
  return <Context.Provider value={{ result, setResult }}>{children}</Context.Provider>;
}
export function useTryOnResult() {
  const context = useContext(Context);
  if (!context) throw new Error('Try-on result provider is missing.');
  return context;
}
