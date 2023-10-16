<script setup lang="ts">
import { mat4, vec2, vec3 } from "gl-matrix"
import { computed, ref, shallowRef } from "vue"
import teapot from "./assets/teapot.obj?raw"
import table from "./assets/table.obj?raw"
import tableTexture from "./assets/table.png"
import streetLamp from "./assets/street-lamp.obj?raw"
import lowPolyTree from "./assets/low-poly-tree.obj?raw"
import tree from "./assets/tree.obj?raw"
import Corner from "./components/Corner.vue"
import { mapToTransformAndColor, projectUV } from "./utils/matrixHelper"
import { renderToHtml } from "./utils/exportToHtml"
import { downloadBlob } from "./utils/downloadBlob"
import { ParsedModel, FaceData } from "./interfaces"
import { INITIAL_FACES, LIGHT } from "./constants"
import TexturedItem from "./components/TexturedItem.vue"
import lowPolyTreeTexture from "./assets/low-poly-tree.png"
import block from "./assets/block.obj?raw"
import blockTexture from "./assets/block.png"

const TARGET_WIDTH = 300

// settings
const lightMode = ref<"diffuse" | "normal">("diffuse")
const rotation = ref(true)
const enableTexture = ref(true)

const cameraMatrix = ref(mat4.create())
const resetCamera = () => {
  cameraMatrix.value = mat4.create()
}

const onDrop = (ev: DragEvent) => {
  ev.preventDefault()

  if (ev.dataTransfer == null) return

  if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    ;[...ev.dataTransfer.items].forEach((item, i) => {
      // If dropped items aren't files, reject them
      if (item.kind === "file") {
        const file = item.getAsFile()
        if (file) {
          console.log(`… file[${i}].name = ${file.name}`)
          handleFile(file)
        }
      }
    })
  } else {
    // Use DataTransfer interface to access the file(s)
    ;[...ev.dataTransfer.files].forEach((file, i) => {
      console.log(`… file[${i}].name = ${file.name}`)
      handleFile(file)
    })
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
  target.value = ""
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
  addContent(res, file.name)
  // const res = parseText(res)
}

const addContent = (text: string, filename: string, texture?: string, width = TARGET_WIDTH) => {
  const faces = parseText(text, width)
  samples.value = [
    ...samples.value,
    {
      name: filename,
      faces,
      ...(texture ? { texture } : {})
    }
  ]
}

const parseText = (text: string, width = TARGET_WIDTH) => {
  const lines = text.split(/\r?\n/g).filter((i) => i.trim() !== "")
  const entries = lines
    .map((i) => {
      const [type, ...values] = i.split(/\s+/g)
      if (type === "f") {
        return [
          "f" as "f",
          ...values.map(
            (i) =>
              i.split("/").map((i) => (i != null && i != "" ? Number(i) : undefined)) as [
                v: number,
                vt: number | undefined,
                vn: number | undefined
              ]
          )
        ] as const
      }
      if (type === "v") {
        return ["v" as "v", ...(values.map(Number) as [number, number, number])] as const
      }
      if (type === "vt") {
        return ["vt" as "vt", ...(values.map(Number) as [number, number])] as const
      }
      return null
    })
    .filter(<T>(i: T): i is NonNullable<T> => i != null)
  // console.log(entries)
  const vertexs = entries.filter(<T extends (typeof entries)[number]>(i: T): i is T & { 0: "v" } => i[0] === "v")
  const textureVertexs = entries.filter(
    <T extends (typeof entries)[number]>(i: T): i is T & { 0: "vt" } => i[0] === "vt"
  )
  const faceIds = entries
    .filter(<T extends (typeof entries)[number]>(i: T): i is T & { 0: "f" } => i[0] === "f")
    .map((i) => i.slice(1)) as [v: number, vt: number | undefined, vn: number | undefined][][]
  // console.log(vertexs, faces)

  const maxX = Math.max(...vertexs.map((i) => i[1]))
  const minX = Math.min(...vertexs.map((i) => i[1]))
  const maxY = Math.max(...vertexs.map((i) => i[2]))
  const minY = Math.min(...vertexs.map((i) => i[2]))
  const maxZ = Math.max(...vertexs.map((i) => i[3]))
  const minZ = Math.min(...vertexs.map((i) => i[3]))

  const lX = maxX - minX
  const lY = maxY - minY
  const lZ = maxZ - minZ

  const scale = width / Math.max(lX, lY, lZ)
  const xOffset = ((maxX + minX) / 2) * -1
  const yOffset = ((maxY + minY) / 2) * -1
  const zOffset = ((maxZ + minZ) / 2) * -1

  const translate = (p: vec3): vec3 => {
    return [(p[0] + xOffset) * scale, (p[1] + yOffset) * scale, (p[2] + zOffset) * scale]
  }
  const mappedFaces: FaceData[] = []

  for (const face of faceIds) {
    for (let i = 0; i < face.length - 2; i++) {
      const first = face[0]

      const vertex: [vec3, vec3, vec3] = [
        translate(vertexs[face[0][0] - 1].slice(1) as vec3),
        translate(vertexs[face[1 + i][0] - 1].slice(1) as vec3),
        translate(vertexs[face[2 + i][0] - 1].slice(1) as vec3)
      ]

      const uv: [vec2, vec2, vec2] | undefined =
        first[1] != null
          ? [
              textureVertexs[face[0][1]! - 1].slice(1) as vec2,
              textureVertexs[face[1 + i][1]! - 1].slice(1) as vec2,
              textureVertexs[face[2 + i][1]! - 1].slice(1) as vec2
            ]
          : undefined

      mappedFaces.push({
        vertex,
        uv
      })
    }
  }

  return mappedFaces
}

