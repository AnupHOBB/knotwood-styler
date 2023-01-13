import {LayerRenderer} from './LayerRenderer.js'

export class LayerManager
{
    constructor(layerSetNames, layerNames)
    {
        this.layerManagerMap = new Map()
        for (let i=0; i<layerSetNames.length; i++)
            this.layerManagerMap.set(layerSetNames[i], new LayerRenderer(layerNames))
    }

    addLayerAt(layerSetName, layerName, imageData)
    {
        let layerRenderer = this.layerManagerMap.get(layerSetName)
        layerRenderer.addLayerAt(layerName, imageData)
    }

    modifyLayer(layerSetName, layerName, colorInString)
    {
        let layerRenderer = this.layerManagerMap.get(layerSetName)
        layerRenderer.modifyLayer(layerName, colorInString)
    }

    modifyAllLayerSets(layerName, colorInString)
    {
        let layerRenderers = this.layerManagerMap.values()
        for (let layerRenderer of layerRenderers)
            layerRenderer.modifyLayer(layerName, colorInString)
    }

    drawLayerSet(layerSetName, canvas)
    {
        let layerSet = this.layerManagerMap.get(layerSetName)
        layerSet.renderToCanvas(canvas)
    }
}