<template>
  <section class="warehouse-switcher">
    <div>
      <span>当前仓库范围</span>
      <strong>{{ warehouse.currentWarehouseName }}</strong>
    </div>
    <select v-model="selected" @change="changeWarehouse">
      <option v-for="item in warehouse.options" :key="item.value" :value="item.value">
        {{ item.text }}
      </option>
    </select>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '../stores/user'
import { useWarehouseStore } from '../stores/warehouse'

const emit = defineEmits<{ changed: [] }>()
const userStore = useUserStore()
const warehouse = useWarehouseStore()

const selected = computed({
  get: () => warehouse.currentWarehouseCode,
  set: (value: string) => warehouse.setCurrentWarehouse(value, userStore.user?.username)
})

function changeWarehouse() {
  emit('changed')
}
</script>
