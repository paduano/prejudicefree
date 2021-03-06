import * as THREE from 'three';
import React, { Fragment } from 'react';
import { ThreeCanvas, ThreeCanvasProps, ThreeCanvasState } from '../three_canvas';
import { debug, getMousePos, PI } from '../../../utils/utils';
import instanceVertexShader from '../../shaders/instance.vertex';
import instanceFragShader from '../../shaders/instance.frag';
import TWEEN, { Tween } from '@tweenjs/tween.js';
import { Observation, ObservationDemographics, ObservationQuery, ValuesQuery } from '../../observation';
import { connect } from 'react-redux';
import { nextOnboardingMessage, setAnimationInProgress, setCurrentColumn, setOnboardingObjectPositions, setSelectedObservation, zoomIn } from '../../store';
import { DotAttributes, DotsVizConfiguration, GroupLayoutInfo, LayoutParams, VizPrepareState } from './grid_viz_configs';
import { threeAssets } from './assets';
import { AxisX } from '../axis_x';
import { AxisY } from '../axis_y';
import { BarCharts } from '../bar_charts';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { Box, Typography } from '@material-ui/core';
import YouMarker from '../you_marker';
import { ChartAnnotationWrapper } from '../chart_annotation_wrapper';
import chartStyles from '../../../styles/chart_annotation.module.css'
import { getCurrentOnboardingMessageSelector, getCurrentStep, getCurrentVizConfigSelector, isFeatureAvailableSelector, OnboardingMessage, OnboardingObjectPositions, OnboardingStepTypes } from '../../onboarding';
import { throttle } from 'throttle-debounce';
import { SelectionMarker } from '../selection_marker';
import { color } from '../colors';
import { RootState } from '../../store_definition';
import { isCountryPreferred, isHorizontalViz } from '../../selectors';
import { Legend } from '../legend';
import { Button } from '../ui_utils';


const PI_2 = 1.57079632679489661923;
const POINT_COUNT = 5000;
const TWEEN_TRANSITION_TIME = 1700;
const CAMERA_ROT = 15;
const CAMERA_IN_FRONT_ROT = PI_2 * 0.8;
// const TWEEN_TRANSITION_TIME = 100;

interface GridVizProps extends ThreeCanvasProps {
    width: number;
    height: number;
    observations: Observation[];
    // allObservationsInCountry: Observation[];
    valuesQuery: ValuesQuery;
    filterQuery: ObservationQuery;
    primaryFilterDemographic: ObservationDemographics;
    secondaryFilterDemographic: ObservationDemographics;
    setSelectedObservation: (o: Observation) => void;
    selectedObservationId?: number;
    setAnimationInProgress: (v: boolean) => void;
    currentRow: number;
    currentColumn: number;
    setCurrentColumn: (c: number) => void;
    animationInProgress: boolean;
    vizConfig: DotsVizConfiguration<any>;
    setOnboardingObjectPositions: (pos: OnboardingObjectPositions) => void,
    disableCameraTrack: boolean,

    nextOnboardingMessage: () => void;
    currentOnboardingMessage: OnboardingMessage,

    zoomInAction: (v: boolean) => void;

    isIntro: boolean,
    isZoomedIn: boolean,
    cameraInFront: boolean,

    limitedWidth: boolean;
    isHorizontal: boolean;

    featureColoredMenEnabled: boolean;
    featureChartsEnabled: boolean;
    featurePickingEnabled: boolean;
    featurePickingMarkerEnabled: boolean;
    featureLegendEnabled: boolean;

    showYourself: boolean;
}

interface GridVizState extends ThreeCanvasState {
    groupLayoutInfo?: GroupLayoutInfo,
    yourselfAnimationInProgress: boolean,
    isDraggingYourself?: boolean;
}

class GridVizView extends ThreeCanvas<GridVizProps, GridVizState> {

    //
    cameraPivot: THREE.Object3D;
    mouseEnterPos: { x: number, y: number } = { x: 0, y: 0 };
    mouseRelPos: { x: number, y: number } = { x: 0, y: 0 };
    currentVizStep = 0;
    currentMorph: 0 | 1 = 0;
    morph = { value: 0 };
    morphTween: Tween<{ value: number }>;


    guiParams = {
        perspective: 432,
        morph: 0,
        maxPeople: 9,
    };

    // dots
    dotsGeometry: THREE.BufferGeometry;
    dotsMaterial: THREE.ShaderMaterial;
    dotsNode: THREE.Points;

    // instance
    instancedGeometry: THREE.BufferGeometry;
    instancedMesh: THREE.InstancedMesh;
    instancedMaterial: THREE.ShaderMaterial;

    // maps
    observationIdToIndexMap = new Map<number, number>();

    // yourself
    yourselfMesh: THREE.Mesh;
    yourselfMaterial: THREE.MeshToonMaterial;
    yourselfPosition: THREE.Vector3;
    yourselfPositionTween: Tween<THREE.Vector3>;

    // intro
    introOpacityTween: Tween<{ opacity: number, index: number }>;
    opacityTransition: { opacity: number, index: number }
    introRotationTween: Tween<{ rot }>;
    cameraOffset = { rot: 0, z: 0, x: 0, y: 0};
    groupLayoutInfo: GroupLayoutInfo;



    constructor(props: GridVizProps) {
        super(props);
        this.morphTween = new TWEEN.Tween(this.morph);
        this.yourselfPosition = new THREE.Vector3(0, 0, 0);
        this.state = {
            ...this.state,
            cursor: '',
        };
    }



