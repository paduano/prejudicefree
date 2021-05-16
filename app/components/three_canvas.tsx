import * as THREE from 'three';
import React from 'react';
import dynamic from "next/dynamic";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';

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

}

export interface ThreeCanvasState {
    annotationLayerTransform: string;

}

const importDatGui = async () => {
    const GUI = await import('dat.gui');
    return GUI
};

export class ThreeCanvas<T> extends React.Component<ThreeCanvasProps & T, ThreeCanvasState> {
    canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef<HTMLCanvasElement>();
    annotationLayerRef: React.RefObject<HTMLDivElement> = React.createRef<HTMLDivElement>();
    annotationCanvasRef: React.RefObject<HTMLCanvasElement> = React.createRef<HTMLCanvasElement>();
    backgroundLayerRef: React.RefObject<HTMLDivElement> = React.createRef<HTMLDivElement>();
    // backgroundCanvasRef: React.RefObject<HTMLCanvasElement> = React.createRef<HTMLCanvasElement>();
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.WebGLRenderer;
    composer: EffectComposer;
    clock: THREE.Clock;
    gui: any;
    backgroundColor = '#000000';
    mouse: THREE.Vector2;


    constructor(props: ThreeCanvasProps) {
        super(props as any);
        this.state = {
            annotationLayerTransform: '',
        }
    }

    componentDidMount() {
        // init three.js
        this.initThreeScene();
        this.renderLoop();

        this.annotate();

        this.annotationLayerRef.current.onmousemove = this.onMouseMove;
        this.annotationLayerRef.current.onmouseenter = this.onMouseEnter;
        // this.canvasRef.current.addEventListener('mousemove', this.onMouseMove);
    }

    initThreeScene() {
        const { width, height } = this.props;
        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        // this.scene.background = new THREE.Color(0x000000);
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
                this.setUpGui(module.GUI)
                // }
            });
        }
    }

    setUpGui(GUI: any) {

    }

    sceneReady() {

    }

    onMouseEnter = (evt: MouseEvent) => {
    }

    onMouseMove(event) {
        event.preventDefault();
        this.mouse.x = (event.clientX / this.props.width) * 2 - 1;
        this.mouse.y = - (event.clientY / this.props.height) * 2 + 1;
    }


    annotate() {
        const { width, height } = this.props;
        const ctx = this.annotationCanvasRef.current.getContext("2d");
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
            this.renderer.render(this.scene, this.camera);
        }

        requestAnimationFrame(this.renderLoop);
    };

    tick = (dt: number, time: number) => {

    }

    renderAnnotation(): JSX.Element | null {
        return null;
    }

    renderBackground(): JSX.Element | null {
        return null;
    }


    render = () => {
        const { width, height } = this.props;
        const { annotationLayerTransform } = this.state;
        const annotationLayerStyle = {
            width,
            height,
            position: 'absolute' as "absolute",
            top: 0,
            left: 0,
        };

        const backgroundLayerStyle = {
            ...annotationLayerStyle,
            backgroundColor: this.backgroundColor,
        };

        const annotationLayerTransformStyle = {
            transform: annotationLayerTransform,
            width: '100%',
            height: '100%',
        }

        const mainContainerStyle = {
            width,
            height,
        }

        return (
            <div style={mainContainerStyle}>
                {/* background */}
                <div style={backgroundLayerStyle} ref={this.backgroundLayerRef} >
                    <div style={annotationLayerTransformStyle}>
                        {/* <canvas ref={this.backgroundCanvasRef} width={width} height={height}></canvas> */}
                        {this.renderBackground()}
                    </div>
                </div>

                <div style={annotationLayerStyle} >
                    <canvas ref={this.canvasRef} width={width} height={height}>
                    </canvas>
                </div>

                {/* annotation layer */}
                <div style={annotationLayerStyle} ref={this.annotationLayerRef} >
                    <div style={annotationLayerTransformStyle}>
                        <canvas ref={this.annotationCanvasRef} width={width} height={height}></canvas>
                        {this.renderAnnotation()}
                    </div>
                </div>

            </div>
        )
    }
}
