import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";

export let threeAssets: {
    man: THREE.Group
} = {} as any;

const loader = new OBJLoader();
function OBJLoaderPromise(url: string): Promise<THREE.Group> {
    return new Promise(resolve => {
        loader.load(url, (object) => {
            resolve(object);
        });
    })
}

export async function LoadResources() {
    threeAssets = {
        // man: await OBJLoaderPromise('/man2_55.obj')
        man: await OBJLoaderPromise('/man-pose02.obj')
    };
}