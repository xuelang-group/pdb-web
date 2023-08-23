<script lang="ts" setup>
  import Graph from './Graph.vue'
  import Sider from './Sider.vue'
</script>
<template>
  <div class="pdb-content">
    <Graph />
    <Sider />
  </div>
</template>
<style lang="less" scoped>
.pdb-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
}
</style>
