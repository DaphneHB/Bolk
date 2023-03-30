#ifdef GL_ES
precision highp float;
#endif

varying vec2 vUv;
uniform float alpha;

void main( void ) {

    vec2 uv = vec2(vUv.x, vUv.y);

    //float a = 1. - mix(0., 1., abs(vUv.y - 0.5) * 2.);
    float gradient = mix(0., 1., exp(-(vUv.y - 0.5) * (vUv.y - 0.5) / 0.06));



    gl_FragColor = vec4(1.,1.,1.,gradient*alpha);



}
