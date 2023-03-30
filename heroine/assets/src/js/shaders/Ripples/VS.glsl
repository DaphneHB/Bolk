#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

//THREE VERS
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix
    * modelViewMatrix
    * vec4( position, 1.0 );
}
