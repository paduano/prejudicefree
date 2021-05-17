import * as THREE from 'three';
import React from 'react';
import { ThreeCanvas, ThreeCanvasProps, ThreeCanvasState } from '../three_canvas';
import { clamp, debug, getMousePos, PI, rand, randInCircle, randInGroup } from '../../../utils/utils';
import dotsVertexShader from '../../shaders/dots.vertex';
import dotsFragShader from '../../shaders/dots.frag';
import instanceVertexShader from '../../shaders/instance.vertex';
import instanceFragShader from '../../shaders/instance.frag';
import TWEEN, { Tween } from '@tweenjs/tween.js';
import { Circles } from './chart_svgs';
import { Observation, ObservationQuery, ValuesQuery } from '../../observation';
import { connect } from 'react-redux';
import { RootState } from '../../store';
import { ShaderMaterial } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { DotAttributes, DotsUniformConfig, DotsVizConfiguration, DOT_CONFIGS, LayoutParams } from './grid_viz_configs';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { threeAssets } from './assets';
import * as d3 from 'd3';


const PI_2 = 1.57079632679489661923;
const POINT_COUNT = 10000;
const TWEEN_TRANSITION_TIME = 1000;
// const TWEEN_TRANSITION_TIME = 100;

interface GridVizProps extends ThreeCanvasProps {
    width: number;
    height: number;
    observations: Observation[];
    allObservationsInCountry: Observation[];
    valuesQuery: ValuesQuery;
    filterQuery: ObservationQuery;
}

interface GridVizState extends ThreeCanvasState {

}

class GridVizView extends ThreeCanvas<GridVizProps> {
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

    constructor(props: GridVizProps) {
        super(props);
        this.morphTween = new TWEEN.Tween(this.morph);
    }


    componentDidUpdate(prevProp: GridVizProps) {
        const obsChanged = this.props.observations != prevProp.observations;
        const valuesChanged = this.props.valuesQuery != prevProp.valuesQuery;
        if (obsChanged || valuesChanged) {
            this.nextStep(this.currentVizStep);
        }
    }