const selectedModel = shallowRef<ParsedModel | null>(null)

const mappedTransforms = computed(() => {
  return selectedModel.value?.faces.map((face) => {
    const res = mapToTransformAndColor(INITIAL_FACES, face.vertex, lightMode.value, LIGHT)
    const textureTransform =
      enableTexture.value && face.uv
        ? projectUV(face.uv.map((i) => [i[0] * 100, 100 - i[1] * 100]) as [vec2, vec2, vec2], [
            [0, 0],
            [100, 0],
            [0, 100]
          ])
        : undefined
    return {
      ...res,
      textureTransform
    }
  })
})

const samples = shallowRef<ParsedModel[]>([])

addContent(block, "block.obj", blockTexture, 100)
addContent(table, "table.obj", tableTexture)
addContent(lowPolyTree, "low-poly-tree.obj", lowPolyTreeTexture)
addContent(streetLamp, "street-lamp.obj")
addContent(teapot, "teapot.obj")
addContent(tree, "tree.obj")
selectedModel.value = samples.value[0]

const loadSample = (newData: ParsedModel) => {
  resetCamera()
  selectedModel.value = newData
}

const exportToFile = () => {
  const current = selectedModel.value
  if (current == null) return
  const html = renderToHtml(current.name, current.faces, lightMode.value, rotation.value)
  console.log(html)
  const blob = new Blob([html], { type: "text/html" })
  downloadBlob(blob, current.name + ".html")
}
const moving = ref(false)
const firstPoint = shallowRef<[number, number]>([0, 0])
const secondPoint = shallowRef<[number, number]>([0, 0])
const onPointerDown = (ev: PointerEvent) => {
  moving.value = true
  firstPoint.value = [
    ev.clientX,
    ev.clientY
  ]
  secondPoint.value = [
    ev.clientX,
    ev.clientY
  ]
  console.log(firstPoint.value)
}
const onPointerMove = (ev: PointerEvent) => {
  if (moving.value) {
    secondPoint.value = [
      ev.clientX,
      ev.clientY
    ]
    console.log(secondPoint.value)
  }
}
const onPointerUp = (_ev: PointerEvent) => {
  const normal = [secondPoint.value[1] - firstPoint.value[1], secondPoint.value[0] - firstPoint.value[0], ] as const
  const distance = vec2.distance(firstPoint.value, secondPoint.value)
  const nm = mat4.create()
  mat4.rotate(nm, nm, distance / 200 * Math.PI, [...normal, 0])
  mat4.mul(nm, nm, cameraMatrix.value)
  cameraMatrix.value = nm

  moving.value = false
  firstPoint.value = [0, 0]
  secondPoint.value = [0, 0]
}
const onPointerCancel = (_ev: PointerEvent) => {
  moving.value = false
  firstPoint.value = [0, 0]
  secondPoint.value = [0, 0]
}
const liveCameraMatrix = computed(() => {
  if (!moving.value || vec2.equals(firstPoint.value, secondPoint.value)) {
    return cameraMatrix.value
  } else {
    const normal = [secondPoint.value[1] - firstPoint.value[1], secondPoint.value[0] - firstPoint.value[0], ] as const
    const distance = vec2.distance(firstPoint.value, secondPoint.value)
    const nm = mat4.create()
    mat4.rotate(nm, nm, distance / 200 * Math.PI, [...normal, 0])
    mat4.mul(nm, nm, cameraMatrix.value)
    return nm
  }
})
const cameraTransform = computed(() => {
  // invert y axis first because it is how html axis works
  return `scaleY(-1) matrix3d(${[...liveCameraMatrix.value].join(',')})`
})
</script>

