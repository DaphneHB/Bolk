import * as THREE from 'three'
import {gsap} from 'gsap';
import Artifact from "./Artifact";

export default class Hero {

    constructor(options){

        //VIDEO BG
        this.videobgAR = 2880/1434;
        this.videotempleAR = 1595/1080;

        this.time = 0;
        let ar = [];
        for ( let i = 0; i < 30; i ++ ) {
            ar.push(Math.random())
        };

        this.myRand = [0.1301614462628411, 0.9754927491187206, 0.501643287198345389, 0.21973154733048728, 0.429467481570998, 0.3329537625533505, 0.50837401610407715, 0.78744038116336563, 0.50480638155598894, 0.43681852384976416, 0.40104893199105796, 0.8817367445463535, 0.2970417491614332, 0.5171588854123204, 0.9054162724193271, 0.508837328261067, 0.7161816148398745, 0.8065636136715084, 0.006348070014411178, 0.06807528376512062, 0.9024372062621122, 0.733540690333653, 0.8593083057580926, 0.03140256272782471, 0.05361757733022876, 0.05997538668208202, 0.8720978338435641, 0.82764157241475624, 0.47403182831607067, 0.9426131363435721];
        this.dummy = new THREE.Object3D();
        this.clock = new THREE.Clock();
        this.mainscene = new THREE.Group();
        this.artifactGroup = new THREE.Group();
        this.cloudsAmount = 30;
        this.devicePixelRatio = 1.5;
        this.container = options.dom;
        this.scene = new THREE.Scene();
        this.artifactScene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0xffffff );
        this.ripplesScene = new THREE.Scene();
        this.sceneFinal = new THREE.Scene();
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.ringWidth = (this.width / 6);
        this.camera = new THREE.PerspectiveCamera( 70, this.width/this.height, 100, 2000 );
        this.camera.position.z = 600;
        this.camera.fov = 2*Math.atan( (this.height/2)/600 )* (180/Math.PI);

        this.max = 100;
        this.currentWave = 0;
        this.mouse = {
            last: new THREE.Vector2(),
            current: new THREE.Vector2(),
            velocity: new THREE.Vector2(),
            updateVelocity: false,
            lastTime: null,
        };

        this.renderer = new THREE.WebGLRenderer( {
            antialias: false,
            alpha: true
        } );

        const opt = {
            type: THREE.HalfFloatType
        }

