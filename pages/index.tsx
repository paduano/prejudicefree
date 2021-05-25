import styles from '../styles/demo.module.css'

import { connect } from 'react-redux';
import { fetchAllVizData, RootState, UISelect } from '../app/store';
import React from 'react';
import { Box, ThemeProvider, Typography } from '@material-ui/core';
import { invertedTheme, invertedThemeMobile } from '../app/components/theme';
import dynamic from 'next/dynamic';
import { Header } from '../app/components/header';
import { MAIN_CONTAINER_ID } from '../app/components/ui_utils';
import { SelectOverlays } from '../app/components/select';
import { Legend } from '../app/components/legend';
import { DetailPanel } from '../app/components/detail_panels';
import { FocusOverlay, isFeatureAvailableSelector } from '../app/onboarding';
import { color } from '../app/components/colors';
import { NavBar } from '../app/components/navbar';

const GridViz = dynamic(() => import('../app/components/viz/grid_viz').then((module) => module.GridViz as any), {
  ssr: false,
}) as any;

interface MVPProps {
  fetchAllVizData: (params) => {},
  loadingState: string;
  selectOverlay?: UISelect;
  featureLegendEnabled: boolean,
  limitedWidth: boolean,
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
        <div className={styles.selectOverlayContainer} style={{ background: color.background }}>
          <Overlay {...this.props.selectOverlay.params} />
        </div>
      );
    } else {
      return null;
    }
  }

  renderFocusOverlay() {
    return <FocusOverlay />
  }

  renderLegendWithLayout() {
    return (
      <Box display='flex' width='100%' justifyContent='center'>
        <Box flex={4} />
        <Box flex={2} mt={4}>
          {this.props.featureLegendEnabled ? <Legend /> : null}
        </Box>
      </Box>
    );
  }

  renderViz() {
    const { limitedWidth } = this.props;
    if (limitedWidth) {
      return (
        <Box style={{ overflowY: 'hidden' }} width={'100%'}>
          <GridViz width={450} height={300} backgroundColor={color.background} />
        </Box>
      );
    } else {
      return (
        <GridViz width={900} height={600} backgroundColor={color.background} />
      );
    }
  }

  render() {
    const { limitedWidth } = this.props;
    const width = 900;
    return (
      <ThemeProvider theme={limitedWidth ? invertedThemeMobile : invertedTheme}>
        <div id={MAIN_CONTAINER_ID} className={styles.container} style={{ background: color.background }}>
          <NavBar current='viz'></NavBar>

          {/* modals, full screen selects */}
          {this.renderSelectOverlay()}
          {this.renderFocusOverlay()}
          {this.loadingComplete() ? (
            <Box display='flex' flexDirection='column' justifyContent={limitedWidth ? '' : 'center'} height='100%'>

              {/* Header */}
              <Header />

              {/* main viz space */}
              <Box display='flex' flexDirection={limitedWidth ? 'column' : 'row'} width='100%' justifyContent='center'  >

                {/* left column */}
                {!limitedWidth ? <Box flexGrow={1} flexBasis={'200px'} /> : null}

                {/* 3d */}
                {this.renderViz()}

                {/* right column */}
                <Box display='flex' flexDirection='column' flexGrow={1} justifyContent='center' zIndex={1 /* force new stacking context */}>
                  <Box pl={1} width={limitedWidth ? '100%' : '200px'}>
                    <DetailPanel />
                  </Box>
                </Box>
              </Box>

              {/* legend */}
              {this.renderLegendWithLayout()}
            </Box>
          ) : "Loading"}
        </div>
      </ThemeProvider>
    )
  }
}

function mapStateToProps(state: RootState, ownProps: MVPProps) {
  return {
    loadingState: state.rawData.loadingState,
    selectOverlay: state.rawData.uiSelect,
    featureLegendEnabled: isFeatureAvailableSelector('legend')(state),
    limitedWidth: state.rawData.isLimitedWidth,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    fetchAllVizData: params => dispatch(fetchAllVizData(params))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MVP as any);
