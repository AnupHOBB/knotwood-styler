import { toImageDataFromImage } from './Helpers.js'
import {LayerManager} from "./LayerManager.js"
/**
 * This class downloads all the images and stores them as image data within the assetMap variable.
 * The assetMap consists of entries where : (key : layer name i.e. glass/bath/floor/base) and (value : setMap).
 * The setMap consists of entries where : (key : set name i.e mobile/pc) and (value: array of imagedata of a particular layer).
 * The variable screenTypes refers to the name for various screen sizes i.e. mobile, pc, etc.
 * The variable layerNames refers to the name for various images i.e. base, floor, glass, bath etc. This is just an array of the names of image layers.
 */
export class AssetManager
{
    constructor(screenTypes, layerNames, assetPathMap)
    {
        this.core = new AssetManagerCore(screenTypes, layerNames, assetPathMap)
    }

    loadAssets(onDownloadComplete)
    {
        this.core.loadAssets(onDownloadComplete)
    }

    changeColor(layerName, colorKeyName)
    {
        this.core.changeLayer(screenType, layerName, colorKeyName)
    }

    changeLayer(screenType, layerName, textureKeyName)
    {
        this.core.changeLayer(screenType, layerName, textureKeyName)
    }
    
    changeColorForAllScreens(layerName, colorKeyName)
    {
        this.core.changeColorForAllScreens(layerName, colorKeyName)
    }

    changeLayerForAllScreens(layerName, textureKeyName)
    {
        this.core.changeLayerForAllScreens(layerName, textureKeyName)
    }

    drawOnCanvas(screenType, canvas)
    {
        this.core.drawOnCanvas(screenType, canvas)
    }
}

class AssetManagerCore
{    
    constructor(screenTypes, layerNames, assetPathMap)
    {
        this.mainFolderPath = '../assets/'
        this.screenTypes = screenTypes
        this.layerNames = layerNames
        this.assetMap = new Map()
        this.assetCounter = 0
        this.totalAssets = this.getTotalAssetCount(assetPathMap, screenTypes)
        this.layerManager = new LayerManager(screenTypes, layerNames)
        this.pathMap = assetPathMap
        this.defaultTextures = []
        this.assetTypeColor = 'color'
        this.assetTypeTexture = 'texture'
        this.setupAssetMap()
    }

    changeColor(screenType, layerName, colorKeyName)
    {
        let screenMap = this.assetMap.get(layerName)
        let maps = screenMap.get(screenType)
        let colorMap = maps[0] 
        let colorImageData = colorMap.get(colorKeyName)
        this.layerManager.changeColor(screenType, layerName, colorImageData)
    }

    changeLayer(screenType, layerName, textureKeyName)
    {
        let screenMap = this.assetMap.get(layerName)
        let maps = screenMap.get(screenType)
        let textureMap = maps[1] 
        let newImageData = textureMap.get(textureKeyName)
        this.layerManager.changeLayer(screenType, layerName, newImageData)
    }
    
    changeColorForAllScreens(layerName, colorKeyName)
    {
        let screenMap = this.assetMap.get(layerName)
        for (let i=0; i<this.screenTypes.length; i++)
        {
            let maps = screenMap.get(this.screenTypes[i])
            let colorMap = maps[0] 
            let colorImageData = colorMap.get(colorKeyName)
            this.layerManager.changeColor(this.screenTypes[i], layerName, colorImageData)
        }
    }

    changeLayerForAllScreens(layerName, textureKeyName)
    {
        let screenMap = this.assetMap.get(layerName)
        for (let i=0; i<this.screenTypes.length; i++)
        {
            let maps = screenMap.get(this.screenTypes[i])
            let textureMap = maps[1] 
            let newImageData = textureMap.get(textureKeyName)
            this.layerManager.changeLayer(this.screenTypes[i], layerName, newImageData)
        }
    }

