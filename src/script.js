import './main.css';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
//import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { BleachBypassShader } from 'three/examples/jsm/shaders/BleachBypassShader.js';
import { CSS3DRenderer, CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer.js";
//import SimplexNoise from 'simplex-noise';

			let camera, cameraTarget, controls, scene, renderer, light, lightPerson, sunLight;

			let material1, material2, materialG;

			let composer;

			let analyser1, analyser2, analyser3;

			let  mesh2, model, tv, skeleton;
			
			let bone = [];

			let t = 0.0;

			const clock = new THREE.Clock();
			const loader = new FBXLoader();
			//const noise = new SimplexNoise(); 

			let assetCount = 0;

			const startButton = document.getElementById( 'startButton' );
			startButton.addEventListener( 'click', init );

			function init() {

				const overlay = document.getElementById( 'overlay' );
				overlay.remove();

				camera = new THREE.PerspectiveCamera( 20, window.innerWidth / window.innerHeight, 0.1, 200);
				camera.position.set( 0, 0, 5);
	
				const listener = new THREE.AudioListener();
				camera.add( listener );

				renderer = new THREE.WebGLRenderer( { antialias: true } );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				renderer.shadowMap.enabled = true;
				renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
				renderer.setAnimationLoop( animate );
				document.body.appendChild( renderer.domElement );

				scene = new THREE.Scene();
				scene.background = new THREE.Color( 'rgb(50,20,150)' );
				//scene.fog = new THREE.Fog({color:'rgb(0,0,0)'},3,50);
				scene.fog = new THREE.FogExp2('rgb(50,20,150)',0.05);

				light = new THREE.PointLight( 0xffffff,1);
				light.position.set(0, 10, 0);
				light.castShadow = true;
				scene.add( light );

				sunLight = new THREE.PointLight('rgba(251, 248, 248, 0.95)', 1.8);
				sunLight.castShadow = true;
				sunLight.position.set(0,1,0);
				scene.add(sunLight);

				lightPerson = new THREE.PointLight( 0xffffff, 3 );
				lightPerson.position.set( 0, 0.0, 0).normalize();
				//scene.add(lightPerson);

				composer = new EffectComposer( renderer );
				composer.addPass( new RenderPass( scene, camera ) );

				const filmPass = new FilmPass(
				0.85, // noise intensity
				0.8,  // scanline intensity
				12,  // scanline count
				false // false to keep colors
				);

				composer.addPass(filmPass);

				const shaderBleach = BleachBypassShader;
				const effectBleach = new ShaderPass( shaderBleach );
				effectBleach.uniforms[ 'opacity' ].value = 0.50;
				composer.addPass(effectBleach);


				//const effect1 = new DotScreenPass( new THREE.Vector2( 0, 0 ), 0.5, 10.8 );;
				//effect1.uniforms[ 'scale' ].value = 4;
				//composer.addPass( effect1 );

				const effect2 = new ShaderPass( RGBShiftShader );
				effect2.uniforms[ 'amount' ].value = 0.0050;
				effect2.uniforms[ 'angle' ].value = 90;
				composer.addPass( effect2 );

				const sphere = new THREE.SphereGeometry();
				const box = new THREE.BoxGeometry();
				const plane = new THREE.PlaneGeometry(500,500);

				material1 = new THREE.MeshStandardMaterial( { color: 0xffaa00} );
				material2 = new THREE.MeshPhongMaterial( { color: 0x6622aa } );

				// sound SPHERE
				const mesh1 = new THREE.Mesh( sphere, material1 );
				mesh1.position.x = 20;
				mesh1.castShadow = true;
				mesh1.receiveShadow = true;
				//scene.add( mesh1 );

				const sound1 = new THREE.PositionalAudio( listener );
				const oscillator1 = listener.context.createOscillator();
				oscillator1.type = 'sine';
				oscillator1.frequency.setValueAtTime( 600, sound1.context.currentTime );
				//oscillator1.start( 0 );
				
				sound1.setNodeSource( oscillator1 );
				sound1.setRefDistance( 20 );
				sound1.setVolume( 0.5 );	
				//mesh1.add( sound1 );

                //sound BOX
				//mesh2 = new THREE.Mesh( box, material2 );
				//mesh2.castShadow = true;
				//mesh2.position.set( 0, 50, - 250 );
		
				//scene.add( mesh2 );

				const sound2 = new THREE.PositionalAudio( listener );
				const oscillator2 = listener.context.createOscillator();
				oscillator2.type = 'square';
				oscillator2.frequency.setValueAtTime( 412, sound2.context.currentTime );
				//oscillator2.start( 0 );
				
				sound2.setNodeSource( oscillator2 );
				sound2.setRefDistance( 20 );
				sound2.setVolume( 0.5 );
				//mesh2.add( sound2 );

				// analysers
				analyser1 = new THREE.AudioAnalyser( sound1, 32 );
				analyser2 = new THREE.AudioAnalyser( sound2, 32 );

				// global ambient audio
				const sound4 = new THREE.Audio( listener );
				const utopiaElement = document.getElementById( 'utopia' );
				// sound4.setMediaElementSource( utopiaElement );
				// sound4.setVolume( 0.5 );
				// utopiaElement.play();

				// ground
				//const helper = new THREE.GridHelper( 1000, 10, 0x444444, 0x444444 );
				//helper.position.y = 0.1;
				//scene.add( helper );

                
                materialG = new THREE.MeshStandardMaterial( { color: 0x72645b} );
				const ground = new THREE.Mesh(plane,materialG);
				ground.receiveShadow = true;
				ground.position.set(0,-1,0);
				ground.rotation.x = -Math.PI/2;
				scene.add(ground);


				
				loader.load( 'models/Silly Dancing.fbx',  function (object) {
					object.traverse(function (child) {
					  if (child.isMesh) {
						child.castShadow = true;   // Allow the model to cast shadows
						child.receiveShadow = true; // Allow the model to receive shadows
						skeleton = child.skeleton;

						for(let i = 0; i < 65; i++){
							bone[i] = skeleton.bones[i];
							//bone[i].rotation.x = Math.PI/12;
						}
					  }
					});

					object.scale.set(0.03,0.03,0.03);
					object.position.set(-10,-1,0);
					scene.add(object);
				  },
				  function (xhr) {
					console.log((xhr.loaded / xhr.total * 100) + '% loaded');
					assetCount = xhr.loaded / xhr.total * 100;
				  },
				  function (error) {
					console.error('An error occurred:', error);
				  }
				);


				const loaderG = new GLTFLoader().setPath( 'models/tv1/' );
				loaderG.load( 'scene.gltf', async function ( gltf ) {

				const model = gltf.scene;
				tv = model;
				tv.scale.set(0.5,0.5,0.5);
				tv.position.set(0,0,-5);
				//arcade.rotation.y = Math.PI * 0.3;
				//arcade.rotation.x = Math.PI * 0.5;

				// model.traverse((child) => {
				//   if (child.isMesh) {
				//       console.log(child.name); // Log object names
				//       child.material.color.set('rgb(250, 248, 248)'); // Change color to Red
				//   }
				//});

				scene.add(tv);


				} );

				
			
				const SoundControls = function () {

					this.master = listener.getMasterVolume();
					this.firstBox = sound1.getVolume();
					// this.secondSphere = sound2.getVolume();
					this.thirdSphere = sound2.getVolume();
					this.Ambient = sound4.getVolume();

				};

				const GeneratorControls = function () {

					this.frequency = oscillator1.frequency.value;
					this.wavetype = oscillator1.type;

				};

				//const gui = new GUI();
				//const soundControls = new SoundControls();
				//const generatorControls = new GeneratorControls();
				//const volumeFolder = gui.addFolder( 'sound volume' );
				//const generatorFolder = gui.addFolder( 'sound generator' );

	/* 			volumeFolder.add( soundControls, 'master' ).min( 0.0 ).max( 1.0 ).step( 0.01 ).onChange( function () {

					listener.setMasterVolume( soundControls.master );

				} ); */
				
				// volumeFolder.add( soundControls, 'firstSphere' ).min( 0.0 ).max( 1.0 ).step( 0.01 ).onChange( function () {

				// 	//sound1.setVolume( soundControls.firstSphere );

				// } );
				// volumeFolder.add( soundControls, 'secondSphere' ).min( 0.0 ).max( 1.0 ).step( 0.01 ).onChange( function () {

				// 	//sound2.setVolume( soundControls.secondSphere );

				// } );

				/* volumeFolder.add( soundControls, 'thirdSphere' ).min( 0.0 ).max( 1.0 ).step( 0.01 ).onChange( function () {

					sound2.setVolume( soundControls.thirdSphere );

				} );
				volumeFolder.add( soundControls, 'Ambient' ).min( 0.0 ).max( 1.0 ).step( 0.01 ).onChange( function () {

					sound4.setVolume( soundControls.Ambient );

				} );
				volumeFolder.open();
				generatorFolder.add( generatorControls, 'frequency' ).min( 50.0 ).max( 5000.0 ).step( 1.0 ).onChange( function () {

					oscillator1.frequency.setValueAtTime( generatorControls.frequency, listener.context.currentTime );

				} );
				generatorFolder.add( generatorControls, 'wavetype', [ 'sine', 'square', 'sawtooth', 'triangle' ] ).onChange( function () {

					oscillator1.type = generatorControls.wavetype;

				} );

				generatorFolder.open(); */

				//
				controls = new FirstPersonControls(camera, renderer.domElement);
				controls.movementSpeed = 10;
				controls.lookSpeed = 0.00;
				controls.enablePan = false;
				controls.lookVertical = false;
				//
				window.addEventListener( 'resize', onWindowResize );

			}

			// Variável para armazenar o gamepad
			let gamepad = null;

			// Função para detectar gamepads conectados
			function connectHandler(event) {
				gamepad = event.gamepad;
				console.log("Gamepad conectado:", gamepad.id);
			}
	
			// Função para detectar gamepads desconectados
			function disconnectHandler(event) {
				if (gamepad && event.gamepad.index === gamepad.index) {
					console.log("Gamepad desconectado:", gamepad.id);
					gamepad = null;
				}
			}
	
			// Adicionando listeners para conexão e desconexão de gamepads
			window.addEventListener("gamepadconnected", connectHandler);
			window.addEventListener("gamepaddisconnected", disconnectHandler);
	
			// Função para atualizar a posição do cubo com base no gamepad
			function updateCubePosition() {
				if (!gamepad) return;
	
				// Atualiza o estado do gamepad
				gamepad = navigator.getGamepads()[gamepad.index];
	
				// Lê os eixos do gamepad (exemplo: eixos 0 e 1 para o joystick esquerdo)
				const xAxis = gamepad.axes[0]; // Eixo X do joystick esquerdo
				const yAxis = gamepad.axes[1]; // Eixo Y do joystick esquerdo

				const xAxis1 = gamepad.axes[2]; // Eixo X do joystick esquerdo
				const yAxis1 = gamepad.axes[3]; // Eixo Y do joystick esquerdo
	
				// Atualiza a posição do cubo
				tv.rotateX(xAxis * 0.1);
				tv.rotateY(yAxis * 0.1);
	
				// Lê os botões do gamepad (exemplo: botão 0 para ação)
				if (gamepad.buttons[0].pressed) {
					//sunLight.color.set(Math.random() * 0xffffff);
					for(let i = 0; i < 8; i++){
						bone[i].rotation.x = THREE.MathUtils.randFloat(-1.0,1.0);
						bone[i].rotation.y = THREE.MathUtils.randFloat(-1.0,1.0);
						bone[i].rotation.z = THREE.MathUtils.randFloat(-1.0,1.0);
					//bone[5].rotation.z = Math.cos(t)*0.8;
				   }
					
				}


				if(bone){

					
					for(let i = 8; i < bone.length; i++){
						bone[i].rotation.x = xAxis;
						bone[i].rotation.y = yAxis;
						bone[i].rotation.z = xAxis1;
					//bone[5].rotation.z = Math.cos(t)*0.8;
				   }
					
					//cabeça/tronco
					// bone[1].rotation.x = xAxis;
					// bone[4].rotation.y = yAxis;
					// //bone[5].rotation.z = Math.cos(t)*0.8;
					
					// //braço esquerdo
					// bone[9].rotation.x = yAxis1;
					// bone[9].rotation.z = xAxis1;
					//bone[11].rotation.z = 0.4+Math.cos(t)*0.4;
					
				}

			}


			function onWindowResize() {

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				//camera.lookAt( cameraTarget );

				renderer.setSize( window.innerWidth, window.innerHeight );

				controls.handleResize();

			}

			function animate() {

				const delta = clock.getDelta();
				updateCubePosition();

				controls.update( delta );

				// material1.emissive.b = analyser1.getAverageFrequency() / 256;
				// material2.emissive.b = analyser2.getAverageFrequency() / 256;

				//mesh2.rotation.x += 0.02;

				t += 0.01;

				// if(bone[1]){
					
				// 	//cabeça/tronco
				// 	bone[1].rotation.x = Math.sin(t)*0.5;
				// 	bone[4].rotation.x = Math.cos(t)*0.8;
				// 	bone[5].rotation.z = Math.cos(t)*0.8;
					
				// 	//braço esquerdo
				// 	bone[9].rotation.y = Math.sin(t)*0.4;
				// 	bone[11].rotation.z = 0.4+Math.cos(t)*0.4;
					
				// }
				//lightPerson.position.copy(camera.position);

				renderer.render( scene, camera );
				composer.render();

			}
	