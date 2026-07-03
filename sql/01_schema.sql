CREATE DATABASE IF NOT EXISTS wms_alpha DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wms_alpha;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS wms_operation_log;
DROP TABLE IF EXISTS wms_interface_log;
DROP TABLE IF EXISTS wms_mock_config;
DROP TABLE IF EXISTS wms_outbound_status_history;
DROP TABLE IF EXISTS wms_outbound_exception;
DROP TABLE IF EXISTS wms_inventory_count_adjustment;
DROP TABLE IF EXISTS wms_inventory_count_line;
DROP TABLE IF EXISTS wms_inventory_count_order;
DROP TABLE IF EXISTS wms_inventory_move_line;
DROP TABLE IF EXISTS wms_inventory_move_order;
DROP TABLE IF EXISTS wms_inventory_transaction;
DROP TABLE IF EXISTS outbound_shipment_sn;
DROP TABLE IF EXISTS outbound_shipment_line;
DROP TABLE IF EXISTS wms_shipment_record;
DROP TABLE IF EXISTS wms_outbound_review_record;
DROP TABLE IF EXISTS wms_picking_record;
DROP TABLE IF EXISTS wms_picking_task;
DROP TABLE IF EXISTS wms_inventory_allocation;
DROP TABLE IF EXISTS wms_outbound_order_detail;
DROP TABLE IF EXISTS wms_outbound_order;
DROP TABLE IF EXISTS wms_inbound_receipt_sn;
DROP TABLE IF EXISTS wms_inbound_receipt_line;
DROP TABLE IF EXISTS wms_inbound_receipt;
DROP TABLE IF EXISTS wms_inbound_order_detail;
DROP TABLE IF EXISTS wms_inbound_order;
DROP TABLE IF EXISTS wms_package_binding;
DROP TABLE IF EXISTS wms_serial_number;
DROP TABLE IF EXISTS wms_inventory;
DROP TABLE IF EXISTS wms_location;
DROP TABLE IF EXISTS wms_area;
DROP TABLE IF EXISTS wms_warehouse;
DROP TABLE IF EXISTS md_supplier;
DROP TABLE IF EXISTS md_customer;
DROP TABLE IF EXISTS md_product;
DROP TABLE IF EXISTS sys_user_owner;
DROP TABLE IF EXISTS sys_user_warehouse;
DROP TABLE IF EXISTS sys_role_owner;
DROP TABLE IF EXISTS sys_role_warehouse;
DROP TABLE IF EXISTS sys_user_role;
DROP TABLE IF EXISTS sys_role_menu;
DROP TABLE IF EXISTS sys_data_scope;
DROP TABLE IF EXISTS sys_field_config;
DROP TABLE IF EXISTS sys_login_log;
DROP TABLE IF EXISTS sys_notice;
DROP TABLE IF EXISTS sys_config;
DROP TABLE IF EXISTS sys_dict_data;
DROP TABLE IF EXISTS sys_dict_type;
DROP TABLE IF EXISTS sys_menu;
DROP TABLE IF EXISTS sys_post;
DROP TABLE IF EXISTS sys_dept;
DROP TABLE IF EXISTS sys_role;
DROP TABLE IF EXISTS sys_user;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE sys_dept (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  parent_id BIGINT NOT NULL DEFAULT 0,
  dept_code VARCHAR(64) NOT NULL UNIQUE,
  dept_name VARCHAR(128) NOT NULL,
  leader VARCHAR(64) NULL,
  phone VARCHAR(64) NULL,
  email VARCHAR(128) NULL,
  order_num INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sys_post (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  post_code VARCHAR(64) NOT NULL UNIQUE,
  post_name VARCHAR(128) NOT NULL,
  post_sort INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  remark VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sys_role (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  role_code VARCHAR(64) NOT NULL UNIQUE,
  role_name VARCHAR(128) NOT NULL,
  role_sort INT NOT NULL DEFAULT 0,
  data_scope VARCHAR(64) NOT NULL DEFAULT 'ALL',
  warehouse_scope VARCHAR(512) NULL,
  owner_scope VARCHAR(512) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  remark VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sys_user (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(128) NOT NULL,
  display_name VARCHAR(128) NOT NULL,
  nickname VARCHAR(128) NULL,
  dept_id BIGINT NULL,
  post_id BIGINT NULL,
  mobile VARCHAR(64) NULL,
  email VARCHAR(128) NULL,
  role_code VARCHAR(64) NOT NULL,
  role_name VARCHAR(128) NOT NULL,
  warehouse_scope VARCHAR(255) NULL,
  owner_scope VARCHAR(255) NULL,
  default_warehouse_code VARCHAR(64) NULL,
  default_owner_code VARCHAR(64) NULL,
  remark VARCHAR(255) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sys_menu (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  parent_id BIGINT NOT NULL DEFAULT 0,
  menu_name VARCHAR(128) NOT NULL,
  menu_type VARCHAR(16) NOT NULL DEFAULT 'MENU',
  path VARCHAR(255) NULL,
  component VARCHAR(255) NULL,
  perms VARCHAR(255) NULL,
  icon VARCHAR(64) NULL,
  order_num INT NOT NULL DEFAULT 0,
  visible TINYINT(1) NOT NULL DEFAULT 1,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  remark VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_sys_menu_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sys_user_role (
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sys_role_menu (
  role_id BIGINT NOT NULL,
  menu_id BIGINT NOT NULL,
  PRIMARY KEY (role_id, menu_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sys_dict_type (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  dict_name VARCHAR(128) NOT NULL,
  dict_type VARCHAR(128) NOT NULL UNIQUE,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  remark VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sys_dict_data (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  dict_type VARCHAR(128) NOT NULL,
  dict_label VARCHAR(128) NOT NULL,
  dict_value VARCHAR(128) NOT NULL,
  dict_sort INT NOT NULL DEFAULT 0,
  css_class VARCHAR(64) NULL,
  list_class VARCHAR(64) NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  remark VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_dict_data_type (dict_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sys_config (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  config_name VARCHAR(128) NOT NULL,
  config_key VARCHAR(128) NOT NULL UNIQUE,
  config_value VARCHAR(512) NOT NULL,
  config_type VARCHAR(32) NOT NULL DEFAULT 'N',
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  remark VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sys_notice (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  notice_title VARCHAR(128) NOT NULL,
  notice_type VARCHAR(32) NOT NULL DEFAULT 'NOTICE',
  notice_content TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
  created_by VARCHAR(64) NOT NULL DEFAULT 'admin',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sys_login_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL,
  ipaddr VARCHAR(64) NULL,
  login_location VARCHAR(128) NULL,
  browser VARCHAR(64) NULL,
  os VARCHAR(64) NULL,
  status VARCHAR(32) NOT NULL,
  message VARCHAR(255) NULL,
  login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sys_field_config (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  page_code VARCHAR(128) NOT NULL,
  page_name VARCHAR(128) NOT NULL,
  field_code VARCHAR(128) NOT NULL,
  field_name VARCHAR(128) NOT NULL,
  field_type VARCHAR(64) NOT NULL DEFAULT 'TEXT',
  visible TINYINT(1) NOT NULL DEFAULT 1,
  required TINYINT(1) NOT NULL DEFAULT 0,
  editable TINYINT(1) NOT NULL DEFAULT 1,
  order_num INT NOT NULL DEFAULT 0,
  role_codes VARCHAR(512) NULL,
  remark VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_field_page_code (page_code, field_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sys_data_scope (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  scope_code VARCHAR(64) NOT NULL UNIQUE,
  scope_name VARCHAR(128) NOT NULL,
  role_code VARCHAR(64) NOT NULL,
  role_name VARCHAR(128) NOT NULL,
  scope_type VARCHAR(64) NOT NULL DEFAULT 'WAREHOUSE_OWNER',
  dept_codes VARCHAR(512) NULL,
  warehouse_codes VARCHAR(512) NULL,
  owner_codes VARCHAR(512) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  remark VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sys_role_warehouse (
  role_id BIGINT NOT NULL,
  warehouse_code VARCHAR(64) NOT NULL,
  PRIMARY KEY (role_id, warehouse_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sys_role_owner (
  role_id BIGINT NOT NULL,
  owner_code VARCHAR(64) NOT NULL,
  PRIMARY KEY (role_id, owner_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sys_user_warehouse (
  user_id BIGINT NOT NULL,
  warehouse_code VARCHAR(64) NOT NULL,
  PRIMARY KEY (user_id, warehouse_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sys_user_owner (
  user_id BIGINT NOT NULL,
  owner_code VARCHAR(64) NOT NULL,
  PRIMARY KEY (user_id, owner_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE md_product (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  owner_code VARCHAR(64) NULL,
  owner_name VARCHAR(128) NULL,
  product_code VARCHAR(64) NOT NULL,
  product_name VARCHAR(128) NOT NULL,
  product_name_en VARCHAR(255) NULL,
  category VARCHAR(64) NOT NULL,
  spec_model VARCHAR(128) NULL,
  product_family VARCHAR(128) NULL,
  product_class VARCHAR(128) NULL,
  unit VARCHAR(32) NOT NULL DEFAULT 'PCS',
  sn_managed TINYINT(1) NOT NULL DEFAULT 0,
  battery_flag TINYINT(1) NOT NULL DEFAULT 0,
  shelf_life_days INT NOT NULL DEFAULT 365,
  safety_stock INT NOT NULL DEFAULT 0,
  aging_threshold_days INT NOT NULL DEFAULT 180,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_product_owner_code (owner_code, product_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE md_customer (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  customer_code VARCHAR(64) NOT NULL UNIQUE,
  customer_name VARCHAR(128) NOT NULL,
  customer_type VARCHAR(64) NOT NULL,
  country_region VARCHAR(64) NULL,
  contact_name VARCHAR(64) NULL,
  contact_phone VARCHAR(64) NULL,
  delivery_address VARCHAR(255) NULL,
  vmi_flag TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE md_supplier (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  supplier_code VARCHAR(64) NOT NULL UNIQUE,
  supplier_name VARCHAR(128) NOT NULL,
  supplier_type VARCHAR(64) NOT NULL,
  contact_name VARCHAR(64) NULL,
  contact_phone VARCHAR(64) NULL,
  vmi_flag TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_warehouse (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  warehouse_code VARCHAR(64) NOT NULL UNIQUE,
  warehouse_name VARCHAR(128) NOT NULL,
  warehouse_type VARCHAR(64) NOT NULL,
  region VARCHAR(64) NULL,
  country VARCHAR(64) NULL,
  city VARCHAR(64) NULL,
  owner_type VARCHAR(32) NULL,
  owner_code VARCHAR(64) NULL,
  own_flag TINYINT(1) NOT NULL DEFAULT 1,
  vmi_flag TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_area (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  warehouse_id BIGINT NOT NULL,
  area_code VARCHAR(64) NOT NULL,
  area_name VARCHAR(128) NOT NULL,
  area_type VARCHAR(64) NOT NULL,
  quality_status_limit VARCHAR(64) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_area_code (warehouse_id, area_code),
  CONSTRAINT fk_area_warehouse FOREIGN KEY (warehouse_id) REFERENCES wms_warehouse(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_location (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  warehouse_id BIGINT NOT NULL,
  area_id BIGINT NOT NULL,
  location_code VARCHAR(64) NOT NULL,
  location_name VARCHAR(128) NOT NULL,
  rack_no VARCHAR(32) NULL,
  level_no VARCHAR(32) NULL,
  column_no VARCHAR(32) NULL,
  capacity INT NOT NULL DEFAULT 0,
  frozen_flag TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_location_code (warehouse_id, location_code),
  CONSTRAINT fk_location_warehouse FOREIGN KEY (warehouse_id) REFERENCES wms_warehouse(id),
  CONSTRAINT fk_location_area FOREIGN KEY (area_id) REFERENCES wms_area(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_inventory (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  warehouse_id BIGINT NOT NULL,
  area_id BIGINT NOT NULL,
  location_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  owner_code VARCHAR(64) NULL,
  owner_name VARCHAR(128) NULL,
  batch_no VARCHAR(64) NULL,
  pallet_code VARCHAR(64) NULL,
  box_code VARCHAR(64) NULL,
  inventory_status VARCHAR(32) NOT NULL DEFAULT 'QUALIFIED',
  total_qty INT NOT NULL DEFAULT 0,
  available_qty INT NOT NULL DEFAULT 0,
  allocated_qty INT NOT NULL DEFAULT 0,
  frozen_qty INT NOT NULL DEFAULT 0,
  unqualified_qty INT NOT NULL DEFAULT 0,
  inbound_date DATE NOT NULL,
  vmi_flag TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_inventory_product (product_id),
  KEY idx_inventory_warehouse (warehouse_id),
  KEY idx_inventory_packaging (pallet_code, box_code),
  CONSTRAINT fk_inventory_warehouse FOREIGN KEY (warehouse_id) REFERENCES wms_warehouse(id),
  CONSTRAINT fk_inventory_area FOREIGN KEY (area_id) REFERENCES wms_area(id),
  CONSTRAINT fk_inventory_location FOREIGN KEY (location_id) REFERENCES wms_location(id),
  CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES md_product(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_serial_number (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sn_code VARCHAR(128) NOT NULL UNIQUE,
  product_id BIGINT NOT NULL,
  owner_code VARCHAR(64) NULL,
  owner_name VARCHAR(128) NULL,
  mes_work_order_no VARCHAR(64) NULL,
  warehouse_id BIGINT NULL,
  location_id BIGINT NULL,
  pallet_code VARCHAR(64) NULL,
  box_code VARCHAR(64) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ISSUED',
  quality_status VARCHAR(32) NOT NULL DEFAULT 'QUALIFIED',
  locked_flag TINYINT(1) NOT NULL DEFAULT 0,
  locked_order_no VARCHAR(64) NULL,
  inbound_order_no VARCHAR(64) NULL,
  inbound_order_line_id BIGINT NULL,
  outbound_order_no VARCHAR(64) NULL,
  sold_flag TINYINT(1) NOT NULL DEFAULT 0,
  market_flag TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_sn_inbound_line (inbound_order_line_id),
  CONSTRAINT fk_sn_product FOREIGN KEY (product_id) REFERENCES md_product(id),
  CONSTRAINT fk_sn_warehouse FOREIGN KEY (warehouse_id) REFERENCES wms_warehouse(id),
  CONSTRAINT fk_sn_location FOREIGN KEY (location_id) REFERENCES wms_location(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_package_binding (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  pallet_code VARCHAR(64) NOT NULL,
  box_code VARCHAR(64) NULL,
  sn_code VARCHAR(128) NOT NULL,
  product_id BIGINT NOT NULL,
  inbound_order_no VARCHAR(64) NULL,
  inbound_order_line_id BIGINT NULL,
  bind_order_no VARCHAR(64) NULL,
  bind_status VARCHAR(32) NOT NULL DEFAULT 'BOUND',
  bind_time DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_binding_sn (sn_code),
  KEY idx_binding_pallet (pallet_code),
  KEY idx_binding_asn (inbound_order_no),
  KEY idx_binding_inbound_line (inbound_order_line_id),
  CONSTRAINT fk_binding_product FOREIGN KEY (product_id) REFERENCES md_product(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_inbound_order (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(64) NOT NULL UNIQUE,
  source_order_no VARCHAR(64) NULL,
  mes_work_order_no VARCHAR(64) NULL,
  inbound_type VARCHAR(64) NOT NULL,
  source_system VARCHAR(64) NOT NULL DEFAULT 'SAP',
  warehouse_id BIGINT NOT NULL,
  supplier_id BIGINT NULL,
  customer_id BIGINT NULL,
  owner_code VARCHAR(64) NULL,
  owner_name VARCHAR(128) NULL,
  ship_from_country VARCHAR(64) NULL,
  sap_plant VARCHAR(32) NULL,
  related_order_no VARCHAR(64) NULL,
  planned_qty INT NOT NULL DEFAULT 0,
  received_qty INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'CREATED',
  plan_arrival_date DATE NULL,
  sap_material_doc_no VARCHAR(64) NULL,
  sap_post_status VARCHAR(32) NULL,
  sap_post_result VARCHAR(512) NULL,
  remark VARCHAR(255) NULL,
  created_by VARCHAR(64) NOT NULL DEFAULT 'system',
  updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inbound_warehouse FOREIGN KEY (warehouse_id) REFERENCES wms_warehouse(id),
  CONSTRAINT fk_inbound_supplier FOREIGN KEY (supplier_id) REFERENCES md_supplier(id),
  CONSTRAINT fk_inbound_customer FOREIGN KEY (customer_id) REFERENCES md_customer(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_inbound_receipt (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  receipt_no VARCHAR(64) NOT NULL UNIQUE,
  inbound_order_id BIGINT NOT NULL,
  inbound_order_no VARCHAR(64) NOT NULL,
  receipt_time DATETIME NOT NULL,
  receipt_user VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'RECEIVED',
  sap_post_status VARCHAR(32) NOT NULL DEFAULT 'NOT_POSTED',
  sap_material_doc_no VARCHAR(64) NULL,
  sap_post_result VARCHAR(512) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_receipt_order (inbound_order_id),
  CONSTRAINT fk_receipt_order FOREIGN KEY (inbound_order_id) REFERENCES wms_inbound_order(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_inbound_receipt_line (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  receipt_id BIGINT NOT NULL,
  inbound_order_line_id BIGINT NOT NULL,
  line_no INT NOT NULL,
  product_id BIGINT NOT NULL,
  product_code VARCHAR(64) NOT NULL,
  receive_qty DECIMAL(18,4) NOT NULL DEFAULT 0,
  sap_post_qty DECIMAL(18,4) NOT NULL DEFAULT 0,
  sap_post_status VARCHAR(32) NOT NULL DEFAULT 'NOT_POSTED',
  sap_material_doc_no VARCHAR(64) NULL,
  sap_post_result VARCHAR(512) NULL,
  KEY idx_receipt_line_receipt (receipt_id),
  CONSTRAINT fk_receipt_line_receipt FOREIGN KEY (receipt_id) REFERENCES wms_inbound_receipt(id),
  CONSTRAINT fk_receipt_line_order_line FOREIGN KEY (inbound_order_line_id) REFERENCES wms_inbound_order_detail(id),
  CONSTRAINT fk_receipt_line_product FOREIGN KEY (product_id) REFERENCES md_product(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_inbound_receipt_sn (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  receipt_id BIGINT NOT NULL,
  receipt_line_id BIGINT NOT NULL,
  sn_code VARCHAR(128) NOT NULL,
  product_id BIGINT NOT NULL,
  inbound_order_line_id BIGINT NOT NULL,
  pallet_code VARCHAR(64) NULL,
  box_code VARCHAR(64) NULL,
  UNIQUE KEY uk_receipt_sn (receipt_id, sn_code),
  CONSTRAINT fk_receipt_sn_receipt FOREIGN KEY (receipt_id) REFERENCES wms_inbound_receipt(id),
  CONSTRAINT fk_receipt_sn_line FOREIGN KEY (receipt_line_id) REFERENCES wms_inbound_receipt_line(id),
  CONSTRAINT fk_receipt_sn_product FOREIGN KEY (product_id) REFERENCES md_product(id),
  CONSTRAINT fk_receipt_sn_order_line FOREIGN KEY (inbound_order_line_id) REFERENCES wms_inbound_order_detail(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_inbound_order_detail (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  line_no INT NOT NULL,
  product_id BIGINT NOT NULL,
  planned_qty INT NOT NULL,
  received_qty INT NOT NULL DEFAULT 0,
  shelved_qty INT NOT NULL DEFAULT 0,
  sap_plant VARCHAR(32) NULL,
  sap_storage_location VARCHAR(32) NULL,
  sn_required TINYINT(1) NOT NULL DEFAULT 0,
  owner_code VARCHAR(64) NULL,
  batch_no VARCHAR(64) NULL,
  quality_status VARCHAR(32) NOT NULL DEFAULT 'QUALIFIED',
  status VARCHAR(32) NOT NULL DEFAULT 'CREATED',
  CONSTRAINT fk_inbound_detail_order FOREIGN KEY (order_id) REFERENCES wms_inbound_order(id),
  CONSTRAINT fk_inbound_detail_product FOREIGN KEY (product_id) REFERENCES md_product(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_outbound_order (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(64) NOT NULL UNIQUE,
  source_order_no VARCHAR(64) NULL,
  source_system VARCHAR(64) NOT NULL DEFAULT 'FULFILLMENT',
  outbound_type VARCHAR(64) NOT NULL,
  warehouse_id BIGINT NOT NULL,
  target_warehouse_id BIGINT NULL,
  customer_id BIGINT NULL,
  owner_code VARCHAR(64) NULL,
  owner_name VARCHAR(128) NULL,
  consignee_code VARCHAR(64) NULL,
  consignee_name VARCHAR(128) NULL,
  expected_ship_time DATETIME NULL,
  related_order_no VARCHAR(64) NULL,
  sales_order_no VARCHAR(64) NULL,
  rework_order_no VARCHAR(64) NULL,
  target_owner_code VARCHAR(64) NULL,
  target_owner_name VARCHAR(128) NULL,
  required_delivery_time DATETIME NULL,
  planned_qty INT NOT NULL DEFAULT 0,
  allocated_qty INT NOT NULL DEFAULT 0,
  picked_qty INT NOT NULL DEFAULT 0,
  review_qty INT NOT NULL DEFAULT 0,
  shipped_qty INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'CREATED',
  logistics_company VARCHAR(64) NULL,
  carrier_name VARCHAR(128) NULL,
  tracking_no VARCHAR(64) NULL,
  shipper VARCHAR(64) NULL,
  ship_time DATETIME NULL,
  sap_material_doc_no VARCHAR(64) NULL,
  sap_post_status VARCHAR(32) NULL,
  sap_post_result VARCHAR(512) NULL,
  trace_post_status VARCHAR(32) NULL,
  parent_order_no VARCHAR(64) NULL,
  split_flag TINYINT(1) NOT NULL DEFAULT 0,
  deleted_flag TINYINT(1) NOT NULL DEFAULT 0,
  remark VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_outbound_warehouse FOREIGN KEY (warehouse_id) REFERENCES wms_warehouse(id),
  CONSTRAINT fk_outbound_target_warehouse FOREIGN KEY (target_warehouse_id) REFERENCES wms_warehouse(id),
  CONSTRAINT fk_outbound_customer FOREIGN KEY (customer_id) REFERENCES md_customer(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_outbound_order_detail (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  line_no INT NOT NULL,
  product_id BIGINT NOT NULL,
  planned_qty INT NOT NULL,
  sap_plant VARCHAR(32) NULL,
  unit VARCHAR(32) NULL,
  sn_required TINYINT(1) NOT NULL DEFAULT 0,
  allocated_qty INT NOT NULL DEFAULT 0,
  picked_qty INT NOT NULL DEFAULT 0,
  review_qty INT NOT NULL DEFAULT 0,
  shipped_qty INT NOT NULL DEFAULT 0,
  batch_no VARCHAR(64) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'CREATED',
  CONSTRAINT fk_outbound_detail_order FOREIGN KEY (order_id) REFERENCES wms_outbound_order(id),
  CONSTRAINT fk_outbound_detail_product FOREIGN KEY (product_id) REFERENCES md_product(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_inventory_allocation (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  allocation_no VARCHAR(64) NOT NULL UNIQUE,
  outbound_order_id BIGINT NOT NULL,
  outbound_order_no VARCHAR(64) NOT NULL,
  outbound_detail_id BIGINT NOT NULL,
  inventory_id BIGINT NOT NULL,
  warehouse_id BIGINT NOT NULL,
  location_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  batch_no VARCHAR(64) NULL,
  sn_code VARCHAR(128) NULL,
  allocated_qty INT NOT NULL DEFAULT 1,
  allocation_mode VARCHAR(32) NOT NULL DEFAULT 'AUTO',
  allocation_status VARCHAR(32) NOT NULL DEFAULT 'ALLOCATED',
  picker VARCHAR(64) NULL,
  picked_at DATETIME NULL,
  reviewer VARCHAR(64) NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_allocation_order_sn (outbound_order_id, sn_code),
  KEY idx_allocation_order (outbound_order_id),
  KEY idx_allocation_sn (sn_code),
  CONSTRAINT fk_allocation_order FOREIGN KEY (outbound_order_id) REFERENCES wms_outbound_order(id),
  CONSTRAINT fk_allocation_detail FOREIGN KEY (outbound_detail_id) REFERENCES wms_outbound_order_detail(id),
  CONSTRAINT fk_allocation_inventory FOREIGN KEY (inventory_id) REFERENCES wms_inventory(id),
  CONSTRAINT fk_allocation_warehouse FOREIGN KEY (warehouse_id) REFERENCES wms_warehouse(id),
  CONSTRAINT fk_allocation_location FOREIGN KEY (location_id) REFERENCES wms_location(id),
  CONSTRAINT fk_allocation_product FOREIGN KEY (product_id) REFERENCES md_product(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_picking_task (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  task_no VARCHAR(64) NOT NULL UNIQUE,
  outbound_order_id BIGINT NOT NULL,
  outbound_order_no VARCHAR(64) NOT NULL,
  warehouse_id BIGINT NOT NULL,
  location_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  plan_qty INT NOT NULL DEFAULT 0,
  picked_qty INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  picker VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_picking_task_order FOREIGN KEY (outbound_order_id) REFERENCES wms_outbound_order(id),
  CONSTRAINT fk_picking_task_warehouse FOREIGN KEY (warehouse_id) REFERENCES wms_warehouse(id),
  CONSTRAINT fk_picking_task_location FOREIGN KEY (location_id) REFERENCES wms_location(id),
  CONSTRAINT fk_picking_task_product FOREIGN KEY (product_id) REFERENCES md_product(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_picking_record (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  task_id BIGINT NOT NULL,
  task_no VARCHAR(64) NOT NULL,
  outbound_order_id BIGINT NOT NULL,
  outbound_order_no VARCHAR(64) NOT NULL,
  sn_code VARCHAR(128) NOT NULL,
  location_id BIGINT NOT NULL,
  picker VARCHAR(64) NOT NULL,
  result VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
  error_message VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_picking_task_sn (task_id, sn_code),
  CONSTRAINT fk_picking_record_task FOREIGN KEY (task_id) REFERENCES wms_picking_task(id),
  CONSTRAINT fk_picking_record_order FOREIGN KEY (outbound_order_id) REFERENCES wms_outbound_order(id),
  CONSTRAINT fk_picking_record_location FOREIGN KEY (location_id) REFERENCES wms_location(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_outbound_review_record (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  outbound_order_id BIGINT NOT NULL,
  outbound_order_no VARCHAR(64) NOT NULL,
  sn_code VARCHAR(128) NOT NULL,
  reviewer VARCHAR(64) NOT NULL,
  result VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
  error_message VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_review_order_sn (outbound_order_id, sn_code),
  CONSTRAINT fk_review_order FOREIGN KEY (outbound_order_id) REFERENCES wms_outbound_order(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_shipment_record (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  shipment_no VARCHAR(64) NOT NULL UNIQUE,
  outbound_order_id BIGINT NOT NULL,
  outbound_order_no VARCHAR(64) NOT NULL,
  carrier VARCHAR(64) NOT NULL,
  tracking_no VARCHAR(64) NOT NULL,
  shipped_qty INT NOT NULL DEFAULT 0,
  shipper VARCHAR(64) NOT NULL,
  ship_time DATETIME NOT NULL,
  shipment_status VARCHAR(32) NOT NULL DEFAULT 'SHIPPED',
  sap_post_status VARCHAR(32) NOT NULL DEFAULT 'NOT_POSTED',
  sap_material_doc_no VARCHAR(64) NULL,
  sap_post_result VARCHAR(512) NULL,
  remark VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_shipment_order FOREIGN KEY (outbound_order_id) REFERENCES wms_outbound_order(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE outbound_shipment_line (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  shipment_id BIGINT NOT NULL,
  outbound_order_line_id BIGINT NOT NULL,
  line_no INT NOT NULL,
  product_id BIGINT NOT NULL,
  product_code VARCHAR(64) NOT NULL,
  ship_qty INT NOT NULL DEFAULT 0,
  sap_post_qty INT NOT NULL DEFAULT 0,
  sap_post_status VARCHAR(32) NOT NULL DEFAULT 'NOT_POSTED',
  sap_material_doc_no VARCHAR(64) NULL,
  sap_post_result VARCHAR(512) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ship_line_shipment FOREIGN KEY (shipment_id) REFERENCES wms_shipment_record(id),
  CONSTRAINT fk_ship_line_order_line FOREIGN KEY (outbound_order_line_id) REFERENCES wms_outbound_order_detail(id),
  CONSTRAINT fk_ship_line_product FOREIGN KEY (product_id) REFERENCES md_product(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE outbound_shipment_sn (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  shipment_id BIGINT NOT NULL,
  shipment_line_id BIGINT NOT NULL,
  sn_code VARCHAR(128) NOT NULL,
  product_id BIGINT NOT NULL,
  outbound_order_line_id BIGINT NOT NULL,
  pallet_code VARCHAR(64) NULL,
  box_code VARCHAR(64) NULL,
  location_code VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ship_sn_shipment FOREIGN KEY (shipment_id) REFERENCES wms_shipment_record(id),
  CONSTRAINT fk_ship_sn_line FOREIGN KEY (shipment_line_id) REFERENCES outbound_shipment_line(id),
  CONSTRAINT fk_ship_sn_order_line FOREIGN KEY (outbound_order_line_id) REFERENCES wms_outbound_order_detail(id),
  CONSTRAINT fk_ship_sn_product FOREIGN KEY (product_id) REFERENCES md_product(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_inventory_transaction (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  transaction_no VARCHAR(64) NOT NULL UNIQUE,
  transaction_type VARCHAR(64) NOT NULL,
  business_doc_no VARCHAR(64) NOT NULL,
  owner_code VARCHAR(64) NULL,
  owner_name VARCHAR(128) NULL,
  warehouse_id BIGINT NOT NULL,
  location_id BIGINT NULL,
  from_location_id BIGINT NULL,
  to_location_id BIGINT NULL,
  product_id BIGINT NOT NULL,
  sn_code VARCHAR(128) NULL,
  batch_no VARCHAR(64) NULL,
  from_pallet_code VARCHAR(64) NULL,
  to_pallet_code VARCHAR(64) NULL,
  from_box_code VARCHAR(64) NULL,
  to_box_code VARCHAR(64) NULL,
  qty INT NOT NULL,
  before_qty INT NULL,
  after_qty INT NULL,
  operator VARCHAR(64) NOT NULL,
  remark VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_transaction_warehouse FOREIGN KEY (warehouse_id) REFERENCES wms_warehouse(id),
  CONSTRAINT fk_transaction_location FOREIGN KEY (location_id) REFERENCES wms_location(id),
  CONSTRAINT fk_transaction_from_location FOREIGN KEY (from_location_id) REFERENCES wms_location(id),
  CONSTRAINT fk_transaction_to_location FOREIGN KEY (to_location_id) REFERENCES wms_location(id),
  CONSTRAINT fk_transaction_product FOREIGN KEY (product_id) REFERENCES md_product(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_inventory_count_order (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  count_order_no VARCHAR(64) NOT NULL UNIQUE,
  count_type VARCHAR(32) NOT NULL,
  count_scope VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'CREATED',
  warehouse_id BIGINT NULL,
  owner_code VARCHAR(64) NULL,
  owner_name VARCHAR(128) NULL,
  area_code VARCHAR(64) NULL,
  location_code VARCHAR(64) NULL,
  product_id BIGINT NULL,
  product_code VARCHAR(64) NULL,
  product_name VARCHAR(128) NULL,
  batch_no VARCHAR(64) NULL,
  pallet_code VARCHAR(64) NULL,
  box_code VARCHAR(64) NULL,
  sn_code VARCHAR(128) NULL,
  freeze_flag TINYINT(1) NOT NULL DEFAULT 0,
  start_time DATETIME NULL,
  end_time DATETIME NULL,
  created_by VARCHAR(64) NOT NULL DEFAULT 'admin',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(64) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  remark VARCHAR(255) NULL,
  CONSTRAINT fk_count_order_warehouse FOREIGN KEY (warehouse_id) REFERENCES wms_warehouse(id),
  CONSTRAINT fk_count_order_product FOREIGN KEY (product_id) REFERENCES md_product(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_inventory_count_line (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  count_order_id BIGINT NOT NULL,
  line_no INT NOT NULL,
  owner_code VARCHAR(64) NULL,
  owner_name VARCHAR(128) NULL,
  warehouse_id BIGINT NOT NULL,
  area_id BIGINT NULL,
  location_id BIGINT NULL,
  product_id BIGINT NOT NULL,
  sn_required TINYINT(1) NOT NULL DEFAULT 0,
  pallet_code VARCHAR(64) NULL,
  box_code VARCHAR(64) NULL,
  sn_code VARCHAR(128) NULL,
  batch_no VARCHAR(64) NULL,
  unit VARCHAR(32) NULL,
  book_qty INT NOT NULL DEFAULT 0,
  actual_qty INT NULL,
  diff_qty INT NULL,
  diff_type VARCHAR(32) NULL,
  diff_reason VARCHAR(255) NULL,
  handling_method VARCHAR(64) NULL,
  line_status VARCHAR(32) NOT NULL DEFAULT 'NOT_COUNTED',
  actual_location_code VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_count_order_line (count_order_id, line_no),
  KEY idx_count_line_sn (sn_code),
  CONSTRAINT fk_count_line_order FOREIGN KEY (count_order_id) REFERENCES wms_inventory_count_order(id),
  CONSTRAINT fk_count_line_warehouse FOREIGN KEY (warehouse_id) REFERENCES wms_warehouse(id),
  CONSTRAINT fk_count_line_area FOREIGN KEY (area_id) REFERENCES wms_area(id),
  CONSTRAINT fk_count_line_location FOREIGN KEY (location_id) REFERENCES wms_location(id),
  CONSTRAINT fk_count_line_product FOREIGN KEY (product_id) REFERENCES md_product(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_inventory_count_adjustment (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  count_order_id BIGINT NOT NULL,
  count_line_id BIGINT NOT NULL,
  adjustment_no VARCHAR(64) NOT NULL UNIQUE,
  adjustment_type VARCHAR(32) NOT NULL,
  qty INT NOT NULL DEFAULT 0,
  from_location_id BIGINT NULL,
  to_location_id BIGINT NULL,
  operator VARCHAR(64) NOT NULL DEFAULT 'admin',
  result VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
  remark VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_count_adjust_order FOREIGN KEY (count_order_id) REFERENCES wms_inventory_count_order(id),
  CONSTRAINT fk_count_adjust_line FOREIGN KEY (count_line_id) REFERENCES wms_inventory_count_line(id),
  CONSTRAINT fk_count_adjust_from_location FOREIGN KEY (from_location_id) REFERENCES wms_location(id),
  CONSTRAINT fk_count_adjust_to_location FOREIGN KEY (to_location_id) REFERENCES wms_location(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_inventory_move_order (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  move_order_no VARCHAR(64) NOT NULL UNIQUE,
  move_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'CREATED',
  owner_code VARCHAR(64) NOT NULL,
  owner_name VARCHAR(128) NULL,
  warehouse_id BIGINT NOT NULL,
  from_area_code VARCHAR(64) NULL,
  from_location_id BIGINT NULL,
  to_area_code VARCHAR(64) NULL,
  to_location_id BIGINT NULL,
  from_pallet_code VARCHAR(64) NULL,
  to_pallet_code VARCHAR(64) NULL,
  from_box_code VARCHAR(64) NULL,
  to_box_code VARCHAR(64) NULL,
  created_by VARCHAR(64) NOT NULL DEFAULT 'admin',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_by VARCHAR(64) NULL,
  confirmed_at DATETIME NULL,
  remark VARCHAR(255) NULL,
  CONSTRAINT fk_move_order_warehouse FOREIGN KEY (warehouse_id) REFERENCES wms_warehouse(id),
  CONSTRAINT fk_move_order_from_location FOREIGN KEY (from_location_id) REFERENCES wms_location(id),
  CONSTRAINT fk_move_order_to_location FOREIGN KEY (to_location_id) REFERENCES wms_location(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_inventory_move_line (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  move_order_id BIGINT NOT NULL,
  line_no INT NOT NULL,
  product_id BIGINT NOT NULL,
  sn_required TINYINT(1) NOT NULL DEFAULT 0,
  sn_code VARCHAR(128) NULL,
  batch_no VARCHAR(64) NULL,
  from_location_id BIGINT NULL,
  to_location_id BIGINT NULL,
  from_pallet_code VARCHAR(64) NULL,
  to_pallet_code VARCHAR(64) NULL,
  from_box_code VARCHAR(64) NULL,
  to_box_code VARCHAR(64) NULL,
  move_qty INT NOT NULL DEFAULT 1,
  unit VARCHAR(32) NULL,
  line_status VARCHAR(32) NOT NULL DEFAULT 'CREATED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_move_order_line (move_order_id, line_no),
  KEY idx_move_line_sn (sn_code),
  CONSTRAINT fk_move_line_order FOREIGN KEY (move_order_id) REFERENCES wms_inventory_move_order(id),
  CONSTRAINT fk_move_line_product FOREIGN KEY (product_id) REFERENCES md_product(id),
  CONSTRAINT fk_move_line_from_location FOREIGN KEY (from_location_id) REFERENCES wms_location(id),
  CONSTRAINT fk_move_line_to_location FOREIGN KEY (to_location_id) REFERENCES wms_location(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_outbound_exception (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  exception_no VARCHAR(64) NOT NULL UNIQUE,
  outbound_order_id BIGINT NULL,
  outbound_order_no VARCHAR(64) NULL,
  task_no VARCHAR(64) NULL,
  sn_code VARCHAR(128) NULL,
  exception_type VARCHAR(64) NOT NULL,
  message VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
  operator VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_outbound_status_history (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  outbound_order_id BIGINT NOT NULL,
  outbound_order_no VARCHAR(64) NOT NULL,
  from_status VARCHAR(32) NULL,
  to_status VARCHAR(32) NOT NULL,
  action VARCHAR(64) NOT NULL,
  operator VARCHAR(64) NOT NULL,
  message VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_status_history_order FOREIGN KEY (outbound_order_id) REFERENCES wms_outbound_order(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_interface_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  interface_name VARCHAR(128) NOT NULL,
  source_system VARCHAR(64) NOT NULL,
  target_system VARCHAR(64) NOT NULL,
  business_doc_no VARCHAR(64) NULL,
  http_method VARCHAR(16) NOT NULL DEFAULT 'POST',
  request_url VARCHAR(255) NOT NULL,
  request_body JSON NULL,
  response_body JSON NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
  retry_count INT NOT NULL DEFAULT 0,
  error_message VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_mock_config (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  interface_name VARCHAR(128) NOT NULL UNIQUE,
  target_system VARCHAR(64) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  force_fail TINYINT(1) NOT NULL DEFAULT 0,
  delay_ms INT NOT NULL DEFAULT 120,
  failure_message VARCHAR(255) NULL,
  updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wms_operation_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  module VARCHAR(64) NOT NULL,
  business_doc_no VARCHAR(64) NULL,
  action VARCHAR(64) NOT NULL,
  operator VARCHAR(64) NOT NULL,
  result VARCHAR(32) NOT NULL,
  message VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
