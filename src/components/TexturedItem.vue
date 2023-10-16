<template>
  <div class="textured-item" :style="itemStyle">
    <div class="texture" :style="textureStyle"></div>
  </div>
</template>
<script setup lang="ts">
import { vec2 } from 'gl-matrix';
import { PropType, computed } from 'vue';
import { projectUV } from '../utils/matrixHelper';

// safari will just crash if you don't crop the background it first
const PRE_CROP =  /safari/i.test(navigator.userAgent)

const props = defineProps({
  transform: String,
  textureSrc: String,
  textureUv: Array as unknown as PropType<[vec2, vec2, vec2]>
})

const itemStyle = computed(() => ({
  transform: props.transform
}))

const uvBoundary = computed(() => {
  if (props.textureUv == null) {
    return null
  }

  const us = props.textureUv.map(i => i[0])
  const vs = props.textureUv.map(i => i[1])
  const minU = Math.min(...us)
  const maxU = Math.max(...us)
  const minV = Math.min(...vs)
  const maxV = Math.max(...vs)

  return [[minU, maxU], [minV, maxV]]
})

const croppingStyle = computed(() => {
  if (uvBoundary.value == null || props.textureUv == null) return null

  const [[minU, maxU], [minV, maxV]] = uvBoundary.value

  const xScale = 1 / (maxU - minU)
  const yScale = 1 / (maxV - minV)

  // wavefront: u ↑ v →
  // web: x → y ↓
  const xOrigin = minU
  const yOrigin = 1 - maxV

  const xSize = `${xScale * 100}%`
  const ySize = `${yScale * 100}%`
  const xOffset = `${-(xOrigin * xScale * 100)}px`
  const yOffset = `${-(yOrigin * yScale * 100)}px`

  const newUV = props.textureUv.map(([u, v]): vec2 => {
    const newU = (u - minU) * xScale
    const newV = 1 - (((1 - v) - (1 - maxV)) * yScale)
    return [newU, newV]
  })

  return {
    newUV,
    backgroundSize: `${xSize} ${ySize}`,
    backgroundPosition: `${xOffset} ${yOffset}`
  }
})

const textureTransform = computed(() => {
  if (PRE_CROP) {
    if (croppingStyle.value?.newUV == null) {
      return null
    }
    return projectUV(croppingStyle.value.newUV.map((i) => [i[0] * 100, 100 - i[1] * 100]) as [vec2, vec2, vec2], [
      [0, 0],
      [100, 0],
      [0, 100]
    ])
  } else {
    if (props.textureUv == null) {
      return null
    }
    return projectUV(props.textureUv.map((i) => [i[0] * 100, 100 - i[1] * 100]) as [vec2, vec2, vec2], [
      [0, 0],
      [100, 0],
      [0, 100]
    ])
  }
})

const textureStyle = computed(() => ({
  backgroundImage: `url("${props.textureSrc}")`,
  transform: textureTransform.value ?? '',
  ...(PRE_CROP ? (croppingStyle.value ?? {}) : {})
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