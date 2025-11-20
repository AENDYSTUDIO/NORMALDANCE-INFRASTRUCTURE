-- NormalDance Demo Data
-- Sample data for demonstrations and presentations

-- Demo users
INSERT INTO users (id, email, username, password_hash, role, wallet_address, bio, is_verified, followers_count, tracks_count, created_at) VALUES
('d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a', 'artist@demo.local', 'electro_dreamer', '$2b$10$demo.hash.for.artist.account', 'artist', '8aHkRJfzZ3zHjPm9GJQqkFLbYjNvLc3XJaKjVwBqQqZz', 'Electronic music producer from Berlin. Creating immersive soundscapes with AI-driven compositions.', true, 25430, 47, '2024-01-15T10:00:00Z'),
('e2f3g4b5-c6d7-8e9f-0a1b-2c3d4e5f6g7b', 'listener@demo.local', 'music_lover_87', '$2b$10$demo.hash.for.listener.account', 'listener', '9bImSKgza4aIjQm0HKRqlGMbZkOvMd4YKbLwCqRrAa', 'Passionate music fan, NFT collector, and early adopter of Web3 music platforms.', true, 89, 0, '2024-02-20T14:30:00Z'),
('f3g4h5c6-d7e8-9f0a-1b2c-3d4e5f6g7h8c', 'admin@demo.local', 'platform_curator', '$2b$10$demo.hash.for.admin.account', 'admin', '0cJnTLhzb5bJkRn1ILRsmHNcZlPwNe5ZLcMxDrSsBb', 'Platform curator and community manager for NormalDance.', true, 12500, 12, '2023-12-01T09:00:00Z'),
('g4h5i6d7-e8f9-0a1b-2c3d-4e5f6g7h8i9d', 'dj@demo.local', 'pulse_master', '$2b$10$demo.hash.for.dj.account', 'artist', '7dHkQJfza3aGiPl8FJqpkELaXiMtKb2WJbJvAoPoPb', 'Professional DJ and electronic music producer. Creator of the popular "Urban Pulse" series.', true, 18750, 89, '2024-03-10T16:45:00Z'),
('h5i6j7e8-f9g0-1a2b-3c4d-5e6f7g8h9i0e', 'producer@demo.local', 'synthwave_queen', '$2b$10$demo.hash.for.producer.account', 'artist', '6eIgPHi9b2bHkOm7EKqojDK9WhLsJa1VIaIu9nNnCa', 'Synthwave and retrowave producer. Blending vintage sounds with modern production techniques.', true, 32100, 156, '2024-04-05T11:20:00Z')
ON CONFLICT (email) DO NOTHING;

-- Update follower/following relationships
UPDATE users SET following_count = 2 WHERE id = 'e2f3g4b5-c6d7-8e9f-0a1b-2c3d4e5f6g7b';
UPDATE users SET following_count = 1 WHERE id = 'g4h5i6d7-e8f9-0a1b-2c3d-4e5f6g7h8i9d';
UPDATE users SET followers_count = 1 WHERE id = 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a';
UPDATE users SET followers_count = 1 WHERE id = 'h5i6j7e8-f9g0-1a2b-3c4d-5e6f7g8h9i0e';

