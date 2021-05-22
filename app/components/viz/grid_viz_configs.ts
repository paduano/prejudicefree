import { debug, pie, PI_HALF, rand, randInCircle, randInGroup, dotsInRect, normalize_1_10_to_0_1 } from "../../../utils/utils";
import { getDemographicGroupIndex, groupsForDemographic, Observation, ObservationDemographics, ObservationQuery, valuesForObservation, ValuesQuery } from "../../observation";
import { colorGradientList, getColorIndex } from "../ui_utils";

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
    observations: Observation[],
    filterQuery: ObservationQuery;
    valuesQuery: ValuesQuery,
    primaryFilterDemographic: ObservationDemographics;
    secondaryFilterDemographic: ObservationDemographics;
    currentRow: number;
    useColors: boolean;
}

export interface GroupLayoutInfo {
    groupPosX: number[][],
    groupPosY: number[][],
    rectWidths: number[][],
    rectHeights: number[][],
    observationsByColorIndex: number[][][], // array for each group
    totalObservations: number[][],
    yourselfPositions: { x: number, y: number}[][],
}

const blueColor = { r: 117 / 255, g: 189 / 255, b: 255 / 255 };
const redColor = { r: 236 / 255, g: 72 / 255, b: 82 / 255 };

const colors = Array.from({ length: 255 }, (x, i) => {
    return { r: 117 / 255, g: 189 / 255, b: i / 255 }
})


const colorGradient = (cListIndex: number) => {
    return {
        r: colorGradientList[cListIndex][0] / 255,
        g: colorGradientList[cListIndex][1] / 255,
        b: colorGradientList[cListIndex][2] / 255,
    }
}

const grayGradient = (i: number) => {
    return {
        r: i,
        g: i,
        b: i,
    }
}


export type DotsVizConfiguration<T> = {
    prepare: (layoutParams: LayoutParams) => T;
    dot?: (index: number, observation: Observation, layoutParams: LayoutParams, state: T) => DotAttributes;
}

