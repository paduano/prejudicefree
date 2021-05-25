

export const color = {
    // background: '#040728', // blue
    // accent: '#f7ed5c', // bright yellow 
    accent: '#fec419', // orangy yellow
    background: '#030622', // dark blue, change me in theme.js
    backgroundWithOpacity: 'rgba(4, 6, 34, 0.8)', // dark blue
}

export const colorGradientList = [
    // inverted
    // [117, 189, 255],
    // // [158, 202, 225],
    // [255, 255, 204],
    // // [255, 237, 160],
    // [254, 217, 118],
    // // [254, 178, 76],
    // // [253, 141, 60],
    // [252, 78, 42],
    // // [227, 26, 28],
    // [177, 0, 38],

    // from red to blue
    // [177, 0, 38],
    // [252, 78, 42],
    // [254, 217, 118],
    // [255, 255, 204],
    // [117, 189, 255],


    // 3 steps
    // [234, 28, 28],
    // [78, 73, 73, 1],
    // [52, 72, 246],

    // 3 steps for blue background
    [234, 28, 28],
    [131, 111, 111],
    [89, 78, 255],
]

export const colorGradientListCSS = (index: number) => {
    const color = colorGradientList[index];
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}


export const getColorIndex = (v: number) => {
    // if (v < 0 || v > 1) {
    //     throw `${v} not a valid color gradient value`
    // }
    // const cListIndex = Math.round(v * (colorGradientList.length - 1));
    let cListIndex = 1;
    if (v <= 4) {
        cListIndex = 0
    } else if (v >= 7) {
        cListIndex = 2
    }
    return cListIndex;
}

