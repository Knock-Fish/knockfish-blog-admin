<template>
    <div class="upload-container">
        <ElUpload class="cover-uploader" v-bind="componentProps"
            v-on="getComponentEvents">
            <div v-if="loading" class="upload-loading">
                <ElIcon class="is-loading">
                    <Loading />
                </ElIcon>
                <div class="upload-text">上传中...</div>
            </div>
            <div v-else-if="!cover" class="upload-placeholder">
                <ElIcon class="upload-icon">
                    <SvgIcon icon="mdi:add" />
                </ElIcon>
                <div v-if="props.text" class="upload-text">{{ props.text }}
                </div>
            </div>
            <img v-else :src="cover" class="cover-image" />
            <div v-if="cover && !loading && props.showDelete" class="cover-mask">
                <ElIcon class="delete-icon" @click.stop="handleDelete">
                    <SvgIcon icon="mdi:delete-outline" />
                </ElIcon>
            </div>
            <template #tip>
                <div class="upload-tip">
                    {{ props.tip }}
                </div>
            </template>
        </ElUpload>
    </div>
</template>

<script setup lang='ts'>
import { ElMessage, type UploadFile, type UploadProps, type UploadRawFile } from "element-plus"
import { Loading } from "@element-plus/icons-vue"
const cover = defineModel<string>({ required: true }) // 封面图片内容
const loading = ref(false) // 上传状态
const props = withDefaults(defineProps < {
    props?: Partial<UploadProps>
    tip?: string
    text?: string
    width?: string | number  // 新增
    height?: string | number // 新增
    showDelete?: boolean // 是否显示删除遮罩
} > (), {
    tip: "建议尺寸 16/9，jpg/png 格式",
    width: 260,
    height: 160,
    showDelete: false
})
// 向外抛出所有事件
const emit = defineEmits<{
    (e: "success", response: any, file: UploadFile): void
    (e: "change", file: UploadFile): void
    (e: "preview", file: UploadFile): void
    (e: "remove", file: UploadFile): void
    (e: "error", error: Error): void
    (e: "progress", event: any): void
    (e: "exceed", files: File[]): void
}>()
// 合并 ElUpload 配置（默认限制1张、图片格式）
const componentProps = computed(() => ({
    accept: "image/jpeg,image/png",
    ...props.props,
    beforeUpload: (file: UploadRawFile) => {
        loading.value = true
        return props.props?.beforeUpload ? props.props.beforeUpload(file) : true
    },
}))
// 所有 ElUpload 事件统一绑定 + 内部逻辑
const getComponentEvents = {
    // 上传成功
    success: (response: any, file: UploadFile) => {
        loading.value = false
        if (!response) {
            ElMessage.error("上传失败：未获取到图片地址")
            return
        }
        // 获取新上传图片url
        cover.value = response
        emit("success", response, file)
        ElMessage.success("图片上传成功")
    },

    // 文件改变
    change: (file: UploadFile) => {
        if (file.raw && !file.raw.type.includes("image/")) {
            ElMessage.error("只能上传图片文件！")
            return
        }
        emit("change", file)
    },
    // 预览
    preview: (file: UploadFile) => emit("preview", file),
    // 删除
    remove: (file: UploadFile) => {
        cover.value = ""
        emit("remove", file)
        ElMessage.info("已移除图片")
    },
    // 错误
    error: (error: Error) => {
        loading.value = false
        ElMessage.error("上传失败：" + error.message)
        emit("error", error)
    },
    // 进度
    progress: (event: any) => emit("progress", event),
    exceed: (files: File[]) => {
        emit("exceed", files)
    },
}
// 删除图片
const handleDelete = () => {
    cover.value = ""
    ElMessage.info("已移除图片")
}
</script>

<style lang="scss" scoped>
.upload-container {
    .cover-uploader {
        .upload-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 1px dashed #d9d9d9;
            border-radius: 6px;
            width: v-bind('typeof width === "number" ? width + "px" : width');
            height: v-bind('typeof height === "number" ? height + "px" : height');

            .is-loading {
                font-size: 28px;
                color: var(--el-color-primary);
            }

            .upload-text {
                margin-top: 8px;
                font-size: 14px;
                color: #8c939d;
            }
        }

        .upload-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 1px dashed #d9d9d9;
            border-radius: 6px;
            width: v-bind('typeof width === "number" ? width + "px" : width');
            height: v-bind('typeof height === "number" ? height + "px" : height');

            .upload-icon {
                font-size: 28px;
                color: #8c939d;
            }

            .upload-text {
                margin-top: 8px;
                font-size: 14px;
                color: #8c939d;
            }
        }

        // ElUpload 渲染的触发器元素，设为相对定位作为遮罩层定位基准
        :deep(.el-upload) {
            position: relative;
            overflow: hidden;
            border-radius: 6px;
        }

        .cover-image {
            display: block;
            object-fit: contain;
            width: v-bind('typeof width === "number" ? width + "px" : width');
            height: v-bind('typeof height === "number" ? height + "px" : height');
        }

        .cover-mask {
            position: absolute;
            top: 0;
            left: 0;
            width: v-bind('typeof width === "number" ? width + "px" : width');
            height: v-bind('typeof height === "number" ? height + "px" : height');
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s;
            border-radius: 6px;
            cursor: pointer;

            .delete-icon {
                font-size: 24px;
                color: #fff;
                transition: transform 0.3s;

                &:hover {
                    transform: scale(1.2);
                    color: #ff6b6b;
                }
            }
        }

        &:hover .cover-mask {
            opacity: 1;
        }
    }

    .el-upload-tip {
        margin-top: 8px;
        font-size: 12px;
        color: #666;
    }
}
</style>