import { debug, pie, PI_HALF, rand, randInCircle, randInGroup, dotsInRect } from "../../../utils/utils";
import { Observation, ObservationQuery, valuesForObservation, ValuesQuery } from "../../observation";

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
    r1: number,
    r2: number,
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
        [117, 189, 255],
        // [158, 202, 225],
        // [255, 255, 204],
        // [255, 237, 160],
        [254, 217, 118],
        // [254, 178, 76],
        // [253, 141, 60],
        // [252, 78, 42],
        // [227, 26, 28],
        [177, 0, 38],
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


const DotsAbortionConfig: DotsVizConfiguration<{ groupsCount: number[] }> = {
    prepare: (layoutParams: LayoutParams) => {
        let groupsCount = [0, 0];
        return { groupsCount }
    },
    dot: (i: number, ob: Observation, layoutParams: LayoutParams, state: { groupsCount: number[] }) => {
        const { groupsCount } = state;
        const groupIndex = (ob.against_abortion ? 1 : 0);
        let x = ob.against_abortion ? -1 : 1;
        let y = 0;
        let z = 0;

        const randCircle = randInGroup(groupsCount[groupIndex], 1000, 1);
        x += randCircle.x;
        y += randCircle.y;
        z += rand(0, 0.4);

        groupsCount[groupIndex]++;

        return {
            position: {
                x,
                y,
                z
            },
            opacity: 1,
        }
    }
}


const DotsReligionAbortionConfig: DotsVizConfiguration<{ groupsCount: number[] }> = {
    prepare: (layoutParams: LayoutParams) => {
        let groupsCount = [0, 0, 0, 0];
        return { groupsCount }
    },
    dot: (i: number, ob: Observation, layoutParams: LayoutParams, state: { groupsCount: number[] }) => {
        const { groupsCount } = state;
        const groupIndex = (ob.against_abortion ? 2 : 0) + (ob.is_religious ? 1 : 0);
        let x = ob.against_abortion ? -1 : 1;
        let y = ob.is_religious ? 1 : -1;
        let z = 0;

        const randCircle = randInGroup(groupsCount[groupIndex], 1000, 1);
        x += randCircle.x;
        y += randCircle.y;
        z += rand(0, 0.4);
        groupsCount[groupIndex]++;

        return {
            position: {
                x,
                y,
                z
            },
            opacity: 1,
        }
    }
}


const DotsAgeConfig: DotsVizConfiguration<{ ageCount: any }> = {
    prepare: (layoutParams: LayoutParams) => {
        let ageCount = {}
        return { ageCount }
    },
    dot: (i: number, ob: Observation, layoutParams: LayoutParams, state: { ageCount: any }) => {
        const { ageCount } = state;
        if (ob.birth_year) {
            ageCount[ob.birth_year] = ageCount[ob.birth_year] || 0;
            const count = ageCount[ob.birth_year];
            let x = (ob.birth_year - 1970) / 10;
            let y = count / 50;
            let z = 0;
            z += rand(0, 0.4);
            ageCount[ob.birth_year]++;
            const useGroup = ob.birth_year >= 1991;
            const color = useGroup ? { r: 1, g: 0, b: 0 } : null;
            return {
                position: {
                    x,
                    y,
                    z
                },
                opacity: 0.6,
                color,
                useGroup,
            }
        } else {
            return {
                opacity: 1
            }
        }
    }
}


