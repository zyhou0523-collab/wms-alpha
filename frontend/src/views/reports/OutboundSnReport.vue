<template>
  <ReportPage :config="reportConfigs.outboundSn" />
</template>

<script setup lang="ts">
import ReportPage from './ReportPage.vue'
import { reportConfigs } from './reportConfigs'
</script>
