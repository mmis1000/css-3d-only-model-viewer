import { mat4, vec3 } from "gl-matrix"

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
        out[0] = p1[0];
        out[1] = p2[0];
        out[2] = p3[0];
        out[3] = p4[0];
        out[4] = p1[1];
        out[5] = p2[1];
        out[6] = p3[1];
        out[7] = p4[1];
        out[8] = p1[2];
        out[9] = p2[2];
        out[10] = p3[2];
        out[11] = p4[2];
        out[12] = 1;
        out[13] = 1;
        out[14] = 1;
        out[15] = 1;
    }
}

export let transformMatrixFromTwoPlane: (out: mat4, p1: vec3, p2: vec3, p3: vec3, t1: vec3, t2: vec3, t3: vec3) => void

{
    const plane1 = mat4.create()
    const inverted = mat4.create()
    const plane2 = mat4.create()

    transformMatrixFromTwoPlane = (out: mat4, p1: vec3, p2: vec3, p3: vec3, t1: vec3, t2: vec3, t3: vec3) => {
        threePointToMatrix(plane1, p1, p2, p3)
        mat4.invert(inverted, plane1)
        threePointToMatrix(plane2, t1, t2, t3)

        mat4.mul(out, inverted, plane2)
    }
}