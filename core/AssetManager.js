import { toImageDataFromImage } from './Helpers.js'
import {LayerManager} from "./LayerManager.js"

/**
 * This class is just a wrapper around the AssetManagerCore class that calls the same functions within AssetManagerCore.
 * Refer to the AssetManagerCore class for detail description of each function.
 * This was done to hide the functions within AssetManagerCore that are meant to be private.
 * Use this to manage all the assets and image layers. 
 */
export class AssetManager
{
    constructor(screenTypes, layerNames, assetPathMap)
    {
        this.core = new AssetManagerCore(screenTypes, layerNames, assetPathMap)
    }

    downloadAssets(onDownloadComplete)
    {
        this.core.downloadAssets(onDownloadComplete)
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

    getColorIcons(layerName)
    {
        return this.core.getColorIcons(layerName) 
    }

    getImageIcons(layerName)
    {
        return this.core.getImageIcons(layerName)
    }
}

/**
 * This is the core class responsible for downloading and managing the assets and icons.
 */
class AssetManagerCore
{    
    /**
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
     * @param {Map} assetPathMap contains the relative path of all the color, texture and icon assets. The program assumes that all the color and texture assets will be stored inside 
     * "assets/[screen type]/[layer name]/"\and icons inside assets/icon/[layer name]/ folders. In case of this project, the directories where the colors and textures of glass layer 
     * are stored are :-"assets/mobile/glass/colors/","assets/mobile/glass/textures/" and icons are stored inside assets/icons/glass folders.
     * 
     * And the JSON structure of the assetPathMap is as follows :-
     *  [
     *       {
     *           "key" : "layerName",
     *           "value" :
     *           [
     *               {
     *                   "0": 
     *                   [//This is colorMap
     *                       {
     *                           "key": "colorKeyName",
     *                           "value": "color path"
     *                       }
     *                   ]
     *               },
     *               {
     *                   "1": 
     *                   [//This is textureMap
     *                       {
     *                           "key": "textureKeyName",
     *                           "value": "texture path"
     *                       }
     *                   ]
     *               },
     *               {
     *                   "2": 
     *                   [//This is iconMap
     *                      {
     *                          "key": "iconKeyName",
     *                          "value": "icon path"
     *                      }
     *                   ]
     *               }
     *           ]
     *       }
     *  ]
     * 
     * Here, the color path should start from within the layer folder. In this case, value will be given as "colors/0.png".
     * Also for the texture path, value should start from within the layer folder. In this case, value will be given as "textures/0.png".
     * But for icon path, value should start from within the assets folder. In this case, value will be given as "[icon-name].png". 
     * E.g : for floor icons path will be "0.png". This is the image used as floor icon here.
     * 
     * The path of colors, textures and icons SHOULD NOT start from the asset folder. It should start from within the layer folder for colors and textures 
     * and from within the layer folder inside icon folder for icons.
     * 
     * After downloading the assets, the assets will be stored in the assetMap variable in the JSON format as shown below :-
     * [
     *     {
     *           "key" : "layername",
     *           "value" : 
     *           [//This is an array that stores screenMap at index 0 and iconMap at index 1
     *               {
     *                   "0":
     *                   [// This is screenMap
     *                       {
     *                           "key" : "screenType",
     *                           "value" : 
     *                          [
     *                               {
     *                                   "0": 
     *                                   [
     *                                       {//This is colorMap
     *                                           "key": "colorKeyName",
     *                                           "value": ImageData object 
     *                                       }
     *                                   ]
     *                               },
     *                               {
     *                                   "1": 
     *                                   [
     *                                       {//This is textureMap
     *                                           "key": "textureKeyName",
     *                                           "value": ImageData object
     *                                       }
     *                                   ]
     *                               }
     *                           ]
     *                       }
     *                   ]
     *               },
     *               {
     *                   "1":
     *                   [// This is iconMap
     *                       {
     *                           "key" : "iconKey",
     *                           "value": ImageData object
     *                       }
     *                   ]
     *               }
     *           ]
     *       }
     *  ]
     *  The assetMap instance variable stores all the downloaded assets as imageData.
     */
    constructor(screenTypes, layerNames, assetPathMap)
    {
        this.mainFolderPath = '../assets/' //path to root folder
        this.iconsPath = this.mainFolderPath + 'icons/' //path to icons folder
        this.screenTypes = screenTypes //array of screenType values
        this.layerNames = layerNames //array of layer names
        this.assetCounter = 0  //counter used for counting the downloaded assets. If assetCounter == totalAssets, then a callback function is called to notify user of completion.
        this.layerManager = new LayerManager(screenTypes, layerNames) // object that is responsible for managing image layers for multiple screen sizes.
        this.assetPathMap = assetPathMap //stores map that contains asset paths
        this.defaultTextures = [] //stores the key value of all the default textures for each image layer
        
        /**
         * The following three values are used to distinguish between assets.
         * Once an asset has been download, the asset along with one of the following values will be passed along the onDownload function below for storage.
         */
        this.assetTypeColor = 'color'  
        this.assetTypeTexture = 'texture'
        this.assetTypeIcon = 'icon'

        this.totalAssets = this.getTotalAssetCount() //value that stores the number of all assets
        this.assetMap = new Map() //stores all the downloaded assets.
        this.setupAssetMap()
    }