const DotsTestCircleAndAbortion: DotsVizConfiguration<any> = {
    prepare: (layoutParams: LayoutParams) => {
        const { filteredObservations, allObservations } = layoutParams;
        const observationsSet = new Set<number>();
        const idPosMapInside = {};
        const idPosMapOutside = {};
        let inside_against_abortion_total = 0;

        for (let i = 0; i < filteredObservations.length; i++) {
            const ob = filteredObservations[i];
            observationsSet.add(ob.id);
            if (ob.against_abortion) {
                inside_against_abortion_total++;
            }
        }

        // create map for id->position to respect the grouping
        let currentInsideAgainstAbortionCount = 0;
        let currentInsideProAbortionCount = 0;
        for (let i = 0; i < filteredObservations.length; i++) {
            const ob = filteredObservations[i];
            if (ob.against_abortion) {
                idPosMapInside[ob.id] = currentInsideAgainstAbortionCount;
                currentInsideAgainstAbortionCount++
            } else {
                idPosMapInside[ob.id] = inside_against_abortion_total + currentInsideProAbortionCount;
                currentInsideProAbortionCount++;
            }
        }

        // same for all observations: count n of people per category, and assign id->index
        let outside_against_abortion_total = 0;
        for (let i = 0; i < allObservations.length; i++) {
            const ob = allObservations[i];
            if (!observationsSet.has(ob.id)) {
                if (ob.against_abortion) {
                    outside_against_abortion_total++;
                }
            }
        }

        // map
        let currentOutsideAgainstAbortionCount = 0;
        let currentOutsideProAbortionCount = 0;
        for (let i = 0; i < allObservations.length; i++) {
            const ob = allObservations[i];
            if (!observationsSet.has(ob.id)) {
                if (ob.against_abortion) {
                    idPosMapOutside[ob.id] = currentOutsideAgainstAbortionCount;
                    currentOutsideAgainstAbortionCount++
                } else {
                    idPosMapOutside[ob.id] = outside_against_abortion_total + currentOutsideProAbortionCount;
                    currentOutsideProAbortionCount++;
                }
            }
        }

        const nOut = layoutParams.allObservations.length - layoutParams.filteredObservations.length;
        const positionsOut = pie(layoutParams.r1 + 0.2, layoutParams.r2, nOut);
        const nIn = layoutParams.filteredObservations.length;
        const positionsIn = pie(0.2, layoutParams.r1 - 0.1, nIn);
        return {
            observationsSet,
            n: filteredObservations.length,
            positionsOut,
            positionsIn,
            idPosMapInside,
            idPosMapOutside,
        }
    },
    dot: (i: number, ob: Observation, layoutParams: LayoutParams, state: any) => {
        const observationsSet: Set<number> = state.observationsSet;
        if (observationsSet.has(ob.id)) {
            //inside
            const index = state.idPosMapInside[ob.id]
            const positionsIn = state.positionsIn[index];
            state.countIn++;
            return {
                position: {
                    x: positionsIn.x,
                    y: positionsIn.y,
                    z: 0,
                },
                color: ob.against_abortion ? redColor : blueColor
            }
        } else {
            //outside
            const index = state.idPosMapOutside[ob.id]
            const positionsOut = state.positionsOut[index];
            state.countOut++;
            return {
                position: {
                    x: positionsOut.x,
                    y: positionsOut.y,
                    z: 0,
                },
                // color: colors[i % colors.length],
                opacity: 1,
                color: ob.against_abortion ? redColor : blueColor
            }
        }
    }
}

