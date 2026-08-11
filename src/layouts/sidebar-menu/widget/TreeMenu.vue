<template>
  <template v-for="item in props.menuData" :key="item.id" >
    <!-- 无子菜单的情况 -->
    <el-menu-item v-if="!item.children || item.children.length === 0"
      :index="item.path">
      <el-icon v-if="item.meta?.icon">
        <SvgIcon :icon="item.meta.icon" />
      </el-icon>
      <span>{{ item.meta?.title }}</span>
    </el-menu-item>

    <!-- 有子菜单的情况 -->
    <el-sub-menu v-else :index="item.path">
      <template #title>
        <el-icon v-if="item.meta?.icon">
          <SvgIcon :icon="item.meta.icon" />
        </el-icon>
        <span>{{ item.meta?.title }}</span>
      </template>
      <!-- 递归调用 TreeMenu -->
      <TreeMenu :menu-data="item.children" />
    </el-sub-menu>
  </template>
</template>

<script lang="ts" setup>
import TreeMenu from './TreeMenu.vue'
import { type AppRouteRecord } from '@/types'
interface Props {
  menuData: AppRouteRecord[]
}
const props = defineProps<Props>()
</script>