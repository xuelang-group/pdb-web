<template>
  <Sider theme="light" width="250">
    <div class="sider-header">组件列表</div>
  </Sider>
</template>

<script lang="ts" setup>
  import { Layout } from "ant-design-vue"
  const { Sider, Content } = Layout;
</script>
<style lang="less" scoped>
.sider-header {
  padding: 10px;
  border-bottom: 1px solid #e8e8e8;
}
</style>