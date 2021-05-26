import { Box, Link, Typography } from "@material-ui/core";
import React from "react";
import { useAccentStyles } from "./theme";

export function NavBar(props: { current: 'viz' | 'about', height: string }) {
    const { current, height } = props;
    const classes = useAccentStyles();
    return (
        <Box display='flex' height={height || '2rem'} pt={2} pr={2}>
            <Typography variant='h3'>
            </Typography>
            <Box flexGrow='1'></Box>

            {current != 'viz' ? (
            <Box mr={2}>
                <Typography variant='h3'>
                    <Link color='inherit' href='/'> Back to the viz </Link>
                </Typography>
            </Box>
            ) : null}

            <Box>
                <Typography variant='h3' className={current == 'about' ? classes.accentText : ''}>
                    <Link color='inherit' href='/about'> About </Link>
                </Typography>
            </Box>
        </Box>
    );
}