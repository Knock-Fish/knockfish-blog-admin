<template>
    <div class="layout-container">
        <!-- 侧边栏 -->
        <SidebarMenu />
        <!-- 头部 -->
        <HeaderBar />
        <!-- 菜单选项卡 -->
        <WorkTab />
        <!-- 页面内容 -->
        <PageContent />
    </div>
</template>

<script setup lang='ts'>


</script>

<style lang="scss" scoped>
.layout-container {
    position: relative;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    min-height: 100vh;

    // 添加背景图片
    // &::before {
    //     content: '';
    //     position: fixed;
    //     top: 0;
    //     left: 0;
    //     right: 0;
    //     bottom: 0;
    //     z-index: 20010; // 设置较低的层级
    //     background-image: url('../../assets/imgs/laffy.jpg'); // 替换为你的图片路径
    //     background-size: cover;
    //     background-position: center;
    //     background-repeat: no-repeat;
    //     background-attachment: fixed; // 固定背景
    //     opacity: 0.3; // 透明度，让背景更淡
    //     pointer-events: none; // 确保不会干扰点击事件
    // }

}

// 全局背景
// body {
//     position: relative;
//     margin: 0;
//     padding: 0;
//     min-height: 100vh;

//     // 添加背景图片
//     &::before {
//         content: '';
//         position: fixed;
//         top: 0;
//         left: 0;
//         right: 0;
//         bottom: 0;
//         z-index: 10000; // 设置较低的层级
//         background-image: url('./assets/imgs/laffy.jpg'); // 替换为你的图片路径
//         background-size: cover;
//         background-position: center;
//         background-repeat: no-repeat;
//         background-attachment: fixed; // 固定背景
//         opacity: 0.3; // 透明度，让背景更淡
//         pointer-events: none; // 确保不会干扰点击事件
//     }
// }

// // 确保主内容区域在背景之上
// #app {
//     position: relative;
//     z-index: 1;
//     background: transparent;
// }

// // el-dialog 遮罩层默认层级是更高的，会自动覆盖
// .el-overlay {
//     z-index: 2000 !important; // element-plus 遮罩默认层级

//     &::before {
//         // 遮罩层有自己的背景，会覆盖页面背景
//         background-color: rgba(0, 0, 0, 0.5);
//     }
// }</style>