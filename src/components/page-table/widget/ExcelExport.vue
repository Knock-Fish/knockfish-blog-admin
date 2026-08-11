<template>
    <ElButton
        class="export-button"
        @click="openDialog"
        type="info"
        plain
    >
        <SvgIcon
            icon="ri:file-excel-2-line"
        />
    </ElButton>
    <ElDialog
        v-model="dialogVisible"
        title="导出 Excel"
        width="500"
        @opened="onDialogOpened"
    >
        <ElInput
            @focus="handleFocus"
            ref="inputRef"
            v-model="fileName"
            placeholder="请输入文件名称"
        ><template #append>.xlsx</template></ElInput>
        <template #footer>
            <div class="dialog-footer">
                <ElButton @click="dialogVisible = false">取消</ElButton>
                <ElButton
                    type="primary"
                    @click="exportToExcel"
                >
                    确认导出
                </ElButton>
            </div>
        </template>
    </ElDialog>
</template>

<script setup lang='ts'>
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { ElMessage } from 'element-plus'
const props = defineProps({
    tableData: {
        type: Array,
        default: []
    }
})
const inputRef = ref<HTMLInputElement | null>(null)
const dialogVisible = ref<boolean>(false)   // 模态框
const fileName = ref<string>('表格名称')    // 默认文件名称
/** 对话框完全打开后的回调 */
const onDialogOpened = () => {
    // 等待对话框动画完全结束
    handleFocus()
}
const handleFocus = () => {
    if(inputRef.value){
        inputRef.value.select()
    }
}
/** 打开模态框 */
const openDialog = () => {
    dialogVisible.value = !dialogVisible.value
    fileName.value = '表格名称' // 每次打开重置
}
/** excel导出保存 */
const exportToExcel = () => {
    if (!fileName.value) {
        ElMessage({
            message: '文件名不能为空！',
            type: 'warning',
        })
        return
    }
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(props.tableData)
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `${fileName.value}.xlsx`)
    // 关闭模态框
    dialogVisible.value = !dialogVisible.value
}
</script>

<style lang="scss" scoped>
.export-button{
    @include icon-button
}
</style>