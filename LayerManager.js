export class LayerManager
{
    constructor(canvas, layerNames)
    {
        this.core = new LayerManagerCore(canvas, layerNames)
    }

    addLayerAt(layerName, imageData)
    {
        this.core.addLayerAt(layerName, imageData)
    }

    modifyLayer(layerName, colorInString)
    {
        this.core.modifyLayer(layerName, colorInString)
    }

    drawIfReady(width, height)
    {
        this.core.drawIfReady(width, height)
    }
}

class LayerManagerCore
{
    constructor(canvas, layerNames)
    {
        this.canvas = canvas
        this.context = canvas.getContext('2d')
        this.layerNames = layerNames
        this.ogLayersDataMap = new Map()
        this.layersDataMap = new Map() 
    }

    addLayerAt(layerName, imageData)
    {
        this.ogLayersDataMap.set(layerName, imageData)
        this.layersDataMap.set(layerName, imageData)
    }

    modifyLayer(layerName, colorInString)
    {
        let imageData = this.duplicateImagedata(this.ogLayersDataMap.get(layerName))
        this.layersDataMap.set(layerName, imageData)
        let pixels = imageData.data
        let rgbval = this.toRGB(colorInString)
        for(let i=0; i<pixels.length; i+=4)
        {
            pixels[i] = this.multiplyColor(pixels[i], rgbval.r)
            pixels[i+1] = this.multiplyColor(pixels[i+1], rgbval.g)
            pixels[i+2] = this.multiplyColor(pixels[i+2], rgbval.b)
        }
        this.drawLayers()
    }

    drawIfReady(width, height)
    {
        if (this.layerNames.length == this.layersDataMap.size)
        {
            this.canvas.width = width
            this.canvas.height = height
            this.drawLayers()
        }
    }

    drawLayers()
    {
        let firstImageData = this.layersDataMap.get(this.layerNames[0])
        let width = firstImageData.width
        let height = firstImageData.height
        let imageSize = firstImageData.data.length
        let finalImage = new Uint8ClampedArray(imageSize)
        for (let i=0; i<imageSize; i+=4)
        {
            let firstA = firstImageData.data[i+3]
            let finalR = this.multiplyColor(firstImageData.data[i], firstA)
            let finalG = this.multiplyColor(firstImageData.data[i + 1], firstA)
            let finalB = this.multiplyColor(firstImageData.data[i + 2], firstA) 
            if (firstA < 255)
            {
                for (let j=1; j<this.layersDataMap.size; j++)
                {
                    let imageData = this.layersDataMap.get(this.layerNames[j])
                    let a = imageData.data[i + 3]
                    let r = this.multiplyColor(imageData.data[i], a)
                    let g = this.multiplyColor(imageData.data[i + 1], a)
                    let b = this.multiplyColor(imageData.data[i + 2], a)  
                    finalR = this.addColor(finalR, r)
                    finalG = this.addColor(finalG, g)
                    finalB = this.addColor(finalB, b) 
                    if (a == 255)
                        break;
                }
            }
            finalImage[i] = finalR
            finalImage[i + 1] = finalG
            finalImage[i + 2] = finalB
            finalImage[i + 3] = 255
        }
        this.context.putImageData(this.toImagedata(finalImage, width, height), 0, 0)
    }

    toImagedata(data, width, height)
    {
        return new ImageData(data, width, height)
    }

    toRGB(str)
    {
        let match = str.match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/)
        return match ? {r:match[1], g:match[2], b:match[3]} : {r:0, g:0, b:0}
    }

    addColor(c1, c2)
    {   
        c1 /= 255
        c2 /= 255
        let c3 = c1 + c2
        if (c3 > 1)
            c3 = 1
        return c3 * 255
    }

    multiplyColor(c1, c2)
    {   
        c1 /= 255
        c2 /= 255
        return c1 * c2 * 255
    }

    duplicateImagedata(source)
    {
        let sourceData = source.data
        let copyData = new Uint8ClampedArray(sourceData.length)
        for (let i=0; i<sourceData.length; i++)
            copyData[i] = sourceData[i]
        return new ImageData(copyData, source.width, source.height)
    }
}