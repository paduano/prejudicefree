import * as THREE from 'three';
import React, { lazy } from 'react';
import dynamic from "next/dynamic";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { debug, getMousePos } from '../../utils/utils';
import { Box } from '@material-ui/core';
import { FadeGradient } from './ui_utils';
import { color } from './colors';

// import type {GUI} from 'dat.gui';

// if (typeof window === 'undefined') {
//     const GUI = null;
// } else {
// }
// const dat_gui = dynamic(() => import('dat.gui').then((module) => module.GUI), {
//     ssr: false,
// }) as any;

export interface ThreeCanvasProps {
    width: number;
    height: number;
    backgroundColor: string;
    limitedWidth: boolean;
}

export interface ThreeCanvasState {
    annotationLayerTransform: string;
}

const importDatGui = async () => {
    const GUI = await import('dat.gui');
    return GUI
};

export class ThreeCanvas<T, S> extends React.Component<ThreeCanvasProps & T, ThreeCanvasState & S> {
    canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef<HTMLCanvasElement>();
    annotationLayerRef: React.RefObject<HTMLDivElement> = React.createRef<HTMLDivElement>();
    untransformedAnnotationLayerRef: React.RefObject<HTMLDivElement> = React.createRef<HTMLDivElement>();
    annotationCanvasRef: React.RefObject<HTMLCanvasElement> = React.createRef<HTMLCanvasElement>();
    backgroundLayerRef: React.RefObject<HTMLDivElement> = React.createRef<HTMLDivElement>();
    containerRef: React.RefObject<HTMLDivElement> = React.createRef<HTMLDivElement>();
    // backgroundCanvasRef: React.RefObject<HTMLCanvasElement> = React.createRef<HTMLCanvasElement>();
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    composer: EffectComposer;
    clock: THREE.Clock;
    gui: any;
    // backgroundColor = '#000000';
    // backgroundColor = '#FFFFFF';
    mouse: THREE.Vector2;

    // picking
    pickingScene: THREE.Scene;
    pickingTexture: THREE.WebGLRenderTarget;
    pickingCamera: THREE.Camera;


    constructor(props: ThreeCanvasProps) {
        super(props as any);
        this.state = {
            annotationLayerTransform: '',
        } as any;
    }

    componentDidMount() {
        // init three.js
        this.initThreeScene();
        this.renderLoop();
        this.annotate();
    }

