<script setup>
const petals = ref([])

const generatePetals = async () => {
  const count = 20
  for (let i = 0; i < count; i++) {
    petals.value.push({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 15 + 10,
      delay: Math.random() * 10,
      duration: Math.random() * 10 + 8,
      opacity: Math.random() * 0.5 + 0.3,
      sway: Math.random() * 20 + 10
    })
  }
}

onMounted(async () => {
  await generatePetals()
})
</script>

<template>
  <div class="bg-container">
    <div class="decorations">
      <div
        v-for="petal in petals"
        :key="petal.id"
        class="sakura-petal"
        :style="{
          left: petal.left + '%',
          fontSize: petal.size + 'px',
          opacity: petal.opacity,
          animationDelay: petal.delay + 's',
          animationDuration: petal.duration + 's',
          '--sway': petal.sway + 'px'
        }"
      >🌸</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bg-container {
  position: fixed;
  inset: 0;
  // background: linear-gradient(135deg, #FFF9FA 0%, #F5F0F7 50%, #FFF0F5 100%);
  background-size: cover;
  background: url("../../assets/imgs/sakura.webp") no-repeat center center fixed;
  background-size: cover;
  z-index: -1;
  overflow: hidden;
}

.decorations {
  position: absolute;
  inset: 0;
  pointer-events: none;

  .sakura-petal {
    position: absolute;
    top: -40px;
    animation: fall linear infinite;
  }
}

@keyframes fall {
  0% {
    transform: translateY(-40px) translateX(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  25% {
    transform: translateY(25vh) translateX(var(--sway, 15px)) rotate(90deg);
  }
  50% {
    transform: translateY(50vh) translateX(calc(-1 * var(--sway, 15px))) rotate(180deg);
  }
  75% {
    transform: translateY(75vh) translateX(var(--sway, 15px)) rotate(270deg);
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) translateX(0) rotate(360deg);
    opacity: 0;
  }
}
</style>
