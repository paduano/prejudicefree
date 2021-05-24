import * as THREE from 'three';
import React, { Fragment } from 'react';
import { ThreeCanvas, ThreeCanvasProps, ThreeCanvasState } from '../three_canvas';
import { debug, getMousePos } from '../../../utils/utils';
import instanceVertexShader from '../../shaders/instance.vertex';
import instanceFragShader from '../../shaders/instance.frag';
import TWEEN, { Tween } from '@tweenjs/tween.js';
import { Observation, ObservationDemographics, ObservationQuery, ValuesQuery } from '../../observation';
import { connect } from 'react-redux';
import { nextOnboardingMessage, RootState, setAnimationInProgress, setCurrentColumn, setOnboardingObjectPositions, setSelectedObservation } from '../../store';
import { DotAttributes, DotsVizConfiguration, GroupLayoutInfo, LayoutParams, VizPrepareState } from './grid_viz_configs';
import { threeAssets } from './assets';
import { AxisX } from '../axis_x';
import { AxisY } from '../axis_y';
import { BarCharts } from '../bar_charts';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { Box } from '@material-ui/core';
import YouMarker from '../you_marker';
import { ChartAnnotationWrapper } from '../chart_annotation_wrapper';
import chartStyles from '../../../styles/chart_annotation.module.css'
import { getCurrentOnboardingMessageSelector, getCurrentVizConfigSelector, isFeatureAvailableSelector, OnboardingMessage, OnboardingObjectPositions } from '../../onboarding';
import { throttle } from 'throttle-debounce';
import { color } from '../ui_utils';
import { SelectionMarker } from '../selection_marker';


