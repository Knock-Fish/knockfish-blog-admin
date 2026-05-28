<template>
    <div class="links-section">
        <div class="section-header">
            <h3 class="section-title">
                <SvgIcon icon="mdi:link-variant" />
                常用外链
            </h3>
        </div>
        <div class="links-grid">
            <a
                class="link-item"
                v-for="link in links"
                :key="link.name"
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
            >
                <div class="link-icon">
                    <img :src="link.icon" alt="">
                </div>
                <span class="link-name">{{ link.name }}</span>
            </a>
            <a
                class="link-item"
                rel="noopener noreferrer"
            >
                <div class="link-icon" style="background-color: gray;">
                    <SvgIcon icon="mdi:add" />
                </div>
                <span class="link-name">添加外链</span>
            </a>
        </div>
    </div>
</template>

<script setup lang='ts'>
interface LinkItem {
    name: string
    url: string
    icon: string
}
const icon = ref({
    GitHub: new URL('../../../../assets/svg/github.svg', import.meta.url).href,
    Bilibili: new URL('../../../../assets/svg/bilibili.svg', import.meta.url).href,
    Juejin: new URL('../../../../assets/svg/juejin.svg', import.meta.url).href,
    CSDN: new URL('../../../../assets/svg/csdn.svg', import.meta.url).href,
    Zhihu: new URL('../../../../assets/svg/zhihu.svg', import.meta.url).href,
    Bokeyuan: new URL('../../../../assets/svg/Bokeyuan.svg', import.meta.url).href,
    Gitee: new URL('../../../../assets/svg/gitee.svg', import.meta.url).href,
})
const links = ref<LinkItem[]>([
    {
        name: 'GitHub',
        url: 'https://github.com',
        icon: icon.value.GitHub,
    },
    {
        name: '哔哩哔哩',
        url: '@/assets/svg/bilibili.svg',
        icon: icon.value.Bilibili,
    },
    {
        name: 'CSDN',
        url: 'https://www.csdn.net',
        icon: icon.value.CSDN,
    },
    {
        name: '知乎',
        url: 'https://www.zhihu.com',
        icon: icon.value.Zhihu,
    },
    {
        name: '掘金',
        url: 'https://juejin.cn',
        icon: icon.value.Juejin,
    },
    {
        name: '博客园',
        url: 'https://www.cnblogs.com',
        icon: icon.value.Bokeyuan,
    },
    {
        name: 'Gitee',
        url: 'https://gitee.com',
        icon: icon.value.Gitee,
    },
])
</script>

<style lang="scss" scoped>
.links-section {
    background: var(--card-color);
    border-radius: 7px;
    padding: 20px;
    border: 1px solid var(--border-color);

    .section-header {
        margin-bottom: 16px;

        .section-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            font-weight: 600;
            color: var(--text-color);
            margin: 0;
        }
    }

    .links-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;

        .link-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 16px 8px;
            border-radius: 7px;
            text-decoration: none;
            transition: all 0.3s ease;
            background-color: var(--el-fill-color-light);
            border: 1px solid var(--border-color);

            &:hover {
                transform: translateY(-3px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                border-color: var(--el-color-primary);
            }

            .link-icon {
                width: 40px;
                height: 40px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                color: #fff;

                img {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                }
            }

            .link-name {
                font-size: 13px;
                color: var(--text-color);
                text-align: center;
            }
        }
    }
}

@media (max-width: $screen-medium) {
    .links-section {
        padding: 15px;

        .section-header {
            margin-bottom: 12px;
        }

        .links-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;

            .link-item {
                padding: 12px 6px;

                .link-icon {
                    width: 36px;
                    height: 36px;
                    font-size: 18px;
                }

                .link-name {
                    font-size: 12px;
                }
            }
        }
    }
}

@media (max-width: $screen-small) {
    .links-section {
        padding: 12px;

        .section-header {
            margin-bottom: 10px;

            .section-title {
                font-size: 14px;
            }
        }

        .links-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;

            .link-item {
                padding: 10px 4px;
                gap: 6px;

                .link-icon {
                    width: 32px;
                    height: 32px;
                    font-size: 16px;
                    border-radius: 8px;
                }

                .link-name {
                    font-size: 11px;
                }
            }
        }
    }
}
</style>