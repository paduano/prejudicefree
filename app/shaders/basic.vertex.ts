import common from 'three/src/renderers/shaders/ShaderChunk/common.glsl';
import uv_pars_vertex from 'three/src/renderers/shaders/ShaderChunk/uv_pars_vertex.glsl';
import uv2_pars_vertex from 'three/src/renderers/shaders/ShaderChunk/uv2_pars_vertex.glsl';
import envmap_pars_vertex from 'three/src/renderers/shaders/ShaderChunk/envmap_pars_vertex.glsl';
import color_pars_vertex from 'three/src/renderers/shaders/ShaderChunk/color_pars_vertex.glsl';
import fog_pars_vertex from 'three/src/renderers/shaders/ShaderChunk/fog_pars_vertex.glsl';
import morphtarget_pars_vertex from 'three/src/renderers/shaders/ShaderChunk/morphtarget_pars_vertex.glsl';
import skinning_pars_vertex from 'three/src/renderers/shaders/ShaderChunk/skinning_pars_vertex.glsl';
import logdepthbuf_pars_vertex from 'three/src/renderers/shaders/ShaderChunk/logdepthbuf_pars_vertex.glsl';
import clipping_planes_pars_vertex from 'three/src/renderers/shaders/ShaderChunk/clipping_planes_pars_vertex.glsl';
import uv_vertex from 'three/src/renderers/shaders/ShaderChunk/uv_vertex.glsl';
import uv2_vertex from 'three/src/renderers/shaders/ShaderChunk/uv2_vertex.glsl';
import color_vertex from 'three/src/renderers/shaders/ShaderChunk/color_vertex.glsl';
import skinbase_vertex from 'three/src/renderers/shaders/ShaderChunk/skinbase_vertex.glsl';
import beginnormal_vertex from 'three/src/renderers/shaders/ShaderChunk/beginnormal_vertex.glsl';
import morphnormal_vertex from 'three/src/renderers/shaders/ShaderChunk/morphnormal_vertex.glsl';
import skinnormal_vertex from 'three/src/renderers/shaders/ShaderChunk/skinnormal_vertex.glsl';
import defaultnormal_vertex from 'three/src/renderers/shaders/ShaderChunk/defaultnormal_vertex.glsl';
import begin_vertex from 'three/src/renderers/shaders/ShaderChunk/begin_vertex.glsl';
import morphtarget_vertex from 'three/src/renderers/shaders/ShaderChunk/morphtarget_vertex.glsl';
import skinning_vertex from 'three/src/renderers/shaders/ShaderChunk/skinning_vertex.glsl';
import project_vertex from 'three/src/renderers/shaders/ShaderChunk/project_vertex.glsl';
import logdepthbuf_vertex from 'three/src/renderers/shaders/ShaderChunk/logdepthbuf_vertex.glsl';
import worldpos_vertex from 'three/src/renderers/shaders/ShaderChunk/worldpos_vertex.glsl';
import clipping_planes_vertex from 'three/src/renderers/shaders/ShaderChunk/clipping_planes_vertex.glsl';
import envmap_vertex from 'three/src/renderers/shaders/ShaderChunk/envmap_vertex.glsl';
import fog_vertex from 'three/src/renderers/shaders/ShaderChunk/fog_vertex.glsl';

const shader = /* glsl */`
/* common */ 
${common}
/* uv_pars_vertex */ 
${uv_pars_vertex}
/* uv2_pars_vertex */ 
${uv2_pars_vertex}
/* envmap_pars_vertex */ 
${envmap_pars_vertex}
/* color_pars_vertex */ 
${color_pars_vertex}
/* fog_pars_vertex */ 
${fog_pars_vertex}
/* morphtarget_pars_vertex */ 
${morphtarget_pars_vertex}
/* skinning_pars_vertex */ 
${skinning_pars_vertex}
/* logdepthbuf_pars_vertex */ 
${logdepthbuf_pars_vertex}
/* clipping_planes_pars_vertex */ 
${clipping_planes_pars_vertex}

void main() {

	/* uv_vertex */ 
${uv_vertex}
	/* uv2_vertex */ 
${uv2_vertex}
	/* color_vertex */ 
${color_vertex}
	/* skinbase_vertex */ 
${skinbase_vertex}

	#ifdef USE_ENVMAP

	/* beginnormal_vertex */ 
${beginnormal_vertex}
	/* morphnormal_vertex */ 
${morphnormal_vertex}
	/* skinnormal_vertex */ 
${skinnormal_vertex}
	/* defaultnormal_vertex */ 
${defaultnormal_vertex}

	#endif

	/* begin_vertex */ 
${begin_vertex}
	/* morphtarget_vertex */ 
${morphtarget_vertex}
	/* skinning_vertex */ 
${skinning_vertex}
	/* project_vertex */ 
${project_vertex}
	/* logdepthbuf_vertex */ 
${logdepthbuf_vertex}

	/* worldpos_vertex */ 
${worldpos_vertex}
	/* clipping_planes_vertex */ 
${clipping_planes_vertex}
	/* envmap_vertex */ 
${envmap_vertex}
	/* fog_vertex */ 
${fog_vertex}

}
`;

export default shader;