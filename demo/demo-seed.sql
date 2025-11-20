-- NormalDance Demo Seed Data
-- Additional data for realistic demo scenarios

-- Additional demo users for diverse scenarios
INSERT INTO users (id, email, username, password_hash, role, wallet_address, bio, is_verified, followers_count, tracks_count, created_at) VALUES
('user-demo-collector', 'collector@demo.local', 'nft_collector', '$2b$10$demo.hash.for.collector.account', 'listener', 'CollectorWalletDemo123...', 'NFT collector and music enthusiast. Building the ultimate electronic music collection.', true, 156, 0, '2024-01-10T08:00:00Z'),
('user-demo-newbie', 'newbie@demo.local', 'music_newbie', '$2b$10$demo.hash.for.newbie.account', 'listener', 'NewbieWalletDemo456...', 'Just discovered Web3 music! Excited to explore new sounds and support artists directly.', false, 23, 0, '2024-06-01T12:00:00Z'),
('user-demo-producer', 'producer@demo.local', 'beat_maker', '$2b$10$demo.hash.for.producer.account', 'artist', 'ProducerWalletDemo789...', 'Independent producer creating beats for underground hip-hop and electronic artists.', true, 890, 34, '2024-02-15T15:30:00Z'),
('user-demo-investor', 'investor@demo.local', 'crypto_investor', '$2b$10$demo.hash.for.investor.account', 'listener', 'InvestorWalletDemoABC...', 'Crypto investor exploring music NFTs as the next big thing in digital assets.', true, 67, 0, '2024-04-20T10:15:00Z'),
('user-demo-dj', 'dj@demo.local', 'club_dj', '$2b$10$demo.hash.for.dj.account', 'artist', 'DJWalletDemoXYZ...', 'Professional DJ spinning sets at underground clubs. Curating the best techno and house.', true, 2340, 67, '2024-01-05T20:45:00Z')
ON CONFLICT (email) DO NOTHING;

