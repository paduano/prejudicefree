import * as THREE from 'three';
import React, { Fragment } from 'react';
import { ThreeCanvas, ThreeCanvasProps, ThreeCanvasState } from '../three_canvas';
import { debug, getMousePos } from '../../../utils/utils';
import instanceVertexShader from '../../shaders/instance.vertex';
import instanceFragShader from '../../shaders/instance.frag';
import TWEEN, { Tween } from '@tweenjs/tween.js';
import { Observation, ObservationDemographics, ObservationQuery, ValuesQuery } from '../../observation';
import { connect } from 'react-redux';
import { RootState, setAnimationInProgress, setCurrentColumn, setSelectedObservation } from '../../store';
import { DotAttributes, DotsVizConfiguration, DOT_CONFIGS, GroupLayoutInfo, LayoutParams, VizPrepareState } from './grid_viz_configs';
import { threeAssets } from './assets';
import { AxisX } from '../axis_x';
import { AxisY } from '../axis_y';
import { BarCharts } from '../bar_charts';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';


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
}

interface GridVizState extends ThreeCanvasState {
    groupLayoutInfo?: GroupLayoutInfo,
}

class GridVizView extends ThreeCanvas<GridVizProps, GridVizState> {

    //
    cameraPivot: THREE.Object3D;
    mouseEnterPos: { x: number, y: number } = { x: 0, y: 0 };
    mouseRelPos: { x: number, y: number } = { x: 0, y: 0 };
    currentVizStep = 0;
    maxVizSteps = DOT_CONFIGS.length - 1;
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
    yourselfMesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>;
    yourselfMaterial: THREE.MeshBasicMaterial;
    yourselfPosition: THREE.Vector3;
    yourselfPositionTween: Tween<THREE.Vector3>;

    constructor(props: GridVizProps) {
        super(props);
        this.morphTween = new TWEEN.Tween(this.morph);
    }


