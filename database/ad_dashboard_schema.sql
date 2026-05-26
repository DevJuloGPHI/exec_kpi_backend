CREATE TABLE IF NOT EXISTS ad_import_batches (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    imported_by VARCHAR(100) NULL,
    remarks VARCHAR(1000) NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_ad_import_batches_report_type (report_type)
);

CREATE TABLE IF NOT EXISTS ad_channel_groups (
    id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_code VARCHAR(50) NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ad_channel_groups_code (group_code)
);

CREATE TABLE IF NOT EXISTS ad_channels (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    channel_group_id TINYINT UNSIGNED NOT NULL,
    channel_code VARCHAR(100) NOT NULL,
    channel_name VARCHAR(100) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ad_channels_code (channel_code),
    KEY idx_ad_channels_group_id (channel_group_id),
    CONSTRAINT fk_ad_channels_group
        FOREIGN KEY (channel_group_id)
        REFERENCES ad_channel_groups (id)
);

CREATE TABLE IF NOT EXISTS ad_daily_performance (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    import_batch_id BIGINT UNSIGNED NOT NULL,
    channel_id BIGINT UNSIGNED NOT NULL,
    report_date DATE NOT NULL,
    spend DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    registrations INT UNSIGNED NOT NULL DEFAULT 0,
    first_deposits INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_daily_channel_report_date (report_date, channel_id),
    KEY idx_ad_daily_performance_channel_id (channel_id),
    KEY idx_ad_daily_performance_import_batch_id (import_batch_id),
    CONSTRAINT fk_ad_daily_performance_batch
        FOREIGN KEY (import_batch_id)
        REFERENCES ad_import_batches (id),
    CONSTRAINT fk_ad_daily_performance_channel
        FOREIGN KEY (channel_id)
        REFERENCES ad_channels (id)
);

INSERT INTO ad_channel_groups (group_code, group_name, is_active)
VALUES
    ('SELF_RUN', 'Self-run Ads', 1),
    ('THIRD_PARTY', 'Third Party Ads', 1)
ON DUPLICATE KEY UPDATE
    group_name = VALUES(group_name),
    is_active = VALUES(is_active),
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO ad_channels (channel_group_id, channel_code, channel_name, is_active)
SELECT
    cg.id,
    seed.channel_code,
    seed.channel_name,
    1
FROM (
    SELECT 'SELF_RUN' AS group_code, 'RICHADS' AS channel_code, 'Richads' AS channel_name
    UNION ALL
    SELECT 'THIRD_PARTY', 'YUGATECH', 'Yugatech'
    UNION ALL
    SELECT 'THIRD_PARTY', 'AISCORE_MATCH', 'AISCORE match'
    UNION ALL
    SELECT 'THIRD_PARTY', 'AISCORE_ODDS', 'AISCORE odds'
    UNION ALL
    SELECT 'THIRD_PARTY', 'AISCORE_CHAT', 'AISCORE chat'
) seed
INNER JOIN ad_channel_groups cg
    ON cg.group_code = seed.group_code
ON DUPLICATE KEY UPDATE
    channel_group_id = VALUES(channel_group_id),
    channel_name = VALUES(channel_name),
    is_active = VALUES(is_active),
    updated_at = CURRENT_TIMESTAMP;

-- Required for insert/update daily performance rows when adding the key to an existing table:
-- ALTER TABLE ad_daily_performance
-- ADD UNIQUE KEY uq_daily_channel_report_date (
--   report_date,
--   channel_id
-- );
