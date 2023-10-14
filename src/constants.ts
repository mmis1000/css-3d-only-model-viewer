import { vec3 } from "gl-matrix";

export const INITIAL_FACES: [vec3, vec3, vec3] = [
  [0, 0, 0],
  [100, 0, 0],
  [0, 100, 0]
]


export const LIGHT = vec3.fromValues(-1, -2, -3)
vec3.normalize(LIGHT, LIGHT)