    componentDidMount() {
        super.componentDidMount();

        // this.annotationLayerRef.current.onclick = this.onClick;
        this.annotationLayerRef.current.onmousedown = this.onMouseDown;
        this.annotationLayerRef.current.onmouseup = this.onMouseUp;
        this.annotationLayerRef.current.onmouseleave = this.onMouseLeave;
        this.annotationLayerRef.current.onmouseenter = this.onMouseEnter;
        this.annotationLayerRef.current.onmousemove = this.onMouseMove;
        this.annotationLayerRef.current.ontouchmove = this.onTouchMove;
        this.annotationLayerRef.current.ontouchstart = this.onTouchStart;
        this.annotationLayerRef.current.ontouchend = this.onTouchEnd;
    }

    onTouchMove = (evt: TouchEvent) => {
        const touches = evt.changedTouches;
        if (this.props.isZoomedIn) {
            evt.preventDefault();
        }
        if (touches.length == 1 && touches[0].identifier == this.currentTouchId) {
            const t = touches[0];
            const dx = t.pageX - this.startTouchX;
            const dy = t.pageY - this.startTouchY;
            const scale = this.getSizeTransform(1);
            this.cameraOffset.x = this.startOffsetX - dx/scale;
            this.cameraOffset.y = this.startOffsetY + dy/scale;
        }
    }

    currentTouchId = null
    startTouchX: number; 
    startTouchY: number;
    startOffsetX: number;
    startOffsetY: number;
    onTouchStart = (evt: TouchEvent) => {
        const touches = evt.changedTouches;
        if (touches.length == 1 && this.props.limitedWidth && this.props.isZoomedIn) {
            const t = touches[0];
            this.currentTouchId = t.identifier;
            this.startTouchX = t.pageX;
            this.startTouchY = t.pageY;
            this.startOffsetX = this.cameraOffset.x;
            this.startOffsetY = this.cameraOffset.y;
        }
    }

    onTouchEnd(evt: TouchEvent) {

    }

