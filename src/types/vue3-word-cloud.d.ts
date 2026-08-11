declare module 'vue3-word-cloud' {
    import type { DefineComponent } from 'vue';
    const Vue3WordCloud: DefineComponent<{
        words: [string, number][];
        color?: ((word: [string, number]) => string);
        fontFamily?: string;
        showTooltip?: boolean;
    }, {}, any>;
    export default Vue3WordCloud;
}