    drawOnCanvas(screenType, canvas)
    {
        this.layerManager.drawOnCanvas(screenType, canvas)
    }

    getTotalAssetCount(assetPathMap, screenTypes)
    {
        let assetCounter = 0
        let layers = assetPathMap.keys()
        for (let layer of layers)
        {
            let assets = assetPathMap.get(layer)
            for (let i=0; i<assets.length; i++)
            {
                let map = assets[i]
                assetCounter += map.size
            }
        }
        return assetCounter * screenTypes.length
    }

    setupAssetMap()
    {
        for (let j=0; j<this.layerNames.length; j++)
        {
            let screenMap = new Map()
            for (let i=0; i<this.screenTypes.length; i++)
            {
                let colorMap = new Map()
                let textureMap = new Map()
                screenMap.set(this.screenTypes[i], [colorMap, textureMap])
            }
            this.assetMap.set(this.layerNames[j], screenMap)
        }
    }

    loadAssets(onDownloadComplete)
    {
        for (let i=0; i<this.screenTypes.length; i++)
        {
            for (let j=0; j<this.layerNames.length; j++)
            {
                let assets = this.pathMap.get(this.layerNames[j])
                let colorMap = assets[0]
                let colorkeys = colorMap.keys()
                for (let colorKey of colorkeys)
                {   
                    const path = this.mainFolderPath + this.screenTypes[i] + '/' + this.layerNames[j] + '/' + colorMap.get(colorKey)
                    this.downloadAssets(path, (imageData)=>this.onDownload(this.layerNames[j], this.screenTypes[i], imageData, onDownloadComplete, this.assetTypeColor, colorKey))
                }
                let textureMap = assets[1]
                let textureKeys = textureMap.keys()
                for (let textureKey of textureKeys)
                {
                    if (this.defaultTextures[j] == undefined)
                        this.defaultTextures[j] = textureKey
                    const path = this.mainFolderPath + this.screenTypes[i] + '/' + this.layerNames[j] + '/' + textureMap.get(textureKey)
                    this.downloadAssets(path, (imageData)=>this.onDownload(this.layerNames[j], this.screenTypes[i], imageData, onDownloadComplete, this.assetTypeTexture, textureKey))
                }
            }
        }
    }

    downloadAssets(path, onDownload)
    {
        let reader = new XMLHttpRequest()
        reader.open('GET', path)
        reader.onreadystatechange = () =>
        {
            if (reader.readyState == 4 && reader.status == 200)
            {    
                let bloburl = URL.createObjectURL(reader.response)
                let img = new Image()
                img.src = bloburl
                img.onload = () => 
                {
                    URL.revokeObjectURL(bloburl)
                    onDownload(toImageDataFromImage(img))
                }
            }
        }
        reader.responseType = 'blob'
        reader.send()
    }

    onDownload(layer, screenType, imageData, onDownloadComplete, assetType, key)
    {
        this.storeAssets(layer, screenType, imageData, assetType, key)
        this.assetCounter++
        if (this.assetCounter == this.totalAssets)
        {
            for (let i=0; i<this.layerNames.length; i++)
            {
                let screenMap = this.assetMap.get(this.layerNames[i])
                for (let j=0; j<this.screenTypes.length; j++)
                {
                    let maps = screenMap.get(this.screenTypes[j])
                    let textureMap = maps[1]
                    this.layerManager.addLayerAt(this.screenTypes[j], this.layerNames[i], textureMap.get(this.defaultTextures[i]))
                }
            }
            onDownloadComplete()
        }
    }

    storeAssets(layer, screenType, imageData, assetType, key)
    {
        let screenMap = this.assetMap.get(layer)
        let maps = screenMap.get(screenType)
        if (assetType == this.assetTypeColor)
        {
            let colorMap = maps[0]
            colorMap.set(key,imageData)
        }
        else if (assetType == this.assetTypeTexture)
        {
            let textureMap = maps[1]
            textureMap.set(key,imageData)
        }
    }
}