const PI_2 = 1.57079632679489661923;
const POINT_COUNT = 5000;
const TWEEN_TRANSITION_TIME = 2000;
const CAMERA_ROT = 15;
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

    featureColoredMenEnabled: boolean;
    featureChartsEnabled: boolean;
    featurePickingEnabled: boolean;
    featurePickingMarkerEnabled: boolean;
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

    constructor(props: GridVizProps) {
        super(props);
        this.morphTween = new TWEEN.Tween(this.morph);
        this.yourselfPosition = new THREE.Vector3(0, 0, 0);
    }



    componentDidMount() {
        super.componentDidMount();

        this.annotationCanvasRef.current.onclick = this.onClick;
        this.annotationCanvasRef.current.onmousedown = this.onMouseDown;
        this.annotationCanvasRef.current.onmouseup = this.onMouseUp;
        this.annotationCanvasRef.current.onmouseleave = this.onMouseLeave;
        this.annotationCanvasRef.current.onmouseenter = this.onMouseEnter;
        this.annotationCanvasRef.current.onmousemove = this.onMouseMove;
    }


    componentDidUpdate(prevProp: GridVizProps) {
        const obsChanged = this.props.observations != prevProp.observations;
        const valuesChanged = this.props.valuesQuery != prevProp.valuesQuery;
        const demographicFilterChanged =
            this.props.primaryFilterDemographic != prevProp.primaryFilterDemographic ||
            this.props.secondaryFilterDemographic != prevProp.secondaryFilterDemographic;
        const currentRowChanged = this.props.currentRow != prevProp.currentRow;
        const vizConfigChanged = this.props.vizConfig != prevProp.vizConfig;
        if (vizConfigChanged || obsChanged || valuesChanged || demographicFilterChanged || currentRowChanged) {
            this.nextStep(this.props.vizConfig);
        }

        const selectedIdChanged = this.props.selectedObservationId != prevProp.selectedObservationId;
        if (selectedIdChanged) {
            if (this.props.selectedObservationId != null) {
                const index = this.observationIdToIndexMap.get(this.props.selectedObservationId);
                this.instancedMaterial.uniforms.selectedIndex.value = index;
                this.yourselfMaterial.color = new THREE.Color('#FFFFFF');
            } else {
                this.instancedMaterial.uniforms.selectedIndex.value = -1;
                this.yourselfMaterial.color = new THREE.Color(color.accent);
            }
        }

        const currentColumnChanged = this.props.currentColumn != prevProp.currentColumn;
        if (currentColumnChanged) {
            this.updateYourselfPositionInCurrentGroup(this.state.groupLayoutInfo);
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
        const { observations } = this.props;

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
        const yourselfPosition = groupLayoutInfo.yourselfPositions[currentColumn][currentRow] ?? { x: 0, y: 0, z: 0 };
        this.setYourselfPosition(new THREE.Vector3(yourselfPosition.x, yourselfPosition.y, 0));
    }

    private applyDotAttributes(attributes: any, dotAttributes: DotAttributes, i: number) {
        if (dotAttributes.position) {
            attributes.position.setXYZ(i,
                dotAttributes.position.x,
                dotAttributes.position.y,
                dotAttributes.position.z,
            );
        }
        if (dotAttributes.opacity) {
            attributes.vertexOpacity.setX(i, dotAttributes.opacity);
        }
        if (dotAttributes.color) {
            attributes.color.setXYZ(i,
                dotAttributes.color.r,
                dotAttributes.color.g,
                dotAttributes.color.b,
            );
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

    YOURSELF_POS_FIX = { x: -9, y: -3 };
    renderBackground() {
        const { selectedObservationId, primaryFilterDemographic, secondaryFilterDemographic, featureChartsEnabled } = this.props;
        const { x: youPosX, y: youPosY } = this.getAnnotationPos(this.yourselfPosition.x, this.yourselfPosition.y);
        const { groupLayoutInfo } = this.state;
        return (
            <Fragment>
                {/* you marker */}
                <ChartAnnotationWrapper hidden={this.state.yourselfAnimationInProgress || this.state.isDraggingYourself}>
                    <Box id='you-marker' position='absolute' left={youPosX + this.YOURSELF_POS_FIX.x} top={youPosY + this.YOURSELF_POS_FIX.y} className={chartStyles.yourselfMarker}>
                        <YouMarker />
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
        if (selectedObservationId && attributes) {
            const i = this.observationIdToIndexMap.get(selectedObservationId);

            const x = attributes.position.getX(i);
            const y = attributes.position.getY(i);
            const pos = this.getAnnotationPos(x, y);
            pickSelection = (
                <Box id='selection-marker' position='absolute' left={pos.x - 8} top={pos.y - 16} style={{pointerEvents: 'none'}} >
                    <SelectionMarker />
                </Box >
            );
        }

        return (
            <Fragment>
                <ChartAnnotationWrapper hidden={this.state.yourselfAnimationInProgress || this.state.isDraggingYourself || !this.props.featurePickingMarkerEnabled}>
                    {pickSelection}
                </ChartAnnotationWrapper>
                {featureChartsEnabled && groupLayoutInfo && secondaryFilterDemographic ?
                    <AxisY groupLayoutInfo={groupLayoutInfo}
                        getSizeTransform={this.getSizeTransform}
                        getAnnotationPos={this.getAnnotationPos} /> : null
                }
            </Fragment>
        );
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


    onClick = (evt: MouseEvent) => {
        // this.pickAPerson(mousePos)
        // this.moveYourselfToGroupPos(mousePos);
    }


    onMouseDown = (evt: MouseEvent) => {
        console.log('onMouseDown')
        const mousePos = getMousePos(this.canvasRef.current, evt);
        if (this.testPickYourself(mousePos)) {
            this.startDraggingYourself(mousePos)

            // dismiss onboarding message
            if (this.props.currentOnboardingMessage && this.props.currentOnboardingMessage.type == 'DRAG_AND_DROP_YOURSELF') {
                this.props.nextOnboardingMessage();
            }
        }
    }

    onMouseUp = (evt: MouseEvent) => {
        console.log('onMouseUp')
        const mousePos = getMousePos(this.canvasRef.current, evt);

        if (this.state.isDraggingYourself) {
            const mousePos = getMousePos(this.canvasRef.current, evt);
            this.dropYourselfToPos(mousePos);
        } else {
            // people picking
            this.pickAPerson(mousePos)
        }
    }

    mouseEnterCounter = 0;
    onMouseEnter = (evt: MouseEvent) => {
        this.mouseEnterCounter++;
        console.log('onMouseEnter ' + this.mouseEnterCounter)
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
        // this.setState({
        //     annotationLayerTransform: `perspective(${this.guiParams.perspective}px) rotateY(${annotationRotX}rad) rotateX(${annotationRotY}rad)`,
        //     annotationRotX,
        //     annotationRotY,
        // })
        this.annotationRotX = annotationRotX;
        this.annotationRotY = annotationRotY;

        if (this.state.isDraggingYourself) {
            const mousePos = getMousePos(this.canvasRef.current, evt);
            this.dragYourselfToPos(mousePos);
        } else if (this.props.featurePickingEnabled) {
            this.throttledPicAPerson(evt)
        }
    }


    getRelMouseCoords(evt: MouseEvent) {
        let { x, y } = getMousePos(this.canvasRef.current, evt);
        // x -= this.mouseEnterPos.x / 2;
        // y -= this.mouseEnterPos.y / 2;

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
            dotsVertexOpacityAttr.push(1);
            dotsVertexOpacity2Attr.push(1);

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
        this.instancedMaterial.transparent = false;
        this.instancedGeometry = (threeAssets.man.children[0] as THREE.Mesh).geometry.clone(); // clone to not break HMR
        this.instancedGeometry.scale(0.05, 0.05, 0.05);
        this.instancedGeometry.rotateX(PI_2);
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

        this.scene.add(this.yourselfMesh);

        this.yourselfMesh.position.copy(this.yourselfPosition);

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

    tick = (dt: number, time: number) => {
        const { disableCameraTrack } = this.props;
        this.morphTween.update();
        this.yourselfPositionTween.update();

        // update yourself position
        this.yourselfMesh.position.copy(this.yourselfPosition);
        this.instancedMaterial.uniforms.yourselfPosition.value = this.yourselfPosition;

        // note the x,y inversion
        const rotX = !disableCameraTrack ? this.mouseRelPos.x / CAMERA_ROT : 0;
        const rotY = !disableCameraTrack ? this.mouseRelPos.y / CAMERA_ROT : 0;

        // smooth move of the camera and transform layers
        const maxDegree = dt / 2; // speed
        const currentRot = this.cameraPivot.rotation;
        const drotX = rotX - currentRot.y;
        const drotY = rotY - currentRot.x;
        const destRotX = currentRot.y + Math.sign(drotX) * Math.min(Math.abs(drotX), maxDegree);
        const destRotY = currentRot.x + Math.sign(drotY) * Math.min(Math.abs(drotY), maxDegree);

        this.cameraPivot.rotation.y = destRotX;
        this.cameraPivot.rotation.x = destRotY;

        if (this.annotationLayerRef.current) {
            const tr = `perspective(${this.guiParams.perspective}px) rotateY(${-destRotX}rad) rotateX(${+destRotY}rad)`;
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

        return intersects.length > 0;
    }


    startDraggingYourself(mousePos: { x: number, y: number }) {
        this.setState({ isDraggingYourself: true });
        console.log('drag yourself -- start')
    }


    dragYourselfToPos = (mousePos: { x: number, y: number }) => {
        const pos = this.getPosFromAnnotationPos(mousePos.x, mousePos.y);
        this.yourselfPosition.x = pos.x;
        this.yourselfPosition.y = pos.y;
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

    throttledPicAPerson = throttle(200, false /* no trailing */, (evt: MouseEvent) => {
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

        featureColoredMenEnabled: isFeatureAvailableSelector('colored_men')(state),
        featureChartsEnabled: isFeatureAvailableSelector('charts')(state),
        featurePickingEnabled: isFeatureAvailableSelector('picking')(state),
        featurePickingMarkerEnabled: isFeatureAvailableSelector('picking_marker')(state),
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
    }
}

export const GridViz = connect(mapStateToProps, mapDispatchToProps)(GridVizView);
