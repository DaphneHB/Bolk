import * as THREE from 'three'
import {gsap} from 'gsap';
import { Base64 } from 'js-base64';

export default class Artifact {

    constructor(options){

        this.hoverEl = options.hoverEl;
        this.width = options.width;
        this.height = options.height;
        this.artifactImages = [];
        this.artifact = new THREE.Mesh();
        this.tmaterial = new THREE.MeshBasicMaterial({
            wireframe: false,
            transparent: true,
            opacity: 0
        });
        const tgeometry = new THREE.PlaneGeometry( 1, 1);
        this.artifact = new THREE.Mesh( tgeometry, this.tmaterial );
        this.artifact.scale.set(this.width,this.height,1);
        this.artifact.position.set(0,0,5);
        var manager = new THREE.LoadingManager();
        const textureLoader = new THREE.TextureLoader(manager);

        var request = new XMLHttpRequest();
        request.open("GET", options.url, true);
        request.send(null);
        request.onreadystatechange = function() {
            if ( request.readyState === 4 && request.status === 200 ) {
                var my_JSON_object = JSON.parse(request.responseText);

                // ciclo l'array e creo un URL oggetto per ogni stringa decodificata
                const createImageUrls = (decodedArray) => {
                    return decodedArray.map((base64String) => {
                        var res = "data:image/webp;base64,"+Base64.btoa(base64String);
                        return res;
                    });
                }

                const t = my_JSON_object.data;
                const imageUrls = createImageUrls(t);

                for (let i = 0; i < imageUrls.length; i++) {

                    const img = textureLoader.load(imageUrls[i],()=>{
                        if (i == 249) {
                            window.dispatchEvent(new Event('textureloadend'));
                        }
                    });

                    let imgRatio = 1920 / 1080;
                    let planeRatio = this.width / this.height;
                    let ratio = planeRatio / imgRatio;
                    img.repeat.x = ratio;
                    img.offset.x = 0.55 * (1 - ratio);
                    this.artifactImages.push(img);

                }

                window.addEventListener('textureloadend',()=>{
                    this.tmaterial.map = this.artifactImages[0];
                    this.tmaterial.map.needsUpdate = true;
                    this.tmaterial.needsUpdate = true;
                });

            }

        }.bind(this);

        this.frames = {
            frame: 0
        };

    }

    render = () => {
        if (window.matchMedia('(max-width: 767.98px)').matches) {
            this.tmaterial.map.dispose();
        }
        this.tmaterial.map = this.artifactImages[this.frames.frame];
        this.tmaterial.needsUpdate = true;
    }

    init() {

        var el = document.querySelector(this.hoverEl);
        var s = document.getElementById(el.dataset.audio);
        gsap.to(this.tmaterial,{opacity:1,duration:3,delay:2.25});

        let st1 = gsap.timeline({
            yoyo: true,
            repeat: -1,
        });

        st1
        .to(this.frames,{
            frame: 100,
            duration: 2,
            snap: "frame",
            onUpdate: this.render // use animation onUpdate instead of scrollTrigger's onUpdate
        });

        let st2 = gsap.timeline({
            paused: true,
            onStart: () => {
                st1.pause();
                s.play();
            },
            onReverseComplete: () => {
                gsap.to(this.frames,{
                    frame: 0,
                    duration: .4,
                    snap: "frame",
                    onUpdate: this.render,
                    onComplete: () => {
                        st1.play(0);
                        s.pause();
                        s.currentTime = 0;
                    }
                });

            },
        });

        st2
        .to(this.frames,{
            frame: 249,
            duration: 2,
            snap: "frame",
            onUpdate: this.render // use animation onUpdate instead of scrollTrigger's onUpdate
        });

        document.querySelector(this.hoverEl).addEventListener('mouseenter',() => {
            st2.play();

        });

        document.querySelector(this.hoverEl).addEventListener('mouseleave',() => {
            st2.reverse();
        });
    }

    resize(){

        this.artifact.scale.set(this.width,this.height,1);
        this.artifact.position.set(0,0,100);

    }

}
