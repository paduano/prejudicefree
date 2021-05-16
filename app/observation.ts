import { educationLevels, educationRanges, getIndexFromRange } from "./data/legend";

type Sex = 'M' | 'F';

export interface AllEntriesStore {
    [countryCode: string]: Observation[]
}

export interface RawValues {
    justify_homosexuality?: number,
    justify_prostitution?: number,
    justify_abortion?: number,
    justify_divorce?: number,
    justify_euthanasia?: number,
    justify_suicide?: number,
    justify_casual_sex?: number,
    justify_death_penalty?: number
}

export interface Observation extends RawValues {
    id: number,
    country_code: string,
    sex?: Sex,
    birth_year?: number,
    education?: number,
    education_parents?: number,
    income_quantiles?: number,
    is_religious?: boolean,
    against_homo?: boolean,
    against_abortion?: boolean,
    political_orientation?: 'R' | 'L' | 'C',
    people_can_be_trusted?: boolean,
    trust_people_first_time?: boolean,
    against_immigrants?: boolean,
}

export interface ObservationQuery {
    country_codes?: string[], // list of accepted country codes
    sex?: Sex,
    min_birth_year?: number,
    max_birth_year?: number,
    min_education?: number,
    max_education?: number,
    min_education_parents?: number,
    max_education_parents?: number,
    min_income_quantiles?: number,
    max_income_quantiles?: number,
    is_religious?: boolean,
}

export interface ValuesQuery extends RawValues {
    // is_religious?: boolean, // duplicated from observationQuery. Since it's more of a value
}

export interface AltObservationQuery extends ObservationQuery {
    whatChanged: {
        variable: 'is_religious' | 'education_parents',
        from: boolean|number;
        to: boolean|number;
    }
}

export interface AltStatsAndQuery {
    stats: StatsAccumulator;
    query: AltObservationQuery;
}

export interface StatsAccumulator {
    country_code: {[id: string]: number},
    sex: {[id in Sex]: number}
    // birth_year?: number, // do segmentation by generation
    // education_parents?: number, //  segment
    income_quantiles: {
        _0_40: number,
        _41_60: number,
        _71_100: number,
    }
    is_religious: {[id: string]: number},
    against_homo: {[id: string]: number},
    against_abortion: {[id: string]: number},
    political_orientation: {[id: string]: number},
    people_can_be_trusted: {[id: string]: number},
    trust_people_first_time: {[id: string]: number}, 
    against_immigrants: {[id: string]: number}, 
}

export const getEmptyStats = (): StatsAccumulator => {
    return {
        country_code: {},
        sex: {'M': 0, 'F': 0},
        income_quantiles: {
            _0_40: 0,
            _41_60: 0,
            _71_100: 0,
        },
        is_religious: {'true': 0, 'false': 0},
        against_homo: {'true': 0, 'false': 0},
        against_abortion: {'true': 0, 'false': 0},
        political_orientation: {'true': 0, 'false': 0},
        people_can_be_trusted: {'true': 0, 'false': 0},
        trust_people_first_time: {'true': 0, 'false': 0}, 
        against_immigrants: {'true': 0, 'false': 0}, 
    }
}

const TRUE_OR_FALSE_KEYS = [
    'is_religious', 
    'against_homo', 
    'against_abortion', 
    'against_immigrants', 
    'people_can_be_trusted', 
    'trust_people_first_time'
];

// keys that are accumulated by their individual value
const FACTOR_KEYS = [
    'sex',
    'country_code',
    'political_orientation', 
];

export function filterAndStatsObservations(observations: Observation[], query: ObservationQuery ) {
    const filteredEntries: Observation[] = [];
    const stats: StatsAccumulator = {
        country_code: {},
        sex: {'M': 0, 'F': 0},
        income_quantiles: {
            _0_40: 0,
            _41_60: 0,
            _71_100: 0,
        },
        is_religious: {'true': 0, 'false': 0},
        against_homo: {'true': 0, 'false': 0},
        against_abortion: {'true': 0, 'false': 0},
        political_orientation: {'true': 0, 'false': 0},
        people_can_be_trusted: {'true': 0, 'false': 0},
        trust_people_first_time: {'true': 0, 'false': 0}, 
        against_immigrants: {'true': 0, 'false': 0}, 
    };
    
    for (let i = 0; i < observations.length; i++) {
        const o = observations[i]; 
        if (matchObservation(o, query)) {
            filteredEntries.push(o);
            accumulateStat(o, stats);
        }
    }

    return {
        filteredEntries, 
        stats,
    }
}

export function formatAllEntriesStore(observations: Observation[]): AllEntriesStore {
    const store: AllEntriesStore = {};
    let id = 0;
    for (let i = 0; i < observations.length; i++) {
        const o = observations[i];
        o.id = id++;
        const code = o.country_code;
        if (!store[code]) {
            store[code] = [];
        }
        store[code].push(o);
    }
    return store;
}

