import { addColor, multiplyColor, duplicateImagedata } from './Helpers.js'

/**
 * This class manages the layers of images for different screen types.
 */
export class LayerManager
{
    /**
     * 
     * @param {Array} screenTypes contains array of string that holds screen names. Screen name or Screen type name is the name of the screen for which there will be a variant of an asset 
     * present. Every image layer will have different variant based on the screen sizes. E.g : ['mobile', 'pc'] in this case. This was added to allow support for multiple screen sizes. 
     * Any name for screen type can be given. But folders with those names must be present inside the assets folder within the project as these names will be used to fetch assets. 
     * 
     * @param {Array} layerNames contains array of string that holds layer names. Layer names are the name of image layers that will be stacked on top of another when displaying the final
     * combined image. Layering is done to allow images to be separately modified. In this project, for a bathroom image, separate layers of glass, floor, bath and a base backgorund images
     * were used, combined and drawn into a canvas for displaying.  E.g : ['glass', 'floor', 'bath', 'base'] in this case. Any name for layers can be given. But folders with those names must 
     * be present inside the "assets/[screnType]/" folder within the project as these names will be used to fetch assets. In case of this project, the layer folders are present inside 
     * "assets/mobile/" and "assets/pc/" directories as this project has "mobile" and "pc" as screen types.
     * 
     */
    constructor(screenTypes, layerNames)
    {
        this.layerManagerMap = new Map()
        for (let i=0; i<screenTypes.length; i++)
            this.layerManagerMap.set(screenTypes[i], new LayerRenderer(layerNames))
    }

    /**
     * Adds image layers as imagedata within the layerRenderer. Before modifying the layers, the layers need to be present within the LayerRenderer.
     * @param {string} screenType is name of the screen type.
     * @param {string} layerName is name of the image layer. 
     * @param {ImageData} imageData image layer as ImageData
     */
    addLayerAt(screenType, layerName, imageData)
    {
        let layerRenderer = this.layerManagerMap.get(screenType)
        layerRenderer.addLayerAt(layerName, imageData)
    }

    /**
     * Changes the color of the layer for a specific screen whose name is given.
     * @param {string} screenType name of the screen type.
     * @param {string} layerName name of the image layer.
     * @param {ImageData} colorImageData imageData of the color to be applied.
     */
    changeColor(screenType, layerName, colorImageData)
    {
        let layerRenderer = this.layerManagerMap.get(screenType)
        layerRenderer.changeColor(layerName, colorImageData)
    }

    /**
     * Replaces the texture of the layer for a specific screen whose name is given.
     * @param {string} screenType name of the screen type.
     * @param {string} layerName name of the image layer.
     * @param {ImageData} newImageData imageData of the color to be applied.
     */
    changeLayer(screenType, layerName, newImageData)
    {
        let layerRenderer = this.layerManagerMap.get(screenType)
        layerRenderer.changeLayer(layerName, newImageData)
    }
    
    /**
     * Changes the color of the layer for all screen.
     * @param {string} layerName name of the image layer.
     * @param {ImageData} colorImageData imageData of the color to be applied.
     */
    changeColorForAllScreens(layerName, colorImageData)
    {
        let layerRenderers = this.layerManagerMap.values()
        for (let layerRenderer of layerRenderers)
            layerRenderer.changeColor(layerName, colorImageData)
    }

    /**
     * Replaces the texture of the layer for all screen.
     * @param {string} layerName name of the image layer.
     * @param {ImageData} newImageData imageData of the color to be applied.
     */
    changeLayerForAllScreens(layerName, newImageData)
    {
        let layerRenderers = this.layerManagerMap.values()
        for (let layerRenderer of layerRenderers)
            layerRenderer.changeLayer(layerName, newImageData)
    }

    /**
     * @param {string} screenType name of the screen type.   
     * @param {Canvas} canvas the canvas onto which the final combine image of all layers of a specific screen type will be rendered.    
     */
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
    /**
     * @param {Array} layerNames see above for more info about it.
     */
    constructor(layerNames)
    {
        this.finalImageData = null  //contains the final image with all the layers that is ready to be displayed.
        this.layerNames = layerNames
        this.actualLayersDataMap = new Map() //the layers whose colors have not been modified
        this.visibleLayersDataMap = new Map()  //the layers whose colors have been or will be modified.
        /* 
        The reason for having two separate maps to store the layers is to allow the individual layers to properly switch between colors in such a way that the presence of the 
        unselected colors will not be seen when another color is selected.
        This is only needed in case of colors and will not be needed for the textures. 
        */
    }

    /**
     * Adds image layers.
     * @param {string} layerName name of the image layer.
     * @param {ImageData} imageData imageData of the image layer that is to be added.
     */
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
            this.combineLayers()
    }

    /**
     * Changes the color of the layer.
     * @param {string} layerName name of the image layer.
     * @param {ImageData} colorImageData imageData of the color to be applied.
     */
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
        this.combineLayers()
    }

    /**
     * Replaces the texture of the layer.
     * @param {string} layerName name of the image layer.
     * @param {ImageData} newImageData imageData of the color to be applied.
     */
    changeLayer(layerName, newImageData)
    {
        let oldImageData = this.actualLayersDataMap.get(layerName)
        this.visibleLayersDataMap.set(layerName, oldImageData)
        let oldPixels = oldImageData.data
        let newPixels = newImageData.data
        for(let i=0; i<oldPixels.length; i++)
            oldPixels[i] = newPixels[i]
        this.combineLayers()
    }

    /**Draws finalImageData into the canvas.
     * @param {Canvas} canvas the canvas onto which finalImageData is to be displayed.
     */
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

    /**
     * Combines all the layers and stores them in finalImageData
     */
    combineLayers()
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