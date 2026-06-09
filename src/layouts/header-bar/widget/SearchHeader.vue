<template>
    <div>
        <div class="search-input" @click="dialogVisible = !dialogVisible">
        <div>
            <SvgIcon icon="mdi:search" color="#78809D" />
            <span>搜索</span>
        </div>
        <div class="search-keydown">
            Ctrl k
        </div>
    </div>
    <ElDialog :header-class="'dialog-header'"
        :header-style="{ paddingBottom: '0', padding: '0' }" style="padding: 0;"
        v-model="dialogVisible" append-to-body :z-index="10001" width="750"
        :fullscreen="width < 750"
        :show-close="false">
        <template #header>
            <div style="padding: 0; margin: 0; width: 100%;">
                <ElInput
                    ref="searchInputRef"
                    style="height: 50px; width: 100%;"
                    v-model="query"
                    placeholder="搜索页面..."
                    @input="handleSearch"
                    @keyup.enter="handleEnter"
                >
                    <template #prefix>
                        <SvgIcon icon="mdi:search" size="2em" />
                    </template>
                    <template #suffix>
                        <SvgIcon style="cursor: pointer;"
                            @click="dialogVisible = !dialogVisible"
                            icon="mdi:close" size="2em" />
                    </template>
                </ElInput>
            </div>
        </template>
        <div class="search-content">
            <div v-if="!query" class="search-hint">
                <SvgIcon icon="mdi:keyboard" size="2em" />
                <span>输入关键词搜索页面</span>
            </div>
            <div v-else-if="searchResults.length === 0" class="search-empty">
                <SvgIcon icon="mdi:file-search-outline" size="2em" />
                <span>未找到匹配的页面</span>
            </div>
            <div v-else class="search-results">
                <template v-for="(group, groupIndex) in searchResults" :key="groupIndex">
                    <div
                        v-for="(item, itemIndex) in group.items"
                        :key="item.route.path"
                        class="result-item"
                        :class="{ 'is-active': selectedIndex === getGlobalIndex(groupIndex, itemIndex), 'is-child': item.level > 0 }"
                        :style="{ paddingLeft: `${item.level * 20 + 16}px` }"
                        @click="handleNavigate(item.route)"
                        @mouseenter="selectedIndex = getGlobalIndex(groupIndex, itemIndex)"
                    >
                        <div v-if="item.level > 0" class="level-indicator">
                            <span class="connector">{{ '└─ '.repeat(item.level - 1) }}└─</span>
                        </div>
                        <div class="result-icon">
                            <SvgIcon :icon="item.route.meta?.icon || 'mdi:file-document-outline'" size="20px" />
                        </div>
                        <div class="result-info">
                            <span class="result-title">{{ item.route.meta?.title || item.route.name }}</span>
                            <span class="result-path">{{ item.route.path }}</span>
                        </div>
                        <div class="result-arrow">
                            <SvgIcon icon="mdi:arrow-right" size="16px" />
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </ElDialog>
    </div>
</template>

<script setup lang='ts'>
import { useMenuStore } from '@/store/modules/menu'
import { useRouter } from 'vue-router'
import { flatPermissionsToMenuTree } from '@/utils/tree/menuHelper'
import { PermissionService } from '@/api/permissionApi'
import { useUserStore } from '@/store/modules/user'
import {type AppRouteRecord} from "@/types/router"
const dialogVisible = ref<boolean>(false)
const query = ref<string>('')
const searchInputRef = ref()
const selectedIndex = ref<number>(0)
const { width } = useWindowSize()
const menuStore = useMenuStore()
const userStore = useUserStore()
const router = useRouter()

const allRoutes = ref<AppRouteRecord[]>([])

interface SearchResultItem {
    route: AppRouteRecord
    level: number
}

interface SearchResultGroup {
    matchedRoute: AppRouteRecord
    items: SearchResultItem[]
}

const flattenRoutesWithLevel = (routes: AppRouteRecord[], level: number = 0): SearchResultItem[] => {
    const result: SearchResultItem[] = []
    
    const traverse = (items: AppRouteRecord[], currentLevel: number) => {
        items.forEach(route => {
            result.push({ route, level: currentLevel })
            if (route.children && route.children.length > 0) {
                traverse(route.children, currentLevel + 1)
            }
        })
    }
    
    traverse(routes, level)
    return result
}

const getUserMenuData = async () => {
    const userId = userStore.info.userId
    if (!userId) return

    try {
        const permissionData = await PermissionService.getUserPermissions(Number(userId))
        const menuList = flatPermissionsToMenuTree(permissionData.list)
        allRoutes.value = menuList
    } catch (error) {
        console.error('获取用户菜单失败:', error)
    }
}

