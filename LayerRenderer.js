import { toRGB, addColor, multiplyColor, duplicateImagedata } from './Helpers.js'

export class LayerRenderer
{
    constructor(layerNames)
    {
        this.core = new LayerRendererCore(layerNames)
    }

    addLayerAt(layerName, imageData)
    {
        this.core.addLayerAt(layerName, imageData)
    }

    modifyLayer(layerName, colorInString)
    {
        this.core.modifyLayer(layerName, colorInString)
    }

    renderToCanvas(canvas)
    {
        this.core.renderToCanvas(canvas)
    }
}

class LayerRendererCore
{
    constructor(layerNames)
    {
        this.finalImageData = null
        this.layerNames = layerNames
        this.ogLayersDataMap = new Map()
        this.layersDataMap = new Map() 
    }

    addLayerAt(layerName, imageData)
    {
        this.ogLayersDataMap.set(layerName, imageData)
        this.layersDataMap.set(layerName, imageData)
        if (this.finalImageData == null)
        {
            let array = new Uint8ClampedArray(imageData.data.length)
            this.finalImageData = new ImageData(array, imageData.width, imageData.height)
        }
        if (this.layerNames.length == this.layersDataMap.size)
            this.drawLayers()
    }

    modifyLayer(layerName, colorInString)
    {
        let imageData = duplicateImagedata(this.ogLayersDataMap.get(layerName))
        this.layersDataMap.set(layerName, imageData)
        let pixels = imageData.data
        let rgbval = toRGB(colorInString)
        for(let i=0; i<pixels.length; i+=4)
        {
            pixels[i] = multiplyColor(pixels[i], rgbval.r)
            pixels[i+1] = multiplyColor(pixels[i+1], rgbval.g)
            pixels[i+2] = multiplyColor(pixels[i+2], rgbval.b)
        }
        this.drawLayers()
    }

    renderToCanvas(canvas)
    {
        if (this.layerNames.length == this.layersDataMap.size)
        {
            canvas.width = this.finalImageData.width
            canvas.height = this.finalImageData.height
            let context = canvas.getContext('2d') 
            context.putImageData(this.finalImageData, 0, 0)
        }
    }

    drawLayers()
    {
        let firstImageData = this.layersDataMap.get(this.layerNames[0])
        let imageSize = firstImageData.data.length
        for (let i=0; i<imageSize; i+=4)
        {
            let firstA = firstImageData.data[i+3]
            let finalR = multiplyColor(firstImageData.data[i], firstA)
            let finalG = multiplyColor(firstImageData.data[i + 1], firstA)
            let finalB = multiplyColor(firstImageData.data[i + 2], firstA) 
            if (firstA < 255)
            {
                for (let j=1; j<this.layersDataMap.size; j++)
                {
                    let imageData = this.layersDataMap.get(this.layerNames[j])
                    let a = imageData.data[i + 3]
                    let r = multiplyColor(imageData.data[i], a)
                    let g = multiplyColor(imageData.data[i + 1], a)
                    let b = multiplyColor(imageData.data[i + 2], a)  
                    finalR = addColor(finalR, r)
                    finalG = addColor(finalG, g)
                    finalB = addColor(finalB, b) 
                    if (a == 255)
                        break;
                }
            }
            this.finalImageData.data[i] = finalR
            this.finalImageData.data[i + 1] = finalG
            this.finalImageData.data[i + 2] = finalB
            this.finalImageData.data[i + 3] = 255 
        }
    }
}