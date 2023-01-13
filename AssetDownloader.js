import { toImageDataFromImage } from './Helpers.js'

export class AssetDownloader
{
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
}