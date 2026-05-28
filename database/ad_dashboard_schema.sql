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

CREATE TABLE IF NOT EXISTS ad_vendors (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vendor_name VARCHAR(150) NOT NULL,
    website_url VARCHAR(500) NULL,
    vendor_type VARCHAR(100) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ad_vendors_name (vendor_name),
    KEY idx_ad_vendors_name (vendor_name)
);

CREATE TABLE IF NOT EXISTS ad_marketing_assignees (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    assignee_name VARCHAR(150) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ad_marketing_assignees_name (assignee_name)
);

CREATE TABLE IF NOT EXISTS ad_vendor_statuses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    status_code VARCHAR(50) NOT NULL,
    status_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ad_vendor_statuses_code (status_code)
);

CREATE TABLE IF NOT EXISTS ad_currency_fx_rates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    currency_code VARCHAR(20) NOT NULL,
    rate_to_usd DECIMAL(18,10) NOT NULL,
    rate_source VARCHAR(100) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ad_currency_fx_rates_code (currency_code)
);

CREATE TABLE IF NOT EXISTS ad_vendor_campaigns (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vendor_id BIGINT UNSIGNED NOT NULL,
    assignee_id BIGINT UNSIGNED NULL,
    status_id BIGINT UNSIGNED NULL,
    campaign_name VARCHAR(255) NULL,
    total_amount_raw VARCHAR(255) NULL,
    amount_value DECIMAL(15,2) NULL,
    currency_code VARCHAR(20) NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    renewal_date DATE NULL,
    source_file VARCHAR(255) NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_campaign_vendor_id (vendor_id),
    KEY idx_campaign_status_id (status_id),
    KEY idx_campaign_assignee_id (assignee_id),
    KEY idx_campaign_start_date (start_date),
    KEY idx_campaign_end_date (end_date),
    CONSTRAINT fk_campaign_vendor
        FOREIGN KEY (vendor_id)
        REFERENCES ad_vendors (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_campaign_assignee
        FOREIGN KEY (assignee_id)
        REFERENCES ad_marketing_assignees (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_campaign_status
        FOREIGN KEY (status_id)
        REFERENCES ad_vendor_statuses (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

INSERT INTO ad_currency_fx_rates (currency_code, rate_to_usd, rate_source, is_active)
VALUES
    ('USD', 1.0000000000, 'mock', 1),
    ('USDT', 1.0000000000, 'mock', 1),
    ('EUR', 1.0800000000, 'mock', 1),
    ('PHP', 0.0178571429, 'mock', 1)
ON DUPLICATE KEY UPDATE
    rate_to_usd = VALUES(rate_to_usd),
    rate_source = VALUES(rate_source),
    is_active = VALUES(is_active),
    updated_at = CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS ad_platform_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type_code VARCHAR(80) NOT NULL,
    type_name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ad_platform_types_code (type_code)
);

CREATE TABLE IF NOT EXISTS ad_partner_platforms (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    platform_type_id BIGINT UNSIGNED NULL,
    platform_code VARCHAR(100) NOT NULL,
    platform_name VARCHAR(150) NOT NULL,
    website_url VARCHAR(500) NULL,
    app_url VARCHAR(500) NULL,
    description TEXT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ad_partner_platforms_code (platform_code),
    KEY idx_partner_platforms_type_id (platform_type_id),
    KEY idx_partner_platforms_name (platform_name),
    CONSTRAINT fk_partner_platform_type
        FOREIGN KEY (platform_type_id)
        REFERENCES ad_platform_types (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS ad_partnership_statuses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    status_code VARCHAR(80) NOT NULL,
    status_name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ad_partnership_statuses_code (status_code)
);

CREATE TABLE IF NOT EXISTS ad_persons_in_charge (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    department VARCHAR(150) NULL,
    role_title VARCHAR(150) NULL,
    email VARCHAR(150) NULL,
    telegram VARCHAR(150) NULL,
    whatsapp VARCHAR(150) NULL,
    phone_number VARCHAR(100) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_person_email (email),
    KEY idx_person_full_name (full_name)
);

CREATE TABLE IF NOT EXISTS ad_partnerships (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    partner_platform_id BIGINT UNSIGNED NOT NULL,
    partnership_status_id BIGINT UNSIGNED NOT NULL,
    person_in_charge_id BIGINT UNSIGNED NULL,
    partnership_name VARCHAR(255) NOT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    renewal_date DATE NULL,
    source_file VARCHAR(255) NULL,
    source_reference VARCHAR(255) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_partnership_platform_id (partner_platform_id),
    KEY idx_partnership_status_id (partnership_status_id),
    KEY idx_partnership_pic_id (person_in_charge_id),
    KEY idx_partnership_dates (start_date, end_date, renewal_date),
    CONSTRAINT fk_partnership_platform
        FOREIGN KEY (partner_platform_id)
        REFERENCES ad_partner_platforms (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_partnership_status
        FOREIGN KEY (partnership_status_id)
        REFERENCES ad_partnership_statuses (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_partnership_person_in_charge
        FOREIGN KEY (person_in_charge_id)
        REFERENCES ad_persons_in_charge (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS ad_partnership_costs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    partnership_id BIGINT UNSIGNED NOT NULL,
    cost_type ENUM('total_cost', 'monthly_fee', 'weekly_fee', 'daily_fee', 'one_time_fee', 'setup_fee', 'other') NOT NULL,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    currency_code VARCHAR(20) NOT NULL DEFAULT 'PHP',
    billing_frequency ENUM('one_time', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom') NULL,
    cost_description TEXT NULL,
    original_cost_text VARCHAR(255) NULL,
    effective_start_date DATE NULL,
    effective_end_date DATE NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_partnership_costs_partnership_id (partnership_id),
    KEY idx_partnership_costs_type (cost_type),
    KEY idx_partnership_costs_currency (currency_code),
    CONSTRAINT fk_partnership_cost
        FOREIGN KEY (partnership_id)
        REFERENCES ad_partnerships (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS ad_placements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    placement_code VARCHAR(100) NOT NULL,
    placement_name VARCHAR(150) NOT NULL,
    platform_area VARCHAR(100) NULL,
    description TEXT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ad_placements_code (placement_code)
);

CREATE TABLE IF NOT EXISTS partnership_ad_placements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    partnership_id BIGINT UNSIGNED NOT NULL,
    ad_placement_id BIGINT UNSIGNED NOT NULL,
    placement_description TEXT NULL,
    display_order INT UNSIGNED NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_partnership_placement (partnership_id, ad_placement_id),
    KEY idx_partnership_ad_placements_partnership_id (partnership_id),
    KEY idx_partnership_ad_placements_placement_id (ad_placement_id),
    CONSTRAINT fk_partnership_ad_placement_partnership
        FOREIGN KEY (partnership_id)
        REFERENCES ad_partnerships (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_partnership_ad_placement_master
        FOREIGN KEY (ad_placement_id)
        REFERENCES ad_placements (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS tracking_links (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    partnership_id BIGINT UNSIGNED NOT NULL,
    ad_channel_id BIGINT UNSIGNED NULL,
    tracking_code VARCHAR(100) NOT NULL,
    tracking_url TEXT NULL,
    utm_source VARCHAR(150) NULL,
    utm_medium VARCHAR(150) NULL,
    utm_campaign VARCHAR(150) NULL,
    utm_content VARCHAR(150) NULL,
    description TEXT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_tracking_partnership_code (partnership_id, tracking_code),
    KEY idx_tracking_partnership_id (partnership_id),
    KEY idx_tracking_ad_channel_id (ad_channel_id),
    KEY idx_tracking_code (tracking_code),
    CONSTRAINT fk_tracking_partnership
        FOREIGN KEY (partnership_id)
        REFERENCES ad_partnerships (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_tracking_ad_channel
        FOREIGN KEY (ad_channel_id)
        REFERENCES ad_channels (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS ad_partnership_notes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    partnership_id BIGINT UNSIGNED NOT NULL,
    note_type ENUM('general', 'contract', 'renewal', 'payment', 'performance', 'other') NOT NULL DEFAULT 'general',
    note_date DATE NULL,
    note_text TEXT NOT NULL,
    created_by VARCHAR(150) NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_partnership_notes_partnership_id (partnership_id),
    KEY idx_partnership_notes_note_date (note_date),
    CONSTRAINT fk_partnership_note_partnership
        FOREIGN KEY (partnership_id)
        REFERENCES ad_partnerships (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS ad_partnership_performance (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    partnership_id BIGINT UNSIGNED NOT NULL,
    ad_channel_id BIGINT UNSIGNED NULL,
    tracking_link_id BIGINT UNSIGNED NULL,
    report_date DATE NOT NULL,
    impressions INT UNSIGNED NOT NULL DEFAULT 0,
    clicks INT UNSIGNED NOT NULL DEFAULT 0,
    registrations INT UNSIGNED NOT NULL DEFAULT 0,
    first_deposits INT UNSIGNED NOT NULL DEFAULT 0,
    spend DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    revenue DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    ctr DECIMAL(10,4) GENERATED ALWAYS AS (
        CASE WHEN impressions = 0 THEN 0 ELSE clicks / impressions * 100 END
    ) STORED,
    cpr DECIMAL(15,4) GENERATED ALWAYS AS (
        CASE WHEN registrations = 0 THEN 0 ELSE spend / registrations END
    ) STORED,
    cpd DECIMAL(15,4) GENERATED ALWAYS AS (
        CASE WHEN first_deposits = 0 THEN 0 ELSE spend / first_deposits END
    ) STORED,
    conversion_rate DECIMAL(10,4) GENERATED ALWAYS AS (
        CASE WHEN registrations = 0 THEN 0 ELSE first_deposits / registrations * 100 END
    ) STORED,
    roi DECIMAL(10,4) GENERATED ALWAYS AS (
        CASE WHEN spend = 0 THEN 0 ELSE (revenue - spend) / spend * 100 END
    ) STORED,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_partnership_performance_daily (partnership_id, report_date, ad_channel_id, tracking_link_id),
    KEY idx_performance_partnership_id (partnership_id),
    KEY idx_performance_report_date (report_date),
    KEY idx_performance_ad_channel_id (ad_channel_id),
    KEY idx_performance_tracking_link_id (tracking_link_id),
    CONSTRAINT fk_performance_partnership
        FOREIGN KEY (partnership_id)
        REFERENCES ad_partnerships (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_performance_ad_channel
        FOREIGN KEY (ad_channel_id)
        REFERENCES ad_channels (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_performance_tracking_link
        FOREIGN KEY (tracking_link_id)
        REFERENCES tracking_links (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS ad_payment_statuses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    status_code VARCHAR(80) NOT NULL,
    status_name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ad_payment_statuses_code (status_code)
);

CREATE TABLE IF NOT EXISTS ad_partnership_payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    partnership_id BIGINT UNSIGNED NOT NULL,
    payment_status_id BIGINT UNSIGNED NOT NULL,
    payment_reference VARCHAR(150) NULL,
    amount_due DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    currency_code VARCHAR(20) NOT NULL DEFAULT 'PHP',
    due_date DATE NULL,
    paid_date DATE NULL,
    billing_period_start DATE NULL,
    billing_period_end DATE NULL,
    remarks TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_payments_partnership_id (partnership_id),
    KEY idx_payments_status_id (payment_status_id),
    KEY idx_payments_due_date (due_date),
    KEY idx_payments_paid_date (paid_date),
    CONSTRAINT fk_payment_partnership
        FOREIGN KEY (partnership_id)
        REFERENCES ad_partnerships (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_payment_status
        FOREIGN KEY (payment_status_id)
        REFERENCES ad_payment_statuses (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
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
