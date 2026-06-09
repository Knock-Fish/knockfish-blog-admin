<template>
    <div class="exception-page">
        <div class="content">
            <div class="error-code">
                <span class="code">{{props.code}}</span>
            </div>
            <div class="error-info">
                <h1 class="title">{{props.errorTitle}}</h1>
                <p class="description">{{props.errorDesc}}</p>
            </div>
            <div class="actions">
                <ElButton type="primary" size="large" @click="goHome">
                    返回首页
                </ElButton>
                <ElButton size="large" @click="goBack">
                    返回上页
                </ElButton>
            </div>
        </div>
        <div class="decoration">
            <div class="bubble"></div>
            <div class="bubble"></div>
            <div class="bubble"></div>
            <div class="bubble"></div>
            <div class="bubble"></div>
        </div>
    </div>
</template>

<script setup lang='ts'>
const router = useRouter()
interface Props{
    code?: number | string
    errorTitle?: string
    errorDesc?: string
}
const props = defineProps<Props>()
const goHome = () => {
    router.push('/')
}

const goBack = () => {
    router.go(-1)
}
</script>

<style lang="scss" scoped>
.exception-page {
    position: relative;
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #8c9ff4 0%, #a071cf 100%);
    overflow: hidden;

    .content {
        position: relative;
        z-index: 10;
        text-align: center;
        color: #fff;

        .error-code {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 40px;
            font-size: 150px;
            font-weight: bold;
            font-family: 'Arial', sans-serif;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);

            .code {
                animation: float 3s ease-in-out infinite;
            }
        }

        .error-info {
            margin-bottom: 50px;

            .title {
                font-size: 32px;
                margin: 0 0 20px 0;
                font-weight: 600;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
            }

            .description {
                font-size: 18px;
                margin: 0;
                opacity: 0.9;
            }
        }

        .actions {
            display: flex;
            gap: 20px;
            justify-content: center;
        }
    }

    .decoration {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        pointer-events: none;

        .bubble {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            animation: rise 10s infinite ease-in;

            &:nth-child(1) {
                width: 40px;
                height: 40px;
                left: 10%;
                animation-delay: 0s;
            }

            &:nth-child(2) {
                width: 20px;
                height: 20px;
                left: 20%;
                animation-delay: 2s;
            }

            &:nth-child(3) {
                width: 50px;
                height: 50px;
                left: 35%;
                animation-delay: 4s;
            }

            &:nth-child(4) {
                width: 80px;
                height: 80px;
                left: 50%;
                animation-delay: 1s;
            }

            &:nth-child(5) {
                width: 35px;
                height: 35px;
                left: 75%;
                animation-delay: 3s;
            }
        }
    }
}

@keyframes float {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-20px);
    }
}

@keyframes rise {
    0% {
        bottom: -100px;
        transform: translateX(0);
    }

    50% {
        transform: translateX(100px);
    }

    100% {
        bottom: 1080px;
        transform: translateX(-200px);
    }
}

@media (max-width: 768px) {
    .exception-page {
        .content {
            .error-code {
                font-size: 100px;

                .code-0 {
                    :deep(svg) {
                        width: 80px !important;
                        height: 80px !important;
                    }
                }
            }

            .error-info {
                .title {
                    font-size: 24px;
                }

                .description {
                    font-size: 14px;
                }
            }

            .actions {
                flex-direction: column;
                padding: 0 20px;

                .el-button {
                    margin: 0 !important;
                }
            }
        }
    }
}
</style>
