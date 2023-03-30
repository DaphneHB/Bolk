#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform float alpha;
uniform vec2 uResolution;
uniform sampler2D txt;
varying vec2 vUv;

void main( void ) {

    vec2 uv = vec2(vUv.x, vUv.y);

    gl_FragColor = texture2D(txt, uv);

    gl_FragColor.a *= alpha;


}