    componentDidUpdate(prevProp: GridVizProps) {
        const obsChanged = this.props.observations != prevProp.observations;
        const valuesChanged = this.props.valuesQuery != prevProp.valuesQuery;
        const demographicFilterChanged =
            this.props.primaryFilterDemographic != prevProp.primaryFilterDemographic ||
            this.props.secondaryFilterDemographic != prevProp.secondaryFilterDemographic;
        const currentRowChanged = this.props.currentRow != prevProp.currentRow;
        const vizConfigChanged = this.props.vizConfig != prevProp.vizConfig;

        // resize window
        if (this.props.width != prevProp.width || this.props.height != prevProp.height) {
            this.resizeWindow();
        }

        if (vizConfigChanged || obsChanged || valuesChanged || demographicFilterChanged || currentRowChanged) {
            this.nextStep(this.props.vizConfig);
        }

        const selectedIdChanged = this.props.selectedObservationId != prevProp.selectedObservationId;
        if (selectedIdChanged) {
            this.updateSelectionMaterial();
        }

        const currentColumnChanged = this.props.currentColumn != prevProp.currentColumn;
        if (currentColumnChanged && !this.state.isDraggingYourself) {
            this.updateYourselfPositionInCurrentGroup(this.state.groupLayoutInfo);
        }

        // from intro to view from top 
        if (this.props.cameraInFront != prevProp.cameraInFront) {
            if (!this.props.cameraInFront) {
                this.introRotateCamera();
                this.instancedMaterial.depthWrite = true;
            } else {
                this.backToIntroRotateCamera();
                this.instancedMaterial.depthWrite = false;
            }
        }

        // zoom in/zoom out
        if (!!this.props.isZoomedIn != !!prevProp.isZoomedIn) {
            if (this.props.isZoomedIn) {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
        }

        if (this.props.showYourself != prevProp.showYourself) {
            this.showYourself(this.props.showYourself);
        }

    }

    getCurrentAttributes(current: boolean) {
        if (!this.instancedGeometry) {
            return null;
        }
        const position1 = this.instancedGeometry.attributes.position1;
        const position2 = this.instancedGeometry.attributes.position2;
        const vertexOpacity = this.instancedGeometry.attributes.vertexOpacity;
        const vertexOpacity2 = this.instancedGeometry.attributes.vertexOpacity2;
        const color = this.instancedGeometry.attributes.color;
        let attributes: {
            position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
            vertexOpacity: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
            color: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
        };

        const currentValue = current ? 0 : 1

        // next morph state
        if (this.currentMorph == currentValue) {
            attributes = {
                position: position1,
                vertexOpacity: vertexOpacity,
                color, // stay same
            };
        } else {
            attributes = {
                position: position2,
                vertexOpacity: vertexOpacity2,
                color, // stay same
            };
        }

        return attributes;
    }

    setObservationData(config: DotsVizConfiguration<any>) {
        const { observations, isHorizontal } = this.props;

        debug({ setObservationData_with_length: this.props.observations.length });

        const position1 = this.instancedGeometry.attributes.position1;
        const position2 = this.instancedGeometry.attributes.position2;
        const vertexOpacity = this.instancedGeometry.attributes.vertexOpacity;
        const vertexOpacity2 = this.instancedGeometry.attributes.vertexOpacity2;
        const color = this.instancedGeometry.attributes.color;

        let attributes = this.getCurrentAttributes(false);

        // Layout
        const layoutParams: LayoutParams = {
            observations,
            valuesQuery: this.props.valuesQuery,
            filterQuery: this.props.filterQuery,
            primaryFilterDemographic: this.props.primaryFilterDemographic,
            secondaryFilterDemographic: this.props.secondaryFilterDemographic,
            currentRow: this.props.currentRow,
            useColors: this.props.featureColoredMenEnabled,
            hideAll: this.props.isIntro,
            horizontal: isHorizontal,
        }

        const configState: VizPrepareState = config.prepare(layoutParams);
        const { groupLayoutInfo } = configState;

        const maxN = observations.length;
        for (let i = 0; i < maxN; i++) {
            const ob = observations[i];
            this.observationIdToIndexMap.set(ob.id, i);
            const dotAttributes = config.dot(i, ob, layoutParams, configState);
            this.applyDotAttributes(attributes, dotAttributes, i);
        }

        // the rest 
        for (let i = maxN; i < POINT_COUNT; i++) {
            attributes.vertexOpacity.setX(i, 0);
        }

        // place yourself
        this.groupLayoutInfo = groupLayoutInfo;
        this.updateYourselfPositionInCurrentGroup(groupLayoutInfo);

        // updates
        position1.needsUpdate = true;
        position2.needsUpdate = true;
        vertexOpacity.needsUpdate = true;
        vertexOpacity2.needsUpdate = true;
        color.needsUpdate = true;
        this.instancedMaterial.uniforms.instanceCount.value = observations.length;

        this.setState({ groupLayoutInfo });
    }

    private updateYourselfPositionInCurrentGroup(groupLayoutInfo: GroupLayoutInfo) {
        const { currentColumn, currentRow } = this.props;
        // another hack, this check should not be necessary
        if (this.groupLayoutInfo.yourselfPositions[currentColumn] != undefined) {
            let yourselfPosition = this.groupLayoutInfo.yourselfPositions[currentColumn][currentRow];
            this.setYourselfPosition(new THREE.Vector3(yourselfPosition.x, yourselfPosition.y, 0));
        }
    }

    private applyDotAttributes(attributes: any, dotAttributes: DotAttributes, i: number) {
        if (dotAttributes.position) {
            attributes.position.setXYZ(i,
                dotAttributes.position.x,
                dotAttributes.position.y,
                dotAttributes.position.z,
            );

            // attributes.position.setXYZ(i,
            //     0,0,0
            // );
        }
        if (dotAttributes.opacity != undefined) {
            attributes.vertexOpacity.setX(i, dotAttributes.opacity);
        }
        if (dotAttributes.color) {
            attributes.color.setXYZ(i,
                dotAttributes.color.r,
                dotAttributes.color.g,
                dotAttributes.color.b,
            );
            // attributes.color.setXYZ(i,
            //     1,0,1
            // );
        }
    }


    setUpGui(GUI: any) {
        this.gui.add(this.guiParams, 'perspective', 1, 1000, 1);
        this.gui.add(this.guiParams, 'morph', 0, 1, 0.01).onChange(v => {
            this.morph.value = v;
            this.morphTween.stop();
        })
        this.gui.add(this.guiParams, 'maxPeople', 0, 9999, 1).onChange(v => {
            this.nextStep(this.props.vizConfig);
        })
    }

    YOURSELF_POS_FIX = { x: -7, y: -3 };
    renderBackground() {
        const { isIntro, showYourself, selectedObservationId, primaryFilterDemographic, secondaryFilterDemographic, featureChartsEnabled } = this.props;
        const { x: youPosX, y: youPosY } = this.getAnnotationPos(this.yourselfPosition.x, this.yourselfPosition.y);
        const { groupLayoutInfo } = this.state;
        return (
            <Fragment>
                {/* you marker */}
                <ChartAnnotationWrapper hideDuringAnimation hidden={this.state.yourselfAnimationInProgress || this.state.isDraggingYourself}>
                    <Box id='you-marker' position='absolute' left={youPosX + this.YOURSELF_POS_FIX.x} top={youPosY + this.YOURSELF_POS_FIX.y} className={chartStyles.yourselfMarker}>
                        {!isIntro && showYourself ? <YouMarker /> : null}
                        {/* {isIntro ? <Typography variant='h3'>You</Typography> : null} */}
                    </Box >
                </ChartAnnotationWrapper>
                {featureChartsEnabled && groupLayoutInfo && primaryFilterDemographic ?
                    <AxisX groupLayoutInfo={groupLayoutInfo}
                        getSizeTransform={this.getSizeTransform}
                        getAnnotationPos={this.getAnnotationPos} /> : null
                }
                {featureChartsEnabled && groupLayoutInfo ?
                    <BarCharts groupLayoutInfo={groupLayoutInfo}
                        getSizeTransform={this.getSizeTransform}
                        getAnnotationPos={this.getAnnotationPos} /> : null
                }

            </Fragment>
        )
    }

    renderAnnotation() {
        const { selectedObservationId, primaryFilterDemographic, secondaryFilterDemographic, featureChartsEnabled } = this.props;
        const { groupLayoutInfo } = this.state;
        const attributes = this.getCurrentAttributes(true);
        let pickSelection: JSX.Element = null
        // if (selectedObservationId && attributes) {
        //     const i = this.observationIdToIndexMap.get(selectedObservationId);

        //     const x = attributes.position.getX(i);
        //     const y = attributes.position.getY(i);
        //     const pos = this.getAnnotationPos(x, y);
        //     pickSelection = (
        //         <Box id='selection-marker' position='absolute' left={pos.x - 8} top={pos.y - 16} style={{ pointerEvents: 'none' }} >
        //             <SelectionMarker />
        //         </Box >
        //     );
        // }

        return (
            <Fragment>
                {/* <ChartAnnotationWrapper hideDuringAnimation hidden={this.state.yourselfAnimationInProgress || this.state.isDraggingYourself || !this.props.featurePickingMarkerEnabled}>
                    {pickSelection}
                </ChartAnnotationWrapper> */}
                {featureChartsEnabled && groupLayoutInfo && secondaryFilterDemographic ?
                    <AxisY groupLayoutInfo={groupLayoutInfo}
                        getSizeTransform={this.getSizeTransform}
                        getAnnotationPos={this.getAnnotationPos} /> : null
                }
            </Fragment>
        );
    }

    renderUntransformedAnnotation(): JSX.Element | null {
        const { groupLayoutInfo } = this.state;
        const { currentRow, featureLegendEnabled, limitedWidth, isZoomedIn, zoomInAction } = this.props;
        let legend: JSX.Element|null = null;
        let zoomOutButton: JSX.Element|null = null;

        //lege
        // if (groupLayoutInfo && featureLegendEnabled) {
        //     const pos = this.getAnnotationPos(
        //         groupLayoutInfo.groupPosX[0][currentRow],
        //         groupLayoutInfo.groupPosY[0][currentRow]);
        //     legend = (
        //         <Box position='absolute' top={60} left={pos.x}>
        //             <ChartAnnotationWrapper hideDuringAnimation>
        //                 <Legend />
        //             </ChartAnnotationWrapper>
        //         </Box>
        //     );
        // }

        if (isZoomedIn) {
            zoomOutButton = (
                <Box position='absolute' top={60} right={limitedWidth ? 2 : (this.props.width - 800) / 2} zIndex={10}>
                    <Button frame label='zoom out' select={false} small onClick={() => zoomInAction(false)}></Button>
                </Box>
            );
        }


        return (
            <Fragment>
                {legend}
                {zoomOutButton}
            </Fragment>
        )
    }

    triggerNextMorphTransition() {
        let value = null;
        if (this.currentMorph == 0) {
            value = 1;
            this.currentMorph = 1;
        } else {
            value = 0;
            this.currentMorph = 0;
        }

        if (value != null) {
            // is it necessary to create a new tween?
            this.morphTween = new TWEEN.Tween(this.morph);
            const dv = Math.abs(this.morph.value - value);
            this.morphTween.to({ value }, dv * TWEEN_TRANSITION_TIME)

            this.props.setAnimationInProgress(true);
            this.morphTween.onComplete(() => {
                this.props.setAnimationInProgress(false);
            })
            // .easing(TWEEN.Easing.Quadratic.Out) // I do this in the shader
            this.morphTween.start();
        }

    }


    onClick = (evt: React.MouseEvent) => {
        if (this.props.featurePickingEnabled && !this.props.limitedWidth) {
            this.props.zoomInAction(!this.props.isZoomedIn);
        }

        // limited width
        if (this.props.featurePickingEnabled && this.props.limitedWidth && !this.props.isZoomedIn) {
            this.props.zoomInAction(true);
        }
    }


    onMouseDown = (evt: MouseEvent) => {
        const mousePos = getMousePos(this.canvasRef.current, evt);
        if (this.testPickYourself(mousePos)) {
            evt.preventDefault();
            evt.stopPropagation();
            this.startDraggingYourself(mousePos)

            // dismiss onboarding message
            if (this.props.currentOnboardingMessage && this.props.currentOnboardingMessage.type == 'DRAG_AND_DROP_YOURSELF') {
                this.props.nextOnboardingMessage();
            }
        }

        if (this.props.limitedWidth && this.props.isZoomedIn) {
            const mousePos = getMousePos(this.canvasRef.current, evt);
            this.pickAPerson(mousePos);
        }
    }

    onMouseUp = (evt: MouseEvent) => {
        const mousePos = getMousePos(this.canvasRef.current, evt);

        if (this.state.isDraggingYourself) {
            const mousePos = getMousePos(this.canvasRef.current, evt);
            this.dropYourselfToPos(mousePos);
        }
    }

    mouseEnterCounter = 0;
    onMouseEnter = (evt: MouseEvent) => {
        this.mouseEnterCounter++;
        // console.log('onMouseEnter ' + this.mouseEnterCounter)
    }

    onMouseLeave = (evt: MouseEvent) => {
        this.mouseEnterCounter--;
        if (this.mouseEnterCounter == 0) {
            console.log('onMouseLeave')
            const mousePos = getMousePos(this.canvasRef.current, evt);

            if (this.state.isDraggingYourself) {
                this.endDraggingYourself(mousePos);
            }
        }
    }


    annotationRotX = 0;
    annotationRotY = 0;
    onMouseMove = (evt: MouseEvent) => {

        let { x, y } = this.getRelMouseCoords(evt);
        this.mouseRelPos = { x, y };
        const annotationRotX = -x / CAMERA_ROT;
        const annotationRotY = y / CAMERA_ROT;

        this.annotationRotX = annotationRotX;
        this.annotationRotY = annotationRotY;

        if (this.state.isDraggingYourself) {
            const mousePos = getMousePos(this.canvasRef.current, evt);
            this.dragYourselfToPos(mousePos);
        } else if (this.props.featurePickingEnabled && this.props.isZoomedIn) {
            this.throttledPickAPerson(evt)
        }
    }


    getRelMouseCoords(evt: MouseEvent) {
        let { x, y } = getMousePos(this.canvasRef.current, evt);


        const relX = ((x / this.props.width) - 0.5) * 2;
        const relY = ((y / this.props.height) - 0.5) * 2;
        return { x: relX, y: relY };
    }

    setUpScene = () => {

        // effect composer
        // const bloomPass = new UnrealBloomPass( new THREE.Vector2( this.props.width, this.props.height), 1.5, 0.4, 0.85 );

        // -- outline pass
        // const renderScene = new RenderPass(this.scene, this.camera);
        // this.composer = new EffectComposer(this.renderer);
        // this.composer.addPass(renderScene);
        // const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera);
        // outlinePass.edgeStrength = 3;
        // outlinePass.edgeGlow = 0;
        // outlinePass.edgeThickness = 1.;
        // this.composer.addPass(outlinePass);
        // --

        // outlinePass.visibleEdgeColor = visibleColor;
        // outlinePass.hiddenEdgeColor.set(0);
        // this.composer.addPass(bloomPass);

        // camera
        this.cameraPivot = new THREE.Object3D()
        this.scene.add(this.cameraPivot);
        this.cameraPivot.add(this.camera);
        this.camera.lookAt(this.cameraPivot.position);

        // light
        const light = new THREE.PointLight(0xffffff, 1, 100);
        light.position.set(1, 1, 5);
        this.scene.add(light);

        // grid
        // const gridHelper = new THREE.GridHelper(10, 10, "#FFFFFF");
        // this.scene.add( gridHelper );
        // gridHelper.rotation.x = PI_2;

        // dots
        this.dotsGeometry = new THREE.BufferGeometry();
        const colors: number[] = [];
        const radius: number[] = [];
        const dotsVerticesAttr: number[] = [];
        const dotsVertices2Attr: number[] = [];
        const dotsVertexOpacityAttr: number[] = [];
        const dotsVertexOpacity2Attr: number[] = [];
        const idColors: number[] = []
        const indices: number[] = []


        for (let i = 0; i < POINT_COUNT; i++) {
            dotsVertices2Attr.push(0);
            dotsVertices2Attr.push(0);
            dotsVertices2Attr.push(0);
            dotsVerticesAttr.push(0);
            dotsVerticesAttr.push(0);
            dotsVerticesAttr.push(0);
            // default color
            colors.push(1); colors.push(1); colors.push(1);
            dotsVertexOpacityAttr.push(0);
            dotsVertexOpacity2Attr.push(0);

            // instance id 
            var c = new THREE.Color();
            c.setHex(i + 1);
            idColors.push(c.r);
            idColors.push(c.g);
            idColors.push(c.b);

            indices.push(i);
        }

        // INSTANCE -----
        this.instancedMaterial = new THREE.ShaderMaterial({
            uniforms: {
                morph: { value: 0 },
                opacity: { value: 1 },
                diffuse: { value: new THREE.Color(0xFFFFFF) },
                instanceCount: { value: POINT_COUNT }, // only "visible" instance count
                picking: { value: 0 }, // to selectively render id colors for picking
                selectedIndex: { value: -1 }, // id of the mesh selected
                yourselfPosition: { value: new THREE.Vector3(0, 0, 0) }, // id of the mesh selected
            },
            vertexShader: instanceVertexShader,
            fragmentShader: instanceFragShader
        });
        this.instancedMaterial.transparent = true;
        this.instancedMaterial.depthWrite = !this.props.cameraInFront;
        this.instancedGeometry = (threeAssets.man.children[0] as THREE.Mesh).geometry.clone(); // clone to not break HMR
        this.instancedGeometry.scale(0.05, 0.05, 0.05);

        // this.instancedGeometry = new THREE.BoxGeometry( 0.02, 0.02, 0.1 );
        this.instancedGeometry.setAttribute('position1', new THREE.InstancedBufferAttribute(Float32Array.from(dotsVerticesAttr), 3))
        this.instancedGeometry.setAttribute('position2', new THREE.InstancedBufferAttribute(Float32Array.from(dotsVertices2Attr), 3));
        this.instancedGeometry.setAttribute('vertexOpacity', new THREE.InstancedBufferAttribute(Float32Array.from(dotsVertexOpacityAttr), 1));
        this.instancedGeometry.setAttribute('vertexOpacity2', new THREE.InstancedBufferAttribute(Float32Array.from(dotsVertexOpacity2Attr), 1));
        this.instancedGeometry.setAttribute('color', new THREE.InstancedBufferAttribute(Float32Array.from(colors), 3));
        this.instancedGeometry.setAttribute('idcolor', new THREE.InstancedBufferAttribute(Float32Array.from(idColors), 3));
        this.instancedGeometry.setAttribute('index', new THREE.InstancedBufferAttribute(Float32Array.from(indices), 1));
        this.instancedMesh = new THREE.InstancedMesh(this.instancedGeometry, this.instancedMaterial, POINT_COUNT);
        this.scene.add(this.instancedMesh);

        const dummy = new THREE.Object3D();
        for (let i = 0; i < POINT_COUNT; i++) {
            // dummy.rotation.set(0, 0, rand(0, 2 * PI));
            dummy.position.set(0, 0, 0);
            dummy.updateMatrix();

            this.instancedMesh.setMatrixAt(i, dummy.matrix);
        }

        // yourself
        const yourselfGeometry = (threeAssets.man.children[0] as THREE.Mesh).geometry.clone(); // clone to not break HM;
        this.yourselfMaterial = new THREE.MeshToonMaterial({ color: new THREE.Color(color.accent) });
        this.yourselfMesh = new THREE.Mesh(yourselfGeometry, this.yourselfMaterial)
        this.yourselfMesh.scale.set(0.1, 0.1, 0.1);

        this.yourselfMesh.rotateX(PI_2 - 0.4);
        this.instancedGeometry.rotateX(PI_2);

        this.yourselfMesh.visible = this.props.showYourself;

        this.scene.add(this.yourselfMesh);
        this.yourselfMesh.position.copy(this.yourselfPosition);

        if (this.props.cameraInFront) {
            this.cameraOffset.rot = CAMERA_IN_FRONT_ROT;
        }

        // outlinePass.selectedObjects = [this.yourselfMesh]; // YYY


        // const pickingInstancedMesh = new THREE.InstancedMesh(this.instancedGeometry, this.instancedMaterial, POINT_COUNT);

        // picking
        // scene picking doesn't work
        // this.pickingScene.add(pickingInstancedMesh);

        // selection
    }

    beforeRenderPicking() {
        this.instancedMaterial.uniforms.picking.value = 1;
    }

    afterRenderPicking() {
        this.instancedMaterial.uniforms.picking.value = 0;
    }


    sceneReady() {
        this.nextStep(this.props.vizConfig);
    }


    nextStep(config: DotsVizConfiguration<any>) {
        this.setObservationData(config);
        this.triggerNextMorphTransition();

        if (this.props.isIntro) {
            // start intro effect
            this.introFadeInEffect();
        }
    }

    setYourselfPosition(pos: THREE.Vector3) {
        this.setState({ yourselfAnimationInProgress: true });
        this.yourselfPositionTween = new TWEEN.Tween(this.yourselfPosition)
            .to({ x: pos.x, y: pos.y, z: pos.z, }, TWEEN_TRANSITION_TIME)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onComplete(() => {
                this.setState({ yourselfAnimationInProgress: false });
            })
            .start();
        // .onUpdate(function (d) { })
        // .onComplete(function () {});

        this.dispatchNewYourselfPosition(pos);
    }

    getCameraRot(dt: number) {
        const { limitedWidth, disableCameraTrack, isZoomedIn } = this.props;
        const MAX_ROT_SPEED = 1.2;
        let xParallax = 0;
        let yParallax = 0;

        if (limitedWidth) {
            const sel = document.scrollingElement;
            const pScroll = sel.scrollTop / (sel.scrollHeight - sel.clientHeight);
            const maxScrollY = PI / 12;
            const maxScrollX = PI / 20;
            // yParallax = -maxScroll/2 + maxScroll * pScroll;
            // this.cameraPivot.position.x = - sel.scrollTop/100
            // this.cameraPivot.position.z = - sel.scrollTop/100
            // yParallax = -maxScrollY / 2 + maxScrollY * pScroll;
            // xParallax = -maxScrollX / 2 + maxScrollX * pScroll;
        } else {
            xParallax = (-0.5 + this.mouseRelPos.x) / CAMERA_ROT * (isZoomedIn ? 2 : 1);
            yParallax = (-0.5 + this.mouseRelPos.y) / CAMERA_ROT * (isZoomedIn ? 2 : 1);
        }

        // note the x,y inversion
        const finalRotX = !disableCameraTrack ? xParallax : 0;
        const finalRotY = !disableCameraTrack ? yParallax + this.cameraOffset.rot : 0;

        // smooth move of the camera and transform layers
        const maxDegree = dt / MAX_ROT_SPEED; // speed
        const currentRot = this.cameraPivot.rotation;
        const deltaRotX = finalRotX - currentRot.y;
        const deltaRotY = finalRotY - currentRot.x;
        const destRotX = currentRot.y + Math.sign(deltaRotX) * Math.min(Math.abs(deltaRotX), maxDegree);
        const destRotY = currentRot.x + Math.sign(deltaRotY) * Math.min(Math.abs(deltaRotY), maxDegree);
        return {
            x: destRotX,
            y: destRotY
        }
    }

    awayPoint = new THREE.Vector3(100,100,100);
    tick = (dt: number, time: number) => {
        this.morphTween.update();
        this.yourselfPositionTween?.update();

        this.introOpacityTween?.update();
        this.introRotationTween?.update();

        this.cameraPivot.position.setZ(this.cameraOffset.z);
        this.cameraPivot.position.setX(this.cameraOffset.x);
        this.cameraPivot.position.setY(this.cameraOffset.y);

        // update yourself position
        this.yourselfMesh.position.copy(this.yourselfPosition);
        if (this.props.showYourself) {
            this.instancedMaterial.uniforms.yourselfPosition.value = this.yourselfPosition;
        } else {
            this.instancedMaterial.uniforms.yourselfPosition.value = this.awayPoint;
        }

        const { x: camRotX, y: camRotY } = this.getCameraRot(dt);
        this.cameraPivot.rotation.y = camRotX;
        this.cameraPivot.rotation.x = camRotY;

        if (this.annotationLayerRef.current) {
            const tr = `perspective(${this.guiParams.perspective}px) rotateY(${-camRotX}rad) rotateX(${+camRotY}rad)`;
            (this.annotationLayerRef.current.children[0] as HTMLElement).style.transform = tr;
            (this.backgroundLayerRef.current.children[0] as HTMLElement).style.transform = tr;
        }

        this.instancedMaterial.uniforms.morph.value = this.morph.value;

    }


    testPickYourself(mouseRelPos: { x: number, y: number }): boolean {
        // raycaster test
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouseRelPos, this.camera);
        // const intersects = raycaster.intersectObjects([this.yourselfMesh]);
        const intersects = raycaster.intersectObjects(this.scene.children);

        const yourselfAnnotationPos = this.getAnnotationPos(this.yourselfPosition.x, this.yourselfPosition.y);

        return Math.abs(yourselfAnnotationPos.x - mouseRelPos.x) < 40 &&
            Math.abs(yourselfAnnotationPos.y - mouseRelPos.y) < 40
    }