    /**
     * Changes the color of the layer for a specific screen whose name is given.
     * @param {string} screenType name of the screen type.
     * @param {string} layerName name of the image layer.
     * @param {string} colorKeyName name of the key of the color asset that was provided within the color map inside the assetPathMap.
     */
    changeColor(screenType, layerName, colorKeyName)
    {
        let assets = this.assetMap.get(layerName)
        let screenMap = assets[0]
        let maps = screenMap.get(screenType)
        let colorMap = maps[0] 
        let colorImageData = colorMap.get(colorKeyName)
        this.layerManager.changeColor(screenType, layerName, colorImageData)
    }

    /**
     * Replaces the texture of the layer for a specific screen  whose name is given.
     * @param {string} screenType name of the screen type.
     * @param {string} layerName name of the image layer.
     * @param {string} textureKeyName name of the key of the texture asset that was provided within the texture map inside the assetPathMap.
     */
    changeLayer(screenType, layerName, textureKeyName)
    {
        let assets = this.assetMap.get(layerName)
        let screenMap = assets[0]
        let maps = screenMap.get(screenType)
        let textureMap = maps[1] 
        let newImageData = textureMap.get(textureKeyName)
        this.layerManager.changeLayer(screenType, layerName, newImageData)
    }
    
    /**
     * Changes the color of the layer for all screen type whose name is given.
     * @param {string} layerName name of the image layer
     * @param {string} colorKeyName key for the color asset that was included in the assetPathMap
     */
    changeColorForAllScreens(layerName, colorKeyName)
    {
        let assets = this.assetMap.get(layerName)
        let screenMap = assets[0]
        for (let i=0; i<this.screenTypes.length; i++)
        {
            let maps = screenMap.get(this.screenTypes[i])
            let colorMap = maps[0] 
            let colorImageData = colorMap.get(colorKeyName)
            this.layerManager.changeColor(this.screenTypes[i], layerName, colorImageData)
        }
    }

   /**
     * Replaces the texture of the layer for all screen type  whose name is given.
     * @param {string} layerName name of the image layer
     * @param {string} textureKeyName key for the texture asset that was included in the assetPathMap
     */
    changeLayerForAllScreens(layerName, textureKeyName)
    {
        let assets = this.assetMap.get(layerName)
        let screenMap = assets[0]
        for (let i=0; i<this.screenTypes.length; i++)
        {
            let maps = screenMap.get(this.screenTypes[i])
            let textureMap = maps[1] 
            let newImageData = textureMap.get(textureKeyName)
            this.layerManager.changeLayer(this.screenTypes[i], layerName, newImageData)
        }
    }

    /**
     * Draws the layers onto the canvas.
     * @param {string} screenType name of the type of screen onto which the layers need to be displayed
     * @param {Canvas} canvas where the layers will be displayed
     */
    drawOnCanvas(screenType, canvas)
    {
        this.layerManager.drawOnCanvas(screenType, canvas)
    }

    /**
     * Retrieves the color icons for a specific layer.
     * For colors, the values within the colorMap inside assetMap is retrieved.
     * @param {string} layerName name of the image layer
     * @returns colorMap
     */
    getColorIcons(layerName)
    {
        let screenType = this.screenTypes[0]
        let assets = this.assetMap.get(layerName)
        let maps = assets[0].get(screenType)
        return maps[0]
    }

   /**
     * Retrieves the texture icons for a specific layer.
     * For textures, the values within the iconMap inside assetMap is retrieved.
     * @param {string} layerName name of the image layer
     * @returns iconMap as Map
     */
    getImageIcons(layerName)
    {
        let assets = this.assetMap.get(layerName)
        return assets[1]
    }

    /**
     * All functions from this point on are meant to be private.
     */

