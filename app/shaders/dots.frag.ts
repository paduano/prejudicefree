import common from 'three/src/renderers/shaders/ShaderChunk/common.glsl'
import color_pars_fragment from 'three/src/renderers/shaders/ShaderChunk/color_pars_fragment.glsl'
import map_particle_pars_fragment from 'three/src/renderers/shaders/ShaderChunk/map_particle_pars_fragment.glsl'
import fog_pars_fragment from 'three/src/renderers/shaders/ShaderChunk/fog_pars_fragment.glsl'
import logdepthbuf_pars_fragment from 'three/src/renderers/shaders/ShaderChunk/logdepthbuf_pars_fragment.glsl'
import clipping_planes_pars_fragment from 'three/src/renderers/shaders/ShaderChunk/clipping_planes_pars_fragment.glsl'
import clipping_planes_fragment from 'three/src/renderers/shaders/ShaderChunk/clipping_planes_fragment.glsl'
import logdepthbuf_fragment from 'three/src/renderers/shaders/ShaderChunk/logdepthbuf_fragment.glsl'
import map_particle_fragment from 'three/src/renderers/shaders/ShaderChunk/map_particle_fragment.glsl'
import color_fragment from 'three/src/renderers/shaders/ShaderChunk/color_fragment.glsl'
import alphatest_fragment from 'three/src/renderers/shaders/ShaderChunk/alphatest_fragment.glsl'
import tonemapping_fragment from 'three/src/renderers/shaders/ShaderChunk/tonemapping_fragment.glsl'
import encodings_fragment from 'three/src/renderers/shaders/ShaderChunk/encodings_fragment.glsl'
import fog_fragment from 'three/src/renderers/shaders/ShaderChunk/fog_fragment.glsl'
import premultiplied_alpha_fragment from 'three/src/renderers/shaders/ShaderChunk/premultiplied_alpha_fragment.glsl'

export default /* glsl */`

uniform vec3 diffuse;
uniform float opacity;
in float pointOpacity;
in vec3 pointColor;

${common}
${color_pars_fragment}
${map_particle_pars_fragment}
${fog_pars_fragment}
${logdepthbuf_pars_fragment}
${clipping_planes_pars_fragment}

void main() {

	${clipping_planes_fragment}

	vec3 outgoingLight = vec3( 0.0 );
	// vec4 diffuseColor = vec4( diffuse, opacity );
	vec4 diffuseColor = vec4( pointColor, opacity );

	${logdepthbuf_fragment}
	${map_particle_fragment}
	${color_fragment}
	${alphatest_fragment}

	outgoingLight = diffuseColor.rgb;

	gl_FragColor = vec4( outgoingLight, pointOpacity );
	// gl_FragColor = vec4( outgoingLight, diffuseColor.a );
    // gl_FragColor = vec4(1.,1.,1.,1.);

	${tonemapping_fragment}
	${encodings_fragment}
	${fog_fragment}
	${premultiplied_alpha_fragment}

}
`;
