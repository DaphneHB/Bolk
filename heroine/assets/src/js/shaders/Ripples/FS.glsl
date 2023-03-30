#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec2 vUv;
uniform float uAlpha;
uniform sampler2D uDisplacement;
uniform sampler2D uTexture;
uniform sampler2D uArtifact;
float PI = 3.14159265359;

void main() {

    vec4 displacement = texture2D(uDisplacement,vUv);

    float theta = displacement.r * 2. * PI;

    vec2 dir = vec2(sin(theta),cos(theta));


    vec2 uv = vUv + dir * displacement.r * 0.1;

    gl_FragColor = texture2D(uTexture,uv);

}
