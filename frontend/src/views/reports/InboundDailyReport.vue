<template>
  <ReportPage :config="reportConfigs.inboundDaily" />
</template>

<script setup lang="ts">
import ReportPage from './ReportPage.vue'
import { reportConfigs } from './reportConfigs'
</script>
