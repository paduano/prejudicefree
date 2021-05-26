import styles from '../styles/demo.module.css'

import { connect } from 'react-redux';
import { fetchAllVizData, RootState, UISelect } from '../app/store';
import React from 'react';
import { Box, Link, ThemeProvider, Typography } from '@material-ui/core';
import { invertedTheme, useAccentStyles } from '../app/components/theme';
import dynamic from 'next/dynamic';
import { Header } from '../app/components/header';
import { MAIN_CONTAINER_ID } from '../app/components/ui_utils';
import { SelectOverlays } from '../app/components/select';
import { Legend } from '../app/components/legend';
import { DetailPanel } from '../app/components/detail_panels';
import { FocusOverlay, isFeatureAvailableSelector } from '../app/onboarding';
import { NavBar } from '../app/components/navbar';



export default function AboutPage() {

  const classes = useAccentStyles();
  return (
    <ThemeProvider theme={invertedTheme}>
      <NavBar current='about' height='2rem'></NavBar>
      <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' height='100%'>
        <Box mt='7rem' width='800px'>

          <Box mb={2}>
            <Typography variant='h2' className={classes.accentText} >
              About this website.
              </Typography>
          </Box>

          <Box>
            <Box>
              <Typography variant='h4'>
                This website uses the data from the <Link color="inherit" underline='always' target="_blank" href="https://www.worldvaluessurvey.org/wvs.jsp">World Values Survey, Wave 7</Link> and is inspired
              by the countless amazing research that has been written on the topic. <br />
              I recommend reading <Link color="inherit" underline='always' target="_blank" href="https://www.cambridge.org/core/books/freedom-rising/80316A9C5264A8038B0AA597078BA7C6"><i>Freedom Rising - Human Empowerment and the Quest for Emancipation</i></Link>
              {' '}by Christian Welzel to anyone that wants to learn more.

              {/* <Box style={{borderTop: '1px solid white'}}></Box> */}

              </Typography>
            </Box>

            <Typography variant='h4'>
              The source code for this website is available <Link color="inherit" underline='always' target="_blank" href="https://github.com/paduano/prejudicefree">here</Link>.
            </Typography>

            <Box mt={4}>
              <Box mb={2}>
                <Typography variant='h2' className={classes.accentText} >
                  About the author.
              </Typography>
              </Box>

              <Typography variant='h4'>
                I'm a UX Software Engineer with a passion for Dataviz. <br/>
                Say hi at hi@prejudicefree.com
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}
