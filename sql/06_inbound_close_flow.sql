-- WMS PC V2.3 inbound arrival notice close flow migration.
-- Safe for existing demo databases; the schema file already contains these columns for fresh installs.

SET @current_schema = DATABASE();

SET @has_split_from_order_no = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @current_schema
    AND TABLE_NAME = 'wms_inbound_order'
    AND COLUMN_NAME = 'split_from_order_no'
);
SET @sql = IF(
  @has_split_from_order_no = 0,
  'ALTER TABLE wms_inbound_order ADD COLUMN split_from_order_no VARCHAR(64) NULL AFTER related_order_no',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_split_flag = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @current_schema
    AND TABLE_NAME = 'wms_inbound_order'
    AND COLUMN_NAME = 'split_flag'
);
SET @sql = IF(
  @has_split_flag = 0,
  'ALTER TABLE wms_inbound_order ADD COLUMN split_flag TINYINT(1) NOT NULL DEFAULT 0 AFTER split_from_order_no',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
