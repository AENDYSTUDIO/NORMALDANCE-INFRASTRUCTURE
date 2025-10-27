// Глобальные типы для проекта
export interface User {
  id: string;
  name: string;
  wallet?: string;
  avatar?: string;
  bio?: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  playCount: number;
  likeCount: number;
  ipfsHash?: string;
}

export interface WalletInfo {
  publicKey: string;
  balance: number;
  connected: boolean;
}

// Замена для {} типов
export type EmptyObject = Record<string, never>;
export type AnyObject = Record<string, unknown>;

// Замена для Function типов
export type AnyFunction = (...args: unknown[]) => unknown;
export type VoidFunction = () => void;