import { toRGB, addColor, multiplyColor, duplicateImagedata } from './Helpers.js'

export class LayerManager
{
    constructor(screenTypes, layerNames)
    {
        this.layerManagerMap = new Map()
        for (let i=0; i<screenTypes.length; i++)
            this.layerManagerMap.set(screenTypes[i], new LayerRenderer(layerNames))
    }

    addLayerAt(screenType, layerName, imageData)
    {
        let layerRenderer = this.layerManagerMap.get(screenType)
        layerRenderer.addLayerAt(layerName, imageData)
    }

    modifyLayer(screenType, layerName, colorInString)
    {
        let layerRenderer = this.layerManagerMap.get(screenType)
        layerRenderer.modifyLayer(layerName, colorInString)
    }

    modifyAllLayerSets(layerName, colorInString)
    {
        let layerRenderers = this.layerManagerMap.values()
        for (let layerRenderer of layerRenderers)
            layerRenderer.modifyLayer(layerName, colorInString)
    }

    drawLayerSet(screenType, canvas)
    {
        let layerRenderer = this.layerManagerMap.get(screenType)
        layerRenderer.renderToCanvas(canvas)
    }
}

/**
 * This class mixes all the layers to produce the final image.
 * As this class does off-screen mixing, in order to display the final image renderToCanvas must be called.
 * The imagedata needs to be added and the the number of imagedata must be the same as the length of layerNames array 
 * or else the class will not render the final image.
 */
class LayerRenderer
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