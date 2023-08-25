<template>
  <Sider theme="light" width="250" class="pdb-content-sider">
    <div class="sider-header">组件列表</div>
  </Sider>
</template>

<script lang="ts" setup>
  import { Layout } from "ant-design-vue"
  const { Sider, Content } = Layout;
</script>
<style lang="less" scoped>
.pdb-content-sider {
  border-right: 1px solid #EAECEF;
}
.sider-header {
  padding: 10px;
  border-bottom: 1px solid #EAECEF;
}
</style>