    /**
     * Returns the number of total assets present within assetPathMap.
     * @returns total asset count as int
     */
    getTotalAssetCount()
    {
        let assetCounter = 0
        let layers = this.assetPathMap.keys()
        for (let layer of layers)
        {
            let assets = this.assetPathMap.get(layer)
            for (let i=0; i<assets.length; i++)
            {
                let map = assets[i]
                assetCounter += map.size
            }
        }
        return assetCounter * this.screenTypes.length
    }

    /**
     * Initializes the assetMap variable
     */
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
            let iconMap = new Map()
            this.assetMap.set(this.layerNames[j], [screenMap, iconMap])
        }
    }

    /**
     * Downloads all the assets
     * @param {Function} onDownloadComplete callback function that is called after all assets are downloaded  
     */
    downloadAssets(onDownloadComplete)
    {
        for (let i=0; i<this.screenTypes.length; i++)
        {
            for (let j=0; j<this.layerNames.length; j++)
            {
                let assetPaths = this.assetPathMap.get(this.layerNames[j])
                let colorMap = assetPaths[0]
                let colorkeys = colorMap.keys()
                for (let colorKey of colorkeys)
                {   
                    const path = this.mainFolderPath + this.screenTypes[i] + '/' + this.layerNames[j] + '/' + colorMap.get(colorKey)
                    this.downloadAsset(path, (imageData)=>this.onDownload(this.layerNames[j], this.screenTypes[i], imageData, onDownloadComplete, this.assetTypeColor, colorKey))
                }
                let textureMap = assetPaths[1]
                let textureKeys = textureMap.keys()
                for (let textureKey of textureKeys)
                {
                    if (this.defaultTextures[j] == undefined)
                        this.defaultTextures[j] = textureKey
                    const path = this.mainFolderPath + this.screenTypes[i] + '/' + this.layerNames[j] + '/' + textureMap.get(textureKey)
                    this.downloadAsset(path, (imageData)=>this.onDownload(this.layerNames[j], this.screenTypes[i], imageData, onDownloadComplete, this.assetTypeTexture, textureKey))
                }
                let iconMap = assetPaths[2]
                let iconKeys = iconMap.keys()
                for (let iconKey of iconKeys)
                {
                    const path = this.iconsPath + this.layerNames[j] + '/' + iconMap.get(iconKey)
                    this.downloadAsset(path, (imageData)=>this.onDownload(this.layerNames[j], this.screenTypes[i], imageData, onDownloadComplete, this.assetTypeIcon, iconKey))
                }
            }
        }
    }

    /**
     * 
     * @param {string} path url of the asset
     * @param {Function} onAssetDownload callback function that is called after current asset is downloaded  
     */
    downloadAsset(path, onAssetDownload)
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
                    onAssetDownload(toImageDataFromImage(img))
                }
            }
        }
        reader.responseType = 'blob'
        reader.send()
    }

    /**
     * Callback function called after an asset is downloaded
     * @param {string} layer name of the layer for to which this asset belongs to
     * @param {string} screenType name of the screenType in which this asset will be displayed on selection.
     * @param {ImageData} imageData asset as ImageData 
     * @param {Function} onDownloadComplete callback to notify to in case all assets are downloaded
     * @param {string} assetType will have one of the values between 'color', 'texture' and 'icon'. It is used to distinguish between the assets.
     * @param {string} key key name of assets which was included in the assetPathMap.
     */
    onDownload(layer, screenType, imageData, onDownloadComplete, assetType, key)
    {
        this.storeAsset(layer, screenType, imageData, assetType, key)
        this.assetCounter++
        if (this.assetCounter == this.totalAssets)
        {
            for (let i=0; i<this.layerNames.length; i++)
            {
                let assets = this.assetMap.get(this.layerNames[i])
                let screenMap = assets[0]
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

    /**
     * Stores the asset inside the assetMap
     * @param {string} layer name of the layer for to which this asset belongs to
     * @param {string} screenType name of the screenType in which this asset will be displayed on selection.
     * @param {ImageData} imageData asset as ImageData 
     * @param {string} assetType will have one of the values between 'color', 'texture' and 'icon'. It is used to distinguish between the assets.
     * @param {string} key key name of assets which was included in the assetPathMap.
     */
    storeAsset(layer, screenType, imageData, assetType, key)
    {
        let assets = this.assetMap.get(layer)
        let screenMap = assets[0]
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
        else if (assetType == this.assetTypeIcon)
        {
            let iconMap = assets[1]
            iconMap.set(key,imageData)
        }
    }
}