export const DotsUniformConfig: DotsVizConfiguration<void> = {
    prepare: (layoutParams: LayoutParams) => { return {
        groupLayoutInfo: {
            groupPosX: [[0]],
            groupPosY: [[0]],
            rectWidths: [[0]],
            rectHeights: [[0]],
            observationsByColorIndex: [[0]],
            totalObservations: [[0]],
            yourselfPositions: [[{x: 0, y: 0}]],
        },
    }},
    dot: (i: number, ob: Observation, layoutParams: LayoutParams, state: void) => {
        let x = rand(-6, 6);
        let y = rand(-4, 4);
        let z = rand(-4, 0);
        const valuesMatch = valuesForObservation(ob, layoutParams.valuesQuery);
        const colorIndex = getColorIndex(valuesMatch);
        
        const color = layoutParams.useColors ? colorGradient(colorIndex) : grayGradient(rand(0, 1));
        return {
            position: {
                x,
                y,
                z
            },
            opacity: 1,
            color,
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

export interface VizPrepareState { 
    idPosMap: any, 
    groupLayoutInfo: GroupLayoutInfo, 
}

export const DotsTestMultiGroup: DotsVizConfiguration<VizPrepareState> = {
    prepare: (layoutParams: LayoutParams) => {
        const { currentRow, observations, valuesQuery, primaryFilterDemographic, secondaryFilterDemographic } = layoutParams;
        const idPosMap: { [id: number]: { x: number, y: number, groupX: number, groupY: number } } = {};

        // 1. group definition
        // -------------------
        const demoX = primaryFilterDemographic;
        const demoY = secondaryFilterDemographic;
        const nGroupX = !!demoX ? groupsForDemographic(demoX).length : 1;
        const nGroupY = !!demoY ? groupsForDemographic(demoY).length : 1;
        const groups: Observation[][][] = new Array(nGroupX)
            .fill(null).map(() => new Array(nGroupY)
            .fill(null).map(() => new Array())); // init multi-dimensional empty X Y array
        const observationsByColorIndex: number[][][] = new Array(nGroupX)
            .fill(null).map(() => new Array(nGroupY)
            .fill(null).map(() => new Array(colorGradientList.length).fill(0))); // X Y array of cList count init at 0s
        const totalObservations: number[][] = new Array(nGroupX)
            .fill(null).map(() => new Array(nGroupY).fill(0)); // X Y array of 0s

        const yourselfValue = normalize_1_10_to_0_1(valuesQuery.value);
        const yourselfPositions: { x: number, y: number}[][] = new Array(nGroupX)
            .fill(null).map(() => new Array(nGroupY)
            .fill(null));

        // 2. group assignment
        // -------------------
        for (let i = 0; i < observations.length; i++) {
            const o = observations[i];
            const groupIndexX = !!demoX ? getDemographicGroupIndex(o, demoX) : 0;
            const groupIndexY = !!demoY ? getDemographicGroupIndex(o, demoY) : 0;
            groups[groupIndexX][groupIndexY].push(o);
            totalObservations[groupIndexX][groupIndexY]++;
        }

        // 3. group sorting
        // -------------------
        const sortByValues = (x: Observation, y: Observation) => {
            let xd = 0;
            let yd = 0;
            const xValue = valuesForObservation(x, valuesQuery) + xd;
            const yValue = valuesForObservation(y, valuesQuery) + yd;
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
        let VIZ_HEIGHT = 4;
        if (nGroupY == 2) {
            VIZ_HEIGHT = 5;
        }
        if (nGroupY == 3) {
            VIZ_HEIGHT = 6;
        }
        if (nGroupY == 4) {
            VIZ_HEIGHT = 8;
        }
        const GROUP_PADDING_X = 0.8;
        const GROUP_PADDING_Y = 3;
        // const SPACE_Y_FOR_OTHER_ROWS = 1.5; 
        const rectWidths: number[][] = new Array(nGroupX).fill(null).map(() => new Array(nGroupY).fill(0)); // init 2 dim with 0
        const rectHeights: number[][] = new Array(nGroupX).fill(null).map(() => new Array(nGroupY).fill(0)); // init 2 dim with 0
        const groupPosX: number[][] = new Array(nGroupX).fill(null).map(() => new Array(nGroupY).fill(0)); // init 2 dim with 0
        const groupPosY: number[][] = new Array(nGroupX).fill(null).map(() => new Array(nGroupY).fill(0)); // init 2 dim with 0
        let totRow: number[] = new Array(nGroupY).fill(0);
        let totColumns: number[] = new Array(nGroupX).fill(0);;
        let N = observations.length;
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
                let height = hr * VIZ_HEIGHT;

                rectWidths[x][y] = width;
                rectHeights[x][y] = height;
                groupPosX[x][y] = -VIZ_WIDTH / 2 + acc_x - (GROUP_PADDING_X * nGroupX / 2);
                groupPosY[x][y] = -VIZ_HEIGHT / 2 + acc_y;
                acc_y += height + GROUP_PADDING_Y;
            }
            acc_x += Math.max(...rectWidths[x]) + GROUP_PADDING_X;
        }

        // Center current Row in the screen
        // ---------------------
        const centeredY = groupPosY[0][currentRow] + rectHeights[0][currentRow] / 2;
        for (let x = 0; x < nGroupX; x++) {
            for (let y = 0; y < nGroupY; y++) {
                groupPosY[x][y] -= centeredY;
            }
        }

        // 5. layout computation
        // ------------------
        let lastObservationValuesMatch = 0;
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

                    // add group position
                    pos.x += posX;
                    pos.y += posY;


                    // 5.1 place yourself
                    // -------------------
                    const valuesMatch = valuesForObservation(o, valuesQuery);
                    const colorIndex = getColorIndex(valuesMatch);
                    observationsByColorIndex[x][y][colorIndex]++;
                    const valueInBetween = (yourselfValue >= lastObservationValuesMatch && yourselfValue <= valuesMatch);
                    if (yourselfPositions[x][y] == null || valueInBetween) {
                        yourselfPositions[x][y] = pos;
                    }
                    lastObservationValuesMatch = valuesMatch;

                    // add displacement if not current row
                    let displaceX = 0;
                    let displaceY = 0;
                    if (currentRow != y) {
                        displaceY += rand(0, 0.4);
                        displaceX += rand(0, 0.4);
                    }

                    idPosMap[o.id] = {
                        x: pos.x + displaceX,
                        y: pos.y + displaceY,
                        groupX: x,
                        groupY: y 
                    };
                }
            }
        }

        // 6. copy and add a little displacement to your position
        // ------------------
        for (let x = 0; x < nGroupX; x++) {
            for (let y = 0; y < nGroupY; y++) {
                yourselfPositions[x][y] = Object.assign({}, yourselfPositions[x][y]);
                yourselfPositions[x][y].y += 0.0001;
            }
        }

        // 

        return {
            idPosMap,
            groupLayoutInfo: {
                groupPosX,
                groupPosY,
                rectWidths,
                rectHeights,
                observationsByColorIndex,
                totalObservations, 
                yourselfPositions,
            },
        };
    },
    dot: (i: number, ob: Observation, layoutParams: LayoutParams, state) => {
        const { observations } = layoutParams;
        const { idPosMap } = state;
        const valuesMatch = valuesForObservation(ob, layoutParams.valuesQuery);
        // const color = mix(blueColor, redColor, valuesMatch)
        const colorIndex = getColorIndex(valuesMatch);
        const color = colorGradient(colorIndex);
        const pos = idPosMap[ob.id];
        if (!pos) {
            console.error('pos not defined')
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

// export const DOT_CONFIGS = [
//     DotsTestMultiGroup,
//     DotsUniformConfig,
// ]
