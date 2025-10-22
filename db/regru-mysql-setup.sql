-- 🚀 NORMAL DANCE - Настройка MySQL базы данных для REG.RU сервера

-- Удаление существующей базы данных (если существует)
DROP DATABASE IF EXISTS u3284463_default;

-- Создание базы данных
CREATE DATABASE u3284463_default
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Создание пользователя (если пользователь уже существует, пропустить эту часть)
-- Пользователь создается через панель управления Ispmanager

-- Предоставление прав
GRANT ALL PRIVILEGES ON u3284463_default.* TO 'u3284463_default'@'localhost';
FLUSH PRIVILEGES;

-- Использование базы данных
USE u3284463_default;

-- Оптимизация настроек базы данных
SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;

-- Создание таблицы пользователей (если используется кастомная аутентификация)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    wallet_address VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_wallet_address (wallet_address),
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создание таблицы треков (если используется локальное хранилище метаданных)
CREATE TABLE IF NOT EXISTS tracks (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(500) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    album VARCHAR(255),
    genre VARCHAR(100),
    duration INT, -- в секундах
    file_size BIGINT,
    ipfs_hash VARCHAR(255),
    blockchain_tx VARCHAR(255),
    nft_mint_address VARCHAR(255),
    user_id VARCHAR(36),
    play_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_artist (artist),
    INDEX idx_genre (genre),
    INDEX idx_user_id (user_id),
    INDEX idx_ipfs_hash (ipfs_hash),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создание таблицы плейлистов
CREATE TABLE IF NOT EXISTS playlists (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id VARCHAR(36),
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_public (is_public),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создание таблицы элементов плейлиста
CREATE TABLE IF NOT EXISTS playlist_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    playlist_id VARCHAR(36),
    track_id VARCHAR(36),
    position INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    INDEX idx_playlist_id (playlist_id),
    INDEX idx_track_id (track_id),
    INDEX idx_position (position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создание таблицы лайков
CREATE TABLE IF NOT EXISTS likes (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    track_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_track (user_id, track_id),
    INDEX idx_user_id (user_id),
    INDEX idx_track_id (track_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создание таблицы подписок/follows (если используется социальная функциональность)
CREATE TABLE IF NOT EXISTS follows (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    follower_id VARCHAR(36),
    following_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (follower_id, following_id),
    INDEX idx_follower_id (follower_id),
    INDEX idx_following_id (following_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создание таблицы сессий (если используется серверные сессии)
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создание таблицы логов активности (для аналитики)
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL, -- 'play', 'like', 'upload', 'share', etc.
    resource_type VARCHAR(50), -- 'track', 'playlist', 'user', etc.
    resource_id VARCHAR(36),
    metadata JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создание таблицы настроек приложения
CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    key_name VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    value_type VARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key_name (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Вставка начальных настроек
INSERT INTO settings (key_name, value, value_type, description) VALUES
('app_name', 'NORMAL DANCE', 'string', 'Название приложения'),
('app_version', '0.1.1', 'string', 'Версия приложения'),
('max_upload_size', '104857600', 'number', 'Максимальный размер загрузки в байтах (100MB)'),
('allowed_audio_formats', '["mp3","wav","flac","ogg"]', 'json', 'Разрешенные форматы аудио'),
('enable_registrations', 'true', 'boolean', 'Разрешить регистрацию пользователей'),
('maintenance_mode', 'false', 'boolean', 'Режим технического обслуживания');

-- Создание представлений для аналитики

-- Популярные треки за неделю
CREATE OR REPLACE VIEW popular_tracks_weekly AS
SELECT
    t.*,
    COUNT(l.id) as likes_this_week,
    COUNT(al.id) as plays_this_week
FROM tracks t
LEFT JOIN likes l ON t.id = l.track_id AND l.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
LEFT JOIN activity_logs al ON t.id = al.resource_id AND al.action = 'play' AND al.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY t.id
ORDER BY likes_this_week DESC, plays_this_week DESC;

-- Активность пользователей за день
CREATE OR REPLACE VIEW daily_user_activity AS
SELECT
    DATE(created_at) as activity_date,
    COUNT(DISTINCT user_id) as active_users,
    COUNT(*) as total_actions,
    COUNT(CASE WHEN action = 'track_upload' THEN 1 END) as uploads,
    COUNT(CASE WHEN action = 'track_play' THEN 1 END) as plays,
    COUNT(CASE WHEN action = 'nft_mint' THEN 1 END) as nft_mints
FROM activity_logs
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY activity_date DESC;

-- Статистика по жанрам
CREATE OR REPLACE VIEW genre_statistics AS
SELECT
    genre,
    COUNT(*) as track_count,
    AVG(CAST(JSON_EXTRACT(metadata, '$.duration') AS UNSIGNED)) as avg_duration,
    SUM(play_count) as total_plays,
    SUM(like_count) as total_likes
FROM tracks
WHERE genre IS NOT NULL
GROUP BY genre
ORDER BY track_count DESC;

-- Создание хранимых процедур

-- Процедура обновления счетчиков трека
DELIMITER //

CREATE PROCEDURE UpdateTrackCounters(IN track_uuid VARCHAR(36))
BEGIN
    UPDATE tracks
    SET
        play_count = (SELECT COUNT(*) FROM activity_logs WHERE resource_id = track_uuid AND action = 'play'),
        like_count = (SELECT COUNT(*) FROM likes WHERE track_id = track_uuid),
        updated_at = NOW()
    WHERE id = track_uuid;
END //

DELIMITER ;

-- Процедура очистки старых сессий
DELIMITER //

CREATE PROCEDURE CleanupOldSessions()
BEGIN
    DELETE FROM sessions WHERE updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
    DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
END //

DELIMITER ;

-- Создание событий для автоматической очистки

-- Автоматическая очистка старых сессий ежедневно
CREATE EVENT IF NOT EXISTS cleanup_old_sessions
ON SCHEDULE EVERY 1 DAY
DO
    CALL CleanupOldSessions();

-- Автоматическое обновление популярных треков ежечасно
CREATE EVENT IF NOT EXISTS update_popular_tracks
ON SCHEDULE EVERY 1 HOUR
DO
    UPDATE tracks t
    SET play_count = (
        SELECT COUNT(*) FROM activity_logs al
        WHERE al.resource_id = t.id AND al.action = 'play'
        AND al.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    )
    WHERE t.updated_at < DATE_SUB(NOW(), INTERVAL 1 HOUR);

-- Проверка и оптимизация таблиц еженедельно
CREATE EVENT IF NOT EXISTS optimize_tables
ON SCHEDULE EVERY 1 WEEK
DO
    OPTIMIZE TABLE users, tracks, playlists, playlist_items, likes, follows, sessions, activity_logs;

-- Создание пользователей для мониторинга (если нужно)

-- Пользователь только для чтения для мониторинга
-- ПРИМЕЧАНИЕ: Создайте через панель управления Ispmanager

-- Настройка прав для мониторинга
-- GRANT SELECT ON u3284463_default.* TO 'monitor'@'localhost';

-- Финальная проверка
SELECT
    'Database setup completed successfully' as status,
    NOW() as completed_at,
    USER() as current_user,
    DATABASE() as current_database;

-- Проверка созданных таблиц
SHOW TABLES;

-- Проверка настроек
SELECT * FROM settings WHERE key_name IN ('app_name', 'app_version');

-- Проверка представлений
SHOW FULL TABLES WHERE TABLE_TYPE = 'VIEW';

-- Проверка событий
SHOW EVENTS;