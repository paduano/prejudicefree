import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/mvp.module.css'

import { useSelector, useDispatch, Provider, connect } from 'react-redux';
import { fetchAllVizData } from '../app/store';
import { Filters } from '../app/components/filters';
import React from 'react';
import { Results } from '../app/components/results';
import { Box, createMuiTheme, CssBaseline, ThemeProvider, Typography } from '@material-ui/core';
import { invertedTheme } from '../app/components/theme';
import { ThreeCanvas } from '../app/components/three_canvas';
import dynamic from 'next/dynamic';
import { Observation } from '../app/observation';
import { ValueFilters } from '../app/components/value_filters';
import { RootState } from '../app/store_definition';

const GridViz = dynamic(() => import('../app/components/viz/grid_viz').then((module) => module.GridViz as any), {
    ssr: false,
}) as any;

interface MVPProps {
  fetchAllVizData: (params) => {},
  loadingState: string;
}

interface MVPState {
  assetsLoaded: boolean;
}

export class MVP extends React.Component<MVPProps, MVPState> {
  gridVizRef: React.RefObject<typeof GridViz> = React.createRef<typeof GridViz>();

  constructor(props: MVPProps) {
    super(props);
    this.state = {
      assetsLoaded: false,
    }
  }

  componentDidMount() {
    this.props.fetchAllVizData({smallDataset: false});
    // load three assets
    import('../app/components/viz/assets').then(module => {
      return module.LoadResources();
    }).then(() => {
        this.setState({assetsLoaded: true});
    });
  }

  render() {
    return (
      <div className={styles.container}>

        <Box display='flex' flexWrap='wrap' >
          {this.state.assetsLoaded ? <GridViz width={800} height={600} /> : "loading assets..."}
          <main className={styles.main}>

            <Box display="flex" flexWrap="wrap">
              <Box mr={4}>
                <Typography variant="h2" component="h2"> 👇 Your Info </Typography>
                <Filters />
              </Box>
              <Box borderLeft="1px solid" pl={4} >
                <Typography variant="h2" component="h2"> 👇 ️Your Values </Typography>
                <ValueFilters />
                <Results />
              </Box>
            </Box>

          </main>
        </Box>

        <ThemeProvider theme={invertedTheme}>
          <footer className={styles.footer}>
            <Typography gutterBottom>
              {this.props.loadingState}
            </Typography>
          </footer>
        </ThemeProvider>
      </div>
    )
  }
}

function mapStateToProps(state: RootState, ownProps: MVPProps) {
  return { 
    loadingState: state.rawData.loadingState,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    fetchAllVizData: params => dispatch(fetchAllVizData(params))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MVP as any);