<template>
  <input class="hidden-input" type="file" ref="fileInput" @change="onFileChange" />
  <div class="app" @drop="onDrop" @dragover.prevent>
    <div class="root" @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerCancel">
      <div v-if="selectedModel" class="scene" :class="{ rotation }" :style="rotation ? {} : { transform: cameraTransform }">
        <template v-for="(item, _index) of mappedTransforms" :key="_index">
          <template v-if="!enableTexture || !item.textureTransform || selectedModel.texture == null">
            <div
              class="item"
              :style="{
                transform: item.transform,
                borderLeftColor: item.color
              }"
            ></div>
          </template>
          <template v-else>
            <TexturedItem
              :transform="item.transform"
              :texture-transform="item.textureTransform"
              :texture-src="selectedModel.texture"
            ></TexturedItem>
          </template>
        </template>
      </div>
    </div>
    <div class="samples">
      <button class="sample add" @click="fileInput?.click()"></button>
      <button class="sample" v-for="(sample, index) of samples" :key="index" @click="loadSample(sample)">
        {{ sample.name }} <br />
        {{ sample.faces.length }} faces
      </button>
    </div>
    <div class="controls">
      <button class="control" @click="exportToFile">Export as html</button>
      <button class="control" @click="enableTexture = !enableTexture">texture: {{ enableTexture ? "on" : "off" }}</button>
      <button class="control" @click="rotation = !rotation">Rotation: {{ rotation ? "on" : "off" }}</button>
      <button class="control" @click="lightMode = lightMode === 'diffuse' ? 'normal' : 'diffuse'">
        Light: {{ lightMode }}
      </button>
    </div>
  </div>
  <Corner />
</template>

<style scoped>
.hidden-input {
  visibility: hidden;
}

@keyframes r {
  0% {
    transform: scaleY(-1) rotateX(0deg) rotateY(1deg);
  }

  50% {
    transform: scaleY(-1) rotateX(180deg) rotateY(181deg);
  }

  100% {
    transform: scaleY(-1) rotateX(360deg) rotateY(361deg);
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
  touch-action: none;
}

.scene {
  width: 0;
  height: 0;
  position: relative;
  transform-style: preserve-3d;
  transform: scaleY(-1) rotateY(1deg);
}

.scene.rotation {
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

.samples {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
  overflow-x: auto;

  border-top: 4px solid #777;
}

.sample {
  margin: 4px;
  width: 100px;
  flex: 0 0 auto;
  border: 4px solid #777;
  border-radius: 4px;
  position: relative;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #333;
  color: white;
}

.sample.add::after,
.sample.add::before {
  display: block;
  position: absolute;
  content: "";
  left: 50%;
  top: 50%;
  height: 4px;
  width: 32px;
  background: #aaa;
}

.sample.add::after {
  transform: translate(-50%, -50%);
}

.sample.add::before {
  transform: translate(-50%, -50%) rotate(90deg);
}

.controls {
  position: fixed;
  right: 0;
  bottom: 104px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow: hidden;
}

.control {
  height: 40px;
  border-radius: 4px;
  border: 4px solid #777;
  background: transparent;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px;
  color: white;
}
</style>