const DotsTestRectValues: DotsVizConfiguration<any> = {
    prepare: (layoutParams: LayoutParams) => {
        const { filteredObservations, allObservations, filterQuery } = layoutParams;
        const idPosMap: { [id: number]: { x: number, y: number, group: number } } = {};
        const observationsSet = new Set<number>();
        const betweenGroupPadding = 0.2;

        const splitGroups = filterQuery.is_religious != undefined;

        const splitGroupFunc = (x: Observation): boolean => {
            return filterQuery.is_religious == !!x.is_religious;
        }
        const paddingForSplitting = (x: Observation): number => {
            if (splitGroups) {
                return splitGroupFunc(x) ? betweenGroupPadding / 2 : -betweenGroupPadding / 2;
            } else {
                return 0;
            }
        }
        const sortByValues = (x: Observation, y: Observation) => {
            let xd = 0;
            let yd = 0;
            if (splitGroups) {
                if (filterQuery.is_religious == x.is_religious) {
                    xd += 100;
                } 
                if (filterQuery.is_religious == y.is_religious) {
                    yd += 100;
                }
            }
            const xValue = valuesForObservation(x, layoutParams.valuesQuery) + xd;
            const yValue = valuesForObservation(y, layoutParams.valuesQuery) + yd;
            return xValue - yValue; 
        }

        const groupRest = [];
        const groupReligion = [];
        const groupDemographic = [];

        // prepare groups
        for (let i = 0; i < filteredObservations.length; i++) {
            const ob = filteredObservations[i];
            groupDemographic.push(ob);
            observationsSet.add(ob.id);
        }
        for (let i = 0; i < allObservations.length; i++) {
            const ob = allObservations[i];
            if (!observationsSet.has(ob.id)) {
                groupRest.push(ob)
            }
        }

        const totN = groupDemographic.length + groupRest.length + groupReligion.length;

        const groupRatio0 = groupDemographic.length / totN;
        const rectWidth0 = 6;
        const rectHeight0 = 3 * groupRatio0;
        const groupPosY0 = -2;

        const groupRatio1 = groupReligion.length / totN;
        const rectWidth1 = 6;
        const rectHeight1 = 3 * groupRatio1;
        const groupPosY1 = groupReligion.length > 0 ? groupPosY0 + rectHeight0 + betweenGroupPadding : groupPosY0 + rectHeight0;

        const groupRatio2 = groupRest.length / totN;
        const rectWidth2 = 6;
        const rectHeight2 = 3 * groupRatio2;
        const groupPosY2 = groupPosY1 + rectHeight1 + betweenGroupPadding;

        // sort
        groupDemographic.sort(sortByValues);
        groupReligion.sort(sortByValues);
        groupRest.sort(sortByValues);

        // group demographic
        for (let i = 0; i < groupDemographic.length; i++) {
            const ob = groupDemographic[i];
            const pos = dotsInRect(rectWidth0, rectHeight0, i, groupDemographic.length);
            idPosMap[ob.id] = {
                x: -rectWidth0 / 2 + pos.x + paddingForSplitting(ob),
                y: pos.y + groupPosY0,
                group: 0
            }
        }

        // religion
        for (let i = 0; i < groupReligion.length; i++) {
            const ob = groupReligion[i];
            const pos = dotsInRect(rectWidth1, rectHeight1, i, groupReligion.length);
            idPosMap[ob.id] = {
                x: -rectWidth1 / 2 + pos.x + paddingForSplitting(ob),
                y: pos.y + groupPosY1,
                group: 1
            }
        }

        // rest 
        for (let i = 0; i < groupRest.length; i++) {
            const ob = groupRest[i];
            const pos = dotsInRect(rectWidth2, rectHeight2, i, groupRest.length);
            idPosMap[ob.id] = {
                x: -rectWidth2 / 2 + pos.x + paddingForSplitting(ob),
                y: pos.y + groupPosY2,
                group: 2
            }
        }

        return {
            idPosMap,
        };
    },
    dot: (i: number, ob: Observation, layoutParams: LayoutParams, state: any) => {
        const { filteredObservations, allObservations } = layoutParams;
        const { idPosMap } = state;
        const valuesMatch = valuesForObservation(ob, layoutParams.valuesQuery);
        // const color = mix(blueColor, redColor, valuesMatch)
        const color = colorGradient(valuesMatch);
        const pos = idPosMap[ob.id];
        if (!pos){
            debugger
        }
        return {
            position: {
                x: pos.x,
                y: pos.y,
                z: 0,
            },
            // color: colors[i % colors.length], // gradient
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
    DotsTestRectValues,
    DotsTestCircleAndAbortion,
    DotsUniformConfig,
    // DotsAbortionConfig,
    // DotsReligionAbortionConfig,
    // DotsUniformConfig,
    // DotsAgeConfig,
    // DotsReligionAbortionConfig,
]
