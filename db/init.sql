-- NormalDance Database Initialization
-- This script runs on first database creation

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create database schema
CREATE SCHEMA IF NOT EXISTS normaldance;

-- Set search path
SET search_path TO normaldance, public;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    wallet_address VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    is_artist BOOLEAN DEFAULT FALSE,
    is_curator BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create nft_collections table
CREATE TABLE IF NOT EXISTS nft_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contract_address VARCHAR(255) UNIQUE,
    total_supply INTEGER DEFAULT 0,
    minted_count INTEGER DEFAULT 0,
    price DECIMAL(36,18),
    royalty_percentage DECIMAL(5,2) DEFAULT 2.5,
    metadata JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create nfts table
CREATE TABLE IF NOT EXISTS nfts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID REFERENCES nft_collections(id) ON DELETE CASCADE,
    token_id VARCHAR(255) UNIQUE NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    metadata JSONB,
    is_listed BOOLEAN DEFAULT FALSE,
    price DECIMAL(36,18),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nft_id UUID REFERENCES nfts(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    transaction_hash VARCHAR(255) UNIQUE,
    price DECIMAL(36,18) NOT NULL,
    fee DECIMAL(36,18) DEFAULT 0,
    transaction_type VARCHAR(50) NOT NULL, -- 'mint', 'transfer', 'sale'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    block_number BIGINT,
    gas_used BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ipfs_files table
CREATE TABLE IF NOT EXISTS ipfs_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cid VARCHAR(255) UNIQUE NOT NULL,
    filename VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB,
    is_pinned BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_nft_collections_creator ON nft_collections(creator_id);
CREATE INDEX IF NOT EXISTS idx_nfts_collection ON nfts(collection_id);
CREATE INDEX IF NOT EXISTS idx_nfts_owner ON nfts(owner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_nft ON transactions(nft_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_ipfs_files_uploader ON ipfs_files(uploader_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nft_collections_updated_at BEFORE UPDATE ON nft_collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nfts_updated_at BEFORE UPDATE ON nfts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (change password in production)
INSERT INTO users (email, username, is_admin, created_at)
VALUES ('admin@normaldance.com', 'admin', TRUE, NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert sample data for development
INSERT INTO users (email, username, wallet_address, is_artist, bio, created_at)
VALUES
    ('artist1@normaldance.com', 'artist1', '0x1234567890123456789012345678901234567890', TRUE, 'Digital artist specializing in music NFTs', NOW()),
    ('curator1@normaldance.com', 'curator1', '0x0987654321098765432109876543210987654321', FALSE, 'NFT curator and collector', NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert sample NFT collection
INSERT INTO nft_collections (name, description, creator_id, total_supply, price, metadata, created_at)
SELECT
    'NormalDance Genesis',
    'The first collection of music NFTs on NormalDance platform',
    u.id,
    1000,
    0.1,
    '{"genre": "electronic", "bpm": 128, "duration": 180}',
    NOW()
FROM users u
WHERE u.username = 'artist1'
ON CONFLICT (contract_address) DO NOTHING;

-- Grant permissions
GRANT USAGE ON SCHEMA normaldance TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA normaldance TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA normaldance TO postgres;