import styles from '../styles/demo.module.css'

import { connect } from 'react-redux';
import { fetchAllVizData, setViewportWidth, UISelect } from '../app/store';
import React from 'react';
import { Box, ThemeProvider, Typography } from '@material-ui/core';
import { invertedTheme, invertedThemeMobile } from '../app/components/theme';
import dynamic from 'next/dynamic';
import { Header } from '../app/components/header';
import { MAIN_CONTAINER_ID, viewportWidth } from '../app/components/ui_utils';
import { SelectOverlays } from '../app/components/select';
import { Legend } from '../app/components/legend';
import { DetailPanel } from '../app/components/detail_panels';
import { FocusOverlay, isFeatureAvailableSelector } from '../app/onboarding';
import { color } from '../app/components/colors';
import { NavBar } from '../app/components/navbar';
import { throttle } from 'throttle-debounce';
import { RootState } from '../app/store_definition';

const GridViz = dynamic(() => import('../app/components/viz/grid_viz').then((module) => module.GridViz as any), {
  ssr: false,
}) as any;

interface MVPProps {
  fetchAllVizData: (params) => {},
  setViewportWidth: (width) => {},
  loadingState: string;
  selectOverlay?: UISelect;
  featureLegendEnabled: boolean,
  limitedWidth: boolean,
  viewportWidth: number,
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

    window.addEventListener('resize', this.throttledOnWindowResize);

  }

  throttledOnWindowResize = throttle(1000, false /* no trailing */, () => {
    this.props.setViewportWidth(viewportWidth());
  });

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
    const { limitedWidth } = this.props;
    if (this.props.selectOverlay.current) {
      const Overlay = SelectOverlays[this.props.selectOverlay.current] as any;
      return (
        <Box className={styles.selectOverlayContainer} 
          pt={limitedWidth ? undefined : '3rem'}
          p={limitedWidth ? '1rem' : undefined}
          style={{ background: color.background }}>
          <Overlay {...this.props.selectOverlay.params} />
        </Box>
      );
    } else {
      return null;
    }
  }

  renderFocusOverlay() {
    return <FocusOverlay />
  }

  renderLegendWithLayout() {
    const { limitedWidth } = this.props;
    return (
      <Box display='flex' width='100%' justifyContent='center'>
        <Box flex-flexBasis={4} />
        <Box flex={2} mt={limitedWidth ? 2 : 4} pr={4}>
          {this.props.featureLegendEnabled ? <Legend /> : null}
        </Box>
        <Box flex={4} />
      </Box>
    );
  }

  renderViz() {
    const { limitedWidth, viewportWidth } = this.props;
    if (limitedWidth) {
      return (
        <Box style={{ overflowX: 'hidden' }} width={'100%'}>
          <GridViz width={viewportWidth} height={400} backgroundColor={color.background} />
          {/* {this.renderLegendWithLayout()} */}
        </Box>
      );
    } else {
      return (
        <Box flex={1} flexBasis={'900px'}>
          <Box position='absolute' style={{ left: 0, top: 0 }}>
            <GridViz width={viewportWidth} height={600} backgroundColor={color.background} limitedWidth />
          </Box>
        </Box>
      );
    }
  }

  render() {
    const { limitedWidth } = this.props;
    // const width = 900;
    const navBarHeight = '2rem';
    const containerStyle = {
      background: color.background,
      minHeight: limitedWidth ? undefined : '100vh',
      height: limitedWidth ? undefined : '100vh',
    }
    return (
      <ThemeProvider theme={limitedWidth ? invertedThemeMobile : invertedTheme}>
        <div id={MAIN_CONTAINER_ID} style={{ background: color.background }}>
          <NavBar height={navBarHeight} current='viz'></NavBar>

          {/* modals, full screen selects */}
          {this.renderSelectOverlay()}
          {this.renderFocusOverlay()}
          {this.loadingComplete() ? (
            <Box display='flex' flexDirection='column' justifyContent={limitedWidth ? '' : 'center'} height={`calc(100% - ${navBarHeight})`}>

              {/* Header */}
              <Header />

              {/* legend */}
              {/* {limitedWidth ? null : this.renderLegendWithLayout()} */}

              {/* main viz space */}
              <Box display='flex' 
                  position='relative' 
                  flexDirection={limitedWidth ? 'column' : 'row'} 
                  width='100%' 
                  minHeight={!limitedWidth ? '600px' : null}
                  justifyContent='center' >

                {/* left column */}
                {!limitedWidth ? <Box flexGrow={1} flexBasis={'200px'} /> : null}

                {/* 3d */}
                {this.renderViz()}

                {/* right column */}
                <Box 
                  display='flex' 
                  flexDirection='column' 
                  flexGrow={1} 
                  justifyContent='center' 
                  style={{pointerEvents: 'none'}}
                  mb={limitedWidth ? 4 : 0}
                  zIndex={10 /* force new stacking context */} >
                  <Box pl={1} width={limitedWidth ? '100%' : '240px'} pb={limitedWidth ? 4 : 0} pr={limitedWidth ? 0 : 2}>
                    <DetailPanel />
                  </Box>
                </Box>
              </Box>
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
    viewportWidth: state.rawData.viewportWidth,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    fetchAllVizData: params => dispatch(fetchAllVizData(params)),
    setViewportWidth: width => dispatch(setViewportWidth({width}))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MVP as any);
