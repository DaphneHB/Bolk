#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

//THREE VERS
varying vec2 vTextureCoord;

void main() {
    vTextureCoord = uv;
    gl_Position = projectionMatrix
    * modelViewMatrix
    * vec4( position, 1.0 );
}