    startDraggingYourself(mousePos: { x: number, y: number }) {
        this.props.setSelectedObservation(null);
        this.setState({ isDraggingYourself: true });
    }


    dragYourselfToPos = (mousePos: { x: number, y: number }) => {
        const { setCurrentColumn } = this.props;
        const pos = this.getPosFromAnnotationPos(mousePos.x, mousePos.y);
        this.yourselfPosition.x = pos.x;
        this.yourselfPosition.y = pos.y;
        const selectedGroupIndices = this.getGroupFromAnnotationPos(mousePos.x, mousePos.y);
        if (selectedGroupIndices) {
            const { groupIndexX } = selectedGroupIndices;
            if (groupIndexX != this.props.currentColumn) {
                // group changed
                setCurrentColumn(groupIndexX);
            }
        }
    }


    dropYourselfToPos(mousePos: { x: number, y: number }) {
        this.setState({ isDraggingYourself: false });
        const groupFound = this.moveYourselfToGroupPos(mousePos);
        if (!groupFound) {
            // bounce back to previous group
            this.updateYourselfPositionInCurrentGroup(this.state.groupLayoutInfo);
        }
    }


    endDraggingYourself(mousePos: { x: number, y: number }) {
        this.setState({ isDraggingYourself: false });

        // go back to current column
        if (this.state.groupLayoutInfo) {
            this.updateYourselfPositionInCurrentGroup(this.state.groupLayoutInfo);
        }
    }


