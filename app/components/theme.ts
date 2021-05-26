import { blue, green, purple } from '@material-ui/core/colors';
import { createMuiTheme, makeStyles, StylesProvider } from '@material-ui/core/styles';
import { color } from './colors';
export const sliderThumbRadius = 28;

const iOSBoxShadow =
    '0 3px 1px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.13),0 0 0 1px rgba(0,0,0,0.02)';

const theme = createMuiTheme({
    palette: {
        secondary: { main: blue[400] },
    },
    overrides: {
      
        MuiSlider: {
            root: {
                color: '#3880ff',
                height: 2,
                padding: '15px 0',
            },
            thumb: {
                height: sliderThumbRadius,
                width: sliderThumbRadius,
                backgroundColor: '#fff',
                boxShadow: iOSBoxShadow,
                marginTop: -14,
                marginLeft: -14,
                '&:focus, &:hover, &$active': {
                    boxShadow: '0 3px 1px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.3),0 0 0 1px rgba(0,0,0,0.02)',
                    // Reset on touch devices, it doesn't add specificity
                    '@media (hover: none)': {
                        boxShadow: iOSBoxShadow,
                    },
                },
            },
            active: {},
            valueLabel: {
                left: 'calc(-50% + 12px)',
                top: -18,
                '& *': {
                    background: 'transparent',
                    color: '#000',
                },
            },
            track: {
                height: 2,
            },
            rail: {
                height: 2,
                opacity: 0.5,
                backgroundColor: '#bfbfbf',
            },
            mark: {
                backgroundColor: '#bfbfbf',
                height: 8,
                width: 1,
                marginTop: -3,
            },
            markActive: {
                opacity: 1,
                backgroundColor: 'currentColor',
            }
        }
    }
});
export default theme;


export const invertedTheme = createMuiTheme({
    palette: {
        background: {
            default: color.background,
        }
    },
    typography: {
        allVariants: {
            color: "#FFFFFF",
            fontFamily: [
                    'Noticia Text',
                ].join(','),

        },
        h1: {
            fontSize: '3rem',
        },
        h2: {
            fontSize: '2rem',
            // fontStyle: 'italic', // YYY
        },
        h3: {
            fontSize: '1rem',
            fontWeight: 700,
            fontFamily: [
                'News Cycle'
            ].join(','),
        },
        h4: {
            fontSize: '1.2rem',
            fontWeight: 400,
            fontFamily: [
                'Noticia Text',
            ].join(','),
        },

        // legend
        h5: {
            fontSize: '1rem',
            fontWeight: 400,
            fontFamily: [
                'News Cycle'
            ].join(','),
        },

        h6: {
            fontSize: '0.8rem',
            fontWeight: 400,
            fontFamily: [
                'Noticia Text',
            ].join(','),
        },
    },
});

export const invertedThemeMobile = createMuiTheme(invertedTheme, {

    typography: {
        h1: {
            fontSize: '2rem',
        },
        h2: {
            fontSize: '1.5rem',
        },
        h3: {
            fontSize: '0.8rem',
        },
        h5: {
            fontSize: '0.7rem',
        },
    }

});

export const useAccentStyles = makeStyles((invertedTheme) => ({
    accentText: {
        color: color.accent
    }
}));