    initThreeScene() {
        const { width, height } = this.props;
        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.mouse = new THREE.Vector2(1, 1);

        this.setUpCamera();

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvasRef.current,
            antialias: true,
            alpha: true,
        });

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(0x000000, 0); // the default

        // picking
        this.pickingScene = new THREE.Scene();
        this.pickingTexture = new THREE.WebGLRenderTarget(width, height);
        this.pickingTexture.texture.minFilter = THREE.LinearFilter

        this.setUpScene();
        this.annotate();
        this.drawBackground();
        this.sceneReady();

        // dat.gui
        if (typeof window !== 'undefined') {
            const previousGUI = document.getElementsByClassName('dg ac'); // hot reloading hack
            if (previousGUI[0]) {
                previousGUI[0].remove()
            }
            importDatGui().then(module => {
                // if (!this.gui) {
                this.gui = new module.GUI();
                this.gui.close();
                this.gui.hide(); // YYY
                this.setUpGui(module.GUI)
                // }
            });
        }
    }

    setUpGui(GUI: any) {

    }

    sceneReady() {

    }

    getAnnotationPos = (x: number, y: number) => {
        const {width, height} = this.props;
        return {
            x: width / 2 + this.getSizeTransform(x),
            y: height / 2 - + this.getSizeTransform(y),
        }
    }

    getSizeTransform = (v: number) => {
        const { limitedWidth, width, height } = this.props;
        // return v * width / 10.2;
        if (limitedWidth) {
            return v * 550 / 10.2;
        } else {
            return v * 800 / 10.2;
        }
    }

    getPosFromAnnotationPos = (x: number, y: number) => {
        const { width, height } = this.props;
        return {
            x: this.getSizeTransformInv(x - (width / 2)),
            y: -this.getSizeTransformInv(y - (height / 2)),
        }
    }

    getSizeTransformInv = (v: number) => {
        const { width, height } = this.props;
        return v / 800 * 10;
        // return v / width * 10;
    }

    tmpVec = new THREE.Vector3();
    getUntransformedAnnotationPos = (v: THREE.Vector3, obj: THREE.Object3D) => {
        // untested code
        const {width, height} = this.props;
        v.setFromMatrixPosition(obj.matrixWorld);
        v.applyMatrix4(this.camera.matrixWorld.multiply(this.camera.projectionMatrix));
        v.x = v.x * width/2 + width/2;
        v.y = -v.y * height/2 + height/2;
        return v;
    }

    annotate() {
        const { width, height } = this.props;
        // const ctx = this.annotationCanvasRef.current.getContext("2d");
        // draw rectangle
        // const sqSize = height * 0.67;
        // ctx.strokeStyle = 'white';
        // ctx.beginPath();
        // ctx.rect((width - sqSize) / 2, (height - sqSize) / 2, sqSize, sqSize);
        // ctx.stroke();
    }

    drawBackground() {
        // const {width, height} = this.props;
        // const canvas = this.backgroundCanvasRef.current;
        // const ctx = canvas.getContext("2d");
    }

    setUpCamera() {
        const { width, height } = this.props;
        // same camera
        this.pickingCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.pickingCamera.matrixAutoUpdate = false;
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.z = 5;
    }

    setUpScene() {
        // let geometry = new THREE.BoxGeometry( 1, 1, 1 );
        // var material = new THREE.MeshBasicMaterial();
        // let cube = new THREE.Mesh( geometry, material );
        // this.scene.add( cube );
    }

    renderLoop = () => {
        const dt = this.clock.getDelta();
        const time = this.clock.getElapsedTime();
        this.tick(dt, time)
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.setRenderTarget(null);
            this.renderer.render(this.scene, this.camera);
        }


        requestAnimationFrame(this.renderLoop);
    };

    tick = (dt: number, time: number) => {

    }

    renderAnnotation(): JSX.Element | null {
        return null;
    }

    renderUntransformedAnnotation(): JSX.Element | null {
        return null;
    }

    renderBackground(): JSX.Element | null {
        return null;
    }

    beforeRenderPicking() {
    }

    afterRenderPicking() {
    }

    renderAndPick(mousePos: {x: number, y: number}) {
        this.beforeRenderPicking();
        const { x, y } = mousePos;

        this.pickingCamera.matrixWorld.copy(this.camera.matrixWorld);
        this.renderer.setRenderTarget(this.pickingTexture);
        // this.renderer.render(this.pickingScene, this.pickingCamera);
        this.renderer.render(this.scene, this.camera);
        var pixelBuffer = new Uint8Array(4);
        this.renderer.readRenderTargetPixels(this.pickingTexture, x, this.pickingTexture.height - y, 1, 1, pixelBuffer);
        var id = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | (pixelBuffer[2]);
        this.afterRenderPicking();
        return id;
    }

    resizeWindow() {
        const { width, height, limitedWidth } = this.props;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.pickingTexture = new THREE.WebGLRenderTarget(width, height);
    }


    render = () => {
        const { width, height, limitedWidth } = this.props;
        const { annotationLayerTransform } = this.state;
        const layerStyle = {
            width,
            height,
            position: 'absolute' as "absolute",
            top: 0,
            left: 0,
        };

        const backgroundLayerStyle = {
            ...layerStyle,
        };

        const annotationLayerStyle = {
            ...layerStyle,
            zIndex: 8,
        }

        const annotationLayerTransformStyle = {
            // transform: annotationLayerTransform,
            width: '100%',
            height: '100%',
            zIndex: 9,
        }

        const mainContainerStyle = {
            width,
            height,
            position: 'relative' as any,
            pointerEvents: 'all', // to make mouse enter/leave work
            overflowX: 'hidden',
            overflowY: 'hidden',
        } as any;

        return (
            <div style={mainContainerStyle} ref={this.containerRef}>
                {/* background */}
                <div style={backgroundLayerStyle} ref={this.backgroundLayerRef} >
                    <div style={annotationLayerTransformStyle}>
                        {/* <canvas ref={this.backgroundCanvasRef} width={width} height={height}></canvas> */}
                        {this.renderBackground()}
                    </div>
                </div>

                <div style={layerStyle} >
                    <canvas ref={this.canvasRef} width={width} height={height}>
                    </canvas>
                </div>


                {/* annotation layer */}
                <div style={layerStyle} ref={this.untransformedAnnotationLayerRef} >
                    <div style={{width: '100%', height: '100%', position: 'relative'}}>
                        {this.renderUntransformedAnnotation()}
                    </div>
                </div>

                {/* annotation layer */}
                <div style={annotationLayerStyle} ref={this.annotationLayerRef} >
                    <div style={annotationLayerTransformStyle}>
                        {/* <canvas ref={this.annotationCanvasRef} width={width} height={height}></canvas> */}
                        {this.renderAnnotation()}
                    </div>
                </div>

                {limitedWidth ? null : <FadeGradient destinationColor={color.background} position='absolute' orientation='bottom' bottom='0' left='0' />}

            </div>
        )
    }
}
