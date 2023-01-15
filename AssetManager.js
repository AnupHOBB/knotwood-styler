import {AssetDownloader} from './AssetDownloader.js'
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
    constructor(screenTypes, layerNames)
    {
        this.core = new AssetManagerCore(screenTypes, layerNames)
    }

    loadAssets(onDownloadComplete)
    {
        this.core.loadAssets(onDownloadComplete)
    }

    addLayerAt(screenType, layerName, imageData)
    {
        this.core.addLayerAt(screenType, layerName, imageData)
    }

    modifyLayer(screenType, layerName, colorInString)
    {
        this.core.modifyLayer(screenType, layerName, colorInString)
    }

    modifyAllLayerSets(layerName, colorInString)
    {
        this.core.modifyAllLayerSets(layerName, colorInString)
    }

    drawLayerSet(screenType, canvas)
    {
        this.core.drawLayerSet(screenType, canvas)
    }
}

class AssetManagerCore
{
    constructor(screenTypes, layerNames)
    {
        this.folder = 'assets/pi/'
        this.extension = '.png'
        this.screenTypes = screenTypes
        this.layerNames = layerNames
        this.downloader = new AssetDownloader()
        this.assetMap = new Map()
        this.assetCounter = 0
        this.totalAssets = screenTypes.length * layerNames.length
        this.layerManager = new LayerManager(screenTypes, layerNames)
        this.setupAssetMap()
    }

    addLayerAt(screenType, layerName, imageData)
    {
        this.layerManager.addLayerAt(screenType, layerName, imageData)
    }

    modifyLayer(screenType, layerName, colorInString)
    {
        this.layerManager.modifyLayer(screenType, layerName, colorInString)
    }

    modifyAllLayerSets(layerName, colorInString)
    {
        this.layerManager.modifyAllLayerSets(layerName, colorInString)
    }

    drawLayerSet(screenType, canvas)
    {
        this.layerManager.drawLayerSet(screenType, canvas)
    }

    setupAssetMap()
    {
        for (let j=0; j<this.layerNames.length; j++)
        {
            let setMap = new Map()
            for (let i=0; i<this.screenTypes.length; i++)
            {
                let imageDatas = []
                setMap.set(this.screenTypes[i], imageDatas)
            }
            this.assetMap.set(this.layerNames[j], setMap)
        }
    }

    loadAssets(onDownloadComplete)
    {
        for (let i=0; i<this.screenTypes.length; i++)
        {
            for (let j=0; j<this.layerNames.length; j++)
            {
                const path = this.folder + this.screenTypes[i] + '/' + this.layerNames[j] + this.extension
                this.downloader.downloadAssets(path, (imageData)=>this.onDownload(this.layerNames[j], this.screenTypes[i], imageData, onDownloadComplete))
            }
        }
    }

    onDownload(layer, set, imageData, onDownloadComplete)
    {
        let setMap = this.assetMap.get(layer)
        let imageDatas = setMap.get(set)
        imageDatas.push(imageData)
        this.assetCounter++
        if (this.assetCounter == this.totalAssets)
        {
            for (let i=0; i<this.layerNames.length; i++)
            {
                let screenMap = this.assetMap.get(this.layerNames[i])
                for (let j=0; j<this.screenTypes.length; j++)
                {
                    let imageDatas = screenMap.get(this.screenTypes[j])
                    this.layerManager.addLayerAt(this.screenTypes[j], this.layerNames[i], imageDatas[0])
                }
            }
            onDownloadComplete()
        }
    }
}