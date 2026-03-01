<template>
  <div class="analysis-dashboard">
    <ElRow :gutter="20">
      <ElCol :xl="14" :lg="15" :xs="24">
        <TodaySales />
      </ElCol>
      <ElCol :xl="10" :lg="9" :xs="24">
        <VisitorInsights />
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
  import TodaySales from './modules/today-sales.vue'
  import VisitorInsights from './modules/visitor-insights.vue'
  import TotalRevenue from './modules/total-revenue.vue'
  import CustomerSatisfaction from './modules/customer-satisfaction.vue'
  import TargetVsReality from './modules/target-vs-reality.vue'
  import TopProducts from './modules/top-products.vue'
  import SalesMappingByCountry from './modules/sales-mapping-by-country.vue'
  import VolumeServiceLevel from './modules/volume-service-level.vue'

  defineOptions({ name: 'BasicAnalysis' })
</script>

<style lang="scss" scoped>
  @use './style';
</style>
