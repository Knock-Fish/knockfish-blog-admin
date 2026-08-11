<template>
    <ElPopover trigger="click" placement="bottom-end" width="80">
        <template #reference>
            <ElButton class="table-setting" type="info" plain>
                <SvgIcon icon="mdi:settings-outline" />
            </ElButton>
        </template>
        <ElCheckbox v-model="localBorder" @change="handleBorderChange">边框</ElCheckbox>
        <ElCheckbox v-model="localStripe" @change="handleStripeChange">斑马纹</ElCheckbox>
    </ElPopover>
</template>

<script setup lang='ts'>
const props = withDefaults(defineProps<{
    stripe?: boolean
    border?: boolean
}>(), {
    stripe: true,
    border: false
})

const emit = defineEmits<{
    (e: 'update:stripe', value: boolean): void
    (e: 'update:border', value: boolean): void
}>()

const localStripe = ref(props.stripe)
const localBorder = ref(props.border)

watch(() => props.stripe, (val) => {
    localStripe.value = val
})

watch(() => props.border, (val) => {
    localBorder.value = val
})

const handleStripeChange = (val: string | number | boolean) => {
    emit('update:stripe', val as boolean)
}

const handleBorderChange = (val: string | number | boolean) => {
    emit('update:border', val as boolean)
}
</script>

<style lang="scss" scoped>
.table-setting {
    @include icon-button
}
</style>