        this.baseTexture = new THREE.WebGLRenderTarget(
            this.width,
            this.height, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat
            }
        );
        this.renderTargetScene = new THREE.WebGLRenderTarget(this.width, this.height,{});
        this.renderTargetArtifact = new THREE.WebGLRenderTarget(this.width, this.height,{});

        this.renderer.setPixelRatio( this.devicePixelRatio );
        this.container.appendChild( this.renderer.domElement );

    }

    start() {

        this.setupResize();
        this.addObjects();
        this.render();
        this.resize();


    }

    destroy() {
        this.container.innerHTML = '';
        cancelAnimationFrame( this.raf );
    }

    setupResize(){
        window.addEventListener('resize',this.resize.bind(this));
    }

    resize(){
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.renderer.setSize( this.width,this.height );
        this.camera.aspect = this.width/this.height;
        this.camera.fov = 2*Math.atan( (this.height/2)/600 )* (180/Math.PI);
        this.camera.updateProjectionMatrix();

        this.baseTexture.setSize(this.width,this.height);
        this.renderTargetScene.setSize(this.width,this.height);
        this.renderTargetArtifact.setSize(this.width,this.height);
        this.finalMESH.scale.set(this.width,this.height,1);

        if (typeof (this.backgroundMesh) != "undefined") {

            this.ringWidth = Math.max(160,(this.width / 6));
            this.ringMesh.scale.set(this.ringWidth,this.ringWidth,1);
            this.backgroundMesh.scale.set(this.width,this.height,1);


            this.templeMesh.scale.set(this.width, this.height, 1);



            this.gradient.scale.set(this.width,400,1);
            this.gradient.position.set(0,-(this.height/2.),5);

            this.sizeVideoAsCover();

        }





    }

    sizeVideoAsCover() {

        var aspect = this.width/this.height;

        if ( aspect < this.videobgAR ) {
            this.textureBG.matrix.setUvTransform( 0, 0, aspect / this.videobgAR, 1, 0, 0.5, 0.5 );
        } else {
            this.textureBG.matrix.setUvTransform( 0, 0, 1, this.videobgAR / aspect, 0, 0.5, 0.5 );
        }

        if ( aspect < this.videotempleAR ) {
            var scaleFactor = aspect / this.videotempleAR;
            this.textureTemple.matrix.setUvTransform(0, 0, scaleFactor, 1, 0, 0.5, 0.5);
        } else {
            var scaleFactor = this.videotempleAR / aspect;
            let offsetY = (1 - scaleFactor) * 0.5;
            this.textureTemple.matrix.setUvTransform(0, -offsetY, 1, scaleFactor, 0, 0.5, 0.5);
        }



    }

    addRipples(){

        const geometry = new THREE.PlaneGeometry( 32, 32, 1 );
        this.ripplesMeshes = [];


        for (let i = 0; i < this.max; i++) {
            let m = new THREE.MeshBasicMaterial( {
                map: new THREE.TextureLoader().load('./static/textures/cloud10-4.png'),
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthTest: false,
                depthWrite: true
            } );

            let mesh = new THREE.Mesh(geometry, m);
            mesh.rotation.z = 2*Math.PI*Math.random();
            mesh.visible = false;
            this.ripplesScene.add( mesh );
            this.ripplesMeshes.push(mesh);

        }

        this.mouseMovement();


        //RING
        let VS = require("./shaders/Ripples/VS.glsl");
        let FS = require("./shaders/Ripples/FS.glsl");

        const finalGeometry = new THREE.PlaneGeometry(1,1);
        const finalMaterial = new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            uniforms: {
                time: { value: 0 },
                uDisplacement: { value: 0 },
                uTexture: { value: 0 },
                uArtifact: { value: 0 },

                resolution: { value: new THREE.Vector2(this.width, this.height) },
            },
            vertexShader : VS,
            fragmentShader : FS,
            transparent: true
        });

        this.finalMESH = new THREE.Mesh(finalGeometry,finalMaterial);

        this.sceneFinal.add(this.finalMESH);

    }

    setNewWave(x,y,index) {
        let m = this.ripplesMeshes[index];
        m.visible = true;
        m.position.x = x;
        m.position.y = y;
        m.material.opacity = 0.5;
        m.scale.x = 0;
        m.scale.y = 0;
    }

    trackMousePos() {




        if (Math.abs(this.mouse.current.x - this.mouse.last.x)<4 && Math.abs(this.mouse.current.y - this.mouse.last.y)<4) {

        } else {
            this.currentWave = (this.currentWave + 1) % this.max;
            this.setNewWave((this.mouse.current.x - this.width/2),(this.height/2 - this.mouse.current.y),this.currentWave);
        }

    }

    mouseMovement(){

        window.addEventListener( 'mousemove', (e)=>{

            const mousePos = {
                x: e.targetTouches ? e.targetTouches[0].clientX : e.clientX,
                y: e.targetTouches ? e.targetTouches[0].clientY : e.clientY,
            };

            this.mouse.last.copy(this.mouse.current);
            this.mouse.current.set(mousePos.x, mousePos.y);


            this.trackMousePos();


        }, false );
    }

    getClouds(mat,quantity) {

        let randomizeMatrix = (matrix,i,rand) => {

            const position = new THREE.Vector3();
            const rotation = new THREE.Euler();
            const quaternion = new THREE.Quaternion();
            const scale = new THREE.Vector3();

            position.x = i/quantity * rand[i] * 8 - 4;
            position.z = -1. + i/quantity * rand[i] * 4 - 2;

            scale.x = scale.y = scale.z = rand[i] * 4;

            return matrix.compose( position, quaternion, scale );

        };

        let clouds = new THREE.InstancedMesh( new THREE.PlaneGeometry( 1, 1 ), mat, quantity );
        clouds.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame


        for ( let i = 0; i < quantity; i ++ ) {
            const matrix = new THREE.Matrix4();
            randomizeMatrix( matrix,i,this.myRand );
            clouds.setMatrixAt( i, matrix );
        }





        clouds.scale.set(this.height/4.5,this.height/4.5,1);
        clouds.position.set(0, -this.height, 100)
        clouds.rotation.set(0, 0, 0);

        clouds.name = 'clouds';

        return clouds;

    }

    getStClouds(mat,quantity) {

        let randomizeMatrix = function () {

            const position = new THREE.Vector3();
            const rotation = new THREE.Euler();
            const quaternion = new THREE.Quaternion();
            const scale = new THREE.Vector3();

            return function ( matrix ) {

                position.x = Math.random() * 8 - 4;
                position.z = -1. + Math.random() * 4 - 2;
                scale.x = scale.y = scale.z = Math.random() * 2;
                matrix.compose( position, quaternion, scale );

            };

        }();

        let clouds = new THREE.InstancedMesh( new THREE.PlaneGeometry( 1, 1 ), mat, quantity );

        for ( let i = 0; i < quantity; i ++ ) {
            const matrix = new THREE.Matrix4();
            randomizeMatrix( matrix );
            clouds.setMatrixAt( i, matrix );
        }

        clouds.scale.set(this.height/4.5,this.height/4.5,1);
        clouds.position.set(0, -(this.height/2), 100)
        clouds.rotation.set(0, 0, 0);
        clouds.name = 'sclouds';

        return clouds;

    }

    addClouds() {

        let cloudTexture = new THREE.TextureLoader().load( './static/textures/cloud10-4.png' );

        let material = new THREE.MeshBasicMaterial( {
            map: cloudTexture,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide,
            opacity: 0
        } );

        this.clouds = this.getClouds(material,this.cloudsAmount);
        this.mainscene.add(this.clouds);

        this.addGradient();

    }

    addGradient() {

        let VS = require("./shaders/gradient/VS.glsl");
        let FS = require("./shaders/gradient/FS.glsl");

        this.gmaterial = new THREE.ShaderMaterial({
            uniforms: {
                alpha : {value: 1},
            },
            side: THREE.DoubleSide,
            vertexShader: VS,
            fragmentShader: FS,
            transparent: true,
        });

        const geometry = new THREE.PlaneGeometry( 1, 1, 32 );
        this.gradient = new THREE.Mesh( geometry, this.gmaterial );
        this.gradient.scale.set(this.width,400,1);
        this.gradient.position.set(0,-(this.height/2.),5);
        this.mainscene.add(this.gradient);

    }

    addArtifacts() {

        this.circle = new Artifact({
            url : "./static/artifacts/cerchio-smaller.json",
            height: this.height,
            width: this.width,
            hoverEl: '.hero-artifact--circle',
        });

        this.artifactGroup.add(this.circle.artifact);

        this.cone = new Artifact({
            url : "./static/artifacts/cone-smaller.json",
            height: this.height,
            width: this.width,
            hoverEl: '.hero-artifact--cone',
        });

        this.artifactGroup.add(this.cone.artifact);

        this.donut = new Artifact({
            url : "./static/artifacts/donut-smaller.json",
            height: this.height,
            width: this.width,
            hoverEl: '.hero-artifact--donut',
        });

        this.artifactGroup.add(this.donut.artifact);

        this.halfcircle = new Artifact({
            url : "./static/artifacts/half-circl-smaller.json",
            height: this.height,
            width: this.width,
            hoverEl: '.hero-artifact--halfcircle',
        });

        this.artifactGroup.add(this.halfcircle.artifact);

        this.sceneFinal.add(this.artifactGroup);



    }

    addImages() {
        const textureLoader = new THREE.TextureLoader();

        //IMAGES
        this.images = [...document.querySelectorAll('.w-image')];
        this.imagesMesh = [];



        this.imagesStore = this.images.map(img=>{



            const imgT = textureLoader.load( img.src );

            imgT.magFilter = THREE.NearestFilter;
            imgT.minFilter = THREE.NearestFilter;

            const tgeometry = new THREE.PlaneGeometry( 1, 1);
            const tmaterial = new THREE.MeshBasicMaterial({
                map:imgT,

                wireframe: false,
                transparent: true
            });


            let mesh = new THREE.Mesh( tgeometry, tmaterial );


            if (img.classList.contains('enter-image')) {
                this.mainscene.add( mesh );
            } else {
                this.scene.add( mesh );
            }

            this.imagesMesh.push(mesh);

            return {
                img: img,
                mesh: mesh,
                material: tmaterial
            }

        });


    }

    setImagesSizePos() {

        this.imagesStore.forEach(o=>{

            let bounds = o.img.getBoundingClientRect();
            var top = bounds.top + window.scrollY;

            if (o.mesh != null) {
                o.mesh.position.y = window.scrollY - top + this.height/2 - bounds.height/2;
                o.mesh.position.x = bounds.left - this.width/2 + bounds.width/2;
                o.mesh.scale.set(bounds.width,bounds.height,1);
            }

        });




    }

    addVideoBG() {
        //VIDEO BG
        const videobg = document.querySelector( '.hero-video--1' );

        videobg.play();
        this.textureBG = new THREE.VideoTexture( videobg );
        this.textureBG.matrixAutoUpdate = false;

        this.textureBG.minFilter = THREE.LinearFilter;
        this.textureBG.magFilter = THREE.LinearFilter;
        this.textureBG.format = THREE.RGBAFormat;

        this.materialBG = new THREE.MeshBasicMaterial({ map:this.textureBG, transparent: true });
        this.materialBG.needsUpdate = true;

        const geometry = new THREE.PlaneGeometry( 1, 1, 32 );
        this.backgroundMesh = new THREE.Mesh( geometry, this.materialBG );
        this.backgroundMesh.scale.set(this.width,this.height,1);

        this.mainscene.add( this.backgroundMesh );


    }


    addVideoTemple() {
        //VIDEO
        const videotemple = document.querySelector( '.hero-video--2' );
        videotemple.play();

        this.textureTemple = new THREE.VideoTexture( videotemple );
        this.textureTemple.matrixAutoUpdate = false;
        this.textureTemple.minFilter = THREE.LinearFilter;
        this.textureTemple.magFilter = THREE.LinearFilter;
        this.textureTemple.format = THREE.RGBAFormat;

        this.materialTemple = new THREE.MeshBasicMaterial({ map:this.textureTemple,opacity:0, transparent: true });
        this.materialTemple.needsUpdate = true;

        const geometry = new THREE.PlaneGeometry( 1, 1, 32 );
        this.templeMesh = new THREE.Mesh( geometry, this.materialTemple );
        this.templeMesh.position.set(0,-this.height,0);

        this.mainscene.add( this.templeMesh );
    }

    addRing() {


        const ringGeometry = new THREE.RingGeometry( 1, 1.35, 128 );
        const ringMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0. } );


        this.ringMesh = new THREE.Mesh( ringGeometry, ringMaterial );
        this.ringMesh.position.set(0,-100,1);
        this.mainscene.add( this.ringMesh );

    }

    addCircle() {

        const geometry = new THREE.CircleGeometry( 1, 128 );
        const material = new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.25 } );
        this.circleMesh = new THREE.Mesh( geometry, material );
        this.circleMesh.position.set(0,0,.5);
        this.circleMesh.scale.set(48,48,1);
        this.mainscene.add( this.circleMesh );

    }


    addObjects(){


        this.addVideoBG();
        this.addVideoTemple();
        this.addRing();
        this.addCircle();
        this.addClouds();
        this.addImages();
        this.addArtifacts();
        this.addRipples();
        this.scene.add(this.mainscene);



    }

    updateClouds() {

        if ( this.clouds ) {

            let dummy = new THREE.Object3D();
            let mat4 = new THREE.Matrix4();

            let t = this.clock.getDelta()*0.05;


            for(let i = 0; i < this.cloudsAmount; i++){

                this.clouds.getMatrixAt(i, mat4);
                mat4.decompose(dummy.position, dummy.quaternion, dummy.scale);

                dummy.rotation.z += t * Math.random() * (i % 2 == 0 ? -1 : 1);
                dummy.updateMatrix();


                this.clouds.setMatrixAt(i, dummy.matrix);
                this.clouds.instanceMatrix.needsUpdate = true;

            }

        }
    }

    updateSingleCloud(value,i,delay,duration) {

        if ( this.clouds ) {

            let dummy = new THREE.Object3D();
            let mat4 = new THREE.Matrix4();



                this.clouds.getMatrixAt(i, mat4);
                mat4.decompose(dummy.position, dummy.quaternion, dummy.scale);


                gsap.to(dummy.position,{
                    y: this.myRand[i]*value,
                    delay:delay,
                    duration: duration,
                    onUpdate: () => {

                        dummy.updateMatrix();


                        this.clouds.setMatrixAt(i, dummy.matrix);
                        this.clouds.instanceMatrix.needsUpdate = true;

                    }
                })

        }
    }




    render(){

        this.updateClouds();
        this.setImagesSizePos();

        this.time++;




        this.renderer.setRenderTarget(this.baseTexture);
        this.renderer.render(this.ripplesScene,this.camera);
        this.finalMESH.material.uniforms.uDisplacement.value = this.baseTexture.texture;

        this.renderer.setRenderTarget(null);
        this.renderer.clear();

        this.renderer.setRenderTarget( this.renderTargetScene);
        this.renderer.render(this.scene,this.camera);
        this.finalMESH.material.uniforms['uTexture'].value = this.renderTargetScene.texture;



        this.renderer.setRenderTarget(null);

        this.renderer.render(this.sceneFinal,this.camera);



        this.ripplesMeshes.forEach(mesh=>{
            if (mesh.visible) {
                mesh.rotation.z += 0.02;
                mesh.material.opacity *= 0.96;
                mesh.scale.x = 0.98* mesh.scale.x + 0.2;
                mesh.scale.y = 0.98* mesh.scale.y + 0.2;
                if (mesh.material.opacity < 0.02) {
                    mesh.visible = false;
                }
            }

        });

        this.raf = window.requestAnimationFrame(this.render.bind(this));

    }
}