    group1: Set<number> = new Set();
    setObservationData(config: DotsVizConfiguration<any>) {
        const allObservationsInCountry = this.props.allObservationsInCountry;
        const filteredObservations = this.props.observations;

        const observations = allObservationsInCountry;

        debug({ setObservationData_with_length: observations.length });

        // const position1 = this.dotsGeometry.attributes.position1;
        // const position2 = this.dotsGeometry.attributes.position2;
        // const vertexOpacity = this.dotsGeometry.attributes.vertexOpacity;
        // const vertexOpacity2 = this.dotsGeometry.attributes.vertexOpacity2;
        // const color = this.dotsGeometry.attributes.color;
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

        // next morph state
        if (this.currentMorph == 1) {
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

        // Layout
        const { r1, r2 } = this.R1R2();
        const layoutParams: LayoutParams = {
            r1: r1 / 78,
            r2: r2 / 78,
            filteredObservations,
            allObservations: allObservationsInCountry,
            valuesQuery: this.props.valuesQuery,
            filterQuery: this.props.filterQuery,
        }
        const configState = config.prepare(layoutParams);

        // const maxN = Math.min(observations.length, this.guiParams.maxPeople);
        const maxN = observations.length;
        for (let i = 0; i < maxN; i++) {
            const ob = observations[i];
            const dotAttributes = config.dot(i, ob, layoutParams, configState);
            this.applyDotAttributes(attributes, dotAttributes, i);
        }

        // the rest 
        for (let i = maxN; i < POINT_COUNT; i++) {
            attributes.vertexOpacity.setX(i, 0);
        }

        position1.needsUpdate = true;
        position2.needsUpdate = true;
        vertexOpacity.needsUpdate = true;
        vertexOpacity2.needsUpdate = true;
        color.needsUpdate = true;
        // this.dotsMaterial.uniforms.vertexCount.value = observations.length;
        this.instancedMaterial.uniforms.instanceCount.value = observations.length;
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
        if (dotAttributes.useGroup) {
            this.group1.add(i);
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

    idCircle1 = 'c1';
    idCircle2 = 'c2';
    renderBackground() {
        return (
            <span />
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
            // .easing(TWEEN.Easing.Quadratic.Out)
            this.morphTween.start();
        }

    }


    onClick = () => {
        this.nextStep();
    }


    onMouseEnter = (evt: MouseEvent) => {
        this.mouseEnterPos = getMousePos(this.canvasRef.current, evt);
        // debug({mouseEnterPosition: this.mouseEnterPos})
    }


    onMouseMove = (evt: MouseEvent) => {
        super.onMouseMove(evt);
        
        let { x, y } = getMousePos(this.canvasRef.current, evt);
        x -= this.mouseEnterPos.x / 2;
        y -= this.mouseEnterPos.y / 2;

        const relX = ((x / this.props.width) - 0.5) * 2;
        const relY = ((y / this.props.height) - 0.5) * 2;
        this.mouseRelPos = { x: relX, y: relY };
        const annotationRotX = -relX / 5;
        const annotationRotY = relY / 5;
        this.setState({
            annotationLayerTransform: `perspective(${this.guiParams.perspective}px) rotateY(${annotationRotX}rad) rotateX(${annotationRotY}rad)`,
        })
    }

    setUpScene = () => {

        // effect composer
        // const bloomPass = new UnrealBloomPass( new THREE.Vector2( this.props.width, this.props.height), 1.5, 0.4, 0.85 );
        // const renderScene = new RenderPass(this.scene, this.camera);
        // bloomPass.compositeMaterial.transparent = true
        // this.composer = new EffectComposer(this.renderer);
        // this.composer.addPass(renderScene);
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
        }

        // INSTANCE -----
        this.instancedMaterial = new THREE.ShaderMaterial({
            uniforms: {
                morph: { value: 0 },
                opacity: { value: 1 },
                diffuse: { value: new THREE.Color(0xFFFFFF) },
                instanceCount: { value: POINT_COUNT }, // only "visible" instance count
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
        this.instancedMesh = new THREE.InstancedMesh(this.instancedGeometry, this.instancedMaterial, POINT_COUNT);
        this.instancedMesh.addEventListener('onPointerMove', (e: THREE.Event) => {
            debugger
        })

        this.scene.add(this.instancedMesh);

        const dummy = new THREE.Object3D();
        for (let i = 0; i < POINT_COUNT; i++) {
            // dummy.rotation.set(0, 0, rand(0, 2 * PI));
            dummy.position.set(0, 0, 0);
            dummy.updateMatrix();

            this.instancedMesh.setMatrixAt(i, dummy.matrix);
        }
    }

    R1R2() {
        const { observations, allObservationsInCountry } = this.props;
        if (allObservationsInCountry.length == 0) {
            return { r1: 0, r2: 0 };
        }
        const ratio = Math.sqrt(observations.length) / Math.sqrt(allObservationsInCountry.length);
        const maxR = 250;
        const r1 = maxR * ratio;
        const r2 = maxR;
        return { r1, r2 }
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
        this.setObservationData(config);
        this.triggerNextMorphTransition();

        // set circles
        const { r1, r2 } = this.R1R2();
        d3.select(`#${this.idCircle1}`).transition().attr('r', r1);
        d3.select(`#${this.idCircle2}`).transition().attr('r', r2);
    }

    tick = (dt: number, time: number) => {
        this.morphTween.update();

        // note the x,y inversion
        this.cameraPivot.rotation.y = this.mouseRelPos.x / 5;
        this.cameraPivot.rotation.x = this.mouseRelPos.y / 5;

        // this.dotsMaterial.uniforms.morph.value = this.guiParams.morph;
        // this.dotsMaterial.uniforms.morph.value = this.morph.value;
        this.instancedMaterial.uniforms.morph.value = this.morph.value;

        this.pick();
    }

    pick = () => {
    }
}



function mapStateToProps(state: RootState, ownProps: GridVizProps) {
    const { allEntries, filterQuery } = state.rawData;
    const currentCountry = filterQuery && filterQuery.country_codes && filterQuery.country_codes.length == 1 ? filterQuery.country_codes[0] : null;
    const allObservationsInCountry = !!currentCountry ? allEntries[currentCountry] : [];
    return {
        observations: state.rawData.filteredEntries,
        allObservationsInCountry,
        valuesQuery: state.rawData.valuesQuery,
        filterQuery: state.rawData.filterQuery,
    }
}

function mapDispatchToProps(dispatch) {
    return {
        //   fetchAllVizData: params => dispatch(fetchAllVizData(params))
    }
}

export const GridViz = connect(mapStateToProps, mapDispatchToProps)(GridVizView);
