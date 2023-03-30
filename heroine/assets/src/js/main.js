//Style
import '../scss/style.scss';

import {gsap} from 'gsap';
import Hero from "./Hero";

gsap.set('.hero-ct',{height:window.innerHeight});
gsap.set('html,body',{overflow:'hidden'});

window.addEventListener('resize', () => {
    gsap.set('.hero-ct',{height:window.innerHeight});
});

//SCENE
const scene = new Hero({
    dom: document.getElementById('hero-canvas'),
});
scene.start();

var tl = gsap.timeline();
tl.to(".hero-loader__txt span", {height: '100%',duration: 2});
tl.to('.hero-loader',{opacity:0,duration:.5});
tl.add('endload')
tl.to(scene.ringMesh.material,{opacity: .5,delay:1,duration:2},'endload')
tl.to(scene.ringMesh.position,{y: 0,duration:2},'endload')
tl.to(scene.clouds.material,{opacity: 1,duration:2},'endload-=0.5')
.add(()=> {
    for(let i = 0; i < 10; i++){
        scene.updateSingleCloud(2.5,i,i*0.3,2);
    }

    for(let i = 10; i < 20; i++){
        scene.updateSingleCloud(2.5,i,(i-10)*0.2,2);
    }

    for(let i = 20; i < 30; i++){
        scene.updateSingleCloud(2.5,i,(i-20)*0.1,2);
    }
},'endload-=0.5');

var tlHover = gsap.timeline({
    paused: true,

});

tlHover.to(scene.circleMesh.scale,{
    x: () => {
        return scene.ringWidth;
    },
    y: () => {
        return scene.ringWidth;
    },
});

document.querySelector('.hero-enter').addEventListener('mouseenter',()=>{
    tlHover.play()
});

document.querySelector('.hero-enter').addEventListener('mouseleave',()=>{
    tlHover.reverse()
});

window.addEventListener('resize',()=>{
    tlHover.invalidate();
});

document.querySelector('.hero-enter').addEventListener('click',()=>{

    gsap.set('html,body',{overflow:'initial'});

    scene.circle.init();
    scene.cone.init();
    scene.donut.init();
    scene.halfcircle.init();

    for(let i = 0; i < 10; i++){
        scene.updateSingleCloud(8,i,i*0.05,3);
    }

    for(let i = 10; i < 20; i++){
        scene.updateSingleCloud(8,i,(i-10)*0.05,3);
    }

    for(let i = 20; i < 30; i++){
        scene.updateSingleCloud(8,i,(i-20)*0.05,3);
    }

    gsap.to(scene.clouds.material,{opacity: 0,duration:1,delay:2.2,ease: "power2.inOut"});
    gsap.to(scene.ringMesh.material,{opacity: 0,duration:2})
    gsap.to(scene.backgroundMesh.material,{opacity: 0,duration:2,delay:.125,ease: "power2.inOut"})
    gsap.to(scene.clouds.position,{y: "+=200",duration:3,ease: "power2.inOut"});
    gsap.to(scene.mainscene.position,{
        y: window.innerHeight,
        duration:3,
        ease: "power2.inOut",
        onComplete: () => {
            scene.clouds.material.dispose();
            //scene.staticClouds.material.dispose();
            scene.backgroundMesh.material.dispose();

        }
    });
    gsap.to(scene.gmaterial.uniforms.alpha,{value:0,ease: "power2.inOut",delay:2,duration:2})
    gsap.to(scene.materialTemple,{opacity: 1,duration:3,delay:2})
    gsap.set('.hero-enter',{display:'none'});

});



