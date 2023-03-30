#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec3 vVertexPosition;
varying vec2 vTextureCoord;

//uniform sampler2D uRenderTexture;
uniform sampler2D tDiffuse;
uniform sampler2D uImage;
uniform sampler2D BG;

uniform float uTime;
uniform float uOpacity;
uniform vec2 uResolution;
uniform float uHue;
uniform float uSaturation;
uniform vec3 uBgColor;
uniform float uIntensity;

#define PI 3.14159265359

const float lightStrength = 5.0;
const float lightColorEffect = 1.0;
const float shadowStrength = 1.25;
const float shadowColorEffect = 0.4375;

// Holy fuck balls, fresnel!
const float bias = 0.2;
const float scale = 10.0;
const float power = 10.1;


vec3 hueRotate(vec3 col, float hue) {
    vec3 k = vec3(0.57735, 0.57735, 0.57735);
    float cosAngle = cos(hue);
    return col * cosAngle + cross(k, col) * sin(hue) + k * dot(k, col) * (1.0 - cosAngle);
}

vec3 saturate(vec3 rgb, float adjustment) {
    vec3 W = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(rgb, W));
    return mix(intensity, rgb, adjustment);
}



float bumpMap(vec2 uv, float height, inout vec3 colormap) {
    vec3 shade = texture2D(BG, vTextureCoord).rgb;

    return 1.0 - shade.r * height;
}

float bumpMap(vec2 uv, float height) {
    vec3 colormap;
    return bumpMap(uv, height, colormap);
}


vec3 rgb2glsl(vec3 rgb) {
    return vec3(rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0);
}

vec4 rgb2glsl(vec4 rgb) {
    return vec4(rgb2glsl(rgb.rgb), rgb.a);
}


// add bump map, reflections and lightnings to the ripples render target texture
vec4 renderPass(vec2 uv, inout float distortion) {
    vec3 surfacePos = vec3(uv, 0.0);
    vec3 ray = normalize(vec3(uv, 1.0));

    //vec3 lightPos = vec3(2.0, 3.0, -3.0);
    //vec3 lightPos = vec3(1.0, 2.0, -4.0);
    vec3 lightPos = vec3(0.0, 0.0, -4.0);
    vec3 normal = vec3(0.0, 0.0, -1.0);

    vec2 sampleDistance = vec2(0.005, 0.0);

    vec3 colormap;

    float fx = bumpMap(sampleDistance.xy, 0.2);
    float fy = bumpMap(sampleDistance.yx, 0.2);
    float f = bumpMap(vec2(0.0), 0.2, colormap);

    distortion = f;

    fx = (fx - f) / sampleDistance.x;
    fy = (fy - f) / sampleDistance.x;
    normal = normalize(normal + vec3(fx, fy, 0.0) * 0.2);


    vec3 lightV = lightPos - surfacePos;
    float lightDist = max(length(lightV), 0.001);
    lightV /= lightDist;

    // light color based on light intensity
    vec3 lightColor = vec3(1.0);

    float shininess = 0.1;
    // brightness also based on light intensity
    float brightness = 1.0;

    float falloff = 0.1;
    // finally attenuation based on light intensity as well
    float attenuation = 3.0 / (1.0 + lightDist * lightDist * falloff);

    float diffuse = max(dot(normal, lightV), 0.0);
    float specular = pow(max(dot( reflect(-lightV, normal), -ray), 0.0), 64.0) * shininess;

    vec3 texCol = (vec3(0.5) * brightness) * 0.5;

    float metalness = (1.0 - colormap.x);
    metalness *= metalness;

    vec3 color = (texCol * (diffuse * vec3(0.9) * 2.0 + 0.5) + lightColor * specular * f * 2.0 * metalness) * attenuation ;

    return vec4(color, 1.0);
}

float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);

    float res = mix(
    mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
    mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
}

float fbm(vec2 x) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < 5; ++i) {
        v += a * noise(x);
        x = rot * x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

float randx(vec2 co)
{
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}


void main() {

    //vec4 xxx = texture2D(oneTexture, vTextureCoord);

    // distortion is the output of our ripples effect + scene lightning
    float distortion;
    vec4 reflections = renderPass(vTextureCoord, distortion);

    vec4 ripples = vec4(vec3(0.5), 1.0);
    ripples += distortion * 0.1 - 0.1;
    ripples += reflections * 0.5;


    //vec4 color = vec4(1.0);
    vec4 color = vec4(rgb2glsl(vec3(uBgColor)), 1.0);

    // ligths & shadows
    //float lights = ripples.r - (0.7 + lightStrength * 0.025);
    //float shadow = 1.0 - (ripples.g + 0.5);


    float shadow = 1.0 - (ripples.a*0.15 + 0.7);

    // gold colors
    vec3 gold1 = rgb2glsl(vec3(239.0, 182.0, 26.0));

    // apply our hue and saturation uniforms
    gold1 = saturate(hueRotate(gold1, uHue), uSaturation);



    // get values to mix black and the colors for shadowss
    float shadowMixValue = clamp(pow(shadow, 3.0) * 5.0, 0.0, 1.0);


    float shadowAttenuation = 0.4;

    vec3 shadowColor = mix(color.rgb, gold1 * shadowAttenuation, shadowMixValue);


    // add shadow colors to the background
    color.rgb = mix(color.rgb, shadowColor, shadowColorEffect);



    vec4 background = color;


    vec2 newUv = vTextureCoord;


    newUv.x = newUv.x + background.r*0.1 - 0.1;
    newUv.y = newUv.y + background.r*0.1 - 0.1;


    vec2 uv = newUv;


    vec4 foreground = texture2D( uImage, uv);


    gl_FragColor = foreground;
    gl_FragColor.rgb += vec3(randx(uv))*0.1;


}