    componentDidUpdate(prevProp: GridVizProps) {
        const obsChanged = this.props.observations != prevProp.observations;
        const valuesChanged = this.props.valuesQuery != prevProp.valuesQuery;
        const demographicFilterChanged = 
            this.props.primaryFilterDemographic != prevProp.primaryFilterDemographic || 
            this.props.secondaryFilterDemographic != prevProp.secondaryFilterDemographic;
        const currentRowChanged = this.props.currentRow != prevProp.currentRow;
        if (obsChanged || valuesChanged || demographicFilterChanged || currentRowChanged) {
            this.nextStep(this.currentVizStep);
        }

        const selectedIdChanged = this.props.selectedObservationId != prevProp.selectedObservationId;
        if (selectedIdChanged) {
            const index = this.observationIdToIndexMap.get(this.props.selectedObservationId);
            this.instancedMaterial.uniforms.selectedIndex.value = index;
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
        const {observations} = this.props;

        debug({ setObservationData_with_length: this.props.observations.length});

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
        }
        const configState: VizPrepareState = config.prepare(layoutParams);
        const {groupLayoutInfo} = configState;

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

        this.setState({groupLayoutInfo});
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


    componentDidMount() {
        super.componentDidMount();

        this.annotationCanvasRef.current.onclick = this.onClick;
    }


    setUpGui(GUI: any) {
        this.gui.add(this.guiParams, 'perspective', 1, 1000, 1);
        this.gui.add(this.guiParams, 'morph', 0, 1, 0.01).onChange(v => {
            this.morph.value = v;
            this.morphTween.stop();
        })
        this.gui.add(this.guiParams, 'maxPeople', 0, 9999, 1).onChange(v => {
            this.nextStep(this.currentVizStep);
        })
    }

    renderBackground() {
        return (
            <span />
            // <Circles idCircle1={this.idCircle1} idCircle2={this.idCircle2} r1={10} r2={100} />
        );
    }

    renderAnnotation() {
        const { selectedObservationId, primaryFilterDemographic, secondaryFilterDemographic} = this.props;
        const {groupLayoutInfo} = this.state;
        const attributes = this.getCurrentAttributes(true);
        let selectionCircle: JSX.Element = null
        if (selectedObservationId && attributes) {
            const i = this.observationIdToIndexMap.get(selectedObservationId);
            
            const x = attributes.position.getX(i);
            const y = attributes.position.getY(i);
            const pos = this.getAnnotationPos(x, y);
            // selectionCircle = <circle cx={pos.x} cy={pos.y - 10} r="6" stroke="white" strokeWidth="2" fill="none" />;
            selectionCircle = <svg x={pos.x - 8} y={pos.y - 14} width="16" height="10" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M3.96215 4.56519L0.226299 0.434751L7.698 0.43475L3.96215 4.56519Z" fill="white" /> </svg>

        }
        const svgStyle = {
            position: 'absolute',
            left: 0,
            top: 0,
            pointerEvents: 'none' as any,
        } as any;

        return (
            <Fragment>
                <svg width={this.props.width} height={this.props.height} style={svgStyle}>
                    {selectionCircle}
                </svg>
                {groupLayoutInfo && primaryFilterDemographic ?
                    <AxisX  groupLayoutInfo={groupLayoutInfo} 
                            getSizeTransform={this.getSizeTransform}
                            getAnnotationPos={this.getAnnotationPos} /> : null
                }
                {groupLayoutInfo && secondaryFilterDemographic ?
                    <AxisY groupLayoutInfo={groupLayoutInfo}
                        getSizeTransform={this.getSizeTransform}
                        getAnnotationPos={this.getAnnotationPos} /> : null
                }
                {groupLayoutInfo ?
                    <BarCharts groupLayoutInfo={groupLayoutInfo}
                        getSizeTransform={this.getSizeTransform}
                        getAnnotationPos={this.getAnnotationPos} /> : null
                }
            </Fragment>
            // <Circles idCircle1={this.idCircle1} idCircle2={this.idCircle2} r1={10} r2={100} />

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
            // .easing(TWEEN.Easing.Quadratic.Out) // I do this in the shader
            this.morphTween.start();
        }

    }


    onClick = (evt: any) => {
        const { observations, setCurrentColumn } = this.props;
        const pickId = this.renderAndPick(evt) - 1; // I increment all Ids by one to detect 0 as nothing selected
        let selectedObservation;
        if (observations && observations[pickId]) {
            selectedObservation = observations[pickId];
        }

        if (selectedObservation) {
            debug({selected_id: selectedObservation.id});
            this.props.setSelectedObservation(selectedObservation);
        } else {
            this.props.setSelectedObservation(null);
        }

        // move to clicked demo group
        if (this.state.groupLayoutInfo) {
            let { x, y } = getMousePos(this.canvasRef.current, evt);
            const selectedGroupIndices = this.getGroupFromAnnotationPos(x, y);
            if (selectedGroupIndices) {
                const { groupIndexX, groupIndexY } = selectedGroupIndices;
                setCurrentColumn(groupIndexX);
            }

        }
    }


    onMouseEnter = (evt: MouseEvent) => {
        // this.mouseEnterPos = getMousePos(this.canvasRef.current, evt);
        // debug({mouseEnterPosition: this.mouseEnterPos})
    }


    onMouseMove = (evt: MouseEvent) => {
        super.onMouseMove(evt);
        
        let { x, y } = getMousePos(this.canvasRef.current, evt);
        // x -= this.mouseEnterPos.x / 2;
        // y -= this.mouseEnterPos.y / 2;

        const relX = ((x / this.props.width) - 0.5) * 2;
        const relY = ((y / this.props.height) - 0.5) * 2;
        this.mouseRelPos = { x: relX, y: relY };
        const annotationRotX = -relX / CAMERA_ROT;
        const annotationRotY = relY / CAMERA_ROT;
        this.setState({
            annotationLayerTransform: `perspective(${this.guiParams.perspective}px) rotateY(${annotationRotX}rad) rotateX(${annotationRotY}rad)`,
        })
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
        // const light = new THREE.PointLight( 0xff0000, 1, 100 );
        // light.position.set( 5, 0, 0 );
        // this.scene.add( light );

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
            var color = new THREE.Color();
            color.setHex(i + 1);
            idColors.push(color.r);
            idColors.push(color.g);
            idColors.push(color.b);

            indices.push(i);
        }

        // INSTANCE -----
        this.instancedMaterial = new THREE.ShaderMaterial({
            uniforms: {
                morph: { value: 0 },
                opacity: { value: 1 },
                diffuse: { value: new THREE.Color(0xFFFFFF) },
                instanceCount: { value: POINT_COUNT }, // only "visible" instance count
                picking: {value: 0}, // to selectively render id colors for picking
                selectedIndex: {value: -1}, // id of the mesh selected
                yourselfPosition: {value: new THREE.Vector3(0,0,0)}, // id of the mesh selected
            },
            vertexShader: instanceVertexShader,
            fragmentShader: instanceFragShader
        });
        this.instancedMaterial.transparent = true;
        this.instancedGeometry = (threeAssets.man.children[0] as THREE.Mesh).geometry.clone(); // clone to not break HMR
        this.instancedGeometry.scale(0.04, 0.04, 0.04);
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
        this.yourselfPosition = new THREE.Vector3(0, 0, 0);
        this.yourselfMaterial = new THREE.MeshBasicMaterial({ color: 0xffFf00 });
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
        this.nextStep(this.currentVizStep);
    }


