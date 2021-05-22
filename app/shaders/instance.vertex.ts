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
#define ACCENT_COLOR vec3(1., 0.768, 0.098) 

// how far away you push the people around you
#define YOURSELF_DISTANCE 0.15 
// affect people whithin this radius
#define YOURSELF_R 0.2

//
attribute vec3 position1;
attribute vec3 position2;
attribute float vertexOpacity;
attribute float vertexOpacity2;
attribute vec3 color;
uniform float instanceCount;
uniform float morph;
uniform float picking;
uniform vec3 yourselfPosition;

// selection
attribute float index; // can I use instance ID here
uniform float selectedIndex;

// picking
attribute vec3 idcolor;
varying vec3 vidcolor;

varying float pointOpacity;
varying vec3 pointColor;
varying vec3 vNormal;
//

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

float easeOutCubic(float x, float delay) {
	return pow(x, 1. + delay * 1.);
}

void main() {

	/* uv_vertex */ 
	${uv_vertex}
	/* uv2_vertex */ 
	${uv2_vertex}
	/* color_vertex */ 
	${color_vertex}
	/* skinbase_vertex */ 
	${skinbase_vertex}

	// #ifdef USE_ENVMAP

	/* beginnormal_vertex */ 
	${beginnormal_vertex}
	/* morphnormal_vertex */ 
	${morphnormal_vertex}
	/* skinnormal_vertex */ 
	${skinnormal_vertex}
	/* defaultnormal_vertex */ 
	${defaultnormal_vertex}

	// #endif

	/* begin_vertex */ 
	${begin_vertex}
	/* morphtarget_vertex */ 
	${morphtarget_vertex}

	// TRANSLATE
	// -----------
	// float index_variance = clamp(1. - (float(gl_InstanceID) / instanceCount), 0., 1.);
	float index_variance = clamp(1. - (float(index) / instanceCount), 0., 1.);
	float transformed_morph = easeOutCubic(morph, index_variance);
	vec3 translate_pos = mix(position1, position2, transformed_morph);

	vec3 youDir = translate_pos - yourselfPosition;
	vec3 yourselfDispacement = normalize(youDir) * YOURSELF_DISTANCE * (1. - smoothstep(length(youDir), 0., YOURSELF_R));
	translate_pos += vec3(yourselfDispacement.xy, 0); 

	// translate to instance position
	transformed += translate_pos; 

	pointColor = color;
	pointOpacity = mix(vertexOpacity, vertexOpacity2, transformed_morph);;
	vNormal = transformedNormal;

	vidcolor = idcolor;

	// SCALE
	// ------------
	// selected item
	// I can probably optimize this code and avoid an IF, but is it worth it?
	float selectScale = 0.;
	if (index == selectedIndex) {
		pointColor = ACCENT_COLOR;
		selectScale = 0.7;
	}
	// scale if picking to make selection easier
	vec3 scaling = (transformed - translate_pos) * 2. * max(picking, selectScale);
	transformed += scaling;

	//

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

`

/* common */ 

#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6

#ifndef saturate
// <tonemapping_pars_fragment> may have defined saturate() already
#define saturate(a) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement(a) ( 1.0 - saturate( a ) )

float pow2( const in float x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float average( const in vec3 color ) { return dot( color, vec3( 0.3333 ) ); }
// expects values in the range of [0,1]x[0,1], returns values in the [0,1] range.
// do not collapse into a single function per: http://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0/
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract(sin(sn) * c);
}

#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float max3( vec3 v ) { return max( max( v.x, v.y ), v.z ); }
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif

struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};

struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};

struct GeometricContext {
	vec3 position;
	vec3 normal;
	vec3 viewDir;
#ifdef CLEARCOAT
	vec3 clearcoatNormal;
#endif
};

vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

}

vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {

	// dir can be either a direction vector or a normal vector
	// upper-left 3x3 of matrix is assumed to be orthogonal

	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );

}

vec3 projectOnPlane(in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal ) {

	float distance = dot( planeNormal, point - pointOnPlane );

	return - distance * planeNormal + point;

}

float sideOfPlane( in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal ) {

	return sign( dot( point - pointOnPlane, planeNormal ) );

}

vec3 linePlaneIntersect( in vec3 pointOnLine, in vec3 lineDirection, in vec3 pointOnPlane, in vec3 planeNormal ) {

	return lineDirection * ( dot( planeNormal, pointOnPlane - pointOnLine ) / dot( planeNormal, lineDirection ) ) + pointOnLine;

}

mat3 transposeMat3( const in mat3 m ) {

	mat3 tmp;

	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );

	return tmp;

}

// https://en.wikipedia.org/wiki/Relative_luminance
float linearToRelativeLuminance( const in vec3 color ) {

	vec3 weights = vec3( 0.2126, 0.7152, 0.0722 );

	return dot( weights, color.rgb );

}

bool isPerspectiveMatrix( mat4 m ) {

	return m[ 2 ][ 3 ] == - 1.0;

}

vec2 equirectUv( in vec3 dir ) {

	// dir is assumed to be unit length

	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;

	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;

	return vec2( u, v );

}

/* uv_pars_vertex */ 

#ifdef USE_UV

	#ifdef UVS_VERTEX_ONLY

		vec2 vUv;

	#else

		varying vec2 vUv;

	#endif

	uniform mat3 uvTransform;

#endif

/* uv2_pars_vertex */ 

#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )

	attribute vec2 uv2;
	varying vec2 vUv2;

	uniform mat3 uv2Transform;

#endif

/* envmap_pars_vertex */ 

#ifdef USE_ENVMAP

	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) ||defined( PHONG )

		#define ENV_WORLDPOS

	#endif

	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;

	#else

		varying vec3 vReflect;
		uniform float refractionRatio;

	#endif

#endif

/* color_pars_vertex */ 

#if defined( USE_COLOR_ALPHA )

	varying vec4 vColor;

#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )

	varying vec3 vColor;

#endif

/* fog_pars_vertex */ 

#ifdef USE_FOG

	varying float fogDepth;

#endif

/* morphtarget_pars_vertex */ 

#ifdef USE_MORPHTARGETS

	uniform float morphTargetBaseInfluence;

	#ifndef USE_MORPHNORMALS

		uniform float morphTargetInfluences[ 8 ];

	#else

		uniform float morphTargetInfluences[ 4 ];

	#endif

#endif

/* skinning_pars_vertex */ 

#ifdef USE_SKINNING

	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;

	#ifdef BONE_TEXTURE

		uniform highp sampler2D boneTexture;
		uniform int boneTextureSize;

		mat4 getBoneMatrix( const in float i ) {

			float j = i * 4.0;
			float x = mod( j, float( boneTextureSize ) );
			float y = floor( j / float( boneTextureSize ) );

			float dx = 1.0 / float( boneTextureSize );
			float dy = 1.0 / float( boneTextureSize );

			y = dy * ( y + 0.5 );

			vec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );
			vec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );
			vec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );
			vec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );

			mat4 bone = mat4( v1, v2, v3, v4 );

			return bone;

		}

	#else

		uniform mat4 boneMatrices[ MAX_BONES ];

		mat4 getBoneMatrix( const in float i ) {

			mat4 bone = boneMatrices[ int(i) ];
			return bone;

		}

	#endif

#endif

/* logdepthbuf_pars_vertex */ 

#ifdef USE_LOGDEPTHBUF

	#ifdef USE_LOGDEPTHBUF_EXT

		varying float vFragDepth;
		varying float vIsPerspective;

	#else

		uniform float logDepthBufFC;

	#endif

#endif

/* clipping_planes_pars_vertex */ 

#if NUM_CLIPPING_PLANES > 0

	varying vec3 vClipPosition;

#endif


void main() {

	/* uv_vertex */ 
	
#ifdef USE_UV

	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;

#endif

	/* uv2_vertex */ 
	
#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )

	vUv2 = ( uv2Transform * vec3( uv2, 1 ) ).xy;

#endif

	/* color_vertex */ 
	
#if defined( USE_COLOR_ALPHA )

	vColor = vec4( 1.0 );

#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )

	vColor = vec3( 1.0 );

#endif

#ifdef USE_COLOR

	vColor *= color;

#endif

#ifdef USE_INSTANCING_COLOR

	vColor.xyz *= instanceColor.xyz;

#endif

	/* skinbase_vertex */ 
	
#ifdef USE_SKINNING

	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );

#endif


	#ifdef USE_ENVMAP

	/* beginnormal_vertex */ 
	
vec3 objectNormal = vec3( normal );

#ifdef USE_TANGENT

	vec3 objectTangent = vec3( tangent.xyz );

#endif

	/* morphnormal_vertex */ 
	
#ifdef USE_MORPHNORMALS

	// morphTargetBaseInfluence is set based on BufferGeometry.morphTargetsRelative value:
	// When morphTargetsRelative is false, this is set to 1 - sum(influences); this results in normal = sum((target - base) * influence)
	// When morphTargetsRelative is true, this is set to 1; as a result, all morph targets are simply added to the base after weighting
	objectNormal *= morphTargetBaseInfluence;
	objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
	objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
	objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
	objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];

#endif

	/* skinnormal_vertex */ 
	
#ifdef USE_SKINNING

	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;

	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;

	#ifdef USE_TANGENT

		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;

	#endif

#endif

	/* defaultnormal_vertex */ 
	
vec3 transformedNormal = objectNormal;

#ifdef USE_INSTANCING

	// this is in lieu of a per-instance normal-matrix
	// shear transforms in the instance matrix are not supported

	mat3 m = mat3( instanceMatrix );

	transformedNormal /= vec3( dot( m[ 0 ], m[ 0 ] ), dot( m[ 1 ], m[ 1 ] ), dot( m[ 2 ], m[ 2 ] ) );

	transformedNormal = m * transformedNormal;

#endif

transformedNormal = normalMatrix * transformedNormal;

#ifdef FLIP_SIDED

	transformedNormal = - transformedNormal;

#endif

#ifdef USE_TANGENT

	vec3 transformedTangent = ( modelViewMatrix * vec4( objectTangent, 0.0 ) ).xyz;

	#ifdef FLIP_SIDED

		transformedTangent = - transformedTangent;

	#endif

#endif


	#endif

	/* begin_vertex */ 
	
vec3 transformed = vec3( position );

	/* morphtarget_vertex */ 
	
#ifdef USE_MORPHTARGETS

	// morphTargetBaseInfluence is set based on BufferGeometry.morphTargetsRelative value:
	// When morphTargetsRelative is false, this is set to 1 - sum(influences); this results in position = sum((target - base) * influence)
	// When morphTargetsRelative is true, this is set to 1; as a result, all morph targets are simply added to the base after weighting
	transformed *= morphTargetBaseInfluence;
	transformed += morphTarget0 * morphTargetInfluences[ 0 ];
	transformed += morphTarget1 * morphTargetInfluences[ 1 ];
	transformed += morphTarget2 * morphTargetInfluences[ 2 ];
	transformed += morphTarget3 * morphTargetInfluences[ 3 ];

	#ifndef USE_MORPHNORMALS

		transformed += morphTarget4 * morphTargetInfluences[ 4 ];
		transformed += morphTarget5 * morphTargetInfluences[ 5 ];
		transformed += morphTarget6 * morphTargetInfluences[ 6 ];
		transformed += morphTarget7 * morphTargetInfluences[ 7 ];

	#endif

#endif

	/* skinning_vertex */ 
	
#ifdef USE_SKINNING

	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );

	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;

	transformed = ( bindMatrixInverse * skinned ).xyz;

#endif

	/* project_vertex */ 
	
vec4 mvPosition = vec4( transformed, 1.0 );

#ifdef USE_INSTANCING

	mvPosition = instanceMatrix * mvPosition;

#endif

mvPosition = modelViewMatrix * mvPosition;

gl_Position = projectionMatrix * mvPosition;

	/* logdepthbuf_vertex */ 
	
#ifdef USE_LOGDEPTHBUF

	#ifdef USE_LOGDEPTHBUF_EXT

		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );

	#else

		if ( isPerspectiveMatrix( projectionMatrix ) ) {

			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;

			gl_Position.z *= gl_Position.w;

		}

	#endif

#endif


	/* worldpos_vertex */ 
	
#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP )

	vec4 worldPosition = vec4( transformed, 1.0 );

	#ifdef USE_INSTANCING

		worldPosition = instanceMatrix * worldPosition;

	#endif

	worldPosition = modelMatrix * worldPosition;

#endif

	/* clipping_planes_vertex */ 
	
#if NUM_CLIPPING_PLANES > 0

	vClipPosition = - mvPosition.xyz;

#endif

	/* envmap_vertex */ 
	
#ifdef USE_ENVMAP

	#ifdef ENV_WORLDPOS

		vWorldPosition = worldPosition.xyz;

	#else

		vec3 cameraToVertex;

		if ( isOrthographic ) {

			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );

		} else {

			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );

		}

		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );

		#ifdef ENVMAP_MODE_REFLECTION

			vReflect = reflect( cameraToVertex, worldNormal );

		#else

			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );

		#endif

	#endif

#endif

	/* fog_vertex */ 
	
#ifdef USE_FOG

	fogDepth = - mvPosition.z;

#endif


}

`