-- Additional demo tracks for variety
INSERT INTO tracks (id, title, artist_id, description, genre, duration, bpm, key_signature, energy, status, ipfs_hash, play_count, like_count, is_premium, price_sol, royalty_percentage, created_at) VALUES
('track-demo-ambient', 'Stellar Drift', 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a', 'Ambient space music perfect for meditation and relaxation. Features generative soundscapes.', 'Ambient', 845, 60, 'A', 0.25, 'published', 'QmAmbientDriftHash123...', 45678, 12345, false, NULL, 4.0, '2024-03-01T09:00:00Z'),
('track-demo-hiphop', 'Street Flow', 'user-demo-producer', 'Hard-hitting hip-hop beat with heavy bass and crisp snares. Perfect for rap verses.', 'Hip-Hop', 187, 90, 'Gm', 0.88, 'published', 'QmHipHopFlowHash456...', 89234, 23456, true, 0.25, 8.0, '2024-04-10T14:20:00Z'),
('track-demo-house', 'Midnight Groove', 'g4h5i6d7-e8f9-0a1b-2c3d-4e5f6g7h8i9d', 'Deep house track with infectious groove and subtle synth melodies.', 'House', 412, 124, 'Dm', 0.72, 'published', 'QmHouseGrooveHash789...', 156789, 34567, false, NULL, 6.0, '2024-05-05T18:30:00Z'),
('track-demo-trance', 'Euphoria Rising', 'h5i6j7e8-f9g0-1a2b-3c4d-5e6f7g8h9i0e', 'Uplifting trance anthem with soaring melodies and driving beats.', 'Trance', 487, 138, 'F#', 0.95, 'published', 'QmTranceRisingHashABC...', 234567, 45678, true, 0.5, 7.0, '2024-05-20T21:15:00Z'),
('track-demo-lofi', 'Rainy Day Study', 'user-demo-dj', 'Chill lofi hip-hop beats for studying and relaxation. Features vinyl crackle and mellow vibes.', 'Lo-Fi', 256, 75, 'C', 0.35, 'published', 'QmLofiStudyHashXYZ...', 345678, 56789, false, NULL, 3.0, '2024-06-10T11:45:00Z'),
('track-demo-dnb', 'Bass Warfare', 'user-demo-dj', 'Aggressive drum and bass track with rolling breaks and heavy sub-bass.', 'Drum & Bass', 298, 170, 'Am', 0.98, 'published', 'QmDnBBassHashDEF...', 123456, 34567, true, 0.3, 9.0, '2024-06-25T16:20:00Z')
ON CONFLICT (id) DO NOTHING;

-- Additional NFT collections
INSERT INTO nft_collections (id, name, symbol, description, creator_id, contract_address, blockchain, total_supply, max_supply, royalty_percentage, floor_price_sol, volume_sol, is_verified, created_at) VALUES
('nft-coll-lofi', 'Chill Sessions', 'CHILL', 'Lo-fi hip-hop NFTs for the relaxed music lover', 'user-demo-dj', 'ChillContractDemo123...', 'solana', 25, 100, 5.0, 0.15, 45.67, false, '2024-06-15T13:00:00Z'),
('nft-coll-beats', 'Producer Packs', 'BEATS', 'Exclusive beat packs and stems for music producers', 'user-demo-producer', 'BeatsContractDemo456...', 'solana', 50, 200, 10.0, 0.8, 123.45, true, '2024-04-25T17:30:00Z'),
('nft-coll-trance', 'Trance Visions', 'TRANCE', 'Psychedelic trance NFTs with animated artwork', 'h5i6j7e8-f9g0-1a2b-3c4d-5e6f7g8h9i0e', 'TranceContractDemo789...', 'solana', 75, 300, 6.0, 0.4, 89.23, true, '2024-05-30T19:45:00Z')
ON CONFLICT (id) DO NOTHING;

-- Additional NFTs
INSERT INTO nfts (id, collection_id, token_id, name, description, image_ipfs_hash, metadata_ipfs_hash, owner_wallet, creator_id, track_id, status, price_sol, last_sale_price_sol, created_at) VALUES
('nft-lofi-1', 'nft-coll-lofi', 'CHILL-001', 'Rainy Day Study #1', 'Premium edition with 4K artwork and bonus tracks', 'QmLofiImage1...', 'QmLofiMeta1...', 'CollectorWalletDemo123...', 'user-demo-dj', 'track-demo-lofi', 'minted', 0.25, 0.18, '2024-06-20T14:00:00Z'),
('nft-beats-1', 'nft-coll-beats', 'BEATS-001', 'Street Flow Pack', 'Complete beat pack with stems and MIDI files', 'QmBeatsImage1...', 'QmBeatsMeta1...', 'ProducerWalletDemo789...', 'user-demo-producer', 'track-demo-hiphop', 'minted', 1.2, 0.95, '2024-04-30T16:30:00Z'),
('nft-trance-1', 'nft-coll-trance', 'TRANCE-001', 'Euphoria Rising #1', 'Animated NFT with psychedelic visuals', 'QmTranceImage1...', 'QmTranceMeta1...', 'DJWalletDemoXYZ...', 'h5i6j7e8-f9g0-1a2b-3c4d-5e6f7g8h9i0e', 'track-demo-trance', 'minted', 0.6, 0.45, '2024-06-01T20:15:00Z'),
('nft-beats-2', 'nft-coll-beats', 'BEATS-002', 'Bass Warfare Stems', 'Drum and bass stems pack with full production files', 'QmDnBImage1...', 'QmDnBMeta1...', 'InvestorWalletDemoABC...', 'user-demo-dj', 'track-demo-dnb', 'minted', 0.9, 0.75, '2024-07-01T12:45:00Z')
ON CONFLICT (id) DO NOTHING;

-- Additional transactions for realistic activity
INSERT INTO transactions (id, user_id, tx_type, amount, currency, blockchain_tx, status, from_wallet, to_wallet, nft_id, description, fee, created_at) VALUES
('tx-demo-stream-1', 'user-demo-newbie', 'streaming_payment', 0.0005, 'SOL', 'StreamTxDemo123...', 'completed', 'NewbieWalletDemo456...', 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a', NULL, 'Stream payment for Midnight Drive', 0.000, '2024-06-15T10:30:00Z'),
('tx-demo-nft-1', 'user-demo-collector', 'nft_purchase', 0.25, 'SOL', 'NftPurchaseDemo456...', 'completed', 'CollectorWalletDemo123...', 'DJWalletDemoXYZ...', 'nft-lofi-1', 'Purchase of Rainy Day Study NFT', 0.001, '2024-06-20T14:05:00Z'),
('tx-demo-royalty-1', 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a', 'royalty_payment', 0.0375, 'SOL', 'RoyaltyDemo789...', 'completed', NULL, 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a', NULL, 'Royalty payment for Neon Dreams streams (5%)', 0.000, '2024-06-30T09:00:00Z'),
('tx-demo-swap-1', 'user-demo-investor', 'token_swap', 10.0, 'NDT', 'SwapDemoABC...', 'completed', 'InvestorWalletDemoABC...', NULL, NULL, 'Swap SOL to NDT tokens', 0.01, '2024-07-01T11:20:00Z'),
('tx-demo-premium-1', 'user-demo-newbie', 'premium_purchase', 0.25, 'SOL', 'PremiumDemoXYZ...', 'completed', 'NewbieWalletDemo456...', 'user-demo-producer', NULL, 'Purchase premium access to Street Flow', 0.001, '2024-07-02T15:45:00Z')
ON CONFLICT (id) DO NOTHING;

-- Additional playlists for demo scenarios
INSERT INTO playlists (id, title, user_id, description, is_public, track_count, created_at) VALUES
('playlist-demo-chill', 'Chill Electronic Vibes', 'user-demo-newbie', 'Perfect playlist for coding and relaxation', true, 4, '2024-06-05T13:00:00Z'),
('playlist-demo-workout', 'High Energy Workout', 'user-demo-collector', 'Pumping tracks for gym sessions', true, 3, '2024-05-20T16:30:00Z'),
('playlist-demo-discovery', 'New Artist Discovery', 'user-demo-investor', 'Fresh tracks from emerging artists', false, 5, '2024-06-25T14:15:00Z')
ON CONFLICT (id) DO NOTHING;

-- Playlist tracks
INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at) VALUES
('playlist-demo-chill', 'track-demo-ambient', 1, '2024-06-05T13:05:00Z'),
('playlist-demo-chill', 'track-demo-lofi', 2, '2024-06-05T13:10:00Z'),
('playlist-demo-chill', 'b2c3d4e5-f6g7-8h9i-0j1k-2l3m4n5o6p7q', 3, '2024-06-05T13:15:00Z'),
('playlist-demo-chill', 'd4e5f6g7-h8i9-0j1k-2l3m-4n5o6p7q8r9s', 4, '2024-06-05T13:20:00Z'),
('playlist-demo-workout', 'track-demo-dnb', 1, '2024-05-20T16:35:00Z'),
('playlist-demo-workout', 'c3d4e5f6-g7h8-9i0j-1k2l-3m4n5o6p7q8r', 2, '2024-05-20T16:40:00Z'),
('playlist-demo-workout', 'track-demo-trance', 3, '2024-05-20T16:45:00Z'),
('playlist-demo-discovery', 'track-demo-hiphop', 1, '2024-06-25T14:20:00Z'),
('playlist-demo-discovery', 'track-demo-house', 2, '2024-06-25T14:25:00Z'),
('playlist-demo-discovery', 'e5f6g7h8-i9j0-1k2l-3m4n-5o6p7q8r9s0t', 3, '2024-06-25T14:30:00Z'),
('playlist-demo-discovery', 'f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0t1u', 4, '2024-06-25T14:35:00Z'),
('playlist-demo-discovery', 'track-demo-ambient', 5, '2024-06-25T14:40:00Z')
ON CONFLICT (playlist_id, track_id) DO NOTHING;

-- Additional likes for engagement simulation
INSERT INTO likes (user_id, track_id) VALUES
('user-demo-collector', 'track-demo-lofi'),
('user-demo-collector', 'track-demo-dnb'),
('user-demo-newbie', 'track-demo-ambient'),
('user-demo-newbie', 'b2c3d4e5-f6g7-8h9i-0j1k-2l3m4n5o6p7q'),
('user-demo-investor', 'track-demo-hiphop'),
('user-demo-investor', 'track-demo-trance'),
('user-demo-dj', 'track-demo-house')
ON CONFLICT (user_id, track_id) DO NOTHING;

-- Additional follows for social features
INSERT INTO follows (follower_id, following_id) VALUES
('user-demo-newbie', 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a'),
('user-demo-newbie', 'user-demo-dj'),
('user-demo-collector', 'h5i6j7e8-f9g0-1a2b-3c4d-5e6f7g8h9i0e'),
('user-demo-collector', 'user-demo-producer'),
('user-demo-investor', 'g4h5i6d7-e8f9-0a1b-2c3d-4e5f6g7h8i9d'),
('user-demo-investor', 'user-demo-dj')
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- Update user stats to reflect new data
UPDATE users SET following_count = following_count + 2 WHERE id = 'user-demo-newbie';
UPDATE users SET following_count = following_count + 2 WHERE id = 'user-demo-collector';
UPDATE users SET following_count = following_count + 2 WHERE id = 'user-demo-investor';
UPDATE users SET followers_count = followers_count + 1 WHERE id = 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a';
UPDATE users SET followers_count = followers_count + 1 WHERE id = 'h5i6j7e8-f9g0-1a2b-3c4d-5e6f7g8h9i0e';
UPDATE users SET followers_count = followers_count + 1 WHERE id = 'g4h5i6d7-e8f9-0a1b-2c3d-4e5f6g7h8i9d';
UPDATE users SET followers_count = followers_count + 2 WHERE id = 'user-demo-dj';
UPDATE users SET followers_count = followers_count + 1 WHERE id = 'user-demo-producer';

-- Update track stats
UPDATE tracks SET like_count = like_count + 1 WHERE id = 'track-demo-lofi';
UPDATE tracks SET like_count = like_count + 1 WHERE id = 'track-demo-dnb';
UPDATE tracks SET like_count = like_count + 1 WHERE id = 'track-demo-ambient';
UPDATE tracks SET like_count = like_count + 1 WHERE id = 'b2c3d4e5-f6g7-8h9i-0j1k-2l3m4n5o6p7q';
UPDATE tracks SET like_count = like_count + 1 WHERE id = 'track-demo-hiphop';
UPDATE tracks SET like_count = like_count + 1 WHERE id = 'track-demo-trance';
UPDATE tracks SET like_count = like_count + 1 WHERE id = 'track-demo-house';