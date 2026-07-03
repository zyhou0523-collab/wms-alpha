-- WMS order status governance dictionaries.
-- This script is safe to execute repeatedly: dictionary types are upserted,
-- and dictionary data for the governed types is refreshed before insert.

INSERT INTO sys_dict_type (dict_name, dict_type, status, remark) VALUES
('WMS 发运订单状态', 'wms_outbound_order_status', 'ACTIVE', '主状态 + 历史兼容状态'),
('WMS 预期到货通知单状态', 'wms_inbound_order_status', 'ACTIVE', '主状态 + 历史兼容状态'),
('SAP 回传状态', 'wms_sap_post_status', 'ACTIVE', '未回传/成功/失败，POSTED 为兼容值')
ON DUPLICATE KEY UPDATE
  dict_name = VALUES(dict_name),
  status = VALUES(status),
  remark = VALUES(remark);

DELETE FROM sys_dict_data
WHERE dict_type IN ('wms_outbound_order_status', 'wms_inbound_order_status', 'wms_sap_post_status');

INSERT INTO sys_dict_data (dict_type, dict_label, dict_value, dict_sort, list_class, is_default, status, remark) VALUES
('wms_outbound_order_status', '创建', 'CREATED', 1, 'info', 1, 'ACTIVE', '主状态'),
('wms_outbound_order_status', '部分分配', 'PARTIAL_ALLOCATED', 2, 'warning', 0, 'ACTIVE', '主状态'),
('wms_outbound_order_status', '完全分配', 'ALLOCATED', 3, 'primary', 0, 'ACTIVE', '主状态'),
('wms_outbound_order_status', '部分拣货', 'PARTIAL_PICKED', 4, 'warning', 0, 'ACTIVE', '主状态'),
('wms_outbound_order_status', '完全拣货', 'PICKED', 5, 'primary', 0, 'ACTIVE', '主状态'),
('wms_outbound_order_status', '部分发运', 'PARTIAL_SHIPPED', 6, 'warning', 0, 'ACTIVE', '主状态'),
('wms_outbound_order_status', '完全发运', 'SHIPPED', 7, 'success', 0, 'ACTIVE', '主状态'),
('wms_outbound_order_status', '订单关闭', 'CLOSED', 8, 'success', 0, 'ACTIVE', '主状态'),
('wms_outbound_order_status', '订单取消', 'CANCELED', 9, 'danger', 0, 'ACTIVE', '主状态'),
('wms_outbound_order_status', '待分配', 'PENDING_ALLOC', 101, 'warning', 0, 'ACTIVE', '兼容状态：历史待分配'),
('wms_outbound_order_status', '拣货中', 'PICKING', 102, 'warning', 0, 'ACTIVE', '兼容状态：历史拣货中'),
('wms_outbound_order_status', '复核中', 'REVIEWING', 103, 'warning', 0, 'ACTIVE', '兼容状态：历史复核中'),
('wms_outbound_order_status', '已复核', 'REVIEWED', 104, 'primary', 0, 'ACTIVE', '兼容状态：历史复核完成'),
('wms_outbound_order_status', '回传成功', 'CALLBACK_SUCCESS', 105, 'success', 0, 'ACTIVE', '兼容状态：旧回调状态，后续使用 sap_post_status'),
('wms_outbound_order_status', '回传失败', 'CALLBACK_FAILED', 106, 'danger', 0, 'ACTIVE', '兼容状态：旧回调状态，后续使用 sap_post_status'),
('wms_outbound_order_status', '分配异常', 'ALLOCATION_EXCEPTION', 107, 'danger', 0, 'ACTIVE', '兼容状态：历史分配异常'),
('wms_inbound_order_status', '创建', 'CREATED', 1, 'info', 1, 'ACTIVE', '主状态'),
('wms_inbound_order_status', '部分收货', 'PARTIAL_RECEIVED', 2, 'warning', 0, 'ACTIVE', '主状态'),
('wms_inbound_order_status', '完全收货', 'RECEIVED', 3, 'success', 0, 'ACTIVE', '主状态'),
('wms_inbound_order_status', '订单关闭', 'CLOSED', 4, 'success', 0, 'ACTIVE', '主状态'),
('wms_inbound_order_status', '订单取消', 'CANCELED', 5, 'danger', 0, 'ACTIVE', '主状态'),
('wms_inbound_order_status', '收货中', 'RECEIVING', 101, 'warning', 0, 'ACTIVE', '兼容状态：历史收货中'),
('wms_inbound_order_status', '已绑定', 'BOUND', 102, 'primary', 0, 'ACTIVE', '兼容状态：包装绑定流程保留'),
('wms_inbound_order_status', '已上架', 'ON_SHELF', 103, 'success', 0, 'ACTIVE', '兼容状态：上架流程保留'),
('wms_inbound_order_status', 'SAP 回传失败', 'SAP_FAILED', 104, 'danger', 0, 'ACTIVE', '兼容状态：后续使用 sap_post_status=FAILED'),
('wms_sap_post_status', '未回传', 'NOT_POSTED', 1, 'info', 1, 'ACTIVE', '主状态'),
('wms_sap_post_status', '回传成功', 'SUCCESS', 2, 'success', 0, 'ACTIVE', '主状态'),
('wms_sap_post_status', '回传失败', 'FAILED', 3, 'danger', 0, 'ACTIVE', '主状态'),
('wms_sap_post_status', '已回传', 'POSTED', 101, 'success', 0, 'ACTIVE', '兼容状态：历史成功值');
