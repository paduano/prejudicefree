import { debug, pie, PI_HALF, rand, randInCircle, randInGroup, dotsInRect } from "../../../utils/utils";
import { getDemographicGroupIndex, groupsForDemographic, Observation, ObservationDemographics, ObservationQuery, valuesForObservation, ValuesQuery } from "../../observation";

export interface DotAttributes {
    position?: {
        x: number,
        y: number,
        z: number,
    };
    opacity?: number
    color?: {
        r: number,
        g: number,
        b: number,
    },
    useGroup?: boolean
}


export interface LayoutParams {
    filteredObservations: Observation[],
    allObservations: Observation[],
    filterQuery: ObservationQuery;
    valuesQuery: ValuesQuery,
    primaryFilterDemographic: ObservationDemographics;
    secondaryFilterDemographic: ObservationDemographics;
}

export interface GroupLayoutInfo {
    groupPosX: number[][],
    groupPosY: number[][],
    rectWidths: number[][],
    rectHeights: number[][],
}

const blueColor = { r: 117 / 255, g: 189 / 255, b: 255 / 255 };
const redColor = { r: 236 / 255, g: 72 / 255, b: 82 / 255 };

const colors = Array.from({ length: 255 }, (x, i) => {
    return { r: 117 / 255, g: 189 / 255, b: i / 255 }
})

const colorGradient = (v: number) => {
    if (v < 0 || v > 1) {
        throw `${v} not a valid color gradient value`
    }
    const cList = [
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
        [177, 0, 38],
        // [227, 26, 28],
        [252, 78, 42],
        // [253, 141, 60],
        // [254, 178, 76],
        [254, 217, 118],
        // [255, 237, 160],
        [255, 255, 204],
        // [158, 202, 225],
        [117, 189, 255],

    ]
    const cListIndex = Math.round(v * (cList.length - 1));
    return {
        r: cList[cListIndex][0] / 255,
        g: cList[cListIndex][1] / 255,
        b: cList[cListIndex][2] / 255,
    }
}


export type DotsVizConfiguration<T> = {
    prepare: (layoutParams: LayoutParams) => T;
    dot?: (index: number, observation: Observation, layoutParams: LayoutParams, state: T) => DotAttributes;
}

export const DotsUniformConfig: DotsVizConfiguration<void> = {
    prepare: (layoutParams: LayoutParams) => { },
    dot: (i: number, ob: Observation, layoutParams: LayoutParams, state: void) => {
        let x = rand(-2, 2);
        let y = rand(-2, 2);
        let z = rand(-2, 2);
        return {
            position: {
                x,
                y,
                z
            },
            opacity: 1
        }
    }
}


function getDemoFiltersFromFilterQuery(filterQuery: ObservationQuery) {
    let demoX: ObservationDemographics | null = null;
    let demoY: ObservationDemographics | null = null;

    // crappy way to decide what demo to filter by
    if (filterQuery.sex != null) {
        if (!demoX) {
            demoX = 'sex';
        } else if (!demoY) {
            demoY = 'sex';
        }
    }
    if (filterQuery.min_education != null) {
        if (!demoX) {
            demoX = 'education';
        } else if (!demoY) {
            demoY = 'education';
        }
    }
    if (filterQuery.min_education_parents != null) {
        if (!demoX) {
            demoX = 'education_parents';
        } else if (!demoY) {
            demoY = 'education_parents';
        }
    }
    if (filterQuery.min_birth_year != null) {
        if (!demoX) {
            demoX = 'age';
        } else if (!demoY) {
            demoY = 'age';
        }
    }
    if (filterQuery.min_income_quantiles != null) {
        if (!demoX) {
            demoX = 'income';
        } else if (!demoY) {
            demoY = 'income';
        }
    }
    if (filterQuery.is_religious != null) {
        if (!demoX) {
            demoX = 'religiosity';
        } else if (!demoY) {
            demoY = 'religiosity';
        }
    }
    return {demoX, demoY};
}

