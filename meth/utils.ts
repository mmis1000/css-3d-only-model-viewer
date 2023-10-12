import { glMatrix, vec3 } from "gl-matrix";
import { display } from "node-kernel";

const encodedStr = (rawStr: string) => rawStr.replace(/[\u00A0-\u9999<>\&]/g, function (i) {
    return '&#' + i.charCodeAt(0) + ';';
});

const formatTable = (cols: number, itemsRaw: { [key: number]: any, length: number }) => {
    if (cols <= 0) return ''

    const items = Array.from(itemsRaw)

    const groups: any[][] = []

    for (let i = 0; i < Math.ceil(items.length / cols); i++) {
        groups.push(items.slice(i * cols, (i + 1) * cols))
    }

    const res = '<table>' +
        groups.map(g =>
            '<tr>' +
            g.map(i => `<td>${encodedStr(String(i))}</td>`)
            .join('\r\n') +
            '</tr>'
        ).join('\r\n') +
        '</table>'

    return res
}


export const table = (cols: number, items:  { [key: number]: any, length: number }) => {
    display.html(formatTable(cols, items))
}

export let getPoint4: (out: vec3, p1: vec3, p2: vec3, p3: vec3) => void

{
    const v1 = vec3.create()
    const v2 = vec3.create()
    const normal = vec3.create()

    getPoint4 =  function getPoint4 (out: vec3, p1: vec3, p2: vec3, p3: vec3) {
        vec3.subtract(v1, p2, p1)
        vec3.subtract(v2, p3, p1)
        vec3.cross(normal, v1, v2)
        vec3.add(out, p1, normal)
    }
}

export const ft = formatTable