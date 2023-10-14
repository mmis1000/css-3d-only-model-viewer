import { mat3, mat4, vec2, vec3 } from "gl-matrix"

export let getPoint4: (out: vec3, p1: vec3, p2: vec3, p3: vec3) => void

{
  const v1 = vec3.create()
  const v2 = vec3.create()
  const normal = vec3.create()

  getPoint4 = function getPoint4(out: vec3, p1: vec3, p2: vec3, p3: vec3) {
    vec3.subtract(v1, p2, p1)
    vec3.subtract(v2, p3, p1)
    vec3.cross(normal, v1, v2)
    vec3.add(out, p1, normal)
  }
}

export let threePointToMatrix: (out: mat4, p1: vec3, p2: vec3, p3: vec3) => void

{
  const p4 = vec3.create()
  threePointToMatrix = (out: mat4, p1: vec3, p2: vec3, p3: vec3) => {
    getPoint4(p4, p1, p2, p3)
    out[0] = p1[0]
    out[1] = p2[0]
    out[2] = p3[0]
    out[3] = p4[0]
    out[4] = p1[1]
    out[5] = p2[1]
    out[6] = p3[1]
    out[7] = p4[1]
    out[8] = p1[2]
    out[9] = p2[2]
    out[10] = p3[2]
    out[11] = p4[2]
    out[12] = 1
    out[13] = 1
    out[14] = 1
    out[15] = 1
  }
}

export let transformMatrixFromTwoPlane: (
  out: mat4,
  p1: vec3,
  p2: vec3,
  p3: vec3,
  t1: vec3,
  t2: vec3,
  t3: vec3
) => void

{
  const plane1 = mat4.create()
  const inverted = mat4.create()
  const plane2 = mat4.create()

  transformMatrixFromTwoPlane = (
    out: mat4,
    p1: vec3,
    p2: vec3,
    p3: vec3,
    t1: vec3,
    t2: vec3,
    t3: vec3
  ) => {
    threePointToMatrix(plane1, p1, p2, p3)
    mat4.invert(inverted, plane1)
    threePointToMatrix(plane2, t1, t2, t3)

    mat4.mul(out, inverted, plane2)
  }
}

export let mapToTransformAndColor: (
  initialFace: [vec3, vec3, vec3],
  face: [vec3, vec3, vec3],
  lightMode: "diffuse" | "normal",
  light: vec3
) => { transform: string; color: string }
{
  const v1 = vec3.create()
  const v2 = vec3.create()
  const n = vec3.create()
  const sum = vec3.create()

  mapToTransformAndColor = (
    initialFace: [vec3, vec3, vec3],
    face: [vec3, vec3, vec3],
    lightMode: "diffuse" | "normal",
    light: vec3
  ) => {
    const matrix = mat4.create()
    transformMatrixFromTwoPlane(matrix, ...initialFace, ...face)
    const transposed = mat4.create()
    mat4.transpose(transposed, matrix)

    if (lightMode === "diffuse") {
      vec3.subtract(v1, face[2], face[0])
      vec3.subtract(v2, face[1], face[0])
      vec3.cross(n, v1, v2)
      vec3.normalize(n, n)
      vec3.add(sum, n, light)
      // 0 ~ 1
      const strength = vec3.length(sum) / 2
      const color = `rgba(${~~(255 * strength)}, ${~~(255 * strength)}, ${~~(255 * strength)}, 1)`

      const transform = `matrix3d(${[...transposed].map(String).join(", ")})`
      return { transform, color }
    } else {
      vec3.subtract(v1, face[2], face[0])
      vec3.subtract(v2, face[1], face[0])
      vec3.cross(n, v1, v2)
      vec3.normalize(n, n)
      const r = Math.abs(n[0] * 256)
      const g = Math.abs(n[1] * 256)
      const b = Math.abs(n[2] * 256)
      const color = `rgba(${~~r}, ${~~g}, ${~~b}, 1)`

      const transform = `matrix3d(${[...transposed].map(String).join(", ")})`
      return { transform, color }
    }
  }
}

export let projectUV: (
  initialFace: [vec2, vec2, vec2],
  face: [vec2, vec2, vec2],
) => string

{
  const sourceInverted = mat3.create()
  const result = mat3.create()
  const transposed = mat3.create()
  projectUV = (
    initialFace: [vec2, vec2, vec2],
    face: [vec2, vec2, vec2],
  ): string => {
    const matrix3Source = mat3.fromValues(
      initialFace[0][0], initialFace[1][0], initialFace[2][0],
      initialFace[0][1], initialFace[1][1], initialFace[2][1],
      1, 1, 1
    )
    mat3.invert(sourceInverted, matrix3Source)
    const matrix3Target = mat3.fromValues(
      face[0][0], face[1][0], face[2][0],
      face[0][1], face[1][1], face[2][1],
      1, 1, 1
    )
    mat3.mul(result, sourceInverted, matrix3Target)
    mat3.transpose(transposed, result)
    const transposed2dMatrix = [
      transposed[0], transposed[1],
      transposed[3], transposed[4],
      transposed[6], transposed[7]
    ]
    const transform = `matrix(${[...transposed2dMatrix].map(String).join(", ")})`
    return transform
  }
}