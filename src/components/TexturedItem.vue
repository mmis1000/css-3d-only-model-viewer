<template>
  <div class="textured-item" :style="itemStyle">
    <div class="texture" :style="textureStyle"></div>
  </div>
</template>
<script setup lang="ts">
import { vec2 } from 'gl-matrix';
import { PropType, computed } from 'vue';
import { projectUV } from '../utils/matrixHelper';

const props = defineProps({
  transform: String,
  textureSrc: String,
  textureUv: Array as unknown as PropType<[vec2, vec2, vec2]>
})

const itemStyle = computed(() => ({
  transform: props.transform
}))

const textureTransform = computed(() => {
  if (props.textureUv == null) {
    return null
  }
  return projectUV(props.textureUv.map((i) => [i[0] * 100, 100 - i[1] * 100]) as [vec2, vec2, vec2], [
    [0, 0],
    [100, 0],
    [0, 100]
  ])
})

const textureStyle = computed(() => ({
  backgroundImage: `url("${props.textureSrc}")`,
  transform: textureTransform.value ?? ''
}))
</script>
<style scoped>
.textured-item {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0% 0%;
  width: 100px;
  height: 100px;
  clip-path: polygon(0 0, 100% 0, 0 100%);
  background-color: black;
  user-select: none;
}

.texture {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;

  transform-origin: 0 0;

  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: 0 0;
  background-color: black;
}
</style>