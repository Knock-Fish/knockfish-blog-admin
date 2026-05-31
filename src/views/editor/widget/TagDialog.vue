<template>
    <ElDialog 
        v-model="visible" 
        title="添加标签" 
        width="400"
        :z-index="10000" 
        @open="handleOpen"
    >
        <div style="display: flex; justify-content: space-between;">
            <div>
                <ElPopover 
                    width="300" 
                    append-to-body
                    popper-class="popper-z-index" 
                    title="已选择标签："
                    placement="left-start"
                >
                    <template #reference>
                        <ElButton size="small" round>
                            已选择（{{ tagTemp?.length }}）
                        </ElButton>
                    </template>
                    <template #default>
                        <ElSpace wrap>
                            <ElTag 
                                v-for="tag in tagTemp"
                                :key="tag.tagId" 
                                closable
                                @close="handleClose(tag)"
                                :color="tag.color"
                            >
                                {{ tag.tagName }}
                            </ElTag>
                        </ElSpace>
                    </template>
                </ElPopover>
            </div>
            <div>
                <ElInput 
                    v-if="inputVisible" 
                    ref="InputRef"
                    v-model="inputValue" 
                    class="w-20" 
                    size="small"
                    @keyup.enter="handleInputConfirm"
                    @blur="handleInputConfirm" 
                />
                <ElButton 
                    v-else 
                    class="button-new-tag" 
                    size="small"
                    @click="showInput"
                >
                    + New Tag
                </ElButton>
            </div>
        </div>
        <ElScrollbar 
            style="margin-top: 15px;" 
            max-height="200px"
            @end-reached="loadMore"
        >
            <ElSpace wrap>
                <ElTag 
                    :color="tag.color" 
                    v-for="tag in tagList"
                    :key="tag.tagId" 
                    @click="handleClick(tag)"
                    :class="{ 'is-action': isTagSelected(tag) }"
                >
                    {{ tag.tagName }}
                </ElTag>
            </ElSpace>
        </ElScrollbar>
        <ElDivider>搜索标签</ElDivider>
        <ElInput 
            v-model="query.tagName" 
            placeholder="输入标签名称"
            @keydown.enter="handleSearchTag"
        >
            <template #append>
                <ElButton @click="handleSearchTag">
                    <SvgIcon icon="mdi:search"></SvgIcon>
                </ElButton>
            </template>
        </ElInput>

        <template #footer>
            <ElButton @click="visible = false">取消</ElButton>
            <ElButton type="primary" @click="handleSelectTagList">
                添加
            </ElButton>
        </template>
    </ElDialog>
</template>

<script setup lang='ts'>
import { ElMessage, type InputInstance, type ScrollbarDirection } from "element-plus"
import { TagService } from "@/api/tagApi"

type Tag = Api.Tag.TagInfo
type PaginatingParams<T> = Api.Common.PaginatingParams<T>

const props = defineProps<{
    modelValue: boolean
    selectedTags: Tag[]
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'update:selectedTags', tags: Tag[]): void
    (e: 'update:tagIds', tagIds: number[]): void
}>()

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const query = reactive<Tag>({})
const inputVisible = ref<boolean>(false)
const inputValue = ref<string>('')
const InputRef = ref<InputInstance>()
const tagList = ref<Tag[]>([])
const tagTemp = ref<Tag[]>([])
const tagLoaded = ref<boolean>(false)

const page = reactive({
    total: 0,
    pageNum: 1,
    pageSize: 30
})

const handleOpen = async () => {
    tagTemp.value = [...props.selectedTags]
    await getTagListData()
}

const getTagListData = async () => {
    if (tagLoaded.value) return
    const data: PaginatingParams<Tag> = await TagService.getTagListData({
        ...query,
        pageNum: page.pageNum,
        pageSize: page.pageSize,
    })
    if (page.pageNum === 1) {
        tagList.value = data.list
    } else {
        tagList.value.push(...data.list)
    }
    tagList.value = data.list
    page.total = data.total
    tagLoaded.value = true
}

const showInput = () => {
    inputVisible.value = true
    nextTick(() => {
        InputRef.value!.input!.focus()
    })
}

const isTagSelected = (tag: Tag) => {
    return tagTemp.value.some(item => item.tagId === tag.tagId)
}

const handleInputConfirm = () => {
    if (inputValue.value) {
        tagList.value?.push({
            tagName: inputValue.value
        })
    }
    inputVisible.value = false
    inputValue.value = ''
}

const handleClose = (tag: Tag) => {
    const index = tagTemp.value.findIndex(t => t.tagId === tag.tagId)
    if (index !== -1) tagTemp.value.splice(index, 1)
}

const handleClick = (tag: Tag) => {
    const index = tagTemp.value.findIndex(t => t.tagId === tag.tagId)
    if (index !== -1) {
        tagTemp.value.splice(index, 1)
    } else {
        tagTemp.value.push(tag)
    }
}

const handleSearchTag = () => {
    tagLoaded.value = false
    getTagListData()
}

const handleSelectTagList = () => {
    visible.value = false
    emit('update:selectedTags', [...tagTemp.value])
    emit('update:tagIds', tagTemp.value.map(tag => tag.tagId!))
}

const loadMore = async (direction: ScrollbarDirection) => {
    if (direction !== 'bottom') return
    if (tagList.value.length >= page.total) return
    page.pageNum += 1
    tagLoaded.value = false
    await getTagListData()
}
</script>

<style lang="scss">
.popper-z-index {
    z-index: 10000 !important;
}
</style>