    dispatchNewYourselfPosition = throttle(1000, false /* no trailing */, (pos: THREE.Vector3) => {
        const rect = this.canvasRef.current.getBoundingClientRect();
        const { x, y } = this.getAnnotationPos(pos.x, pos.y);
        this.props.setOnboardingObjectPositions({
            yourself: {
                left: rect.left + x + this.YOURSELF_POS_FIX.x,
                top: rect.top + y + this.YOURSELF_POS_FIX.y,
            }
        });
    });


    moveYourselfToGroupPos(mousePos: { x: number, y: number }): boolean {
        const { setCurrentColumn } = this.props;
        if (!this.state.groupLayoutInfo) {
            console.warn('this.state.layoutGroupInfo undefined')
            return false;
        }

        const selectedGroupIndices = this.getGroupFromAnnotationPos(mousePos.x, mousePos.y);
        if (selectedGroupIndices) {
            const { groupIndexX } = selectedGroupIndices;
            if (groupIndexX != this.props.currentColumn) {
                // group changed
                setCurrentColumn(groupIndexX);
                return true;
            } else {
                //group unchanged
                this.updateYourselfPositionInCurrentGroup(this.state.groupLayoutInfo);
                return true;
            }
        }

        return false;
    }


    getGroupFromAnnotationPos(x: number, y: number): null | { groupIndexX: number, groupIndexY: number } {
        const { groupLayoutInfo } = this.state;

        if (!groupLayoutInfo) {
            return null;
        }

        const { groupPosX, groupPosY, rectWidths, rectHeights } = groupLayoutInfo;
        const nGroupX = groupPosX.length;
        const nGroupY = groupPosX[0].length;
        let groupIndexX, groupIndexY;

        for (let gx = 0; gx < nGroupX; gx++) {
            for (let gy = 0; gy < nGroupY; gy++) {
                const w = this.getSizeTransform(rectWidths[gx][gy]);
                const h = this.getSizeTransform(rectHeights[gx][gy]);
                const { x: cx, y: cy } = this.getAnnotationPos(groupPosX[gx][gy], groupPosY[gx][gy]);
                let pointInRect = x > cx && y < cy && x < cx + w && y > cy - h; // note y inverted
                if (pointInRect) {
                    groupIndexX = gx;
                    groupIndexY = gy;
                }
            }
        }


        if (groupIndexX != undefined) {
            return { groupIndexX, groupIndexY };
        } else return null
    }

