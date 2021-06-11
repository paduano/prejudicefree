import styles from '../styles/demo.module.css'

import { connect } from 'react-redux';
import { fetchAllVizData, fetchTimeData, setViewportWidth, UISelect } from '../app/store';
import React, { Fragment } from 'react';
import { Box, ThemeProvider, Typography } from '@material-ui/core';
import { invertedTheme, invertedThemeMobile } from '../app/components/theme';
import dynamic from 'next/dynamic';
import { Header, StoryContent, STORY_WIDTH } from '../app/components/header';
import { Loading, MAIN_CONTAINER_ID, viewportWidth } from '../app/components/ui_utils';
import { SelectOverlays } from '../app/components/select';
import { Legend } from '../app/components/legend';
import { DetailPanel, TimeTravel } from '../app/components/detail_panels';
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
  fetchTimeData: () => {},
  setViewportWidth: (width) => {},
  loadingState: string;
  selectOverlay?: UISelect;
  featureLegendEnabled: boolean,
  limitedWidth: boolean,
  viewportWidth: number,
  selectedCountry: string,
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
    this.props.fetchTimeData();
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
    return this.state.assetsLoaded && this.props.loadingState && this.props.selectedCountry;
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
      <Box display='flex' width={'100%'} height='0px' justifyContent='center' zIndex={10}>
        <Box width={limitedWidth ? '100%' : STORY_WIDTH} mt={limitedWidth ? 4 : 3} pl={limitedWidth ? 2 : 0}>
          {this.props.featureLegendEnabled ? <Legend vertical={!limitedWidth} /> : null}
        </Box>
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
        <Box flexGrow={0} flexBasis={'800px'}>
          <Box position='absolute' style={{ left: 0, top: '-70px' }}>
            <GridViz width={viewportWidth} height={600} backgroundColor={color.background} limitedWidth />
          </Box>
        </Box>
      );
    }
  }

  render() {
    const { limitedWidth } = this.props;
    // const width = 900;
    const navBarHeight = '3rem';
    const columnSpacer = () => !limitedWidth ? <Box flexShrink={1} flexBasis={'100px'}></Box> : null;
    const containerStyle = {
      background: color.background,
      minHeight: limitedWidth ? undefined : '100vh',
      height: limitedWidth ? undefined : '100vh',
    }
    return (
      <ThemeProvider theme={limitedWidth ? invertedThemeMobile : invertedTheme}>
        <div id={MAIN_CONTAINER_ID} style={{ background: color.background }}>
          {this.loadingComplete() ? (
            <Fragment>
              <NavBar height={navBarHeight} current='viz'></NavBar>
              {/* modals, full screen selects */}
              {this.renderSelectOverlay()}
              {this.renderFocusOverlay()}
              <Box display='flex' flexDirection='column' justifyContent={limitedWidth ? '' : 'center'} height={`calc(100% - ${navBarHeight})`}>

                {/* Header */}
                <Header />

                {/* legend */}
                {this.renderLegendWithLayout()}

                {/* main viz space */}
                <Box display='flex'
                  position='relative'
                  flexDirection={limitedWidth ? 'column' : 'row'}
                  width='100%'
                  minHeight={!limitedWidth ? '530px' : null}
                  justifyContent='center' >

                  {/* left column */}
                  {!limitedWidth ?
                    <Box
                      display='flex'
                      flexGrow={1}
                      flexDirection='column'
                      alignItems='flex-end'
                      zIndex={10}
                      flexBasis={'200px'}>
                      {columnSpacer()}
                      <Box pr={1} width={'160px'}>
                        <TimeTravel />
                      </Box>
                    </Box>
                    : null}

                  {/* 3d */}
                  {this.renderViz()}

                  {/* right column */}
                  <Box
                    display='flex'
                    flexDirection='column'
                    flexGrow={1}
                    style={{ pointerEvents: 'none' }}
                    zIndex={10 /* force new stacking context */} >
                    {columnSpacer()}
                    <Box pl={1} width={limitedWidth ? '100%' : '240px'} pr={limitedWidth ? 0 : 2} pb={limitedWidth ? 2 : 0}>
                      <DetailPanel />
                    </Box>
                  </Box>
                </Box>

                {/* story content */}
                <Box>
                  <StoryContent />
                </Box>
              </Box>
            </Fragment>
          ) :
            // Loading page
            <Loading></Loading>
          }
        </div>
      </ThemeProvider>
    )
  }
}

function mapStateToProps(state: RootState, ownProps: MVPProps) {
  return {
    loadingState: state.rawData.loadingState,
    selectOverlay: state.rawData.uiSelect,
    selectedCountry: state.rawData.filterQuery.country_codes && state.rawData.filterQuery.country_codes[0],
    featureLegendEnabled: isFeatureAvailableSelector('legend')(state),
    limitedWidth: state.rawData.isLimitedWidth,
    viewportWidth: state.rawData.viewportWidth,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    fetchAllVizData: params => dispatch(fetchAllVizData(params)),
    fetchTimeData: () => dispatch(fetchTimeData()),
    setViewportWidth: width => dispatch(setViewportWidth({ width }))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MVP as any);