export function filterAndStatObservationsWithVariations(observStore: AllEntriesStore, query: ObservationQuery) {
    if (!query.country_codes) {
        console.warn('query does not specify a country');
    }

    const observations: Observation[] = [];
    query.country_codes.forEach(code => {
        if (observStore[code]) {
            observations.push(...observStore[code]);
        }
    });


    const {stats, filteredEntries} = filterAndStatsObservations(observations, query);
    const altQueries = generateAlternativeQueries(query);
    const altStatsAndQuery = altQueries.map(query => {return {
        stats: filterAndStatsObservations(observations, query).stats,
        query,
    }});

    return {
        filteredEntries,
        stats,
        altStatsAndQuery,
    }
}

function generateAlternativeQueries(original: ObservationQuery ): AltObservationQuery[] {
    const queries: AltObservationQuery[] = []

    // vary religion
    if (original.is_religious != undefined) {
        const flipReligiosity = Object.assign({}, );
        queries.push({
            ...original, 
            is_religious: !original.is_religious,
            whatChanged: {
                variable: 'is_religious',
                from: original.is_religious,
                to: !original.is_religious
            }
        });
    } else {
        queries.push({
            ...original, 
            is_religious: true,
            whatChanged: {
                variable: 'is_religious',
                from: false,
                to: true
            }
        });
        queries.push({
            ...original, 
            is_religious: false,
            whatChanged: {
                variable: 'is_religious',
                from: true,
                to: false
            }
        });
    }

    // vary parents education
    const currentIndex = getIndexFromRange(original.min_education_parents, original.max_education_parents, educationRanges);
    for (let i = 0; i < educationRanges.length; i++) {
        if (i != currentIndex) {
            queries.push({
                ...original,
                min_education_parents: educationRanges[i][0], 
                max_education_parents: educationRanges[i][1],
                whatChanged: {
                    variable: 'education_parents',
                    from: currentIndex,
                    to: i 
                }
            });
        }
    }

    return queries;
}

function accumulateStat(o: Observation, stat: StatsAccumulator) {
    TRUE_OR_FALSE_KEYS.forEach(key => {
        if (o[key] != undefined) {
            const v = '' + o[key];
            if (v != 'true' && v != 'false') {
                throw `${v} must be 'true' or 'false'`
            }
            stat[key][v] += 1; 
        }
    });

    FACTOR_KEYS.forEach(key => {
        if (o[key] != undefined) {
            const v = o[key];
            if (stat[key][v] == undefined) {
                stat[key][v] = 0;
            }
            stat[key][v] += 1; 
        }
    });

    if (o.income_quantiles != undefined) {
        const q = o.income_quantiles;
        stat.income_quantiles._0_40 += q < 4 ? 1 : 0; 
        stat.income_quantiles._41_60 += q >= 4 && q <= 6 ? 1 : 0; 
        stat.income_quantiles._71_100 += q > 7 ? 1 : 0; 
    }
}

function matchObservation(o: Observation, query: ObservationQuery): boolean {
    // country
    if (query.country_codes) {
        if (o.country_code == undefined || query.country_codes.indexOf(o.country_code) == -1) {
            return false;
        } 
    }

    // sex
    if (query.sex) {
        if (o.sex == undefined || query.sex != o.sex) {
            return false;
        } 
    }

    // religiosity
    // if (query.is_religious != undefined) {
    //     if (o.is_religious == undefined || query.is_religious != o.is_religious) {
    //         return false;
    //     } 
    // }

    // min birth year
    if (query.min_birth_year != undefined) {
        if (o.birth_year == undefined || query.min_birth_year > o.birth_year) {
            return false;
        } 
    }

    // max birth year
    if (query.max_birth_year != undefined) {
        if (o.birth_year == undefined || query.max_birth_year < o.birth_year) {
            return false;
        } 
    }
    
    // min education
    if (query.min_education != undefined) {
        if (o.education == undefined || query.min_education > o.education) {
            return false;
        }
    }

    // max education
    if (query.max_education != undefined) {
        if (o.education == undefined || query.max_education < o.education) {
            return false;
        }
    }

    // min education parents
    if (query.min_education_parents != undefined) {
        if (o.education_parents == undefined || query.min_education_parents > o.education_parents) {
            return false;
        } 
    }

    // max education parents
    if (query.max_education_parents != undefined) {
        if (o.education_parents == undefined || query.max_education_parents < o.education_parents) {
            return false;
        } 
    }

   
    // min income
    if (query.min_income_quantiles != undefined) {
        if (o.income_quantiles == undefined || query.min_income_quantiles > o.income_quantiles) {
            return false;
        } 
    }

    // max income
    if (query.max_income_quantiles != undefined) {
        if (o.income_quantiles == undefined || query.max_income_quantiles < o.income_quantiles) {
            return false;
        } 
    }

    return true;
} 

// value matching, returns 0 - 1 
export function valuesForObservation(observation: Observation, query: ValuesQuery): number {
    let nOfValues = 0;
    let z = 0;
    Object.keys(query).forEach(value => {
        if (observation[value] !== undefined && query[value] !== undefined) {
            nOfValues++;
            z += Math.abs(observation[value] - query[value]);
        }
    })
    if (nOfValues == 0) {
        return 0;
    }
    return z/nOfValues;
}