import {AssetDownloader} from './DownloadManager.js'

export class AssetManager
{
    constructor(layerSetNames, layerNames)
    {
        this.core = new AssetManagerCore(layerSetNames, layerNames)
    }

    loadAssets(onDownloadComplete)
    {
        this.core.loadAssets(onDownloadComplete)
    }
}

class AssetManagerCore
{
    constructor(layerSetNames, layerNames)
    {
        this.folder = 'assets/pi/'
        this.extension = '.png'
        this.layerSetNames = layerSetNames
        this.layerNames = layerNames
        this.downloader = new AssetDownloader()
        this.assetMap = new Map()
        this.assetCounter = 0
        this.totalAssets = layerSetNames.length * layerNames.length
        this.onDownloadComplete = null
        this.setupAssetMap()
    }

    setupAssetMap()
    {
        for (let j=0; j<this.layerNames.length; j++)
        {
            let setMap = new Map()
            for (let i=0; i<this.layerSetNames.length; i++)
            {
                let imageDatas = []
                setMap.set(this.layerSetNames[i], imageDatas)
            }
            this.assetMap.set(this.layerNames[j], setMap)
        }
    }

    loadAssets(onDownloadComplete)
    {
        this.onDownloadComplete = onDownloadComplete
        for (let i=0; i<this.layerSetNames.length; i++)
        {
            for (let j=0; j<this.layerNames.length; j++)
            {
                const path = this.folder + this.layerSetNames[i] + '/' + this.layerNames[j] + this.extension
                this.downloader.downloadAssets(path, (imageData)=>this.onDownload(this.layerNames[j], this.layerSetNames[i], imageData))
            }
        }
    }

    onDownload(layer, set, imageData)
    {
        let setMap = this.assetMap.get(layer)
        let imageDatas = setMap.get(set)
        imageDatas.push(imageData)
        this.assetCounter++
        if (this.assetCounter == this.totalAssets)
            this.onDownloadComplete(this.assetMap)
    }
}