export const PI = 3.141592653589793;
export const PI2 = 6.283185307179586;
export const PI_HALF = 1.5707963267948966;

export function clamp(num: number, min: number, max: number) {
    return num <= min ? min : num >= max ? max : num;
}


export function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}   

export function debug(dict: {[index: string]: any}) {
    const colors = ["f3722c","f8961e","f9c74f","90be6d","43aa8b","577590"];
    const keys = Object.keys(dict);
    if (keys.length == 0) {
        return;
    }
    const h = keys.join();
    let hh = 0;
    for (let i = 0; i < h.length; i++) {
        hh += h.codePointAt(i);
    }
    const color = colors[hh%colors.length];

    let out = Object.keys(dict).reduce((prev: string, curr: string) => {
        let value = dict[curr];
        if (typeof value == 'number' && value % 1 != 0) {
            value = value.toFixed(3) + '…';
        }
        // THREE.js vector
        if (value.isVector3) {
            value = `x: ${value.x.toFixed(3)}, y: ${value.y.toFixed(3)}, z: ${value.z.toFixed(3)}`;
        }
        // btVector vector
        if (value.x instanceof Function) {
            value = `x: ${value.x().toFixed(3)}, y: ${value.y().toFixed(3)}, z: ${value.z().toFixed(3)}`;
        }

        if (value.x !== undefined && value.y !== undefined) {
            value = `x: ${value.x}, y: ${value.y}`
        }
        return prev + `${curr}: ${value}\t`;
    }, '');
    out = '%c' + out;
    console.log(out, `color: #${color}`);
}

export const rand = (min: number, max: number) => {
    return min + (max-min) * Math.random();
}

export const randInCircle = (radius: number, minRadius: number = 0) => {
    const t = 2 * PI * Math.random()
    const u = Math.random() + Math.random();
    const r = (u > 1 ? 2 - u : u) * (radius - minRadius) + minRadius;
    return {x: r * Math.cos(t), y: r * Math.sin(t)};
}

export const randOnCircumference = (radius: number) => {
    var angle = Math.random()*Math.PI*2;
    let x = Math.cos(angle)*radius;
    let y = Math.sin(angle)*radius;
    return {x, y};
}

export const randInGroup = (index: number, maxIndex: number, density: number, baseRadius: number = 0) => {
    const r = Math.sqrt(index / maxIndex) / density;
    return randOnCircumference(baseRadius + r);
}

export function pie(rmin: number, rmax: number, N: number) {
    const area = PI * Math.pow(rmax, 2) - PI * Math.pow(rmin, 2);
    const distanceBetweenN = Math.sqrt((area / N) / PI) * (1.7);
    const nCircles = Math.trunc((rmax - rmin) / distanceBetweenN);
    const currentSlotInCircle = [];
    const slotsInCircle = [];
    const theta = [];
    const radius = [];
    const deltaTheta = [];
    let currentCircle = nCircles - 1;

    const positions = [];

    for (let i = 0; i < nCircles; i++) {
        const r = rmin + ((rmax - rmin) / nCircles) * i;
        radius.push(r);
        const circumference = 2 * PI * r;
        const nInC = circumference / distanceBetweenN;
        slotsInCircle.push(nInC);
        currentSlotInCircle.push(0);
        deltaTheta.push((2 * PI) / nInC);
        theta.push(0);
    }

    for (let i = 0; i < N; i++) {
      
        const t = currentSlotInCircle[currentCircle] * deltaTheta[currentCircle];
        currentSlotInCircle[currentCircle]++;
        const r = radius[currentCircle];
        positions.push({x: r * Math.cos(t), y: r * Math.sin(t)});

        // find next circle
        for (let c = nCircles - 1; c > 0 ; c--) {
            const occupancyPercent = currentSlotInCircle[c] / slotsInCircle[c];
            const nextOccupancyPercent = currentSlotInCircle[c - 1] / slotsInCircle[c - 1];
            if (occupancyPercent > nextOccupancyPercent) {
                currentCircle = c - 1;
            } else {
                currentCircle = c;
                break
            }
        }
        // if (currentCircle != 0) {
        //     // const occupancyPercent = currentSlotInCircle[currentCircle] / slotsInCircle[currentCircle];
        //     // const nextOccupancyPercent = currentSlotInCircle[currentCircle - 1] / slotsInCircle[currentCircle - 1];
           
        //     // for (let nextOccupancyPercent = 0; currentCircle >= 1 && occupancyPercent > nextOccupancyPercent; currentCircle--) {
        //     // }
        // } else {
        //     currentCircle = nCircles - 1;
        // }
    }

    return positions;
}

export function dotsInRect(width: number, height: number, i: number, N: number, rand = true, sort: 'w'|'h'='w') {
    const d = Math.sqrt((width * height) / N);
    let xi: number, yi: number;

    if (sort == 'w') {
        const nForHeight = height / d;
        xi = Math.floor(i / nForHeight);
        yi = i - (xi * nForHeight);
    } else {
        const nForWidth = width / d;
        yi = Math.floor(i / nForWidth);
        xi = i - (yi * nForWidth);
    }
    const xr = d * (rand ? Math.random() / 2 : 0);
    const yr = d * (rand ? Math.random() / 2 : 0);
    return {
        x: xi * d + xr,
        y: yi * d + yr,
    }
} 

export function normalize_1_10_to_0_1(v: number) {
    return (v - 1)/9;
}