const DotsTestMultiGroup: DotsVizConfiguration<{idPosMap: any, groupLayoutInfo: GroupLayoutInfo}> = {
    prepare: (layoutParams: LayoutParams) => {
        const { filteredObservations, allObservations, filterQuery, primaryFilterDemographic, secondaryFilterDemographic } = layoutParams;
        const idPosMap: { [id: number]: { x: number, y: number, groupX: number, groupY: number } } = {};
        const betweenGroupPadding = 0.2;

        // 1. group definition
        // -------------------
        const demoX = primaryFilterDemographic;
        const demoY = secondaryFilterDemographic;
        const nGroupX = !!demoX ? groupsForDemographic(demoX).length : 1;
        const nGroupY = !!demoY ? groupsForDemographic(demoY).length : 1;
        const groups: Observation[][][] = new Array(nGroupX)
            .fill(null).map(() => new Array(nGroupY)
            .fill(null).map(() => new Array())); // init multi-dimensional empty X Y array

        // 2. group assignment
        // -------------------
        for (let i = 0; i < allObservations.length; i++) {
            const o = allObservations[i];
            const groupIndexX = !!demoX ? getDemographicGroupIndex(o, demoX) : 0;
            const groupIndexY = !!demoY ? getDemographicGroupIndex(o, demoY) : 0;
            groups[groupIndexX][groupIndexY].push(o);
        }

        // 3. group sorting
        // -------------------
        const sortByValues = (x: Observation, y: Observation) => {
            let xd = 0;
            let yd = 0;
            const xValue = valuesForObservation(x, layoutParams.valuesQuery) + xd;
            const yValue = valuesForObservation(y, layoutParams.valuesQuery) + yd;
            return xValue - yValue;
        }
        for (let x = 0; x < nGroupX; x++) {
            for (let y = 0; y < nGroupY; y++) {
                groups[x][y].sort(sortByValues);
            }
        }

        // 4. layout variables
        // ------------------
        const VIZ_WIDTH = 6;
        const VIZ_HEIGHT = 4;
        const GROUP_PADDING = 0.3;
        const rectWidths: number[][] = new Array(nGroupX).fill(null).map(() => new Array(nGroupY).fill(0)); // init 2 dim with 0
        const rectHeights: number[][] = new Array(nGroupX).fill(null).map(() => new Array(nGroupY).fill(0)); // init 2 dim with 0
        const groupPosX: number[][] = new Array(nGroupX).fill(null).map(() => new Array(nGroupY).fill(0)); // init 2 dim with 0
        const groupPosY: number[][] = new Array(nGroupX).fill(null).map(() => new Array(nGroupY).fill(0)); // init 2 dim with 0
        let totRow: number[] = new Array(nGroupY).fill(0);
        let totColumns: number[] = new Array(nGroupX).fill(0);;
        let N = allObservations.length;
        // get totals for row and columns
        for (let x = 0; x < nGroupX; x++) {
            for (let y = 0; y < nGroupY; y++) {
                const l = groups[x][y].length;
                totRow[y] += l;
                totColumns[x] += l;
            }
        }
        // compute widths and pos
        let acc_x = 0;
        for (let x = 0; x < nGroupX; x++) {
            let acc_y = 0;
            for (let y = 0; y < nGroupY; y++) {
                const hr = totRow[y] / N;
                const wr = totColumns[x] / N;
                const width = wr * VIZ_WIDTH;
                const height = hr * VIZ_HEIGHT;
                rectWidths[x][y] = width;
                rectHeights[x][y] = height;
                groupPosX[x][y] = -VIZ_WIDTH / 2 + acc_x;
                groupPosY[x][y] = -VIZ_HEIGHT / 2 + acc_y;
                acc_y += height + GROUP_PADDING;
            }
            acc_x += Math.max(...rectWidths[x]) + GROUP_PADDING;
        }

        // 5. layout computation
        // ------------------
        const orientation = nGroupX == 1 ? 'w' : 'h';
        for (let x = 0; x < nGroupX; x++) {
            for (let y = 0; y < nGroupY; y++) {
                const group = groups[x][y];
                const rectWidth = rectWidths[x][y];
                const rectHeight = rectHeights[x][y];
                const posX = groupPosX[x][y];
                const posY = groupPosY[x][y];
                for (let i = 0; i < group.length; i++) {
                    const o = group[i];
                    const pos = dotsInRect(rectWidth, rectHeight, i, group.length, true /* noise */, orientation);
                    idPosMap[o.id] = {
                        x: posX + pos.x,
                        y: posY + pos.y,
                        groupX: x,
                        groupY: y 
                    };
                }
            }
        }
        return {
            idPosMap,
            groupLayoutInfo: {
                groupPosX,
                groupPosY,
                rectWidths,
                rectHeights,
            }
        };
    },
    dot: (i: number, ob: Observation, layoutParams: LayoutParams, state) => {
        const { filteredObservations, allObservations } = layoutParams;
        const { idPosMap } = state;
        const valuesMatch = valuesForObservation(ob, layoutParams.valuesQuery);
        // const color = mix(blueColor, redColor, valuesMatch)
        const color = colorGradient(valuesMatch);
        const pos = idPosMap[ob.id];
        if (!pos) {
            debugger
        }
        return {
            position: {
                x: pos.x,
                y: pos.y,
                z: 0,
            },
            color,
            opacity: 1,
        }
    }
}

const mix = (c1, c2, x) => {
    return {
        r: c1.r * (1 - x) + c2.r * x,
        g: c1.g * (1 - x) + c2.g * x,
        b: c1.b * (1 - x) + c2.b * x,
    }
}

export const DOT_CONFIGS = [
    DotsTestMultiGroup,
    DotsUniformConfig,
]