-- Demo tracks
INSERT INTO tracks (id, title, artist_id, description, genre, duration, bpm, key_signature, energy, status, ipfs_hash, play_count, like_count, is_premium, price_sol, royalty_percentage, created_at) VALUES
('a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p', 'Midnight Drive', 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a', 'A cyberpunk-inspired electronic track perfect for late-night drives through neon-lit cities.', 'Electronic', 245, 128, 'Am', 0.85, 'published', 'QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o', 234567, 45230, false, NULL, 5.0, '2024-01-20T08:30:00Z'),
('b2c3d4e5-f6g7-8h9i-0j1k-2l3m4n5o6p7q', 'Neon Dreams', 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a', 'Synthwave masterpiece featuring vintage synthesizers and driving basslines.', 'Synthwave', 198, 120, 'Fm', 0.78, 'published', 'QmXWJtgh7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7p', 189432, 38765, true, 0.5, 7.5, '2024-02-05T12:15:00Z'),
('c3d4e5f6-g7h8-9i0j-1k2l-3m4n5o6p7q8r', 'Urban Pulse', 'g4h5i6d7-e8f9-0a1b-2c3d-4e5f6g7h8i9d', 'High-energy techno track designed for peak-time DJ sets in underground clubs.', 'Techno', 312, 140, 'Gm', 0.92, 'published', 'QmYWJtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE8q', 456789, 67890, false, NULL, 3.0, '2024-03-15T20:00:00Z'),
('d4e5f6g7-h8i9-0j1k-2l3m-4n5o6p7q8r9s', 'Retrowave Sunset', 'h5i6j7e8-f9g0-1a2b-3c4d-5e6f7g8h9i0e', 'Nostalgic retrowave ballad with soaring melodies and atmospheric pads.', 'Retrowave', 267, 110, 'C#', 0.65, 'published', 'QmZXJtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE9r', 345678, 56234, true, 0.8, 6.0, '2024-04-08T17:45:00Z'),
('e5f6g7h8-i9j0-1k2l-3m4n-5o6p7q8r9s0t', 'Digital Frontiers', 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a', 'Cutting-edge experimental electronic track exploring the boundaries of sound design.', 'Experimental', 387, 95, 'D', 0.71, 'published', 'QmAYJtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE0s', 98765, 23456, false, NULL, 8.5, '2024-05-12T14:20:00Z'),
('f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0t1u', 'Cosmic Journey', 'h5i6j7e8-f9g0-1a2b-3c4d-5e6f7g8h9i0e', 'Ambient space music with generative elements and modular synthesis.', 'Ambient', 523, 75, 'A', 0.45, 'published', 'QmBYJtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE1t', 76543, 18765, true, 1.2, 4.5, '2024-06-18T21:30:00Z')
ON CONFLICT (id) DO NOTHING;

-- Demo follows
INSERT INTO follows (follower_id, following_id) VALUES
('e2f3g4b5-c6d7-8e9f-0a1b-2c3d4e5f6g7b', 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a'),
('e2f3g4b5-c6d7-8e9f-0a1b-2c3d4e5f6g7b', 'h5i6j7e8-f9g0-1a2b-3c4d-5e6f7g8h9i0e'),
('g4h5i6d7-e8f9-0a1b-2c3d-4e5f6g7h8i9d', 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a')
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- Demo likes
INSERT INTO likes (user_id, track_id) VALUES
('e2f3g4b5-c6d7-8e9f-0a1b-2c3d4e5f6g7b', 'a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p'),
('e2f3g4b5-c6d7-8e9f-0a1b-2c3d4e5f6g7b', 'c3d4e5f6-g7h8-9i0j-1k2l-3m4n5o6p7q8r'),
('f3g4h5c6-d7e8-9f0a-1b2c-3d4e5f6g7h8c', 'b2c3d4e5-f6g7-8h9i-0j1k-2l3m4n5o6p7q')
ON CONFLICT (user_id, track_id) DO NOTHING;

-- Demo NFT collections
INSERT INTO nft_collections (id, name, symbol, description, creator_id, contract_address, blockchain, total_supply, max_supply, royalty_percentage, floor_price_sol, volume_sol, is_verified, created_at) VALUES
('nft-coll-1', 'Electronic Dreams', 'EDREAM', 'Exclusive collection of electronic music NFTs from top producers', 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a', '8aHkRJfzZ3zHjPm9GJQqkFLbYjNvLc3XJaKjVwBqQqZz', 'solana', 150, 1000, 7.5, 0.5, 234.67, true, '2024-02-10T10:00:00Z'),
('nft-coll-2', 'Synthwave Classics', 'SYNTH', 'Timeless synthwave tracks minted as NFTs', 'h5i6j7e8-f9g0-1a2b-3c4d-5e6f7g8h9i0e', '9bImSKgza4aIjQm0HKRqlGMbZkOvMd4YKbLwCqRrAa', 'solana', 89, 500, 5.0, 0.8, 156.34, true, '2024-03-20T15:30:00Z'),
('nft-coll-3', 'Underground Techno', 'TECHNO', 'Rare techno tracks from underground scenes', 'g4h5i6d7-e8f9-0a1b-2c3d-4e5f6g7h8i9d', '7dHkQJfza3aGiPl8FJqpkELaXiMtKb2WJbJvAoPoPb', 'solana', 45, 200, 10.0, 2.0, 89.12, false, '2024-04-15T18:45:00Z')
ON CONFLICT (id) DO NOTHING;

-- Demo NFTs
INSERT INTO nfts (id, collection_id, token_id, name, description, image_ipfs_hash, metadata_ipfs_hash, owner_wallet, creator_id, track_id, status, price_sol, last_sale_price_sol, created_at) VALUES
('nft-1', 'nft-coll-1', 'EDR-001', 'Midnight Drive #1', 'Limited edition NFT of the Midnight Drive track with exclusive artwork', 'QmImage1hash...', 'QmMetadata1hash...', '8aHkRJfzZ3zHjPm9GJQqkFLbYjNvLc3XJaKjVwBqQqZz', 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a', 'a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p', 'minted', 0.75, 0.6, '2024-02-15T12:00:00Z'),
('nft-2', 'nft-coll-1', 'EDR-002', 'Neon Dreams #1', 'Exclusive Neon Dreams collectible with animated artwork', 'QmImage2hash...', 'QmMetadata2hash...', '9bImSKgza4aIjQm0HKRqlGMbZkOvMd4YKbLwCqRrAa', 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a', 'b2c3d4e5-f6g7-8h9i-0j1k-2l3m4n5o6p7q', 'minted', 1.2, 0.9, '2024-02-20T14:30:00Z'),
('nft-3', 'nft-coll-2', 'SYN-001', 'Retrowave Sunset #1', 'Golden hour edition of the Retrowave Sunset track', 'QmImage3hash...', 'QmMetadata3hash...', '7dHkQJfza3aGiPl8FJqpkELaXiMtKb2WJbJvAoPoPb', 'h5i6j7e8-f9g0-1a2b-3c4d-5e6f7g8h9i0e', 'd4e5f6g7-h8i9-0j1k-2l3m-4n5o6p7q8r9s', 'minted', 0.95, 0.7, '2024-04-10T16:20:00Z'),
('nft-4', 'nft-coll-3', 'TEC-001', 'Urban Pulse #1', 'Limited edition techno NFT with behind-the-scenes content', 'QmImage4hash...', 'QmMetadata4hash...', '6eIgPHi9b2bHkOm7EKqojDK9WhLsJa1VIaIu9nNnCa', 'g4h5i6d7-e8f9-0a1b-2c3d-4e5f6g7h8i9d', 'c3d4e5f6-g7h8-9i0j-1k2l-3m4n5o6p7q8r', 'minted', 2.5, 2.1, '2024-04-20T19:15:00Z'),
('nft-5', 'nft-coll-2', 'SYN-002', 'Cosmic Journey #1', 'Premium edition with 4K artwork and ambient meditation tracks', 'QmImage5hash...', 'QmMetadata5hash...', '8aHkRJfzZ3zHjPm9GJQqkFLbYjNvLc3XJaKjVwBqQqZz', 'h5i6j7e8-f9g0-1a2b-3c4d-5e6f7g8h9i0e', 'f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0t1u', 'minted', 1.8, 1.4, '2024-05-05T11:45:00Z')
ON CONFLICT (id) DO NOTHING;

-- Demo transactions
INSERT INTO transactions (id, user_id, tx_type, amount, currency, blockchain_tx, status, from_wallet, to_wallet, nft_id, description, fee, created_at) VALUES
('tx-1', 'e2f3g4b5-c6d7-8e9f-0a1b-2c3d4e5f6g7b', 'nft_purchase', 0.75, 'SOL', '5J8n9qVxVzHjPm9GJQqkFLbYjNvLc3XJaKjVwBqQqZz', 'completed', '9bImSKgza4aIjQm0HKRqlGMbZkOvMd4YKbLwCqRrAa', '8aHkRJfzZ3zHjPm9GJQqkFLbYjNvLc3XJaKjVwBqQqZz', 'nft-1', 'Purchase of Midnight Drive NFT #1', 0.002, '2024-02-15T12:05:00Z'),
('tx-2', 'g4h5i6d7-e8f9-0a1b-2c3d-4e5f6g7h8i9d', 'nft_purchase', 1.2, 'SOL', '6K9o0rWyWzIjQm0HKRqlGMbZkOvMd4YKbLwCqRrAa', 'completed', '7dHkQJfza3aGiPl8FJqpkELaXiMtKb2WJbJvAoPoPb', '8aHkRJfzZ3zHjPm9GJQqkFLbYjNvLc3XJaKjVwBqQqZz', 'nft-2', 'Purchase of Neon Dreams NFT #1', 0.004, '2024-02-20T14:35:00Z'),
('tx-3', 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a', 'royalty_payment', 0.056, 'SOL', '4H7m8lUzTzHjPm9GJQqkFLbYjNvLc3XJaKjVwBqQqZz', 'completed', NULL, '8aHkRJfzZ3zHjPm9GJQqkFLbYjNvLc3XJaKjVwBqQqZz', NULL, 'Royalty payment for Midnight Drive streams (7.5%)', 0.000, '2024-02-28T09:00:00Z'),
('tx-4', 'e2f3g4b5-c6d7-8e9f-0a1b-2c3d4e5f6g7b', 'streaming_payment', 0.001, 'SOL', '3G6k7jTySyHjPm9GJQqkFLbYjNvLc3XJaKjVwBqQqZz', 'completed', '9bImSKgza4aIjQm0HKRqlGMbZkOvMd4YKbLwCqRrAa', '8aHkRJfzZ3zHjPm9GJQqkFLbYjNvLc3XJaKjVwBqQqZz', NULL, 'Stream payment for Midnight Drive', 0.000, '2024-03-01T15:22:00Z')
ON CONFLICT (id) DO NOTHING;

-- Demo DEX pools
INSERT INTO dex_pools (id, token_a_symbol, token_a_contract, token_b_symbol, token_b_contract, reserve_a, reserve_b, total_liquidity, fee, is_active, created_at) VALUES
('dex-pool-1', 'NDT', 'NDTContractAddress123...', 'SOL', NULL, 1000000.0, 50000.0, 223606.8, 0.003, true, '2024-03-01T10:00:00Z'),
('dex-pool-2', 'USDC', 'USDCContractAddress456...', 'NDT', 'NDTContractAddress123...', 75000.0, 100000.0, 86602.5, 0.003, true, '2024-03-15T14:30:00Z')
ON CONFLICT (id) DO NOTHING;

-- Demo user balances for DEX
INSERT INTO user_balances (user_id, token_symbol, token_contract, balance, locked_balance) VALUES
('e2f3g4b5-c6d7-8e9f-0a1b-2c3d4e5f6g7b', 'SOL', NULL, 25.5, 0.0),
('e2f3g4b5-c6d7-8e9f-0a1b-2c3d4e5f6g7b', 'NDT', 'NDTContractAddress123...', 15000.0, 5000.0),
('e2f3g4b5-c6d7-8e9f-0a1b-2c3d4e5f6g7b', 'USDC', 'USDCContractAddress456...', 500.0, 0.0),
('d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a', 'SOL', NULL, 100.0, 0.0),
('d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a', 'NDT', 'NDTContractAddress123...', 50000.0, 0.0)
ON CONFLICT (user_id, token_symbol) DO NOTHING;

-- Demo playlists
INSERT INTO playlists (id, title, user_id, description, is_public, track_count, created_at) VALUES
('playlist-1', 'Electronic Essentials', 'e2f3g4b5-c6d7-8e9f-0a1b-2c3d4e5f6g7b', 'My essential electronic tracks for coding sessions', true, 3, '2024-02-25T13:00:00Z'),
('playlist-2', 'Chill Vibes', 'f3g4h5c6-d7e8-9f0a-1b2c-3d4e5f6g7h8c', 'Perfect soundtrack for relaxation and focus', true, 2, '2024-03-10T16:30:00Z')
ON CONFLICT (id) DO NOTHING;

-- Demo playlist tracks
INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at) VALUES
('playlist-1', 'a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p', 1, '2024-02-25T13:05:00Z'),
('playlist-1', 'b2c3d4e5-f6g7-8h9i-0j1k-2l3m4n5o6p7q', 2, '2024-02-25T13:10:00Z'),
('playlist-1', 'c3d4e5f6-g7h8-9i0j-1k2l-3m4n5o6p7q8r', 3, '2024-02-25T13:15:00Z'),
('playlist-2', 'd4e5f6g7-h8i9-0j1k-2l3m-4n5o6p7q8r9s', 1, '2024-03-10T16:35:00Z'),
('playlist-2', 'f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0t1u', 2, '2024-03-10T16:40:00Z')
ON CONFLICT (playlist_id, track_id) DO NOTHING;

-- Demo albums
INSERT INTO albums (id, title, artist_id, description, cover_ipfs_hash, track_count, is_nft, price_sol, created_at) VALUES
('album-1', 'Cyber Dreams', 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a', 'A collection of cyberpunk-inspired electronic tracks', 'QmAlbumCover1...', 6, true, 3.5, '2024-06-01T10:00:00Z'),
('album-2', 'Urban Chronicles', 'g4h5i6d7-e8f9-0a1b-2c3d-4e5f6g7h8i9d', 'Techno journey through city life', 'QmAlbumCover2...', 12, false, NULL, '2024-05-15T12:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Demo album tracks
INSERT INTO album_tracks (album_id, track_id, position) VALUES
('album-1', 'a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p', 1),
('album-1', 'b2c3d4e5-f6g7-8h9i-0j1k-2l3m4n5o6p7q', 2),
('album-1', 'e5f6g7h8-i9j0-1k2l-3m4n-5o6p7q8r9s0t', 3),
('album-1', 'c3d4e5f6-g7h8-9i0j-1k2l-3m4n5o6p7q8r', 4),
('album-1', 'd4e5f6g7-h8i9-0j1k-2l3m-4n5o6p7q8r9s', 5),
('album-1', 'f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0t1u', 6),
('album-2', 'c3d4e5f6-g7h8-9i0j-1k2l-3m4n5o6p7q8r', 1)
ON CONFLICT (album_id, track_id) DO NOTHING;
