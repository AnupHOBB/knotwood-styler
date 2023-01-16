import { addColor, multiplyColor, duplicateImagedata } from './Helpers.js'

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

    changeColor(screenType, layerName, colorImageData)
    {
        let layerRenderer = this.layerManagerMap.get(screenType)
        layerRenderer.changeColor(layerName, colorImageData)
    }

    changeLayer(screenType, layerName, newImageData)
    {
        let layerRenderer = this.layerManagerMap.get(screenType)
        layerRenderer.changeLayer(layerName, newImageData)
    }
    
    changeColorForAllScreens(layerName, colorImageData)
    {
        let layerRenderers = this.layerManagerMap.values()
        for (let layerRenderer of layerRenderers)
            layerRenderer.changeColor(layerName, colorImageData)
    }

    changeLayerForAllScreens(layerName, newImageData)
    {
        let layerRenderers = this.layerManagerMap.values()
        for (let layerRenderer of layerRenderers)
            layerRenderer.changeLayer(layerName, newImageData)
    }

    drawOnCanvas(screenType, canvas)
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
        this.actualLayersDataMap = new Map()
        this.visibleLayersDataMap = new Map() 
    }

    addLayerAt(layerName, imageData)
    {
        this.actualLayersDataMap.set(layerName, imageData)
        this.visibleLayersDataMap.set(layerName, imageData)
        if (this.finalImageData == null)
        {
            let array = new Uint8ClampedArray(imageData.data.length)
            this.finalImageData = new ImageData(array, imageData.width, imageData.height)
        }
        if (this.layerNames.length == this.visibleLayersDataMap.size)
            this.drawLayers()
    }

    changeColor(layerName, colorImageData)
    {
        let imageData = duplicateImagedata(this.actualLayersDataMap.get(layerName))
        this.visibleLayersDataMap.set(layerName, imageData)
        let imagePixels = imageData.data
        let colorPixels = colorImageData.data
        for(let i=0; i<imagePixels.length; i+=4)
        {
            imagePixels[i] = multiplyColor(imagePixels[i], colorPixels[i])
            imagePixels[i+1] = multiplyColor(imagePixels[i+1], colorPixels[i+1])
            imagePixels[i+2] = multiplyColor(imagePixels[i+2], colorPixels[i+2])
        }
        this.drawLayers()
    }

    changeLayer(layerName, newImageData)
    {
        let oldImageData = this.actualLayersDataMap.get(layerName)
        this.visibleLayersDataMap.set(layerName, oldImageData)
        let oldPixels = oldImageData.data
        let newPixels = newImageData.data
        for(let i=0; i<oldPixels.length; i++)
            oldPixels[i] = newPixels[i]
        this.drawLayers()
    }

    renderToCanvas(canvas)
    {
        if (this.layerNames.length == this.visibleLayersDataMap.size)
        {
            canvas.width = this.finalImageData.width
            canvas.height = this.finalImageData.height
            let context = canvas.getContext('2d') 
            context.putImageData(this.finalImageData, 0, 0)
        }
    }

    drawLayers()
    {
        let firstImageData = this.visibleLayersDataMap.get(this.layerNames[0])
        let imageSize = firstImageData.data.length
        for (let i=0; i<imageSize; i+=4)
        {
            let firstA = firstImageData.data[i+3]
            let finalR = multiplyColor(firstImageData.data[i], firstA)
            let finalG = multiplyColor(firstImageData.data[i + 1], firstA)
            let finalB = multiplyColor(firstImageData.data[i + 2], firstA) 
            if (firstA < 255)
            {
                for (let j=1; j<this.visibleLayersDataMap.size; j++)
                {
                    let imageData = this.visibleLayersDataMap.get(this.layerNames[j])
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