    nextStep(step?: number) {
        if (step !== undefined) {
            this.currentVizStep = step;
        } else {
            this.currentVizStep++;
            if (this.currentVizStep > this.maxVizSteps) {
                this.currentVizStep = 0;
            }
        }
        const config = DOT_CONFIGS[this.currentVizStep];
        this.props.setAnimationInProgress(true);
        setTimeout(() => {
            this.props.setAnimationInProgress(false);
        }, TWEEN_TRANSITION_TIME);
        this.setObservationData(config);
        this.triggerNextMorphTransition();
    }

    setYourselfPosition(pos: THREE.Vector3) {
        this.yourselfPositionTween = new TWEEN.Tween(this.yourselfPosition)
            .to({ x: pos.x, y: pos.y, z: pos.z, }, TWEEN_TRANSITION_TIME)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();
            // .onUpdate(function (d) { })
            // .onComplete(function () {});
    }

    tick = (dt: number, time: number) => {
        this.morphTween.update();
        this.yourselfPositionTween.update();

        // update yourself position
        this.yourselfMesh.position.copy(this.yourselfPosition);
        this.instancedMaterial.uniforms.yourselfPosition.value = this.yourselfPosition;

        // note the x,y inversion
        this.cameraPivot.rotation.y = this.mouseRelPos.x / CAMERA_ROT;
        this.cameraPivot.rotation.x = this.mouseRelPos.y / CAMERA_ROT;

        this.instancedMaterial.uniforms.morph.value = this.morph.value;

        this.pick();
    }

    pick = () => {
    }

    getGroupFromAnnotationPos(x: number, y: number): null| {groupIndexX: number, groupIndexY: number} {
        const {groupLayoutInfo} = this.state;

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
                const {x: cx, y: cy} = this.getAnnotationPos(groupPosX[gx][gy], groupPosY[gx][gy]);
                let pointInRect = x > cx && y < cy && x < cx + w && y > cy - h; // note y inverted
                if (pointInRect) {
                    groupIndexX = gx;
                    groupIndexY = gy;
                }
            }
        }


        if (groupIndexX != undefined) {
            return {groupIndexX, groupIndexY};
        } else return null
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
    }
}

function mapDispatchToProps(dispatch) {
    return {
        //   fetchAllVizData: params => dispatch(fetchAllVizData(params))
        setSelectedObservation: o => dispatch(setSelectedObservation({o})),
        setCurrentColumn: column => dispatch(setCurrentColumn({column})),
        setAnimationInProgress: value => dispatch(setAnimationInProgress({value})),
    }
}

export const GridViz = connect(mapStateToProps, mapDispatchToProps)(GridVizView);
