-- NormalDance Demo Database Initialization
-- This file creates the schema for demo environment

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('artist', 'listener', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE track_status AS ENUM ('draft', 'processing', 'published', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE nft_status AS ENUM ('draft', 'minting', 'minted', 'failed', 'burned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'listener',
    wallet_address VARCHAR(255),
    bio TEXT,
    avatar_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT false,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    tracks_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracks table
CREATE TABLE IF NOT EXISTS tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    artist_id UUID REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    genre VARCHAR(100),
    duration INTEGER NOT NULL, -- in seconds
    bpm INTEGER,
    key_signature VARCHAR(10),
    energy DECIMAL(3,2),
    status track_status DEFAULT 'draft',
    ipfs_hash VARCHAR(255),
    blockchain_tx VARCHAR(255),
    nft_token_id VARCHAR(255),
    play_count BIGINT DEFAULT 0,
    like_count BIGINT DEFAULT 0,
    is_explicit BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    price_sol DECIMAL(10,4),
    royalty_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Albums table (for collections of tracks)
CREATE TABLE IF NOT EXISTS albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    artist_id UUID REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    cover_ipfs_hash VARCHAR(255),
    track_count INTEGER DEFAULT 0,
    is_nft BOOLEAN DEFAULT false,
    nft_contract VARCHAR(255),
    price_sol DECIMAL(10,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Album tracks relationship
CREATE TABLE IF NOT EXISTS album_tracks (
    album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    PRIMARY KEY (album_id, track_id)
);

-- Playlists table
CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    track_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playlist tracks
CREATE TABLE IF NOT EXISTS playlist_tracks (
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (playlist_id, track_id)
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, track_id)
);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- NFT collections
CREATE TABLE IF NOT EXISTS nft_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES users(id),
    contract_address VARCHAR(255) UNIQUE,
    blockchain VARCHAR(20) DEFAULT 'solana', -- solana, ton, ethereum
    total_supply INTEGER DEFAULT 0,
    max_supply INTEGER,
    royalty_percentage DECIMAL(5,2) DEFAULT 5.0,
    base_uri VARCHAR(500),
    image_ipfs_hash VARCHAR(255),
    floor_price_sol DECIMAL(10,4),
    volume_sol DECIMAL(15,4) DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NFTs (individual tokens)
CREATE TABLE IF NOT EXISTS nfts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID REFERENCES nft_collections(id),
    token_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_ipfs_hash VARCHAR(255),
    metadata_ipfs_hash VARCHAR(255),
    owner_wallet VARCHAR(255) NOT NULL,
    creator_id UUID REFERENCES users(id),
    track_id UUID REFERENCES tracks(id), -- if music NFT
    mint_tx VARCHAR(255),
    status nft_status DEFAULT 'draft',
    price_sol DECIMAL(10,4),
    last_sale_price_sol DECIMAL(10,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, token_id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tx_type VARCHAR(50) NOT NULL, -- 'nft_purchase', 'streaming_payment', 'royalty'
    amount DECIMAL(15,4) NOT NULL,
    currency VARCHAR(10) DEFAULT 'SOL',
    blockchain_tx VARCHAR(255),
    status payment_status DEFAULT 'pending',
    from_wallet VARCHAR(255),
    to_wallet VARCHAR(255),
    nft_id UUID REFERENCES nfts(id),
    track_id UUID REFERENCES tracks(id),
    description TEXT,
    fee DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DEX related tables
CREATE TABLE IF NOT EXISTS dex_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_a_symbol VARCHAR(20) NOT NULL,
    token_a_contract VARCHAR(255),
    token_b_symbol VARCHAR(20) NOT NULL,
    token_b_contract VARCHAR(255),
    reserve_a DECIMAL(20,8) DEFAULT 0,
    reserve_b DECIMAL(20,8) DEFAULT 0,
    total_liquidity DECIMAL(20,8) DEFAULT 0,
    fee DECIMAL(5,4) DEFAULT 0.003, -- 0.3%
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User balances for DEX
CREATE TABLE IF NOT EXISTS user_balances (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_symbol VARCHAR(20) NOT NULL,
    token_contract VARCHAR(255),
    balance DECIMAL(20,8) DEFAULT 0,
    locked_balance DECIMAL(20,8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, token_symbol)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_status ON tracks(status);
CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre);
CREATE INDEX IF NOT EXISTS idx_tracks_created_at ON tracks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nfts_owner ON nfts(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_nfts_collection ON nfts(collection_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_tracks_search ON tracks USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_users_search ON users USING gin(to_tsvector('english', username || ' ' || COALESCE(bio, '')));
CREATE INDEX IF NOT EXISTS idx_albums_search ON albums USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
