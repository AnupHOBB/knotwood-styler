export function toRGB(str)
{
    let match = str.match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/)
    return match ? {r:match[1], g:match[2], b:match[3]} : {r:0, g:0, b:0}
}

export function addColor(c1, c2)
{   
    c1 /= 255
    c2 /= 255
    let c3 = c1 + c2
    if (c3 > 1)
        c3 = 1
    return c3 * 255
}

export function multiplyColor(c1, c2)
{   
    c1 /= 255
    c2 /= 255
    return c1 * c2 * 255
}

export function duplicateImagedata(source)
{
    let sourceData = source.data
    let copyData = new Uint8ClampedArray(sourceData.length)
    for (let i=0; i<sourceData.length; i++)
        copyData[i] = sourceData[i]
    return new ImageData(copyData, source.width, source.height)
}

export function toImageDataFromImage(img)
{
    let canvas = document.createElement('canvas')
    let ctxt = canvas.getContext('2d')
    canvas.width = img.width
    canvas.height = img.height
    ctxt.drawImage(img, 0, 0)
    return ctxt.getImageData(0, 0, img.width, img.height)
} 