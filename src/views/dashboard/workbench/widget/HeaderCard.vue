<template>
    <div class="header-card">
        <div class="greeting-section">
            <div class="greeting-text">
                <h2>{{ greetingText }}</h2>
                <p class="username">{{ userInfo.nickname }}</p>
            </div>
            <div class="avatar-wrapper">
                <img :src="userInfo.avatar" class="avatar" />
                <div class="status-dot online"></div>
            </div>
        </div>
        <div class="time-section">
            <div class="current-time">{{ currentTime }}</div>
            <div class="current-date">{{ currentDate }}</div>
        </div>
    </div>
</template>
<script setup lang='ts'>
import { useUserStore } from "@/store/modules/user"
const userStore = useUserStore()
const userInfo = ref({
    nickname: '',
    avatar: ''
})
const currentTime = ref('')
const currentDate = ref('')
let timer: number | null = null
// 更新时间
const updateTime = () => {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const seconds = now.getSeconds().toString().padStart(2, '0')
    currentTime.value = `${hours}:${minutes}:${seconds}`

    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    const weekDay = weekDays[now.getDay()]
    currentDate.value = `${year}年${month}月${day}日 ${weekDay}`
}
// 获取问候语
const greetingText = computed(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 9) {
        return '早上好'
    } else if (hour >= 9 && hour < 12) {
        return '上午好'
    } else if (hour >= 12 && hour < 14) {
        return '中午好'
    } else if (hour >= 14 && hour < 18) {
        return '下午好'
    } else if (hour >= 18 && hour < 22) {
        return '晚上好'
    } else {
        return '夜深了，请注意休息'
    }
})
onMounted(() => {
    userInfo.value = {
        nickname: userStore.info.nickname || '管理员',
        avatar: userStore.info.avatar || ''
    }
    updateTime()
    timer = window.setInterval(updateTime, 1000)
})
onUnmounted(() => {
    if (timer) {
        clearInterval(timer)
    }
})
</script>
<style lang="scss" scoped>
/* 顶部信息卡片 */
.header-card {
    box-sizing: border-box;
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    background-color: var(--card-color);
    border: 1px solid var(--border-color);
    border-radius: 7px;
    color: var(--text-color);
    padding: 0 20px;

    .greeting-section {
        display: flex;
        align-items: center;
        gap: 20px;
    }

    .greeting-text {
        h2 {
            font-size: 20px;
            font-weight: 600;
            margin: 0;
            margin-bottom: 5px;
        }

        .username {
            font-size: 16px;
            opacity: 0.9;
            margin: 0;
        }
    }

    .avatar-wrapper {
        position: relative;
        width: 60px;
        height: 60px;

        .avatar {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 3px solid rgba(255, 255, 255, 0.5);
            object-fit: cover;
        }

        .status-dot {
            position: absolute;
            bottom: 0px;
            right: 0px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            border: 2px solid #fff;

            &.online {
                background-color: #67c23a;
            }
        }
    }

    .time-section {
        text-align: right;

        .current-time {
            font-size: 36px;
            font-weight: 300;
            font-family: 'SF Mono', Monaco, 'Courier New', monospace;
            margin-bottom: 5px;
        }

        .current-date {
            font-size: 14px;
            opacity: 0.9;
        }
    }

    @media (max-width: $screen-larger) {
        padding: 20px;

        .greeting-text h2 {
            font-size: 24px;
        }

        .avatar-wrapper {
            width: 60px;
            height: 60px;
        }

        .current-time {
            font-size: 28px !important;
        }
    }

    @media (max-width: $screen-medium) {
        flex-direction: column;
        gap: 20px;
        text-align: center;

        .time-section {
            text-align: center;
        }

        .greeting-text h2 {
            font-size: 22px;
        }
    }

    @media (max-width: $screen-small) {
        padding: 15px;

        .current-time {
            font-size: 24px;
        }
    }
}
</style>