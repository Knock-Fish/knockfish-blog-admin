<template>
    <div class="workbench">
        <div class="header-section">
            <HeaderCard />
            <StatsCard />
        </div>
        <div class="section">
            <div class="left-section">
                <div class="activity">
                    <div style="flex: 1;">
                        <ChartArticle />
                    </div>
                    <ActivitySection style="flex: 0.5;"/>
                </div>
                <TodoList />
            </div>
            <div class="right-section">
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
</script>

<style lang="scss" scoped>
.workbench {
    box-sizing: border-box;

    .header-section {
        display: flex;
        gap: 15px;

        .header-card {
            flex: 1;
        }

        .stats-card {
            flex: 1;
        }

        @media screen and (max-width: $screen-larger) {
            gap: 0;
            flex-direction: column;
        }
    }


    .section {
        display: flex;
        gap: 15px;

        @media screen and (max-width: $screen-medium) {
            flex-direction: column;
        }

        .left-section {
            display: flex;
            flex-direction: column;
            flex: 1;
            gap: 15px;

            .activity {
                display: flex;
                gap: 15px;
            }
        }

        .right-section {
            display: flex;
            flex-direction: column;
            gap: 15px;
            flex: 0.4;

            @media screen and (max-width: $screen-larger) {
                flex: 1;
            }
        }
    }

    @media screen and (max-width: $screen-small) {
        padding: 10px;

        .section {
            flex-direction: column;
        }
    }
}

@media (max-width: 1024px) {
    .workbench {
        padding: 15px;
    }
}
</style>