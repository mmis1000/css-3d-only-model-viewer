<script setup lang="ts">
import { mat4, vec3 } from 'gl-matrix';
import { transformMatrixFromTwoPlane } from './utils/matrixHelper';
import { computed, ref } from 'vue';

const TARGET_WIDTH = 300

const light = vec3.fromValues(-1, 1, 1)
vec3.normalize(light, light)

const points: [vec3, vec3, vec3] = [
  [0, 0, 0],
  [100, 0, 0],
  [0, 100, 0],
]
const targets: [vec3, vec3, vec3][] = [
  [
    [0, 0, 0],
    [100, 0, 0],
    [0, 100, 0],
  ],
  [
    [0, 100, 0],
    [100, 0, 0],
    [100, 100, 0],
  ],
  [
    [100, 0, 100],
    [0, 0, 100],
    [0, 100, 100],
  ],
  [
    [100, 0, 100],
    [0, 100, 100],
    [100, 100, 100],
  ],
  [
    [0, 0, 0],
    [0, 0, 100],
    [0, 100, 0],
  ],
  [
    [0, 100, 0],
    [0, 0, 100],
    [0, 100, 100],
  ],
  [
    [100, 0, 100],
    [100, 0, 0],
    [100, 100, 0],
  ],
  [
    [100, 0, 100],
    [100, 100, 0],
    [100, 100, 100],
  ],
  [
    [0, 0, 0],
    [0, 0, 100],
    [100, 0, 0],
  ],
  [
    [100, 0, 0],
    [0, 0, 100],
    [100, 0, 100],
  ],
  [
    [0, 100, 100],
    [0, 100, 0],
    [100, 100, 0],
  ],
  [
    [0, 100, 100],
    [100, 100, 0],
    [100, 100, 100],
  ]
]
const onDrop = (ev: DragEvent) => {
  ev.preventDefault();

  if (ev.dataTransfer == null) return

  if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    [...ev.dataTransfer.items].forEach((item, i) => {
      // If dropped items aren't files, reject them
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          console.log(`… file[${i}].name = ${file.name}`);
        handleFile(file)
        }
      }
    });
  } else {
    // Use DataTransfer interface to access the file(s)
    [...ev.dataTransfer.files].forEach((file, i) => {
      console.log(`… file[${i}].name = ${file.name}`);
      handleFile(file)
    });
  }
}
const fileInput = ref<HTMLInputElement>()
const onFileChange = (ev: Event) => {
  const target: HTMLInputElement = ev.currentTarget as HTMLInputElement
  if (target.files != null && (target.files.length ?? 0) > 0) {
    for (let i = 0; i < target.files.length; i++) {
      console.log(target.files[i])
      handleFile(target.files[i])
    }
  }
  target.value = ''
}
const handleFile = async (file: File) => {
  const res = await new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.readAsText(file)
    reader.onload = () => {
      resolve(reader.result as string)
    }
  })
  console.log(res)
  handleText(res)
}
const handleText = (text: string) => {
  const lines = text.split(/\r?\n/g).filter(i => i.trim() !== '')
  const entries = lines.map(i => {
    const [type, ...values] = i.split(/\s+/g)
    if (type === 'f') {
      return ['f' as 'f', ...(values).map(i => Number(i.split('/')[0])) as number[]] as const
    }
    if (type === 'v') {
      return ['v' as 'v', ...(values).map(Number) as [number, number, number]] as const
    }
    return null
  }).filter(<T>(i: T): i is NonNullable<T> => i != null)
  console.log(entries)
  const vertexs = entries.filter(<T extends (typeof entries)[number]>(i: T): i is T & {0: 'v'} => i[0] === 'v')
  const faceIds = entries.filter(<T extends (typeof entries)[number]>(i: T): i is T & {0: 'f'}  => i[0] === 'f').map(i => i.slice(1)) as number[][]
  console.log(vertexs, faces)

  const maxX = Math.max(...vertexs.map(i => i[1]))
  const minX = Math.min(...vertexs.map(i => i[1]))
  const maxY = Math.max(...vertexs.map(i => i[2]))
  const minY = Math.min(...vertexs.map(i => i[2]))
  const maxZ = Math.max(...vertexs.map(i => i[3]))
  const minZ = Math.min(...vertexs.map(i => i[3]))

  const lX = maxX - minX
  const lY = maxY - minY
  const lZ = maxZ - minZ

  const scale = TARGET_WIDTH / Math.max(lX, lY, lZ)
  const xOffset = (maxX + minX) / 2 * -1
  const yOffset = (maxY + minY) / 2 * -1
  const zOffset = (maxZ + minZ) / 2 * -1

  const translate = (p: vec3): vec3 => {
    return [
      (p[0] + xOffset) * scale,
      (p[1] + yOffset) * scale,
      (p[2] + zOffset) * scale
    ]
  }
  const mappedFaces: [vec3, vec3, vec3][] = []

  for (const face of faceIds) {
    for (let i = 1; i < face.length - 1; i++) {
      mappedFaces.push([
        translate(vertexs[face[0] - 1].slice(1) as vec3),
        translate(vertexs[face[1 + i - 1] - 1].slice(1) as vec3),
        translate(vertexs[face[2 + i - 1] - 1].slice(1) as vec3)
      ])
    }
  }

  faces.value = mappedFaces
}


const faces = ref<[vec3, vec3, vec3][]>([
  ...targets
])

const mappedTransforms = computed(() => {
  
  const v1 = vec3.create()
  const v2 = vec3.create()
  const n = vec3.create()
  const sum = vec3.create()

  return faces.value.map((face) => {
    const matrix = mat4.create()
    transformMatrixFromTwoPlane(matrix, ...points, ...face)
    const transposed = mat4.create()
    mat4.transpose(transposed, matrix)

    vec3.subtract(v1, face[2], face[0])
    vec3.subtract(v2, face[1], face[0])
    vec3.cross(n, v1, v2)
    vec3.normalize(n, n)
    vec3.add(sum, n, light)
    // 0 ~ 1
    const strength = vec3.length(sum) / 2
    const color = `rgba(${255 * strength}, ${255 * strength}, ${255 * strength}, 1)`

    const transform = `matrix3d(${[...transposed].map(String).join(', ')})`
    return  { transform, color }
  })
})
</script>

<template>
  <input class="hidden-input" type="file" ref="fileInput" @change="onFileChange"/>
  <div class="root" @drop="onDrop" @dragover.prevent @click="fileInput?.click()">
    <div class="scene">
      <div class="item" v-for="(item, index) of mappedTransforms" :key="index" :style="{
        transform: item.transform,
        borderLeftColor: item.color
      }"></div>
    </div>
  </div>
</template>

<style scoped>

.hidden-input {
  visibility: hidden;
}

@keyframes r {
  0% {
    transform: scaleY(-1)  rotateX(0deg) rotateY(0deg);
  }
  50% {
    transform: scaleY(-1)  rotateX(180deg) rotateY(180deg);
  }
  100% {
    transform: scaleY(-1)  rotateX(360deg) rotateY(360deg);
  }
}

.root {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  perspective: 800px;
}
.scene {
  width: 0;
  height: 0;
  position: relative;
  transform-style: preserve-3d;
  transform: scaleY(-1) rotateY(100deg);
  animation: 20s infinite linear r;
}
.item {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0% 0%;
  width: 0;
  height: 0;
  border-bottom: 100px solid transparent;
  border-left: 100px solid rgba(100, 100, 100, 0.5);
}
</style>
