import common from 'three/src/renderers/shaders/ShaderChunk/common.glsl';
import dithering_pars_fragment from 'three/src/renderers/shaders/ShaderChunk/dithering_pars_fragment.glsl';
import color_pars_fragment from 'three/src/renderers/shaders/ShaderChunk/color_pars_fragment.glsl';
import uv_pars_fragment from 'three/src/renderers/shaders/ShaderChunk/uv_pars_fragment.glsl';
import uv2_pars_fragment from 'three/src/renderers/shaders/ShaderChunk/uv2_pars_fragment.glsl';
import map_pars_fragment from 'three/src/renderers/shaders/ShaderChunk/map_pars_fragment.glsl';
import alphamap_pars_fragment from 'three/src/renderers/shaders/ShaderChunk/alphamap_pars_fragment.glsl';
import aomap_pars_fragment from 'three/src/renderers/shaders/ShaderChunk/aomap_pars_fragment.glsl';
import lightmap_pars_fragment from 'three/src/renderers/shaders/ShaderChunk/lightmap_pars_fragment.glsl';
import envmap_common_pars_fragment from 'three/src/renderers/shaders/ShaderChunk/envmap_common_pars_fragment.glsl';
import envmap_pars_fragment from 'three/src/renderers/shaders/ShaderChunk/envmap_pars_fragment.glsl';
import cube_uv_reflection_fragment from 'three/src/renderers/shaders/ShaderChunk/cube_uv_reflection_fragment.glsl';
import fog_pars_fragment from 'three/src/renderers/shaders/ShaderChunk/fog_pars_fragment.glsl';
import specularmap_pars_fragment from 'three/src/renderers/shaders/ShaderChunk/specularmap_pars_fragment.glsl';
import logdepthbuf_pars_fragment from 'three/src/renderers/shaders/ShaderChunk/logdepthbuf_pars_fragment.glsl';
import clipping_planes_pars_fragment from 'three/src/renderers/shaders/ShaderChunk/clipping_planes_pars_fragment.glsl';
import clipping_planes_fragment from 'three/src/renderers/shaders/ShaderChunk/clipping_planes_fragment.glsl';
import logdepthbuf_fragment from 'three/src/renderers/shaders/ShaderChunk/logdepthbuf_fragment.glsl';
import map_fragment from 'three/src/renderers/shaders/ShaderChunk/map_fragment.glsl';
import color_fragment from 'three/src/renderers/shaders/ShaderChunk/color_fragment.glsl';
import alphamap_fragment from 'three/src/renderers/shaders/ShaderChunk/alphamap_fragment.glsl';
import alphatest_fragment from 'three/src/renderers/shaders/ShaderChunk/alphatest_fragment.glsl';
import specularmap_fragment from 'three/src/renderers/shaders/ShaderChunk/specularmap_fragment.glsl';
import aomap_fragment from 'three/src/renderers/shaders/ShaderChunk/aomap_fragment.glsl';
import envmap_fragment from 'three/src/renderers/shaders/ShaderChunk/envmap_fragment.glsl';
import tonemapping_fragment from 'three/src/renderers/shaders/ShaderChunk/tonemapping_fragment.glsl';
import encodings_fragment from 'three/src/renderers/shaders/ShaderChunk/encodings_fragment.glsl';
import fog_fragment from 'three/src/renderers/shaders/ShaderChunk/fog_fragment.glsl';
import premultiplied_alpha_fragment from 'three/src/renderers/shaders/ShaderChunk/premultiplied_alpha_fragment.glsl';
import dithering_fragment from 'three/src/renderers/shaders/ShaderChunk/dithering_fragment.glsl';

const shader = /* glsl */`
uniform vec3 diffuse;
uniform float opacity;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif

/* common */ 
${common}
/* dithering_pars_fragment */ 
${dithering_pars_fragment}
/* color_pars_fragment */ 
${color_pars_fragment}
/* uv_pars_fragment */ 
${uv_pars_fragment}
/* uv2_pars_fragment */ 
${uv2_pars_fragment}
/* map_pars_fragment */ 
${map_pars_fragment}
/* alphamap_pars_fragment */ 
${alphamap_pars_fragment}
/* aomap_pars_fragment */ 
${aomap_pars_fragment}
/* lightmap_pars_fragment */ 
${lightmap_pars_fragment}
/* envmap_common_pars_fragment */ 
${envmap_common_pars_fragment}
/* envmap_pars_fragment */ 
${envmap_pars_fragment}
/* cube_uv_reflection_fragment */ 
${cube_uv_reflection_fragment}
/* fog_pars_fragment */ 
${fog_pars_fragment}
/* specularmap_pars_fragment */ 
${specularmap_pars_fragment}
/* logdepthbuf_pars_fragment */ 
${logdepthbuf_pars_fragment}
/* clipping_planes_pars_fragment */ 
${clipping_planes_pars_fragment}

void main() {

	/* clipping_planes_fragment */ 
${clipping_planes_fragment}

	vec4 diffuseColor = vec4( diffuse, opacity );

	/* logdepthbuf_fragment */ 
${logdepthbuf_fragment}
	/* map_fragment */ 
${map_fragment}
	/* color_fragment */ 
${color_fragment}
	/* alphamap_fragment */ 
${alphamap_fragment}
	/* alphatest_fragment */ 
${alphatest_fragment}
	/* specularmap_fragment */ 
${specularmap_fragment}

	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );

	// accumulation (baked indirect lighting only)
	#ifdef USE_LIGHTMAP
	
		vec4 lightMapTexel= texture2D( lightMap, vUv2 );
		reflectedLight.indirectDiffuse += lightMapTexelToLinear( lightMapTexel ).rgb * lightMapIntensity;

	#else

		reflectedLight.indirectDiffuse += vec3( 1.0 );

	#endif

	// modulation
	/* aomap_fragment */ 
${aomap_fragment}

	reflectedLight.indirectDiffuse *= diffuseColor.rgb;

	vec3 outgoingLight = reflectedLight.indirectDiffuse;

	/* envmap_fragment */ 
${envmap_fragment}

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );

	/* tonemapping_fragment */ 
${tonemapping_fragment}
	/* encodings_fragment */ 
${encodings_fragment}
	/* fog_fragment */ 
${fog_fragment}
	/* premultiplied_alpha_fragment */ 
${premultiplied_alpha_fragment}
	/* dithering_fragment */ 
${dithering_fragment}

}
`;
export default shader;