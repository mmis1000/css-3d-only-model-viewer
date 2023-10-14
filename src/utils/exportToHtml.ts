import { mapToTransformAndColor } from "./matrixHelper"
import { FaceData } from "../interfaces"
import { INITIAL_FACES, LIGHT } from '../constants'

const encodedStr = (rawStr: string) =>
  rawStr.replace(/[\u00A0-\u9999<>\&]/g, function (i) {
    return "&#" + i.charCodeAt(0) + ";"
  })

const htmlTemplate = (
  title: string,
  body: string,
  hasRotation: boolean
) => /* html */ `
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${encodedStr(title)}</title>
    <style>
      html {
        background-color: #242424;
      }
${hasRotation
    ? `      @keyframes r {
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

      .scene.rotation {
        animation: 20s infinite linear r;
      }`
    : ""
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
        transform: scaleY(-1) rotateY(1deg);
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
        filter: blur(0px);
      }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="root">
        <div class="scene${hasRotation ? " rotation" : ""}">
${body}
        </div>
      </div>
    </div>
  </body>
</html>
`

export const renderToHtml = (
  title: string,
  faces: FaceData[],
  lightMode: "diffuse" | "normal",
  hasRotation: boolean
) => {
  const elements = faces.map((face) => {
    return mapToTransformAndColor(INITIAL_FACES, face.vertex, lightMode, LIGHT)
  })

  const body = elements
    .map(({ transform, color }) => {
      return `<div class="item" style="transform: ${transform}; border-left-color: ${color}"></div>`
    })
    .join("\r\n")

  return htmlTemplate(title, body, hasRotation)
}
