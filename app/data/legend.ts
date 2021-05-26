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
export const ageRanges = [[1981, 2002], [1956, 1980], [1900, 1955]];
export const incomeRanges = [[1, 4], [5, 7], [8, 10]];
export const educationRanges = [[0, 2], [3, 5], [6, 8]];

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
