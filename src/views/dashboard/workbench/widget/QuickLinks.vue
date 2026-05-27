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
                <div class="link-icon" :class="link.bgClass">
                    <SvgIcon :icon="link.icon" />
                </div>
                <span class="link-name">{{ link.name }}</span>
            </a>
        </div>
    </div>
</template>

<script setup lang='ts'>
interface LinkItem {
    name: string
    url: string
    icon: string
    bgClass: string
}

const links = ref<LinkItem[]>([
    {
        name: 'GitHub',
        url: 'https://github.com',
        icon: 'mdi:github',
        bgClass: 'bg-github'
    },
    {
        name: '哔哩哔哩',
        url: 'https://www.bilibili.com',
        icon: 'mdi:bilibili',
        bgClass: 'bg-bilibili'
    },
    {
        name: '掘金',
        url: 'https://juejin.cn',
        icon: 'mdi:gold',
        bgClass: 'bg-juejin'
    },
    {
        name: '思否',
        url: 'https://segmentfault.com',
        icon: 'mdi:forum',
        bgClass: 'bg-segmentfault'
    },
    {
        name: 'CSDN',
        url: 'https://www.csdn.net',
        icon: 'mdi:language-css3',
        bgClass: 'bg-csdn'
    },
    {
        name: '知乎',
        url: 'https://www.zhihu.com',
        icon: 'mdi:zhihu',
        bgClass: 'bg-zhihu'
    },
    {
        name: 'npm',
        url: 'https://www.npmjs.com',
        icon: 'mdi:npm',
        bgClass: 'bg-npm'
    },
    {
        name: 'Vue',
        url: 'https://vuejs.org',
        icon: 'mdi:vuejs',
        bgClass: 'bg-vue'
    }
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

                &.bg-github {
                    background: linear-gradient(135deg, #333 0%, #666 100%);
                }

                &.bg-bilibili {
                    background: linear-gradient(135deg, #fb7299 0%, #ffaabb 100%);
                }

                &.bg-juejin {
                    background: linear-gradient(135deg, #007fff 0%, #00aaff 100%);
                }

                &.bg-segmentfault {
                    background: linear-gradient(135deg, #009c49 0%, #00d65d 100%);
                }

                &.bg-csdn {
                    background: linear-gradient(135deg, #fc5531 0%, #ff6b3d 100%);
                }

                &.bg-zhihu {
                    background: linear-gradient(135deg, #0066ff 0%, #0088ff 100%);
                }

                &.bg-npm {
                    background: linear-gradient(135deg, #cb0000 0%, #ff0000 100%);
                }

                &.bg-vue {
                    background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
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