const searchResults = computed((): SearchResultGroup[] => {
    if (!query.value) return []
    const searchText = query.value.toLowerCase()
    
    const matchedGroups: SearchResultGroup[] = []
    const visitedPaths = new Set<string>()

    const findMatches = (routes: AppRouteRecord[]): AppRouteRecord[] => {
        const matches: AppRouteRecord[] = []
        
        const traverse = (items: AppRouteRecord[]) => {
            items.forEach(route => {
                const title = (route.meta?.title || '').toLowerCase()
                const name = (route.name || '').toString().toLowerCase()
                const path = (route.path || '').toLowerCase()
                
                if (title.includes(searchText) || name.includes(searchText) || path.includes(searchText)) {
                    matches.push(route)
                }
                
                if (route.children && route.children.length > 0) {
                    traverse(route.children)
                }
            })
        }
        
        traverse(routes)
        return matches
    }

    const matchedRoutes = findMatches(allRoutes.value)

    const addGroup = (matchedRoute: AppRouteRecord, parentRoutes: AppRouteRecord[] = [], levelOffset: number = 0) => {
        const group: SearchResultGroup = {
            matchedRoute,
            items: []
        }

        const addItem = (route: AppRouteRecord, level: number) => {
            if (visitedPaths.has(route.path)) return
            visitedPaths.add(route.path)
            group.items.push({ route, level })
        }

        parentRoutes.forEach((parent, idx) => {
            addItem(parent, idx)
        })

        addItem(matchedRoute, parentRoutes.length + levelOffset)

        if (matchedRoute.children && matchedRoute.children.length > 0) {
            const childrenWithLevel = flattenRoutesWithLevel(matchedRoute.children, parentRoutes.length + levelOffset + 1)
            childrenWithLevel.forEach(item => {
                if (!visitedPaths.has(item.route.path)) {
                    visitedPaths.add(item.route.path)
                    group.items.push(item)
                }
            })
        }

        matchedGroups.push(group)
    }

    const findParentChain = (targetRoute: AppRouteRecord, routes: AppRouteRecord[], parents: AppRouteRecord[] = []): AppRouteRecord[] | null => {
        for (const route of routes) {
            if (route.path === targetRoute.path) {
                return [...parents]
            }
            if (route.children && route.children.length > 0) {
                const result = findParentChain(targetRoute, route.children, [...parents, route])
                if (result) return result
            }
        }
        return null
    }

    matchedRoutes.forEach(matchedRoute => {
        if (visitedPaths.has(matchedRoute.path)) return
        
        const parentChain = findParentChain(matchedRoute, allRoutes.value) || []
        addGroup(matchedRoute, parentChain)
    })

    return matchedGroups
})

const getGlobalIndex = (groupIndex: number, itemIndex: number): number => {
    let index = 0
    for (let i = 0; i < groupIndex; i++) {
        const group = searchResults.value[i]
        if (group) {
            index += group.items.length
        }
    }
    return index + itemIndex
}

const handleSearch = () => {
    selectedIndex.value = 0
}

const handleEnter = () => {
    let totalItems = 0
    for (const group of searchResults.value) {
        if (selectedIndex.value < totalItems + group.items.length) {
            const itemIndex = selectedIndex.value - totalItems
            const item = group.items[itemIndex]
            if (item) {
                handleNavigate(item.route)
            }
            return
        }
        totalItems += group.items.length
    }
}

const handleNavigate = (route: AppRouteRecord) => {
    dialogVisible.value = false
    query.value = ''
    router.push(route.path)
}

watch(dialogVisible, (val) => {
    if (val) {
        nextTick(() => {
            searchInputRef.value?.focus()
        })
        getUserMenuData()
    } else {
        query.value = ''
        selectedIndex.value = 0
    }
})

watch(query, () => {
    selectedIndex.value = 0
})

onMounted(() => {
    if (menuStore.menuList && menuStore.menuList.length > 0) {
        allRoutes.value = menuStore.menuList
    }
})
</script>

<style lang="scss" scoped>
.search-content {
    min-height: 200px;
    max-height: 400px;
    overflow-y: auto;

    &::-webkit-scrollbar {
        width: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background-color: var(--el-border-color);
        border-radius: 2px;
    }
}

.search-hint,
.search-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: var(--text-color-secondary);

    svg {
        margin-bottom: 12px;
        opacity: 0.5;
    }

    span {
        font-size: 14px;
    }
}

.search-results {
    padding: 8px 0;
}

.result-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 8px;
    margin: 0 8px;
    box-sizing: border-box;

    &:hover,
    &.is-active {
        background-color: var(--el-fill-color-light);
    }

    &.is-child {
        .result-icon {
            width: 28px;
            height: 28px;
        }
    }

    .level-indicator {
        display: flex;
        align-items: center;
        height: 16px;
        flex-shrink: 0;

        .connector {
            font-size: 12px;
            color: var(--text-color-secondary);
            white-space: nowrap;
            font-family: monospace;
        }
    }

    .result-icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background-color: var(--el-color-primary-light-9);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--el-color-primary);
        flex-shrink: 0;
    }

    .result-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;

        .result-title {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-color);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .result-path {
            font-size: 12px;
            color: var(--text-color-secondary);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }

    .result-arrow {
        color: var(--text-color-secondary);
        opacity: 0;
        transition: opacity 0.2s ease;

        .is-active & {
            opacity: 1;
        }
    }
}

:deep(.el-dialog .el-dialog__header) {
    padding: 0 !important;
    margin: 0 !important;
    padding-bottom: 0 !important;
    border-bottom: none !important;
}

:deep(.el-dialog__header.dialog-header) {
    padding: 0 !important;
    margin: 0 !important;
    padding-bottom: 0 !important;
    border-bottom: none !important;
}

.search-input {
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 160px;
    height: 36px;
    padding: 0 10px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;

    &>div {
        display: flex;
        align-items: center;

        span {
            font-size: 13px;
            color: #99A1B7;
            margin-left: 10px;
        }
    }

    .search-keydown {
        border: 1px solid var(--border-color);
        font-size: 12px;
        color: #99A1B7;
        padding: 3px 7px;
        border-radius: 5px;
    }

    .search-wapper {
        position: fixed;
        right: 40%;
        top: 25%;
    }
}
</style>