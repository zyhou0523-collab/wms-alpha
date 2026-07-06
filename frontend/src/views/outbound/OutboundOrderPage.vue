<template>
  <el-card class="page-card shipping-page" shadow="never">
    <template #header>
      <div class="page-header">
        <div>
          <div class="page-title">{{ t('outbound.title') }}</div>
          <div class="muted">{{ t('outbound.subtitle') }}</div>
        </div>
        <el-button type="primary" @click="load">{{ t('common.refresh') }}</el-button>
      </div>
    </template>

    <el-form :model="query" inline label-width="104px" class="query-form">
      <el-form-item :label="t('outbound.shipmentOrderNo')">
        <el-input v-model="query.orderNo" clearable placeholder="SO-OUT-202606110001" />
      </el-form-item>
      <el-form-item :label="t('outbound.orderType')">
        <el-select v-model="query.orderType" clearable filterable :placeholder="t('common.all')" style="width: 180px">
          <el-option v-for="item in orderTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('outbound.orderStatus')">
        <el-select v-model="query.status" clearable filterable :placeholder="t('common.all')" style="width: 180px">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('outbound.warehouseCode')">
        <el-input v-model="query.warehouseCode" clearable placeholder="HZ" />
      </el-form-item>
      <el-form-item :label="t('outbound.owner')">
        <el-input v-model="query.owner" clearable placeholder="货主编码/名称" />
      </el-form-item>
      <el-form-item :label="t('outbound.consignee')">
        <el-input v-model="query.consigneeCode" clearable placeholder="客户/目标方" />
      </el-form-item>
      <el-form-item :label="t('outbound.relatedOrderNo')">
        <el-input v-model="query.relatedOrderNo" clearable placeholder="SO / STO / TR" />
      </el-form-item>
      <el-form-item :label="t('outbound.salesOrderNo')">
        <el-input v-model="query.salesOrderNo" clearable />
      </el-form-item>
      <el-form-item :label="t('outbound.sapPost')">
        <el-select v-model="query.sapPostStatus" clearable :placeholder="t('common.all')" style="width: 160px">
          <el-option v-for="item in sapStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">{{ t('common.query') }}</el-button>
        <el-button @click="reset">{{ t('common.reset') }}</el-button>
      </el-form-item>
    </el-form>

    <div class="toolbar">
      <el-button type="primary" @click="openCreate">{{ t('common.add') }}</el-button>
      <el-button :disabled="!selectedRows.length" @click="bulkAllocate">{{ t('common.allocateInventory') }}</el-button>
      <el-button type="warning" plain :disabled="!selectedRows.length" @click="retrySelectedSap">{{ t('common.retrySap') }}</el-button>
      <el-button @click="placeholder(t('common.export'))">{{ t('common.export') }}</el-button>
      <el-button @click="load">{{ t('common.refresh') }}</el-button>
      <el-button @click="outboundImportInput?.click()">{{ t('common.importTemplate') }}</el-button>
      <el-button link type="primary" @click="downloadOutboundImportTemplate">{{ t('common.downloadTemplate') }}</el-button>
      <input ref="outboundImportInput" class="hidden-file-input" type="file" accept=".csv,.txt" @change="importOutboundRows" />
    </div>

    <el-alert
      class="list-alert"
      type="info"
      show-icon
      :closable="false"
      title="列表按发运订单表头展示；展开后查看产品行明细，行明细不会作为主列表行展示。"
    />

    <el-table
      v-loading="loading"
      :data="rows"
      border
      stripe
      class="shipping-table"
      style="width: 100%"
      @selection-change="selectedRows = $event"
    >
      <el-table-column type="selection" width="44" />
      <el-table-column type="expand" width="46">
        <template #default="{ row }">
          <div class="shipping-line-expand-wrapper">
            <el-table :data="row.lines || []" border size="small" class="shipping-line-subtable" empty-text="暂无行明细">
              <el-table-column prop="line_no" label="行号" width="70" />
              <el-table-column prop="line_status" label="行状态" width="110">
                <template #default="{ row: line }">
                  <el-tag :type="statusType(line.line_status || line.status)" size="small">{{ statusLabel(line.line_status || line.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="product_code" label="产品编码" width="170" show-overflow-tooltip />
              <el-table-column prop="product_description" label="产品描述" width="200" show-overflow-tooltip>
                <template #default="{ row: line }">{{ line.product_description || line.product_name }}</template>
              </el-table-column>
              <el-table-column prop="owner_code" label="货主" width="100">
                <template #default>{{ row.owner_code || '-' }}</template>
              </el-table-column>
              <el-table-column prop="order_qty" label="订单数量" width="90" align="right" />
              <el-table-column prop="allocated_qty" label="分配数量" width="90" align="right" />
              <el-table-column label="待分配" width="90" align="right">
                <template #default="{ row: line }">{{ pendingAllocateQty(line) }}</template>
              </el-table-column>
              <el-table-column prop="picked_qty" label="拣货数量" width="90" align="right" />
              <el-table-column prop="shipped_qty" label="发货数量" width="90" align="right" />
              <el-table-column prop="sap_plant" label="SAP 工厂" width="100" />
              <el-table-column prop="unit" label="单位" width="70" />
            </el-table>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="shipment_order_no" label="发运订单编号" width="190" show-overflow-tooltip>
        <template #default="{ row }">{{ row.shipment_order_no || row.order_no }}</template>
      </el-table-column>
      <el-table-column prop="status" label="发运订单状态" width="120">
        <template #default="{ row }"><el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="order_type" label="订单类型" width="130">
        <template #default="{ row }">{{ orderTypeLabel(row.order_type || row.outbound_type) }}</template>
      </el-table-column>
      <el-table-column prop="warehouse_code" label="仓库编号" width="150" show-overflow-tooltip />
      <el-table-column prop="warehouse_name" label="仓库名称" width="160" show-overflow-tooltip />
      <el-table-column prop="owner_code" label="货主" width="100" />
      <el-table-column prop="owner_name" label="货主名称" width="150" show-overflow-tooltip />
      <el-table-column prop="consignee_code" label="收货人编码" width="140" show-overflow-tooltip />
      <el-table-column prop="consignee_name" label="收货人名称" width="170" show-overflow-tooltip />
      <el-table-column prop="expected_ship_time" label="预期发货时间" width="170" show-overflow-tooltip />
      <el-table-column prop="related_order_no" label="关联单号" width="170" show-overflow-tooltip />
      <el-table-column prop="sales_order_no" label="销售单号" width="160" show-overflow-tooltip />
      <el-table-column label="目标仓库" width="170" show-overflow-tooltip>
        <template #default="{ row }">{{ [row.target_warehouse_code, row.target_warehouse_name].filter(Boolean).join(' / ') || '-' }}</template>
      </el-table-column>
      <el-table-column label="目标货主" width="150" show-overflow-tooltip>
        <template #default="{ row }">{{ [row.target_owner_code, row.target_owner_name].filter(Boolean).join(' / ') || '-' }}</template>
      </el-table-column>
      <el-table-column prop="required_delivery_time" label="要求交货时间" width="170" show-overflow-tooltip />
      <el-table-column prop="carrier_name" label="物流商" width="120" show-overflow-tooltip />
      <el-table-column prop="tracking_no" label="物流单号" width="150" show-overflow-tooltip />
      <el-table-column prop="sap_post_status" label="回传 SAP" width="110">
        <template #default="{ row }"><el-tag :type="sapType(row.sap_post_status)" size="small">{{ sapLabel(row.sap_post_status) }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="sap_post_result" label="回传说明" width="190" show-overflow-tooltip />
      <el-table-column label="操作" fixed="right" width="390">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">{{ t('common.details') }}</el-button>
          <el-button v-if="canEdit(row)" link type="primary" @click="openEdit(row)">{{ t('common.edit') }}</el-button>
          <el-button v-if="canAllocate(row)" link type="primary" @click="openAllocation(row)">{{ t('common.allocateInventory') }}</el-button>
          <el-button v-if="canPick(row)" link type="primary" @click="openPick(row)">{{ t('common.pick') }}</el-button>
          <el-button v-if="canShip(row)" link type="success" @click="openShip(row)">{{ t('common.ship') }}</el-button>
          <el-button v-if="canPostSap(row)" link type="warning" @click="postSap(row)">{{ t('common.sapPost') }}</el-button>
          <el-button v-if="canClose(row)" link type="warning" @click="closeOrder(row)">{{ t('common.close') }}</el-button>
          <el-button v-if="canCancel(row)" link type="danger" @click="cancelOrder(row)">{{ t('common.cancel') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :page-sizes="[10, 20, 50]"
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        @current-change="load"
        @size-change="load"
      />
    </div>
  </el-card>

  <el-dialog v-model="createVisible" :title="createMode === 'edit' ? '编辑发运订单' : '新建发运订单'" width="980px">
    <el-form :model="createForm" label-width="118px">
      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="订单类型">
            <el-select v-model="createForm.orderType" style="width: 100%" @change="onCreateTypeChange">
              <el-option v-for="item in orderTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8"><el-form-item label="发运订单编号"><el-input v-model="createForm.shipmentOrderNo" :disabled="createMode === 'edit'" placeholder="留空自动生成" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="关联单号"><el-input v-model="createForm.relatedOrderNo" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="仓库编号"><el-input v-model="createForm.warehouseCode" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="货主"><el-input v-model="createForm.ownerCode" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="货主名称"><el-input v-model="createForm.ownerName" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="收货人编码"><el-input v-model="createForm.consigneeCode" :disabled="isCreateTransfer" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="销售单号"><el-input v-model="createForm.salesOrderNo" :disabled="isCreateTransfer" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="目标仓库"><el-input v-model="createForm.targetWarehouseCode" :disabled="!isCreateTransfer" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="预期发货"><el-date-picker v-model="createForm.expectedShipTime" type="datetime" style="width: 100%" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="要求交货"><el-date-picker v-model="createForm.requiredDeliveryTime" type="datetime" style="width: 100%" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="物流商"><el-input v-model="createForm.carrierName" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="物流单号"><el-input v-model="createForm.trackingNo" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="备注"><el-input v-model="createForm.remark" /></el-form-item></el-col>
      </el-row>
      <div class="subsection-title">
        产品明细
        <el-button link type="primary" @click="addCreateLine">新增行</el-button>
      </div>
      <el-table :data="createForm.lines" border size="small">
        <el-table-column prop="lineNo" label="行号" width="80">
          <template #default="{ row }"><el-input-number v-model="row.lineNo" :min="1" controls-position="right" /></template>
        </el-table-column>
        <el-table-column prop="productCode" label="产品编码" min-width="170">
          <template #default="{ row }"><el-input v-model="row.productCode" /></template>
        </el-table-column>
        <el-table-column prop="orderQty" label="订单数量" width="130">
          <template #default="{ row }"><el-input-number v-model="row.orderQty" :min="1" controls-position="right" /></template>
        </el-table-column>
        <el-table-column prop="sapPlant" label="SAP 工厂" width="130">
          <template #default="{ row }"><el-input v-model="row.sapPlant" /></template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="100">
          <template #default="{ row }"><el-input v-model="row.unit" /></template>
        </el-table-column>
        <el-table-column prop="snRequired" label="SN 管理" width="100">
          <template #default="{ row }"><el-switch v-model="row.snRequired" /></template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row, $index }">
            <el-button link type="primary" @click="copyCreateLine(row)">复制</el-button>
            <el-button link type="danger" :disabled="createForm.lines.length <= 1" @click="createForm.lines.splice($index, 1)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-form>
    <template #footer>
      <el-button @click="createVisible = false">取消</el-button>
      <el-button type="primary" @click="submitCreate">{{ createMode === 'edit' ? '保存' : '创建' }}</el-button>
    </template>
  </el-dialog>

  <el-drawer v-model="detailVisible" title="发运订单详情" size="78%">
    <template v-if="detail.order">
      <div class="detail-actionbar">
        <div class="detail-actionbar-title">订单作业入口</div>
        <div class="detail-actionbar-buttons">
          <el-button @click="detailVisible = false">返回</el-button>
          <el-button @click="refreshDetail">刷新</el-button>
          <el-button v-if="canEdit(detail.order)" type="primary" plain @click="openEditFromDetail">编辑</el-button>
          <el-button v-if="canAllocate(detail.order)" type="primary" @click="openAllocationFromDetail">库存分配</el-button>
          <el-button v-if="canPick(detail.order)" type="primary" @click="openPickFromDetail">拣货</el-button>
          <el-button v-if="canShip(detail.order)" type="success" @click="openShipFromDetail">发货</el-button>
          <el-button v-if="hasCancelableAllocations" type="danger" plain @click="batchCancelAllocations">取消分配</el-button>
          <el-button v-if="hasCancelablePickRecords" type="danger" plain @click="batchCancelPickRecords">取消拣货</el-button>
          <el-button v-if="hasCancelableShipmentRecords" type="danger" plain @click="batchCancelShipmentRecords">取消发货</el-button>
          <el-button v-if="canPostSap(detail.order)" type="warning" plain @click="postSapFromDetail">回传 SAP</el-button>
          <el-button v-if="canClose(detail.order)" type="warning" plain @click="closeOrderFromDetail">关闭</el-button>
          <el-button v-if="canCancel(detail.order)" type="danger" plain @click="cancelOrderFromDetail">取消订单</el-button>
        </div>
      </div>
      <el-descriptions :column="4" border>
        <el-descriptions-item label="发运订单">{{ detail.order.order_no }}</el-descriptions-item>
        <el-descriptions-item label="订单类型">{{ orderTypeLabel(detail.order.order_type || detail.order.outbound_type) }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="statusType(detail.order.status)">{{ statusLabel(detail.order.status) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="SAP 回传"><el-tag :type="sapType(detail.order.sap_post_status)">{{ sapLabel(detail.order.sap_post_status) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="仓库">{{ detail.order.warehouse_code }} / {{ detail.order.warehouse_name }}</el-descriptions-item>
        <el-descriptions-item label="货主">{{ detail.order.owner_code }} / {{ detail.order.owner_name }}</el-descriptions-item>
        <el-descriptions-item label="收货人">{{ detail.order.consignee_code || '-' }} / {{ detail.order.consignee_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="关联单号">{{ detail.order.related_order_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="计划总数">{{ detail.order.planned_qty }}</el-descriptions-item>
        <el-descriptions-item label="分配总数">{{ detail.order.allocated_qty }}</el-descriptions-item>
        <el-descriptions-item label="拣货总数">{{ detail.order.picked_qty }}</el-descriptions-item>
        <el-descriptions-item label="发货总数">{{ detail.order.shipped_qty }}</el-descriptions-item>
        <el-descriptions-item label="预期发货时间">{{ detail.order.expected_ship_time || '-' }}</el-descriptions-item>
        <el-descriptions-item label="销售单号">{{ detail.order.sales_order_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="返工单号">{{ detail.order.rework_order_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="目标仓库">{{ [detail.order.target_warehouse_code, detail.order.target_warehouse_name].filter(Boolean).join(' / ') || '-' }}</el-descriptions-item>
        <el-descriptions-item label="目标货主">{{ [detail.order.target_owner_code, detail.order.target_owner_name].filter(Boolean).join(' / ') || '-' }}</el-descriptions-item>
        <el-descriptions-item label="要求交货时间">{{ detail.order.required_delivery_time || '-' }}</el-descriptions-item>
        <el-descriptions-item label="物流商">{{ detail.order.carrier_name || detail.order.logistics_company || '-' }}</el-descriptions-item>
        <el-descriptions-item label="物流单号">{{ detail.order.tracking_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="回传说明">{{ detail.order.sap_post_result || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-tabs class="detail-tabs">
        <el-tab-pane label="行明细">
          <el-table :data="detail.lines || detail.details || []" border height="260" @selection-change="selectedDetailLines = $event">
            <el-table-column type="selection" width="44" />
            <el-table-column prop="line_no" label="行号" width="80" />
            <el-table-column prop="line_status" label="行状态" width="120">
              <template #default="{ row }"><el-tag :type="statusType(row.line_status || row.status)" size="small">{{ statusLabel(row.line_status || row.status) }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="product_code" label="产品编码" width="170" />
            <el-table-column prop="product_description" label="产品描述" min-width="190">
              <template #default="{ row }">{{ row.product_description || row.product_name }}</template>
            </el-table-column>
            <el-table-column label="货主" width="100">
              <template #default>{{ detail.order.owner_code || '-' }}</template>
            </el-table-column>
            <el-table-column prop="order_qty" label="订单数量" width="90" />
            <el-table-column prop="allocated_qty" label="分配" width="80" />
            <el-table-column label="待分配" width="90">
              <template #default="{ row }">{{ pendingAllocateQty(row) }}</template>
            </el-table-column>
            <el-table-column prop="picked_qty" label="拣货" width="80" />
            <el-table-column prop="shipped_qty" label="发货" width="80" />
            <el-table-column label="待拣货" width="90">
              <template #default="{ row }">{{ remainingPickQty(row) }}</template>
            </el-table-column>
            <el-table-column label="待发货" width="90">
              <template #default="{ row }">{{ remainingShipQty(row) }}</template>
            </el-table-column>
            <el-table-column label="可操作" width="90">
              <template #default="{ row }">{{ operableQty(row) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="分配记录">
          <div class="record-toolbar">
            <span>已选 {{ selectedAllocations.length }} 条分配记录</span>
            <el-button type="danger" plain :disabled="!selectedAllocations.length" @click="batchCancelAllocations">批量取消分配</el-button>
          </div>
          <el-table :data="detail.allocations || []" border height="260" @selection-change="selectedAllocations = $event">
            <el-table-column type="selection" width="44" :selectable="canCancelAllocationRecord" />
            <el-table-column prop="allocation_no" label="分配记录" width="190" />
            <el-table-column prop="line_no" label="行号" width="80" />
            <el-table-column prop="product_code" label="产品编码" width="160" />
            <el-table-column prop="product_name" label="产品描述" width="180" show-overflow-tooltip />
            <el-table-column prop="owner_code" label="货主" width="100" />
            <el-table-column prop="location_code" label="库位" width="120" />
            <el-table-column prop="pallet_code" label="托盘码" width="130" show-overflow-tooltip />
            <el-table-column prop="box_code" label="箱码" width="130" show-overflow-tooltip />
            <el-table-column prop="sn_code" label="SN" width="170" />
            <el-table-column prop="allocated_qty" label="数量" width="80" />
            <el-table-column prop="allocation_mode" label="模式" width="110" />
            <el-table-column prop="allocation_status" label="状态" width="120" />
            <el-table-column prop="created_at" label="创建时间" width="170" show-overflow-tooltip />
            <el-table-column label="操作" width="110">
              <template #default="{ row }">
                <el-button v-if="canCancelAllocationRecord(row)" link type="danger" @click="cancelAllocationRecord(row)">取消分配</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="拣货记录">
          <div class="record-toolbar">
            <span>已选 {{ selectedPickRecords.length }} 条拣货记录</span>
            <el-button type="danger" plain :disabled="!selectedPickRecords.length" @click="batchCancelPickRecords">批量取消拣货</el-button>
          </div>
          <el-table :data="detail.pickingRecords || []" border height="240" @selection-change="selectedPickRecords = $event">
            <el-table-column type="selection" width="44" :selectable="canCancelPickRecord" />
            <el-table-column prop="task_no" label="任务号" width="180" />
            <el-table-column prop="line_no" label="行号" width="80" />
            <el-table-column prop="product_code" label="产品编码" width="160" />
            <el-table-column prop="product_name" label="产品描述" width="180" show-overflow-tooltip />
            <el-table-column prop="owner_code" label="货主" width="100" />
            <el-table-column prop="location_code" label="库位" width="120" />
            <el-table-column prop="pallet_code" label="托盘码" width="130" show-overflow-tooltip />
            <el-table-column prop="box_code" label="箱码" width="130" show-overflow-tooltip />
            <el-table-column prop="sn_code" label="SN/数量标识" width="180" />
            <el-table-column label="拣货数量" width="90">
              <template #default="{ row }">{{ row.picked_qty || 1 }}</template>
            </el-table-column>
            <el-table-column prop="pick_mode" label="拣货模式" width="130">
              <template #default="{ row }">{{ pickModeLabel(row.pick_mode || row.allocation_mode) }}</template>
            </el-table-column>
            <el-table-column prop="result" label="拣货状态" width="110" />
            <el-table-column prop="picker" label="拣货人" width="100" />
            <el-table-column prop="created_at" label="时间" />
            <el-table-column label="操作" width="110">
              <template #default="{ row }">
                <el-button v-if="canCancelPickRecord(row)" link type="danger" @click="cancelPickRecord(row)">取消拣货</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="发货记录">
          <div class="record-toolbar">
            <span>已选 {{ selectedShipments.length }} 条发货记录</span>
            <el-button type="danger" plain :disabled="!selectedShipments.length" @click="batchCancelShipmentRecords">批量取消发货</el-button>
          </div>
          <el-table :data="detail.shipments || []" border height="240" @selection-change="selectedShipments = $event">
            <el-table-column type="selection" width="44" :selectable="canCancelShipmentRecord" />
            <el-table-column prop="shipment_no" label="发货批次" width="190" />
            <el-table-column prop="line_no" label="行号" width="80" />
            <el-table-column prop="product_code" label="产品编码" width="160" />
            <el-table-column prop="product_name" label="产品描述" width="180" show-overflow-tooltip />
            <el-table-column prop="owner_code" label="货主" width="100" />
            <el-table-column prop="pallet_code" label="托盘码" width="130" show-overflow-tooltip />
            <el-table-column prop="box_code" label="箱码" width="130" show-overflow-tooltip />
            <el-table-column prop="sn_code" label="SN" width="170" />
            <el-table-column prop="carrier" label="物流商" width="120" />
            <el-table-column prop="tracking_no" label="物流单号" width="150" />
            <el-table-column prop="shipped_qty" label="数量" width="90" />
            <el-table-column prop="shipment_status" label="发货状态" width="110" />
            <el-table-column prop="sap_post_status" label="SAP" width="110" />
            <el-table-column prop="sap_material_doc_no" label="SAP 凭证" width="150" show-overflow-tooltip />
            <el-table-column prop="ship_time" label="发运时间" />
            <el-table-column prop="shipper" label="发货人" width="100" />
            <el-table-column label="操作" width="110">
              <template #default="{ row }">
                <el-button v-if="canCancelShipmentRecord(row)" link type="danger" @click="cancelShipmentRecord(row)">取消发货</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="SAP/接口日志">
          <el-table :data="detail.interfaceLogs || []" border height="260">
            <el-table-column prop="interface_name" label="接口" width="180" />
            <el-table-column prop="source_system" label="来源" width="90" />
            <el-table-column prop="target_system" label="目标" width="90" />
            <el-table-column prop="status" label="状态" width="100" />
            <el-table-column prop="error_message" label="失败原因" min-width="180" />
            <el-table-column prop="created_at" label="时间" width="170" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="操作日志">
          <el-table :data="detail.operationLogs || []" border height="240">
            <el-table-column prop="created_at" label="操作时间" width="170" />
            <el-table-column prop="operator" label="操作人" width="100" />
            <el-table-column prop="action" label="动作" width="170" />
            <el-table-column prop="result" label="结果" width="90" />
            <el-table-column prop="message" label="说明" />
            <el-table-column prop="business_doc_no" label="关联单号" width="170" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </template>
  </el-drawer>

  <el-drawer v-model="allocationVisible" title="库存分配" size="76%">
    <template v-if="allocationData.order">
      <el-descriptions :column="4" border>
        <el-descriptions-item label="发运订单">{{ allocationData.order.order_no }}</el-descriptions-item>
        <el-descriptions-item label="订单数量">{{ allocationData.order.planned_qty }}</el-descriptions-item>
        <el-descriptions-item label="已分配">{{ allocationData.order.allocated_qty }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusLabel(allocationData.order.status) }}</el-descriptions-item>
      </el-descriptions>
      <div class="action-strip">
        <el-button type="primary" @click="autoAllocate">系统自动分配 FIFO</el-button>
        <el-button type="success" @click="manualAllocate">人工指定分配</el-button>
        <el-button type="danger" plain @click="releaseAllocation">取消未拣货分配</el-button>
      </div>
      <el-table :data="allocationLines" border size="small" class="mini-form">
        <el-table-column prop="line_no" label="行号" width="70" />
        <el-table-column prop="product_code" label="产品编码" width="160" show-overflow-tooltip />
        <el-table-column prop="product_description" label="产品描述" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.product_description || row.product_name }}</template>
        </el-table-column>
        <el-table-column label="货主" width="110">
          <template #default>{{ allocationData.order.owner_code || '-' }}</template>
        </el-table-column>
        <el-table-column prop="order_qty" label="订单数量" width="90" align="right" />
        <el-table-column prop="allocated_qty" label="已分配" width="90" align="right" />
        <el-table-column label="待分配" width="90" align="right">
          <template #default="{ row }">{{ pendingAllocateQty(row) }}</template>
        </el-table-column>
        <el-table-column prop="picked_qty" label="已拣货" width="90" align="right" />
        <el-table-column prop="shipped_qty" label="已发货" width="90" align="right" />
        <el-table-column label="可操作" width="90" align="right">
          <template #default="{ row }">{{ operableQty(row) }}</template>
        </el-table-column>
        <el-table-column prop="sap_plant" label="SAP 工厂" width="100" />
        <el-table-column prop="unit" label="单位" width="70" />
        <el-table-column prop="line_status" label="行状态" width="110">
          <template #default="{ row }"><el-tag :type="statusType(row.line_status || row.status)" size="small">{{ statusLabel(row.line_status || row.status) }}</el-tag></template>
        </el-table-column>
      </el-table>
      <el-form :model="manualForm" inline class="mini-form">
        <el-form-item label="行明细">
          <el-select v-model="manualForm.lineId" placeholder="选择行" style="width: 260px">
            <el-option v-for="line in allocationLines" :key="line.line_id || line.id" :label="`${line.line_no} / ${line.product_code}`" :value="line.line_id || line.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="非 SN 数量">
          <el-input-number v-model="manualForm.quantity" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="库位">
          <el-input v-model="manualForm.locationCode" placeholder="非 SN 指定库位" />
        </el-form-item>
      </el-form>
      <el-tabs>
        <el-tab-pane label="可用库存 / 人工选择">
          <el-table :data="allocationData.availableInventory || []" border height="310" @selection-change="candidateSelection = $event">
            <el-table-column type="selection" width="44" :selectable="selectableCandidate" />
            <el-table-column prop="line_no" label="行号" width="80" />
            <el-table-column prop="owner_code" label="货主" width="100" />
            <el-table-column prop="owner_name" label="货主名称" width="150" show-overflow-tooltip />
            <el-table-column prop="warehouse_code" label="仓库编码" width="140" />
            <el-table-column prop="warehouse_name" label="仓库名称" width="150" show-overflow-tooltip />
            <el-table-column prop="product_code" label="产品" width="160" />
            <el-table-column prop="product_name" label="产品名称" width="160" show-overflow-tooltip />
            <el-table-column prop="location_code" label="库位" width="120" />
            <el-table-column prop="pallet_code" label="托盘" width="130" />
            <el-table-column prop="box_code" label="箱码" width="130" />
            <el-table-column prop="sn_code" label="SN" width="170" />
            <el-table-column prop="inventory_status" label="库存状态" width="110" />
            <el-table-column prop="quality_status" label="质量" width="100" />
            <el-table-column prop="available_qty" label="可用数量" width="100" />
            <el-table-column prop="inbound_date" label="入库日期" width="120" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="推荐分配">
          <el-table :data="allocationData.recommendedInventory || []" border height="260">
            <el-table-column prop="line_no" label="行号" width="80" />
            <el-table-column prop="owner_code" label="货主" width="100" />
            <el-table-column prop="owner_name" label="货主名称" width="150" show-overflow-tooltip />
            <el-table-column prop="product_code" label="产品" width="160" />
            <el-table-column prop="product_name" label="产品名称" width="160" show-overflow-tooltip />
            <el-table-column prop="location_code" label="库位" width="120" />
            <el-table-column prop="sn_code" label="SN" width="170" />
            <el-table-column prop="available_qty" label="可用数量" width="100" />
            <el-table-column prop="inbound_date" label="入库日期" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="分配结果">
          <el-table :data="allocationData.allocations || []" border height="260">
            <el-table-column prop="allocation_no" label="分配记录" width="190" />
            <el-table-column prop="owner_code" label="货主" width="100" />
            <el-table-column prop="product_code" label="产品" width="160" />
            <el-table-column prop="sn_code" label="SN" width="170" />
            <el-table-column prop="allocated_qty" label="数量" width="90" />
            <el-table-column prop="allocation_mode" label="模式" width="110" />
            <el-table-column prop="allocation_status" label="状态" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </template>
  </el-drawer>

  <el-dialog v-model="pickVisible" title="拣货" width="760px">
    <el-alert type="info" show-icon :closable="false" title="有分配记录时必须按分配结果拣货；无分配记录时可直接扫描 SN 或按非 SN 数量拣货。" />
    <el-form :model="pickForm" label-width="110px" class="dialog-form">
      <el-form-item label="行明细">
        <el-select v-model="pickForm.lineId" style="width: 100%" @change="onPickLineChange">
          <el-option v-for="line in pickLines" :key="line.line_id || line.id" :label="`${line.line_no} / ${line.product_code} / 剩余 ${remainingPickQty(line)}`" :value="line.line_id || line.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="拣货模式">
        <el-radio-group v-model="pickForm.pickMode">
          <el-radio-button label="ALLOCATED">按分配结果</el-radio-button>
          <el-radio-button label="DIRECT">不分配直接拣货</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-alert type="success" show-icon :closable="false" :title="pickModeText" class="mode-alert" />
      <div v-if="pickForm.pickMode === 'ALLOCATED'" class="pick-list-panel">
        <div class="record-toolbar">
          <span>分配明细清单</span>
          <el-button size="small" @click="printPickingList">打印拣货清单</el-button>
        </div>
        <el-table :data="currentPickAllocationRows" border size="small" max-height="220">
          <el-table-column prop="line_no" label="行号" width="70" />
          <el-table-column prop="product_code" label="产品编码" width="150" />
          <el-table-column prop="product_name" label="产品描述" width="170" show-overflow-tooltip />
          <el-table-column prop="owner_code" label="货主" width="90" />
          <el-table-column prop="location_code" label="库位" width="110" />
          <el-table-column prop="pallet_code" label="托盘码" width="120" show-overflow-tooltip />
          <el-table-column prop="box_code" label="箱码" width="120" show-overflow-tooltip />
          <el-table-column prop="sn_code" label="SN" width="160" show-overflow-tooltip />
          <el-table-column prop="allocated_qty" label="分配数量" width="90" />
          <el-table-column label="已拣货" width="90">
            <template #default="{ row }">{{ ['PICKED', 'REVIEWED', 'SHIPPED'].includes(row.allocation_status) ? row.allocated_qty || 1 : 0 }}</template>
          </el-table-column>
          <el-table-column label="待拣货" width="90">
            <template #default="{ row }">{{ row.allocation_status === 'ALLOCATED' ? row.allocated_qty || 1 : 0 }}</template>
          </el-table-column>
          <el-table-column prop="allocation_mode" label="分配方式" width="120" />
        </el-table>
      </div>
      <el-form-item v-if="currentPickLine?.sn_required" label="扫码 SN">
        <el-input v-model="pickForm.scanText" class="scan-box" type="textarea" :rows="7" placeholder="扫描或粘贴 SN，回车、空格、逗号均可分隔" />
      </el-form-item>
      <template v-else>
        <el-form-item label="拣货数量"><el-input-number v-model="pickForm.quantity" :min="1" controls-position="right" /></el-form-item>
        <el-form-item label="库位"><el-input v-model="pickForm.locationCode" placeholder="未分配直接拣货时填写库位" /></el-form-item>
      </template>
    </el-form>
    <template #footer>
      <el-button @click="pickVisible = false">取消</el-button>
      <el-button type="primary" @click="submitPick">确认拣货</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="shipVisible" title="发运确认" width="760px">
    <el-alert type="info" show-icon :closable="false" title="整单发运默认带出全部可发行；按行发运可选择一行或多行并分别维护本次发货数。" />
    <el-form :model="shipForm" label-width="110px" class="dialog-form">
      <el-form-item label="发运方式">
        <el-radio-group v-model="shipForm.shipMode" @change="onShipModeChange">
          <el-radio value="ORDER">整单发运</el-radio>
          <el-radio value="LINE">按行发运</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="shipForm.shipMode === 'LINE'" label="选择明细行">
        <el-select v-model="shipForm.selectedLineIds" multiple collapse-tags collapse-tags-tooltip placeholder="请选择可发运明细行" style="width: 100%" @change="onShipSelectedLinesChange">
          <el-option v-for="line in shipLines" :key="line.line_id || line.id" :disabled="remainingShipQty(line) <= 0" :label="`${line.line_no} / ${line.product_code} / 可发 ${remainingShipQty(line)}`" :value="line.line_id || line.id" />
        </el-select>
      </el-form-item>
      <el-table :data="shipForm.lines" size="small" border class="ship-line-table">
        <el-table-column label="发运" width="70" align="center">
          <template #default="{ row }">
            <el-checkbox v-model="row.selected" :disabled="!row.availableShipQty" @change="syncShipQtyFromLines" />
          </template>
        </el-table-column>
        <el-table-column prop="lineNo" label="行号" width="80" />
        <el-table-column prop="productCode" label="产品编码" min-width="160" show-overflow-tooltip />
        <el-table-column label="SN" width="70">
          <template #default="{ row }">{{ row.snRequired ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column prop="orderQty" label="订单数" width="90" />
        <el-table-column prop="pickedQty" label="已拣" width="90" />
        <el-table-column prop="shippedQty" label="已发" width="90" />
        <el-table-column prop="availableShipQty" label="可发" width="90" />
        <el-table-column label="本次发货" width="150">
          <template #default="{ row }">
            <el-input-number v-model="row.thisShipQty" :min="0" :max="row.availableShipQty" :disabled="!row.selected || !row.availableShipQty" controls-position="right" @change="syncShipQtyFromLines" />
          </template>
        </el-table-column>
      </el-table>
      <el-form-item label="本次发货数"><el-input-number v-model="shipForm.shipQty" :min="0" controls-position="right" disabled /></el-form-item>
      <el-form-item label="物流商"><el-input v-model="shipForm.carrierName" /></el-form-item>
      <el-form-item label="物流单号"><el-input v-model="shipForm.trackingNo" /></el-form-item>
      <el-form-item label="发运人"><el-input v-model="shipForm.shipper" /></el-form-item>
      <el-form-item label="备注"><el-input v-model="shipForm.remark" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="shipVisible = false">取消</el-button>
      <el-button type="success" @click="submitShip">确认发运</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { outboundService } from '../../api/services'
import { OUTBOUND_ORDER_STATUS_DEFINITIONS, SAP_POST_STATUS_DEFINITIONS } from '../../constants/orderStatus'
import {
  canAllocateOutboundOrder,
  canCancelAllocationOutboundOrder,
  canCancelOutboundOrder,
  canCancelPickOutboundOrder,
  canCancelShipOutboundOrder,
  canCloseOutboundOrder,
  canEditOutboundOrder,
  canPickOutboundOrder,
  canPostSapOutboundOrder,
  canShipOutboundOrder
} from '../../constants/orderActionPermissions'
import { sapStatusLabel as i18nSapStatusLabel, statusLabel as i18nStatusLabel, useI18n } from '../../i18n'
import { downloadTextFile, importResultHtml, parseSectionedCsv, readTextFile } from '../../utils/fileTransfer'

type Row = Record<string, any>

const loading = ref(false)
const rows = ref<Row[]>([])
const total = ref(0)
const query = reactive<Row>({ pageNum: 1, pageSize: 10 })
const selectedRows = ref<Row[]>([])

const createVisible = ref(false)
const createMode = ref<'create' | 'edit'>('create')
const editingOrderId = ref<number | null>(null)
const detailVisible = ref(false)
const allocationVisible = ref(false)
const pickVisible = ref(false)
const shipVisible = ref(false)
const outboundImportInput = ref<HTMLInputElement>()

const detail = ref<Row>({})
const allocationData = ref<Row>({})
const candidateSelection = ref<Row[]>([])
const currentOrder = ref<Row | null>(null)
const selectedDetailLines = ref<Row[]>([])
const selectedAllocations = ref<Row[]>([])
const selectedPickRecords = ref<Row[]>([])
const selectedShipments = ref<Row[]>([])

const createForm = reactive<Row>({ lines: [] })
const manualForm = reactive<Row>({ quantity: 0 })
const pickForm = reactive<Row>({ pickMode: 'ALLOCATED', quantity: 1 })
const shipForm = reactive<Row>({ shipMode: 'ORDER', selectedLineIds: [], shipQty: 0, lines: [] })
const pickLines = ref<Row[]>([])
const pickAllocations = ref<Row[]>([])
const shipLines = ref<Row[]>([])
const { t } = useI18n()

const orderTypeOptions = [
  ['SALES_OUTBOUND', '销售出库'],
  ['AFTERSALE_OUTBOUND', '售后出库'],
  ['WAREHOUSE_TRANSFER', '仓库调拨'],
  ['STO_OUTBOUND', 'STO 出库'],
  ['WORK_ORDER_ISSUE', '工单领料出库'],
  ['MATERIAL_REQUISITION', '领料单出库'],
  ['REWORK_OUTBOUND', '返工出库'],
  ['RETURN_OUTBOUND', '退货出库'],
  ['OTHER_OUTBOUND', '其他出库']
].map(([value, label]) => ({ value, label }))

const statusOptions = computed(() => OUTBOUND_ORDER_STATUS_DEFINITIONS.map((item) => ({
  value: item.value,
  label: statusOptionLabel(i18nStatusLabel(item.value), item.legacy)
})))
const sapStatusOptions = computed(() => SAP_POST_STATUS_DEFINITIONS.map((item) => ({
  value: item.value,
  label: statusOptionLabel(i18nSapStatusLabel(item.value), item.legacy)
})))

const isCreateTransfer = computed(() => ['WAREHOUSE_TRANSFER', 'STO_OUTBOUND'].includes(createForm.orderType))
const allocationLines = computed(() => allocationData.value.lines || allocationData.value.details || [])
const currentPickLine = computed(() => pickLines.value.find((line) => Number(line.line_id || line.id) === Number(pickForm.lineId)))
const hasPickAllocation = computed(() => pickAllocations.value.some((row) => ['ALLOCATED', 'PICKED', 'REVIEWED'].includes(row.allocation_status)))
const pickModeText = computed(() => hasPickAllocation.value ? '拣货模式：按分配结果拣货' : '拣货模式：不分配直接拣货')
const currentPickAllocationRows = computed(() => pickAllocations.value.filter((row) => {
  const lineId = Number(pickForm.lineId || 0)
  return ['ALLOCATED', 'PICKED', 'REVIEWED'].includes(row.allocation_status)
    && (!lineId || Number(row.outbound_detail_id || row.line_id || row.lineId) === lineId)
}))
const hasCancelableAllocations = computed(() => (detail.value.allocations || []).some((row: Row) => canCancelAllocationRecord(row)))
const hasCancelablePickRecords = computed(() => (detail.value.pickingRecords || []).some((row: Row) => canCancelPickRecord(row)))
const hasCancelableShipmentRecords = computed(() => (detail.value.shipments || []).some((row: Row) => canCancelShipmentRecord(row)))

onMounted(load)

async function load() {
  loading.value = true
  try {
    const data = await outboundService.list({ ...query })
    rows.value = data.items || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

function search() {
  query.pageNum = 1
  load()
}

function reset() {
  Object.keys(query).forEach((key) => {
    if (!['pageNum', 'pageSize'].includes(key)) delete query[key]
  })
  query.pageNum = 1
  load()
}

function openCreate() {
  createMode.value = 'create'
  editingOrderId.value = null
  Object.assign(createForm, {
    shipmentOrderNo: '',
    orderType: 'SALES_OUTBOUND',
    sourceSystem: 'FULFILLMENT',
    relatedOrderNo: `FUL-SO-${Date.now()}`,
    salesOrderNo: `SO${Date.now()}`,
    warehouseCode: 'HZ',
    ownerCode: '3060',
    ownerName: '杭州利沃得',
    consigneeCode: 'CUST-TESLA-001',
    targetWarehouseCode: 'NB',
    expectedShipTime: new Date(),
    requiredDeliveryTime: new Date(Date.now() + 86400000),
    carrierName: '',
    trackingNo: '',
    remark: '',
    lines: [
      { lineNo: 10, productCode: 'GT3-10KD1R11004', orderQty: 3, sapPlant: '3060', unit: 'PCS', snRequired: true },
      { lineNo: 20, productCode: 'HXEDE081R10002', orderQty: 5, sapPlant: '3060', unit: 'PCS', snRequired: false }
    ]
  })
  createVisible.value = true
}

function onCreateTypeChange() {
  if (isCreateTransfer.value) {
    createForm.consigneeCode = ''
    createForm.salesOrderNo = ''
    createForm.relatedOrderNo = createForm.orderType === 'STO_OUTBOUND' ? `STO${Date.now()}` : `TR${Date.now()}`
  } else {
    createForm.consigneeCode = createForm.consigneeCode || 'CUST-TESLA-001'
    createForm.salesOrderNo = createForm.salesOrderNo || `SO${Date.now()}`
  }
}

function addCreateLine() {
  createForm.lines.push({ lineNo: (createForm.lines.length + 1) * 10, productCode: 'GT3-10KD1R11004', orderQty: 1, sapPlant: '3060', unit: 'PCS', snRequired: true })
}

function copyCreateLine(row: Row) {
  createForm.lines.push({ ...row, lineNo: (createForm.lines.length + 1) * 10 })
}

async function submitCreate() {
  if (createMode.value === 'edit' && editingOrderId.value) {
    await outboundService.update(editingOrderId.value, { ...createForm, operator: 'planner' })
    ElMessage.success('发运订单已保存')
  } else {
    await outboundService.create({ ...createForm })
    ElMessage.success('发运订单已创建')
  }
  createVisible.value = false
  await refreshAfterOrderAction(editingOrderId.value || undefined)
}

async function openEdit(row: Row) {
  const data = await outboundService.detail(Number(row.id))
  if (!canEdit(data.order || row)) {
    ElMessage.warning('仅创建态且未分配、未拣货、未发货、未回传 SAP 成功的发运订单允许编辑')
    return
  }
  const order = data.order || row
  createMode.value = 'edit'
  editingOrderId.value = Number(order.id)
  Object.assign(createForm, {
    shipmentOrderNo: order.shipment_order_no || order.order_no,
    orderType: order.order_type || order.outbound_type || 'SALES_OUTBOUND',
    sourceSystem: order.source_system || 'FULFILLMENT',
    relatedOrderNo: order.related_order_no || order.source_order_no || '',
    salesOrderNo: order.sales_order_no || '',
    warehouseCode: order.warehouse_code || 'HZ',
    ownerCode: order.owner_code || '3060',
    ownerName: order.owner_name || '',
    consigneeCode: order.consignee_code || order.customer_code || '',
    targetWarehouseCode: order.target_warehouse_code || '',
    expectedShipTime: order.expected_ship_time || '',
    requiredDeliveryTime: order.required_delivery_time || '',
    carrierName: order.carrier_name || order.logistics_company || '',
    trackingNo: order.tracking_no || '',
    remark: order.remark || '',
    lines: (data.lines || data.details || []).map((line: Row) => ({
      lineNo: Number(line.line_no || line.lineNo || 0),
      productCode: line.product_code || '',
      orderQty: Number(line.order_qty || line.planned_qty || 1),
      sapPlant: line.sap_plant || order.owner_code || '3060',
      unit: line.unit || 'PCS',
      snRequired: Number(line.sn_required || line.sn_managed || 0) === 1
    }))
  })
  if (!createForm.lines.length) addCreateLine()
  createVisible.value = true
}

async function openEditFromDetail() {
  if (detail.value.order) await openEdit(detail.value.order)
}

async function openDetail(row: Row) {
  detail.value = await outboundService.detail(Number(row.id))
  selectedDetailLines.value = []
  selectedAllocations.value = []
  selectedPickRecords.value = []
  selectedShipments.value = []
  detailVisible.value = true
}

async function refreshDetail() {
  if (!detail.value.order) return
  detail.value = await outboundService.detail(Number(detail.value.order.id))
  selectedDetailLines.value = []
  selectedAllocations.value = []
  selectedPickRecords.value = []
  selectedShipments.value = []
}

async function refreshAfterOrderAction(orderId?: number) {
  await load()
  if (detailVisible.value && detail.value.order && (!orderId || Number(detail.value.order.id) === Number(orderId))) {
    await refreshDetail()
  }
}

function detailOrderRow() {
  return detail.value.order || null
}

async function openAllocationFromDetail() {
  const order = detailOrderRow()
  if (order) await openAllocation(order)
}

async function openPickFromDetail() {
  const order = detailOrderRow()
  if (order) await openPick(order)
}

async function openShipFromDetail() {
  const order = detailOrderRow()
  if (order) await openShip(order)
}

async function openAllocation(row: Row, line?: Row) {
  currentOrder.value = row
  candidateSelection.value = []
  allocationData.value = await outboundService.allocationView(Number(row.id))
  if (line) manualForm.lineId = line.line_id || line.id
  else manualForm.lineId = allocationLines.value[0]?.line_id || allocationLines.value[0]?.id
  manualForm.quantity = 0
  manualForm.locationCode = ''
  allocationVisible.value = true
}

async function autoAllocate() {
  if (!currentOrder.value) return
  await outboundService.allocateAuto(Number(currentOrder.value.id), { operator: 'wh_admin' })
  ElMessage.success('系统自动分配已执行')
  allocationData.value = await outboundService.allocationView(Number(currentOrder.value.id))
  await refreshAfterOrderAction(Number(currentOrder.value.id))
}

async function manualAllocate() {
  if (!currentOrder.value) return
  const serialNumbers = candidateSelection.value.map((row) => row.sn_code).filter(Boolean)
  await outboundService.allocateManual(Number(currentOrder.value.id), {
    lineId: manualForm.lineId,
    serialNumbers,
    quantity: manualForm.quantity,
    locationCode: manualForm.locationCode,
    operator: 'wh_admin'
  })
  ElMessage.success('人工指定分配完成')
  candidateSelection.value = []
  allocationData.value = await outboundService.allocationView(Number(currentOrder.value.id))
  await refreshAfterOrderAction(Number(currentOrder.value.id))
}

async function releaseAllocation() {
  if (!currentOrder.value) return
  await outboundService.releaseAllocation(Number(currentOrder.value.id), { operator: 'wh_admin' })
  ElMessage.success('未拣货分配已取消')
  allocationData.value = await outboundService.allocationView(Number(currentOrder.value.id))
  await refreshAfterOrderAction(Number(currentOrder.value.id))
}

async function bulkAllocate() {
  for (const row of selectedRows.value) {
    await outboundService.allocateAuto(Number(row.id), { operator: 'wh_admin' })
  }
  ElMessage.success('选中订单自动分配已执行')
  await load()
}

async function openPick(row: Row, line?: Row) {
  currentOrder.value = row
  const data = await outboundService.detail(Number(row.id))
  pickLines.value = data.lines || data.details || []
  pickAllocations.value = data.allocations || []
  pickForm.lineId = line ? (line.line_id || line.id) : (pickLines.value[0]?.line_id || pickLines.value[0]?.id)
  pickForm.pickMode = pickAllocations.value.some((item) => ['ALLOCATED', 'PICKED', 'REVIEWED'].includes(item.allocation_status)) ? 'ALLOCATED' : 'DIRECT'
  pickForm.scanText = ''
  pickForm.quantity = 1
  pickForm.locationCode = ''
  pickVisible.value = true
}

function onPickLineChange() {
  pickForm.scanText = ''
  pickForm.quantity = 1
}

async function submitPick() {
  if (!currentOrder.value) return
  await outboundService.pick(Number(currentOrder.value.id), {
    lineId: pickForm.lineId,
    pickMode: pickForm.pickMode,
    serialNumbers: parseLines(pickForm.scanText),
    quantity: pickForm.quantity,
    locationCode: pickForm.locationCode,
    operator: 'wh_admin'
  })
  ElMessage.success('拣货完成')
  pickVisible.value = false
  await refreshAfterOrderAction(Number(currentOrder.value.id))
}

async function openShip(row: Row, line?: Row) {
  currentOrder.value = row
  const data = await outboundService.detail(Number(row.id))
  shipLines.value = data.lines || data.details || []
  const selectedLineId = line ? Number(line.line_id || line.id) : 0
  shipForm.shipMode = selectedLineId ? 'LINE' : 'ORDER'
  shipForm.selectedLineIds = selectedLineId ? [selectedLineId] : []
  shipForm.lines = buildShipLineForms(shipLines.value, selectedLineId ? [selectedLineId] : undefined)
  syncShipQtyFromLines()
  shipForm.carrierName = row.carrier_name || 'SF'
  shipForm.trackingNo = row.tracking_no || `SF${Date.now()}`
  shipForm.shipper = 'logistics'
  shipForm.remark = ''
  shipVisible.value = true
}

async function submitShip() {
  if (!currentOrder.value) return
  syncShipQtyFromLines()
  const lineShipments = (shipForm.lines || [])
    .filter((line: Row) => line.selected && Number(line.thisShipQty || 0) > 0)
    .map((line: Row) => ({ lineId: line.lineId, shipQty: Number(line.thisShipQty || 0) }))
  if (!lineShipments.length) {
    ElMessage.warning('请选择至少一行可发运明细')
    return
  }
  await outboundService.ship(Number(currentOrder.value.id), { ...shipForm, lineShipments, operator: 'logistics' })
  ElMessage.success('发运确认完成，SAP 将在关闭订单时回传')
  shipVisible.value = false
  await refreshAfterOrderAction(Number(currentOrder.value.id))
}

async function cancelPickRecord(row: Row) {
  if (!detail.value.order) return
  await ElMessageBox.confirm('取消后该拣货记录会回退为已分配或在库状态，是否继续？', '取消拣货', { type: 'warning' })
  detail.value = await outboundService.cancelPick(Number(detail.value.order.id), Number(row.id), { operator: 'wh_admin', reason: '页面取消拣货' })
  ElMessage.success('拣货已取消')
  await refreshAfterOrderAction(Number(detail.value.order.id))
}

async function cancelShipmentRecord(row: Row) {
  if (!detail.value.order) return
  await ElMessageBox.confirm('取消后该发运批次会回退为已拣货未发运，是否继续？', '取消发货', { type: 'warning' })
  detail.value = await outboundService.cancelShipment(Number(detail.value.order.id), Number(row.id), { operator: 'logistics', reason: '页面取消发货' })
  ElMessage.success('发货已取消')
  await refreshAfterOrderAction(Number(detail.value.order.id))
}

async function cancelAllocationRecord(row: Row) {
  selectedAllocations.value = [row]
  await batchCancelAllocations()
}

async function batchCancelAllocations() {
  if (!detail.value.order) return
  const rows = selectedRowsForAction(detail.value.allocations || [], selectedAllocations.value, canCancelAllocationRecord)
  if (!rows.length) {
    ElMessage.warning('请选择可取消的未拣货分配记录')
    return
  }
  await ElMessageBox.confirm(`确认取消 ${rows.length} 条未拣货分配记录？`, '批量取消分配', { type: 'warning' })
  const result = await outboundService.cancelAllocations(Number(detail.value.order.id), {
    allocationIds: rows.map((row) => Number(row.id)),
    operator: 'wh_admin',
    reason: '详情页批量取消分配'
  })
  showBatchResult('取消分配', result)
  await refreshAfterOrderAction(Number(detail.value.order.id))
}

async function batchCancelPickRecords() {
  if (!detail.value.order) return
  const rows = selectedRowsForAction(detail.value.pickingRecords || [], selectedPickRecords.value, canCancelPickRecord)
  if (!rows.length) {
    ElMessage.warning('请选择可取消的未发货拣货记录')
    return
  }
  await ElMessageBox.confirm(`确认取消 ${rows.length} 条未发货拣货记录？`, '批量取消拣货', { type: 'warning' })
  const result = await outboundService.cancelPicks(Number(detail.value.order.id), {
    pickIds: rows.map((row) => Number(row.id)),
    operator: 'wh_admin',
    reason: '详情页批量取消拣货'
  })
  showBatchResult('取消拣货', result)
  await refreshAfterOrderAction(Number(detail.value.order.id))
}

async function batchCancelShipmentRecords() {
  if (!detail.value.order) return
  const rows = selectedRowsForAction(detail.value.shipments || [], selectedShipments.value, canCancelShipmentRecord)
  if (!rows.length) {
    ElMessage.warning('请选择可取消的未 SAP 成功发货记录')
    return
  }
  await ElMessageBox.confirm(`确认取消 ${rows.length} 条未 SAP 成功发货记录？`, '批量取消发货', { type: 'warning' })
  const result = await outboundService.cancelShipments(Number(detail.value.order.id), {
    shipmentIds: rows.map((row) => Number(row.id)),
    operator: 'logistics',
    reason: '详情页批量取消发货'
  })
  showBatchResult('取消发货', result)
  await refreshAfterOrderAction(Number(detail.value.order.id))
}

function selectedRowsForAction(allRows: Row[], selected: Row[], predicate: (row: Row) => boolean) {
  const lineIds = selectedDetailLineIds()
  const baseRows = selected.length
    ? selected
    : lineIds.length
      ? allRows.filter((row) => lineIds.includes(Number(row.outbound_detail_id || row.line_id || row.lineId)))
      : allRows
  return baseRows.filter(predicate)
}

function selectedDetailLineIds() {
  return selectedDetailLines.value.map((row) => Number(row.line_id || row.id)).filter(Boolean)
}

function showBatchResult(label: string, result: Row) {
  const successCount = Number(result.successCount || result.success_count || 0)
  const failedItems = result.failedItems || result.errors || []
  if (failedItems.length) {
    ElMessage.warning(`${label}完成：成功 ${successCount} 条，失败 ${failedItems.length} 条`)
    return
  }
  ElMessage.success(`${label}完成：成功 ${successCount || '全部'} 条`)
}

async function postSapFromDetail() {
  if (!detail.value.order) return
  await postSap(detail.value.order)
  await refreshDetail()
}

async function closeOrderFromDetail() {
  if (!detail.value.order) return
  await closeOrder(detail.value.order)
  detailVisible.value = false
}

async function cancelOrderFromDetail() {
  if (!detail.value.order) return
  await cancelOrder(detail.value.order)
  detailVisible.value = false
}

async function postSap(row: Row) {
  await outboundService.postSap(Number(row.id), { operator: 'logistics' })
  ElMessage.success('SAP 回传已执行')
  await load()
}

async function retrySelectedSap() {
  const rows = selectedRows.value.filter(canPostSap)
  if (!rows.length) {
    ElMessage.warning('请选择已关闭且 SAP 未回传或回传失败的发运订单')
    return
  }
  const result = await outboundService.retrySapPost({ orderIds: rows.map((row) => Number(row.id)) })
  showBatchResult('重传 SAP', result)
  await load()
}

async function downloadOutboundImportTemplate() {
  downloadTextFile(await outboundService.importTemplate())
}

async function importOutboundRows(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const data = parseSectionedCsv(await readTextFile(file))
    const result = await outboundService.importRows(data.headers, data.lines)
    await ElMessageBox.alert(importResultHtml(result), '发运订单导入结果', { dangerouslyUseHTMLString: true, confirmButtonText: '知道了' })
    await load()
  } finally {
    input.value = ''
  }
}

function outboundCloseLines(row: Row) {
  return Array.isArray(row.lines) ? row.lines as Row[] : []
}

function outboundClosePlannedQty(row: Row) {
  return Number(row.order_qty ?? row.orderQty ?? row.planned_qty ?? row.plannedQty ?? 0)
}

function outboundCloseShippedQty(row: Row) {
  return Number(row.shipped_qty ?? row.shippedQty ?? 0)
}

function isOutboundFullyShipped(row: Row) {
  if (String(row.status || '').toUpperCase() === 'SHIPPED') return true
  const lines = outboundCloseLines(row)
  if (lines.length) {
    return lines.every((line) => {
      const planned = outboundClosePlannedQty(line)
      return planned > 0 && outboundCloseShippedQty(line) >= planned
    })
  }
  const planned = outboundClosePlannedQty(row)
  return planned > 0 && outboundCloseShippedQty(row) >= planned
}

function hasOutboundRemainingQty(row: Row) {
  const lines = outboundCloseLines(row)
  if (lines.length) {
    return lines.some((line) => outboundClosePlannedQty(line) - outboundCloseShippedQty(line) > 0)
  }
  return outboundClosePlannedQty(row) - outboundCloseShippedQty(row) > 0
}

function hasOutboundPartialShippedLine(row: Row) {
  return outboundCloseLines(row).some((line) => {
    const planned = outboundClosePlannedQty(line)
    const shipped = outboundCloseShippedQty(line)
    return planned > 0 && shipped > 0 && shipped < planned
  })
}

function shouldShowOutboundSplitConfirm(row: Row) {
  if (isOutboundFullyShipped(row)) return false
  return hasOutboundRemainingQty(row)
    && (String(row.status || '').toUpperCase() === 'PARTIAL_SHIPPED' || hasOutboundPartialShippedLine(row))
}

async function submitOutboundClose(row: Row, generateSplitOrder: boolean) {
  const result = await outboundService.close(Number(row.id), { operator: 'manager', generateSplitOrder })
  const splitOrderNo = result?.splitOrderNo || result?.split_order_no
  const sapStatus = result?.order?.sap_post_status
  const sapMessage = result?.order?.sap_post_result || ''
  if (sapStatus === 'FAILED') {
    ElMessage.warning(splitOrderNo
      ? `订单已关闭，已生成分单 ${splitOrderNo}，SAP 回传失败：${sapMessage || '可在列表重传'}`
      : `订单已关闭，SAP 回传失败：${sapMessage || '可在列表重传'}`)
  } else if (splitOrderNo) {
    ElMessage.success(`订单已关闭，已生成分单 ${splitOrderNo}，SAP 回传已触发`)
  } else {
    ElMessage.success('订单已关闭，SAP 回传已触发')
  }
  await load()
}

async function closeOrder(row: Row) {
  if (shouldShowOutboundSplitConfirm(row)) {
    try {
      await ElMessageBox.confirm(
        '当前发运订单尚未全部发运，是否将未发运数量生成新的发运订单？',
        '部分发运关单确认',
        {
          type: 'warning',
          confirmButtonText: '生成分单并关闭',
          cancelButtonText: '仅关闭原单',
          distinguishCancelAndClose: true
        }
      )
      await submitOutboundClose(row, true)
    } catch (action) {
      if (action === 'cancel') await submitOutboundClose(row, false)
    }
    return
  }
  await ElMessageBox.confirm('是否确认关闭该发运订单？', '关闭发运订单', {
    type: 'warning',
    confirmButtonText: '确认关闭'
  })
  await submitOutboundClose(row, false)
}

async function cancelOrder(row: Row) {
  await ElMessageBox.confirm('取消后该发运订单进入终态，是否继续？', '取消发运订单', { type: 'warning' })
  await outboundService.cancel(Number(row.id), { operator: 'planner', reason: '页面取消' })
  ElMessage.success('订单已取消')
  await load()
}

function selectableCandidate(row: Row) {
  return Number(row.available_qty || 0) > 0
    && ['QUALIFIED', undefined, ''].includes(row.inventory_status)
    && ['QUALIFIED', undefined, ''].includes(row.quality_status)
    && !row.locked_flag
    && !row.frozen_flag
}

function canAllocate(row: Row) {
  return canAllocateOutboundOrder(row)
}

function canPick(row: Row, line?: Row) {
  return canPickOutboundOrder(row, line)
}

function canShip(row: Row, line?: Row) {
  return canShipOutboundOrder(row, line)
}

function canEdit(row: Row) {
  return canEditOutboundOrder(row)
}

function canCancelPick(row: Row) {
  return canCancelPickOutboundOrder(row)
}

function canCancelShipment(row: Row) {
  return canCancelShipOutboundOrder(row)
}

function canCancelAllocationRecord(row: Row) {
  if (['CLOSED', 'CANCELED'].includes(detail.value.order?.status)) return false
  return canCancelAllocationOutboundOrder(row)
}

function canCancelPickRecord(row: Row) {
  return canCancelPickOutboundOrder({ ...row, order_status: detail.value.order?.status })
}

function canCancelShipmentRecord(row: Row) {
  return canCancelShipOutboundOrder({ ...row, status: detail.value.order?.status || row.order_status || row.status })
}

function canPostSap(row: Row) {
  return canPostSapOutboundOrder(row)
}

function canClose(row: Row) {
  return canCloseOutboundOrder(row)
}

function canCancel(row: Row) {
  return canCancelOutboundOrder(row)
}

function remainingPickQty(line: Row) {
  return Math.max(Number(line.order_qty || line.planned_qty || 0) - Number(line.picked_qty || 0), 0)
}

function remainingShipQty(line: Row) {
  return Math.max(Number(line.picked_qty || 0) - Number(line.shipped_qty || 0), 0)
}

function buildShipLineForms(lines: Row[], selectedLineIds?: number[]) {
  const selectedIds = new Set((selectedLineIds || []).map(Number))
  return lines.map((line) => {
    const lineId = Number(line.line_id || line.id)
    const availableShipQty = remainingShipQty(line)
    const selected = selectedIds.size ? selectedIds.has(lineId) && availableShipQty > 0 : availableShipQty > 0
    return {
      lineId,
      lineNo: line.line_no,
      productCode: line.product_code,
      productName: line.product_name || line.product_description,
      snRequired: Number(line.sn_required || line.sn_managed || 0) === 1,
      orderQty: Number(line.order_qty || line.planned_qty || 0),
      pickedQty: Number(line.picked_qty || 0),
      shippedQty: Number(line.shipped_qty || 0),
      availableShipQty,
      thisShipQty: selected ? availableShipQty : 0,
      selected
    }
  })
}

function syncShipQtyFromLines() {
  shipForm.shipQty = (shipForm.lines || [])
    .filter((line: Row) => line.selected)
    .reduce((total: number, line: Row) => total + Number(line.thisShipQty || 0), 0)
}

function onShipLineChange() {
  rebuildShipFormLines()
}

function onShipModeChange() {
  if (shipForm.shipMode === 'ORDER') shipForm.selectedLineIds = []
  rebuildShipFormLines()
}

function onShipSelectedLinesChange() {
  rebuildShipFormLines()
}

function rebuildShipFormLines() {
  const selectedIds = shipForm.shipMode === 'LINE' ? (shipForm.selectedLineIds || []).map(Number) : undefined
  shipForm.lines = buildShipLineForms(shipLines.value, selectedIds)
  syncShipQtyFromLines()
}

function pendingAllocateQty(line: Row) {
  return Math.max(Number(line.order_qty || line.planned_qty || 0) - Number(line.allocated_qty || 0), 0)
}

function operableQty(line: Row) {
  return Math.max(Number(line.order_qty || line.planned_qty || 0) - Math.max(Number(line.allocated_qty || 0), Number(line.picked_qty || 0), Number(line.shipped_qty || 0)), 0)
}

function pickModeLabel(value: string) {
  if (value === 'DIRECT_PICK') return '不分配直接拣货'
  if (value === 'MANUAL') return '人工指定分配拣货'
  if (value === 'AUTO_FIFO' || value === 'AUTO' || value === 'ALLOCATED') return '按分配结果拣货'
  return value || '按分配结果拣货'
}

function printPickingList() {
  if (!currentOrder.value) return
  const rows = currentPickAllocationRows.value
  if (!rows.length) {
    ElMessage.warning('当前行没有可打印的分配明细')
    return
  }
  const order = currentOrder.value
  const htmlRows = rows.map((row) => `
    <tr>
      <td>${row.line_no || ''}</td>
      <td>${row.product_code || ''}</td>
      <td>${row.product_name || row.product_description || ''}</td>
      <td>${row.location_code || ''}</td>
      <td>${row.pallet_code || ''}</td>
      <td>${row.box_code || ''}</td>
      <td>${row.sn_code || ''}</td>
      <td>${row.allocated_qty || 1}</td>
    </tr>
  `).join('')
  const printWindow = window.open('', '_blank', 'width=1000,height=720')
  if (!printWindow) return
  printWindow.document.write(`
    <html>
      <head>
        <title>拣货清单-${order.order_no}</title>
        <style>
          body { font-family: Arial, "Microsoft YaHei", sans-serif; padding: 24px; color: #1f2937; }
          h1 { font-size: 20px; margin-bottom: 12px; }
          .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 18px; margin-bottom: 18px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #dcdfe6; padding: 7px 8px; text-align: left; }
          th { background: #f5f7fa; }
        </style>
      </head>
      <body>
        <h1>发运订单拣货清单</h1>
        <div class="meta">
          <div>发运订单：${order.order_no || ''}</div>
          <div>仓库：${order.warehouse_code || ''} ${order.warehouse_name || ''}</div>
          <div>货主：${order.owner_code || ''} ${order.owner_name || ''}</div>
          <div>拣货时间：${new Date().toLocaleString()}</div>
        </div>
        <table>
          <thead>
            <tr><th>行号</th><th>产品编码</th><th>产品描述</th><th>库位</th><th>托盘码</th><th>箱码</th><th>SN</th><th>分配数量</th></tr>
          </thead>
          <tbody>${htmlRows}</tbody>
        </table>
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

function parseLines(value = '') {
  return String(value).split(/\r?\n|,|;|\s+/).map((item) => item.trim()).filter(Boolean)
}

function placeholder(name: string) {
  ElMessage.info(`${name}能力已预留，后续接入模板/异步任务`)
}

function orderTypeLabel(value: string) {
  const alias: Record<string, string> = { SALES: 'SALES_OUTBOUND', TRANSFER: 'WAREHOUSE_TRANSFER', AFTERSALE: 'AFTERSALE_OUTBOUND' }
  const normalized = alias[value] || value
  return orderTypeOptions.find((item) => item.value === normalized)?.label || value || '-'
}

function statusLabel(status: string) {
  return i18nStatusLabel(status, status || '-')
}

function statusType(status: string) {
  if (['SHIPPED', 'CLOSED', 'CALLBACK_SUCCESS'].includes(status)) return 'success'
  if (['CANCELED', 'CALLBACK_FAILED', 'ALLOCATION_EXCEPTION'].includes(status)) return 'danger'
  if (['PARTIAL_ALLOCATED', 'PARTIAL_PICKED', 'PARTIAL_SHIPPED', 'PENDING_ALLOC', 'PICKING', 'REVIEWING'].includes(status)) return 'warning'
  if (['ALLOCATED', 'PICKED', 'REVIEWED'].includes(status)) return 'primary'
  return 'info'
}

function statusOptionLabel(label: string, legacy?: boolean) {
  return legacy ? t('statusMeta.compatibleLabel', { label }) : label
}

function sapLabel(status: string) {
  return i18nSapStatusLabel(status || 'NOT_POSTED')
}

function sapType(status: string) {
  if (['SUCCESS', 'POSTED'].includes(status)) return 'success'
  if (status === 'FAILED') return 'danger'
  return 'info'
}
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
}

.query-form {
  padding: 4px 0 2px;
}

.toolbar,
.action-strip {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.action-strip {
  margin-top: 12px;
}

.hidden-file-input {
  display: none;
}

.detail-actionbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 12px;
  margin-bottom: 14px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #f8fafc;
}

.detail-actionbar-title {
  flex: 0 0 auto;
  font-weight: 700;
  line-height: 32px;
}

.detail-actionbar-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.record-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  color: #606266;
}

.pick-list-panel {
  margin: 12px 0 16px;
}

.ship-line-table {
  margin-bottom: 16px;
}

.ship-line-table :deep(.el-input-number) {
  width: 128px;
}

.list-alert {
  margin-bottom: 12px;
}

.shipping-line-expand-wrapper {
  box-sizing: border-box;
  width: calc(100% - 96px);
  margin-left: 96px;
  padding: 10px 0 12px 12px;
  border-left: 3px solid #dcdfe6;
  overflow-x: auto;
}

.shipping-line-subtable {
  width: max-content;
  min-width: 1180px;
  max-width: none;
}

.shipping-line-subtable :deep(.el-table__cell) {
  padding: 6px 0;
}

.shipping-line-subtable :deep(.cell) {
  white-space: nowrap;
}

.shipping-line-subtable :deep(.el-table-fixed-column--left),
.shipping-line-subtable :deep(.el-table-fixed-column--right),
.shipping-line-subtable :deep(.is-fixed) {
  position: static !important;
  left: auto !important;
  right: auto !important;
  z-index: auto !important;
  box-shadow: none !important;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.detail-tabs,
.dialog-form,
.mini-form {
  margin-top: 16px;
}

.mode-alert {
  margin: -4px 0 14px;
}

.subsection-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8px 0;
  font-weight: 600;
}

.scan-box {
  font-size: 18px;
}
</style>
