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

export const ageRanges = [[1999, 2002], [1982, 1998], [1970, 1981], [1940, 1969]];
export const incomeRanges = [[1, 3], [4, 7], [8, 10]];
export const educationRanges = [[0, 3], [4, 5], [6, 8]];


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


// export const educationMarks = function(steps: string[]): {value: number, label: string}[] {
//     const ret = [];
//     steps.forEach((label, value) => {
//         ret.push({
//             value,
//             label,
//         })
//     })
//     return ret;
// }(educationLevels);
