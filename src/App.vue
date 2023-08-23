<script setup lang="ts">
import { Layout } from "ant-design-vue"
import Center from './components/center/index.vue'
const { Sider, Content } = Layout
</script>

<template>
  <Layout class="pdb-layout">
    <Sider theme="light">组件列表</Sider>
    <Content>
      <Center />
    </Content>
  </Layout>
</template>

<style lang="less" scoped>

.pdb-layout {
  height: 100%;
  width: 100%;
  flex-direction: row;
}
</style>
