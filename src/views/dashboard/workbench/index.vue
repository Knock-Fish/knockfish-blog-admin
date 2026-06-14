<template>
    <div class="workbench">
        <div class="header-section">
            <HeaderCard style="flex: 1;"/>
            <StatsCard style="flex: 1;"/>
        </div>
        <div class="section">
            <div class="left-section">
                <ChartArticle />
                <div class="activity">
                    <ActivitySection style="flex: 0.8;" />
                    <TodoList style="flex: 1;" />
                </div>
            </div>
            <div class="right-section">
                <PieChart />
                <QuickActions />
                <QuickLinks />
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import HeaderCard from './widget/HeaderCard.vue'
import ActivitySection from './widget/ActivitySection.vue'
import QuickActions from './widget/QuickActions.vue'
import QuickLinks from './widget/QuickLinks.vue'
import StatsCard from './widget/StatsCard.vue'
import TodoList from './widget/TodoList.vue'
import ChartArticle from './widget/ChartArticle.vue'
import PieChart from "./widget/PieChart.vue"
</script>

<style lang="scss" scoped>
.workbench {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 15px;

    .header-section {
        box-sizing: border-box;
        height: 95px;
        display: flex;
        gap: 10px;

        @media screen and (max-width: 1024px) {
            height: 100%;
            flex-direction: column;
        }
    }

    .section {
        display: flex;
        gap: 10px;
        width: 100%;

        .left-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 10px;
            min-width: 0;

            .activity {
                display: flex;
                gap: 10px;

                @media screen and (max-width: 768px) {
                    flex-direction: column;
                }
            }
        }

        .right-section {
            // flex: 0.4;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        /* 小屏幕自动垂直排列 */
        @media screen and (max-width: 1024px) {
            flex-direction: column;

            .left-section,
            .right-section {
                flex: 1;
                width: 100%;
            }

            .right-section {
                flex: 1;
            }
        }
    }

    @media screen and (max-width: 768px) {
        padding: 10px;
    }
}
</style>