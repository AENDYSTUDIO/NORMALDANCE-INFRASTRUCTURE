"use client";

import { Suspense } from 'react';

import { NFTMemorials, default as NFTMemorialsComponent } from '@/components/memorials/index';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Upload,
  Plus,
  ShieldCheck,
  Star,
  Rocket,
  Globe,
  Lock,
  Unlock,
  } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTelegram } from "@/contexts/telegram-context";

// Web3 transaction interfaces
interface Web3Transaction {
  id: string;
  type: 'mint' | 'transfer' | 'stake';
  tokenMint?: number;
  { amount: number; // in blockchain native currency
  } | {
  message: string;
  }
  interface MintNFT {
    name: string;
    description: string;
    imageUrl: string;
    initialPrice: number;
    maxSupply: number;
    royalty: number; // percentage of sales
  }
  interface TransferNFT {
    from: string;
    to: string;
    id: string;
    amount: number;
    tokenMint?: number;
  }

// Custom Web3 service for NFT operations
interface Web3Service {
  mintNFT: (options: MintNFTOptions) => Promise<NFTMemorial>;
  transferNFT: (from: string, to: string, amount: number) => Promise<string>;
  stakeNFT: (tokenId: string, days: number) => Promise<boolean>;
  listTransactions: (tokenAddress: string) => Promise<Web3Transaction[]>;
}

interface MintNFTOptions {
  title: string;
  artist: string;
  description: string;
  genre: string;
  imageUrl: string;
  initialPrice: number;
  mintCount: number;
  metadata?: Record<string, any>;
}
