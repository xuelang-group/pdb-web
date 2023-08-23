<script setup lang="ts">
import { Layout } from "ant-design-vue"
import Center from './components/center/index.vue'
import Left from './components/left/index.vue'

const { Content } = Layout
</script>

<template>
  <Layout class="pdb-layout">
    <Left />
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