    throttledPickAPerson = throttle(200, false /* no trailing */, (evt: MouseEvent) => {
        if (!this.state.isDraggingYourself) {
            const mousePos = getMousePos(this.canvasRef.current, evt);
            this.pickAPerson(mousePos);
        }
    });

    pickAPerson(mousePos: { x: number, y: number }) {
        const { observations } = this.props;
        const pickId = this.renderAndPick(mousePos) - 1; // I increment all Ids by one to detect 0 as nothing selected
        let selectedObservation;
        if (observations && observations[pickId]) {
            selectedObservation = observations[pickId];
        }

        if (selectedObservation) {
            debug({ selected_id: selectedObservation.id });
            this.props.setSelectedObservation(selectedObservation);
        } else {
            this.props.setSelectedObservation(null);
        }
    }

    introFadeInEffect = () => {
        if (this.introOpacityTween) {
            this.introOpacityTween.stop();
        }
        this.opacityTransition = { opacity: 0, index: Math.trunc(Math.random() * this.props.observations.length) }

        this.introOpacityTween = new Tween(this.opacityTransition);
        this.introOpacityTween
            .to({ opacity: 1 }, 200)
            .onUpdate(obj => {
                this.getCurrentAttributes(true).vertexOpacity.setX(obj.index, obj.opacity)
                this.getCurrentAttributes(true).vertexOpacity.needsUpdate = true;
            })
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onComplete(() => {
                if (this.props.isIntro) {
                    this.introFadeInEffect();
                }
            })
            .start();
    }

