import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/demo.module.css'

import { useSelector, useDispatch, Provider, connect } from 'react-redux';
import { fetchAllVizData, store, AppDispatch, RootState, SelectTypes, UISelect } from '../app/store';
import { Filters } from '../app/components/filters';
import React from 'react';
import { Results } from '../app/components/results';
import { Box, createMuiTheme, CssBaseline, ThemeProvider, Typography } from '@material-ui/core';
import { invertedTheme } from '../app/components/theme';
import { ThreeCanvas } from '../app/components/three_canvas';
import dynamic from 'next/dynamic';
import { GroupStats, Observation } from '../app/observation';
import { ValueFilters } from '../app/components/value_filters';
import { Title } from '../app/components/title';
import { MAIN_CONTAINER_ID } from '../app/components/ui_utils';
import { SelectOverlays } from '../app/components/select';
import { Legend } from '../app/components/legend';
import { SelectedObservation, YourselfInfo } from '../app/components/detail_panels';

const GridViz = dynamic(() => import('../app/components/viz/grid_viz').then((module) => module.GridViz as any), {
  ssr: false,
}) as any;

interface MVPProps {
  fetchAllVizData: (params) => {},
  loadingState: string;
  selectOverlay?: UISelect;
  currentGroupStats?: GroupStats
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
    this.props.fetchAllVizData({ smallDataset: false });
    // load three assets
    import('../app/components/viz/assets').then(module => {
      return module.LoadResources();
    }).then(() => {
      this.setState({ assetsLoaded: true });
    });
  }

  loadingComplete() {
    return this.state.assetsLoaded && this.props.loadingState;
  }

  renderDebugFooter() {
    return (
      <footer className={styles.footer}>
        <Typography gutterBottom>
          Loading {this.props.loadingState}
        </Typography>
      </footer>
    );
  }

  renderSelectOverlay() {
    if (this.props.selectOverlay.current) {
      const Overlay = SelectOverlays[this.props.selectOverlay.current] as any;
      return (
        <div className={styles.selectOverlayContainer}>
          <Overlay {...this.props.selectOverlay.params} />
        </div>
      );
    } else {
      return null;
    }
  }

  renderLegendWithLayout() {
    return (
      <Box display='flex' width='100%' justifyContent='center'>
        <Box flex={4} />
        <Box flex={2} mt={4}>
          <Legend />
        </Box>
      </Box>
    );
  }

  render() {
    return (
      <ThemeProvider theme={invertedTheme}>
        <div id={MAIN_CONTAINER_ID} className={styles.container}>
          {this.loadingComplete() ? (
            <Box display='flex' flexDirection='column' justifyContent='center' height='100%'>

              {/* titles */}
              <Title />

              {/* main viz space */}
              <Box display='flex' flexDirection='row' width='100%' justifyContent='center'  >

                <Box width='100px' />

                {/* 3d */}
                <GridViz width={800} height={600} /> 

                {/* right column */}
                <Box width='200px' display='flex' flexDirection='column' mt={4}>
                  <Box mb={1}> 
                    {this.props.currentGroupStats ? <YourselfInfo /> : null}
                  </Box>
                  <Box> 
                    <SelectedObservation />
                  </Box>
                </Box>
              </Box>

              {/* legend */}
              {this.renderLegendWithLayout()}
            </Box>
          ) : "Loading"}

          {/* modals, full screen selects */}
          {this.renderSelectOverlay()}
        </div>
      </ThemeProvider>
    )
  }
}

function mapStateToProps(state: RootState, ownProps: MVPProps) {
  return {
    loadingState: state.rawData.loadingState,
    selectOverlay: state.rawData.uiSelect,
    currentGroupStats: state.rawData.currentGroupStats,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    fetchAllVizData: params => dispatch(fetchAllVizData(params))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MVP as any);
