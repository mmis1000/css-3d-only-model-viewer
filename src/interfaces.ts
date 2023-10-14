import { vec2, vec3 } from "gl-matrix"

export interface FaceData {
  vertex: [vec3, vec3, vec3],
  uv?: [vec2, vec2, vec2]
}

export interface ParsedModel {
  name: string
  faces: FaceData[]
}
