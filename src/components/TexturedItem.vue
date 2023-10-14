<template>
  <div class="item" :style="itemStyle">
    <div class="texture" :style="textureStyle"></div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  transform: String,
  textureSrc: String,
  textureTransform: String
})

const itemStyle = computed(() => ({
  transform: props.transform
}))

const textureStyle = computed(() => ({
  backgroundImage: `url("${props.textureSrc}")`,
  transform: props.textureTransform
}))
</script>
<style scoped>
.item {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0% 0%;
  width: 100px;
  height: 100px;
  clip-path: polygon(0 0, 100% 0, 0 100%);
}

.texture {
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: 0 0;
}
</style>