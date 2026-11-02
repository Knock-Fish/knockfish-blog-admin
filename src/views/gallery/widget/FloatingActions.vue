<template>
  <div class="fab">
    <button type="button" class="fab-btn" title="回到顶部" @click="emit('toTop')">↑</button>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ toTop: [] }>()
</script>

<style scoped>
.fab {
  position: fixed;
  right: 26px;
  bottom: 28px;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fab-btn {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 1px solid var(--g-border);
  border-radius: 50%;
  appearance: none;
  background: var(--g-surface);
  color: var(--g-primary-strong);
  font-size: 16px;
  box-shadow: 0 6px 18px rgba(160, 130, 195, 0.22);
  transition: all 0.2s ease;
}

.fab-btn:hover {
  background: var(--g-primary-soft);
  transform: translateY(-2px);
}
</style>
