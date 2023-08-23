<template>
  <Sider theme="light" class="pdb-content-sider" width="250">
    <div class="sider-header">属性</div>
    <div class="sider-content">
      <div v-for="item in params" class="edit-item">
        <Input v-model:value="item.key" />：
        <Input v-model:value="item.value" />
      </div>
    </div>
  </Sider>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { Input } from "ant-design-vue";
import { Layout } from "ant-design-vue"
import { useEditorStore } from '../../store/editor';

const { Sider, Content } = Layout
const editorStore = useEditorStore();
const { currentEditModel } = storeToRefs(editorStore);
const params = ref<any[]>([]);

watch(currentEditModel, function (newVal, oldVal) {
  let _params = new Array();
  if (JSON.stringify(newVal?.params) !== JSON.stringify(oldVal?.params)) {
    Object.keys(newVal?.params).forEach(function (key) {
      _params.push({ key, value: newVal?.params[key] });
    });
  }
  params.value = _params;
})
</script> 
<style lang="less" scoped>
.pdb-content-sider {
  height: 100%;
  .sider-header {
    padding: 10px;
    border-bottom: 1px solid #e8e8e8;
  }
  .sider-content {
    padding: 10px;
  }
  .edit-item {
    display: flex;
    align-items: center;
  }
}
</style>
  