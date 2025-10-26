-- NormalDance Database Migrations
-- Run this script for database schema updates

-- Migration: Add new columns to users table
ALTER TABLE normaldance.users
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);

-- Migration: Add new columns to nft_collections table
ALTER TABLE normaldance.nft_collections
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS max_supply INTEGER;

-- Migration: Add new columns to nfts table
ALTER TABLE normaldance.nfts
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS attributes JSONB,
ADD COLUMN IF NOT EXISTS rarity_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS last_price DECIMAL(36,18),
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- Migration: Add new columns to transactions table
ALTER TABLE normaldance.transactions
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(36,18) DEFAULT 0,
ADD COLUMN IF NOT EXISTS royalty_fee DECIMAL(36,18) DEFAULT 0,
ADD COLUMN IF NOT EXISTS network VARCHAR(50) DEFAULT 'solana',
ADD COLUMN IF NOT EXISTS gas_price DECIMAL(36,18);

-- Migration: Create user_profiles table
CREATE TABLE IF NOT EXISTS normaldance.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES normaldance.users(id) ON DELETE CASCADE UNIQUE,
    display_name VARCHAR(255),
    website_url TEXT,
    twitter_handle VARCHAR(100),
    instagram_handle VARCHAR(100),
    discord_handle VARCHAR(100),
    telegram_handle VARCHAR(100),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration: Create user_follows table
CREATE TABLE IF NOT EXISTS normaldance.user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES normaldance.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES normaldance.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Migration: Create nft_likes table
CREATE TABLE IF NOT EXISTS normaldance.nft_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES normaldance.users(id) ON DELETE CASCADE,
    nft_id UUID REFERENCES normaldance.nfts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, nft_id)
);

-- Migration: Create nft_views table
CREATE TABLE IF NOT EXISTS normaldance.nft_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES normaldance.users(id) ON DELETE CASCADE,
    nft_id UUID REFERENCES normaldance.nfts(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id VARCHAR(255)
);

-- Migration: Create notifications table
CREATE TABLE IF NOT EXISTS normaldance.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES normaldance.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'sale', 'bid', 'follow', 'like', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration: Create bids table
CREATE TABLE IF NOT EXISTS normaldance.bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nft_id UUID REFERENCES normaldance.nfts(id) ON DELETE CASCADE,
    bidder_id UUID REFERENCES normaldance.users(id) ON DELETE CASCADE,
    amount DECIMAL(36,18) NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'accepted', 'rejected', 'cancelled'
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration: Create auctions table
CREATE TABLE IF NOT EXISTS normaldance.auctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nft_id UUID REFERENCES normaldance.nfts(id) ON DELETE CASCADE UNIQUE,
    seller_id UUID REFERENCES normaldance.users(id) ON DELETE CASCADE,
    starting_price DECIMAL(36,18) NOT NULL,
    reserve_price DECIMAL(36,18),
    current_bid DECIMAL(36,18),
    current_bidder_id UUID REFERENCES normaldance.users(id),
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'ended', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration: Create staking_pools table
CREATE TABLE IF NOT EXISTS normaldance.staking_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    token_address VARCHAR(255),
    reward_rate DECIMAL(10,4), -- Annual percentage yield
    min_stake_amount DECIMAL(36,18),
    max_stake_amount DECIMAL(36,18),
    lock_period_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    total_staked DECIMAL(36,18) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration: Create user_stakes table
CREATE TABLE IF NOT EXISTS normaldance.user_stakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES normaldance.users(id) ON DELETE CASCADE,
    pool_id UUID REFERENCES normaldance.staking_pools(id) ON DELETE CASCADE,
    amount DECIMAL(36,18) NOT NULL,
    staked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unlocks_at TIMESTAMP WITH TIME ZONE,
    rewards_claimed DECIMAL(36,18) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'unlocked', 'withdrawn'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration: Add indexes for new tables
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON normaldance.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON normaldance.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON normaldance.user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_nft_likes_user ON normaldance.nft_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_likes_nft ON normaldance.nft_likes(nft_id);
CREATE INDEX IF NOT EXISTS idx_nft_views_user ON normaldance.nft_views(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_views_nft ON normaldance.nft_views(nft_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON normaldance.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON normaldance.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_bids_nft ON normaldance.bids(nft_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder ON normaldance.bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_auctions_nft ON normaldance.auctions(nft_id);
CREATE INDEX IF NOT EXISTS idx_auctions_seller ON normaldance.auctions(seller_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON normaldance.auctions(status);
CREATE INDEX IF NOT EXISTS idx_staking_pools_active ON normaldance.staking_pools(is_active);
CREATE INDEX IF NOT EXISTS idx_user_stakes_user ON normaldance.user_stakes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stakes_pool ON normaldance.user_stakes(pool_id);
CREATE INDEX IF NOT EXISTS idx_user_stakes_status ON normaldance.user_stakes(status);

-- Migration: Add triggers for updated_at on new tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON normaldance.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON normaldance.bids FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auctions_updated_at BEFORE UPDATE ON normaldance.auctions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staking_pools_updated_at BEFORE UPDATE ON normaldance.staking_pools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_stakes_updated_at BEFORE UPDATE ON normaldance.user_stakes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration: Update permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA normaldance TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA normaldance TO postgres;