    introRotateCamera = () => {
        this.introRotationTween = new Tween(this.cameraOffset);
        this.introRotationTween
            .to({ rot: 0 }, 1000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();
    }

    backToIntroRotateCamera = () => {
        this.introRotationTween = new Tween(this.cameraOffset);
        this.introRotationTween
            .to({ rot: CAMERA_IN_FRONT_ROT }, 1000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();
    }


    zoomIn = () => {
        const {limitedWidth} = this.props;
        const destRot = limitedWidth ? 0.3 : 0.2;
        const destZ = limitedWidth ? -2.5 : -1.5;
        const destY = limitedWidth ? 1 : 0.5;
        this.updateSelectionMaterial();
        this.introRotationTween = new Tween(this.cameraOffset);
        this.introRotationTween
            .to({ rot: destRot, z: destZ, y: destY}, 1000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();

        this.setState({
            cursor: 'zoom-out',
        })
    }

    zoomOut = () => {
        this.updateSelectionMaterial();
        this.introRotationTween = new Tween(this.cameraOffset);
        this.introRotationTween
            .to({ rot: 0, z: 0, x: 0, y: 0 }, 1000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();

        this.setState({
            cursor: 'zoom-in',
        })
    }

    updateSelectionMaterial() {
        if (this.props.selectedObservationId != null) {
            const index = this.observationIdToIndexMap.get(this.props.selectedObservationId);
            this.instancedMaterial.uniforms.selectedIndex.value = index;
            this.yourselfMaterial.color = new THREE.Color('#FFFFFF');
        } else {
            this.instancedMaterial.uniforms.selectedIndex.value = -1;
            this.yourselfMaterial.color = new THREE.Color(color.accent);
        }

        if (this.props.isZoomedIn) {
            this.yourselfMaterial.color = new THREE.Color('#FFFFFF');
        }
    }

    showYourself(v: boolean) {
        this.yourselfMesh.visible = v;
    }

}



function mapStateToProps(state: RootState, ownProps: GridVizProps) {
    const { filterQuery } = state.rawData;
    return {
        observations: state.rawData.filteredEntries,
        valuesQuery: state.rawData.valuesQuery,
        filterQuery: state.rawData.filterQuery,
        primaryFilterDemographic: state.rawData.primaryFilterDemographic,
        secondaryFilterDemographic: state.rawData.secondaryFilterDemographic,
        selectedObservationId: state.rawData.selectedObservationId,
        currentRow: state.rawData.currentRow,
        currentColumn: state.rawData.currentColumn,
        animationInProgress: state.rawData.animationInProgress,
        vizConfig: getCurrentVizConfigSelector(state),
        disableCameraTrack: !!getCurrentOnboardingMessageSelector(state),
        currentOnboardingMessage: getCurrentOnboardingMessageSelector(state),
        isIntro: getCurrentStep(state).type < OnboardingStepTypes.VIZ_RANDOM,
        isZoomedIn: state.rawData.zoomedIn,
        cameraInFront: getCurrentStep(state).type < OnboardingStepTypes.VIZ_ONE_GROUP,
        limitedWidth: state.rawData.isLimitedWidth,
        isHorizontal: isHorizontalViz(state),
        // showYourself: !!state.rawData.valuesQuery.value && isCountryPreferred(state),
        showYourself: getCurrentStep(state).type < OnboardingStepTypes.VIZ_RANDOM || !!state.rawData.valuesQuery.value,

        featureColoredMenEnabled: isFeatureAvailableSelector('colored_men')(state),
        featureChartsEnabled: isFeatureAvailableSelector('charts')(state),
        featurePickingEnabled: isFeatureAvailableSelector('picking')(state),
        featurePickingMarkerEnabled: isFeatureAvailableSelector('picking_marker')(state),
        featureLegendEnabled: isFeatureAvailableSelector('legend')(state),
    }
}

function mapDispatchToProps(dispatch) {
    return {
        //   fetchAllVizData: params => dispatch(fetchAllVizData(params))
        setSelectedObservation: o => dispatch(setSelectedObservation({ o })),
        setCurrentColumn: column => dispatch(setCurrentColumn({ column })),
        setAnimationInProgress: value => dispatch(setAnimationInProgress({ value })),
        setOnboardingObjectPositions: positions => dispatch(setOnboardingObjectPositions(positions)),
        nextOnboardingMessage: () => dispatch(nextOnboardingMessage()),
        zoomInAction: (v: boolean) => dispatch(zoomIn(v)),
    }
}

export const GridViz = connect(mapStateToProps, mapDispatchToProps)(GridVizView);
