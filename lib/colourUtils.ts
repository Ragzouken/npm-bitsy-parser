export function numToRgbString(num: number)
{
    return `${(num >> 16) & 255},${(num >> 8) & 255},${num & 255}`;
}

export function rgbStringToNum(str: string)
{
    const [r, g, b] = str.split(",");
    return (parseInt(b, 10) << 0) | (parseInt(g, 10) << 8) | (parseInt(r, 10) << 16);
}
