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
in float pointOpacity;
in vec3 pointColor;
varying vec3 vNormal;

// picking
uniform float picking;
varying vec3 vidcolor;

// #ifndef FLAT_SHADED

// 	varying vec3 vNormal;

// #endif

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

	// gl_FragColor = vec4( outgoingLight, diffuseColor.a );
	// gl_FragColor = vec4( 1., 1., 1., 1. );
	float l = 0.7 + 0.3 * clamp(dot(vNormal, vec3(1.,1.,1.)), 0., 1.);

	if (picking > 0.) {
		// color picking
		gl_FragColor = vec4(vidcolor, 1.0);
	} else {
		gl_FragColor = vec4( vec3(pointColor) * outgoingLight * l, pointOpacity ); //YYY
	}

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

`

#define FLAT_SHADED;
uniform vec3 diffuse;
uniform float opacity;
in float pointOpacity;
in vec3 pointColor;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif

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

/* dithering_pars_fragment */ 

#ifdef DITHERING

	// based on https://www.shadertoy.com/view/MslGR8
	vec3 dithering( vec3 color ) {
		//Calculate grid position
		float grid_position = rand( gl_FragCoord.xy );

		//Shift the individual colors differently, thus making it even harder to see the dithering pattern
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );

		//modify shift acording to grid position.
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );

		//shift the color by dither_shift
		return color + dither_shift_RGB;
	}

#endif

/* color_pars_fragment */ 

#if defined( USE_COLOR_ALPHA )

	varying vec4 vColor;

#elif defined( USE_COLOR )

	varying vec3 vColor;

#endif

/* uv_pars_fragment */ 

#if ( defined( USE_UV ) && ! defined( UVS_VERTEX_ONLY ) )

	varying vec2 vUv;

#endif

/* uv2_pars_fragment */ 

#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )

	varying vec2 vUv2;

#endif

/* map_pars_fragment */ 

#ifdef USE_MAP

	uniform sampler2D map;

#endif

/* alphamap_pars_fragment */ 

#ifdef USE_ALPHAMAP

	uniform sampler2D alphaMap;

#endif

/* aomap_pars_fragment */ 

#ifdef USE_AOMAP

	uniform sampler2D aoMap;
	uniform float aoMapIntensity;

#endif

/* lightmap_pars_fragment */ 

#ifdef USE_LIGHTMAP

	uniform sampler2D lightMap;
	uniform float lightMapIntensity;

#endif

/* envmap_common_pars_fragment */ 

#ifdef USE_ENVMAP

	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform int maxMipLevel;

	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif

/* envmap_pars_fragment */ 

#ifdef USE_ENVMAP

	uniform float reflectivity;

	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG )

		#define ENV_WORLDPOS

	#endif

	#ifdef ENV_WORLDPOS

		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif

#endif

/* cube_uv_reflection_fragment */ 

#ifdef ENVMAP_TYPE_CUBE_UV

	#define cubeUV_maxMipLevel 8.0
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_maxTileSize 256.0
	#define cubeUV_minTileSize 16.0

	// These shader functions convert between the UV coordinates of a single face of
	// a cubemap, the 0-5 integer index of a cube face, and the direction vector for
	// sampling a textureCube (not generally normalized ).

	float getFace( vec3 direction ) {

		vec3 absDirection = abs( direction );

		float face = - 1.0;

		if ( absDirection.x > absDirection.z ) {

			if ( absDirection.x > absDirection.y )

				face = direction.x > 0.0 ? 0.0 : 3.0;

			else

				face = direction.y > 0.0 ? 1.0 : 4.0;

		} else {

			if ( absDirection.z > absDirection.y )

				face = direction.z > 0.0 ? 2.0 : 5.0;

			else

				face = direction.y > 0.0 ? 1.0 : 4.0;

		}

		return face;

	}

	// RH coordinate system; PMREM face-indexing convention
	vec2 getUV( vec3 direction, float face ) {

		vec2 uv;

		if ( face == 0.0 ) {

			uv = vec2( direction.z, direction.y ) / abs( direction.x ); // pos x

		} else if ( face == 1.0 ) {

			uv = vec2( - direction.x, - direction.z ) / abs( direction.y ); // pos y

		} else if ( face == 2.0 ) {

			uv = vec2( - direction.x, direction.y ) / abs( direction.z ); // pos z

		} else if ( face == 3.0 ) {

			uv = vec2( - direction.z, direction.y ) / abs( direction.x ); // neg x

		} else if ( face == 4.0 ) {

			uv = vec2( - direction.x, direction.z ) / abs( direction.y ); // neg y

		} else {

			uv = vec2( direction.x, direction.y ) / abs( direction.z ); // neg z

		}

		return 0.5 * ( uv + 1.0 );

	}

	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {

		float face = getFace( direction );

		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );

		mipInt = max( mipInt, cubeUV_minMipLevel );

		float faceSize = exp2( mipInt );

		float texelSize = 1.0 / ( 3.0 * cubeUV_maxTileSize );

		vec2 uv = getUV( direction, face ) * ( faceSize - 1.0 );

		vec2 f = fract( uv );

		uv += 0.5 - f;

		if ( face > 2.0 ) {

			uv.y += faceSize;

			face -= 3.0;

		}

		uv.x += face * faceSize;

		if ( mipInt < cubeUV_maxMipLevel ) {

			uv.y += 2.0 * cubeUV_maxTileSize;

		}

		uv.y += filterInt * 2.0 * cubeUV_minTileSize;

		uv.x += 3.0 * max( 0.0, cubeUV_maxTileSize - 2.0 * faceSize );

		uv *= texelSize;

		vec3 tl = envMapTexelToLinear( texture2D( envMap, uv ) ).rgb;

		uv.x += texelSize;

		vec3 tr = envMapTexelToLinear( texture2D( envMap, uv ) ).rgb;

		uv.y += texelSize;

		vec3 br = envMapTexelToLinear( texture2D( envMap, uv ) ).rgb;

		uv.x -= texelSize;

		vec3 bl = envMapTexelToLinear( texture2D( envMap, uv ) ).rgb;

		vec3 tm = mix( tl, tr, f.x );

		vec3 bm = mix( bl, br, f.x );

		return mix( tm, bm, f.y );

	}

	// These defines must match with PMREMGenerator

	#define r0 1.0
	#define v0 0.339
	#define m0 - 2.0
	#define r1 0.8
	#define v1 0.276
	#define m1 - 1.0
	#define r4 0.4
	#define v4 0.046
	#define m4 2.0
	#define r5 0.305
	#define v5 0.016
	#define m5 3.0
	#define r6 0.21
	#define v6 0.0038
	#define m6 4.0

	float roughnessToMip( float roughness ) {

		float mip = 0.0;

		if ( roughness >= r1 ) {

			mip = ( r0 - roughness ) * ( m1 - m0 ) / ( r0 - r1 ) + m0;

		} else if ( roughness >= r4 ) {

			mip = ( r1 - roughness ) * ( m4 - m1 ) / ( r1 - r4 ) + m1;

		} else if ( roughness >= r5 ) {

			mip = ( r4 - roughness ) * ( m5 - m4 ) / ( r4 - r5 ) + m4;

		} else if ( roughness >= r6 ) {

			mip = ( r5 - roughness ) * ( m6 - m5 ) / ( r5 - r6 ) + m5;

		} else {

			mip = - 2.0 * log2( 1.16 * roughness ); // 1.16 = 1.79^0.25
		}

		return mip;

	}

	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {

		float mip = clamp( roughnessToMip( roughness ), m0, cubeUV_maxMipLevel );

		float mipF = fract( mip );

		float mipInt = floor( mip );

		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );

		if ( mipF == 0.0 ) {

			return vec4( color0, 1.0 );

		} else {

			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );

			return vec4( mix( color0, color1, mipF ), 1.0 );

		}

	}

#endif

/* fog_pars_fragment */ 

#ifdef USE_FOG

	uniform vec3 fogColor;
	varying float fogDepth;

	#ifdef FOG_EXP2

		uniform float fogDensity;

	#else

		uniform float fogNear;
		uniform float fogFar;

	#endif

#endif

/* specularmap_pars_fragment */ 

#ifdef USE_SPECULARMAP

	uniform sampler2D specularMap;

#endif

/* logdepthbuf_pars_fragment */ 

#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )

	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;

#endif

/* clipping_planes_pars_fragment */ 

#if NUM_CLIPPING_PLANES > 0

	varying vec3 vClipPosition;

	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];

#endif


void main() {

	/* clipping_planes_fragment */ 
	
#if NUM_CLIPPING_PLANES > 0

	vec4 plane;

	#pragma unroll_loop_start
	for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {

		plane = clippingPlanes[ i ];
		if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;

	}
	#pragma unroll_loop_end

	#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES

		bool clipped = true;

		#pragma unroll_loop_start
		for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {

			plane = clippingPlanes[ i ];
			clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;

		}
		#pragma unroll_loop_end

		if ( clipped ) discard;

	#endif

#endif


	vec4 diffuseColor = vec4( diffuse, opacity );

	/* logdepthbuf_fragment */ 
	
#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )

	// Doing a strict comparison with == 1.0 can cause noise artifacts
	// on some platforms. See issue #17623.
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;

#endif

	/* map_fragment */ 
	
#ifdef USE_MAP

	vec4 texelColor = texture2D( map, vUv );

	texelColor = mapTexelToLinear( texelColor );
	diffuseColor *= texelColor;

#endif

	/* color_fragment */ 
	
#if defined( USE_COLOR_ALPHA )

	diffuseColor *= vColor;

#elif defined( USE_COLOR )

	diffuseColor.rgb *= vColor;

#endif

	/* alphamap_fragment */ 
	
#ifdef USE_ALPHAMAP

	diffuseColor.a *= texture2D( alphaMap, vUv ).g;

#endif

	/* alphatest_fragment */ 
	
#ifdef ALPHATEST

	if ( diffuseColor.a < ALPHATEST ) discard;

#endif

	/* specularmap_fragment */ 
	
float specularStrength;

#ifdef USE_SPECULARMAP

	vec4 texelSpecular = texture2D( specularMap, vUv );
	specularStrength = texelSpecular.r;

#else

	specularStrength = 1.0;

#endif


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
	
#ifdef USE_AOMAP

	// reads channel R, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
	float ambientOcclusion = ( texture2D( aoMap, vUv2 ).r - 1.0 ) * aoMapIntensity + 1.0;

	reflectedLight.indirectDiffuse *= ambientOcclusion;

	#if defined( USE_ENVMAP ) && defined( STANDARD )

		float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );

		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.specularRoughness );

	#endif

#endif


	reflectedLight.indirectDiffuse *= diffuseColor.rgb;

	vec3 outgoingLight = reflectedLight.indirectDiffuse;

	/* envmap_fragment */ 
	
#ifdef USE_ENVMAP

	#ifdef ENV_WORLDPOS

		vec3 cameraToFrag;

		if ( isOrthographic ) {

			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );

		} else {

			cameraToFrag = normalize( vWorldPosition - cameraPosition );

		}

		// Transforming Normal Vectors with the Inverse Transformation
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );

		#ifdef ENVMAP_MODE_REFLECTION

			vec3 reflectVec = reflect( cameraToFrag, worldNormal );

		#else

			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );

		#endif

	#else

		vec3 reflectVec = vReflect;

	#endif

	#ifdef ENVMAP_TYPE_CUBE

		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );

	#elif defined( ENVMAP_TYPE_CUBE_UV )

		vec4 envColor = textureCubeUV( envMap, reflectVec, 0.0 );

	#else

		vec4 envColor = vec4( 0.0 );

	#endif

	#ifndef ENVMAP_TYPE_CUBE_UV

		envColor = envMapTexelToLinear( envColor );

	#endif

	#ifdef ENVMAP_BLENDING_MULTIPLY

		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );

	#elif defined( ENVMAP_BLENDING_MIX )

		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );

	#elif defined( ENVMAP_BLENDING_ADD )

		outgoingLight += envColor.xyz * specularStrength * reflectivity;

	#endif

#endif


	// gl_FragColor = vec4( outgoingLight, diffuseColor.a );
	// gl_FragColor = vec4( 1., 1., 1., 1. );
	gl_FragColor = vec4( vec3(pointColor) * outgoingLight * dot(vNormal, vec3(1.,1.,0)), pointOpacity );

	/* tonemapping_fragment */ 
	
#if defined( TONE_MAPPING )

	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );

#endif

	/* encodings_fragment */ 
	
gl_FragColor = linearToOutputTexel( gl_FragColor );

	/* fog_fragment */ 
	
#ifdef USE_FOG

	#ifdef FOG_EXP2

		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * fogDepth * fogDepth );

	#else

		float fogFactor = smoothstep( fogNear, fogFar, fogDepth );

	#endif

	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );

#endif

	/* premultiplied_alpha_fragment */ 
	
#ifdef PREMULTIPLIED_ALPHA

	// Get get normal blending with premultipled, use with CustomBlending, OneFactor, OneMinusSrcAlphaFactor, AddEquation.
	gl_FragColor.rgb *= gl_FragColor.a;

#endif

	/* dithering_fragment */ 
	
#ifdef DITHERING

	gl_FragColor.rgb = dithering( gl_FragColor.rgb );

#endif


}

`