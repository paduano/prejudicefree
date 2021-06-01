export const educationLevels = [
    'Less than primary',
    'Primary',
    'Lower secondary',
    'Upper secondary',
    'Post-secondary non tertiary',
    'Short-cycle tertiary',
    'Bachelor or equivalent',
    'Master or equivalent',
    'Doctoral or equivalent',
];

// export const ageRanges = [[1991, 2002], [1980, 2002], [1955, 1980], [1900, 1955]];
export const ageRanges = [[1981, 2002], [1956, 1980], [1800, 1955]];
// export const incomeRanges = [[1, 2], [3,4], [5, 6], [7, 8], [9, 10]];
export const incomeRanges = [[1, 3], [4,7], [8, 10]];
// export const educationRanges = [[0, 2], [3, 5], [6, 8]];
export const educationRanges = [[0, 0], [1, 1], [2, 2]];

export const getIndexFromRange = (min: number, max: number, ranges: number[][]) => {
    for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        if (range[0] == min && range[1] == max) {
            return i
        }
    }
    // console.warn(`${min}, ${max} is not a valid range`);
    return 0;
}

export const LATEST_WAVE = 'wvs_evs_7';
export const WAVE_TO_YEAR = {
    wvs_1: 1984,
    wvs_2: 1994,
    wvs_3: 1998,
    wvs_4: 2004,
    wvs_5: 2009,
    wvs_6: 2014,

    // EVS
    // 1           1981 - 1984
    //  2           1990 - 1993
    //  3           1999 - 2001
    //  4           2008 - 2010
    evs_1: 1984,
    evs_2: 1993,
    evs_3: 2001,
    evs_4: 2010,

    [LATEST_WAVE]: 2020,
}

export const VALUES_WITH_LIMITED_AVAILABLE_YEARS = {
    // justify_homosexuality: [1,2,3,4,5,6,7],
    // justify_prostitution: [1,2,3,4,5,6,7],
    // justify_abortion: [1,2,3,4,5,6,7],
    // justify_divorce: [1,2,3,4,5,6,7],
    justify_casual_sex: [LATEST_WAVE],
    justify_death_penalty: [LATEST_WAVE]

}

