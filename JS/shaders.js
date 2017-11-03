'use strict';

window.onload = init;

var mainScene, hudScene;
var mainCamera, mainRenderer;
var hudCamera, hudRenderer;

var clock = new THREE.Clock();
var uniforms;

var mouse = new THREE.Vector2();
var rotateDown = false, leftDown = false, leftClock = new THREE.Clock(), leftTime = 0;
var raycaster = new THREE.Raycaster();

var muted = false, paused = false;

var sphere;

var intersects = [];
var isOn = [];
for( var i = 0; i < 50; i++ ){
	intersects.push( new THREE.Vector3(0.0, 0.0, 0.0) );
	isOn.push(false);
}


function init(){

	initScene();
	initLights();

	initAudio();

	initMain();
	//initHUD();

	render();

}

function initScene(){

	mainScene = new THREE.Scene();

	uniforms = { 
		time: { value: clock.getElapsedTime() },
		lightPos: { value: new THREE.Vector3(-20,20,20)},
		intersects: { value: intersects },
		isOn: { value: isOn }
	};

	var sphereMaterial = new THREE.ShaderMaterial( {
		uniforms: uniforms,
		vertexShader: $('#sphereVert').text(),
		fragmentShader: $('#sphereFrag').text()
	} );

	sphere = new THREE.Mesh( new THREE.SphereGeometry(3, 500, 500), sphereMaterial );
	mainScene.add(sphere);

	/*var cube = new THREE.Mesh( new THREE.CubeGeometry(1, 1, 1), new THREE.MeshPhongMaterial({color: 'red', shininess: 50}) );
	cube.position.set(4,4,4);
	mainScene.add(cube);*/

	//hudScene = new THREE.Scene();

}

function initLights(){
    var spotLight = new THREE.SpotLight( 0xdedede );
	spotLight.position.set( -20, 20, 20 );

	spotLight.castShadow = true;

	spotLight.shadow.mapSize.width = 1024;
	spotLight.shadow.mapSize.height = 1024;
	spotLight.shadow.radius = 2;

	spotLight.shadow.camera.near = 500;
	spotLight.shadow.camera.far = 4000;
	spotLight.shadow.camera.fov = 30;

	var ambientLight = new THREE.AmbientLight( 0x111111 );
	mainScene.add( ambientLight );

	mainScene.add( spotLight );

	//hudScene.add( spotLight.clone() );
}

function initAudio(){

}

function initMain(){

	mainRenderer = new THREE.WebGLRenderer();
	mainRenderer.setClearColor( 0x050505, 1.0 );
	
	mainRenderer.shadowMap.enabled = true;
	mainRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

	mainCamera = new THREE.PerspectiveCamera( 45, 1, 0.1, 10000 );
	mainCamera.position.set(5,20,15);
	mainCamera.lookAt( mainScene.position );

	$("#mainView").append( mainRenderer.domElement );

}

/*function initHUD(width, height){

	hudRenderer = new THREE.WebGLRenderer({ alpha: true });
	
	hudRenderer.shadowMap.enabled = true;

	hudCamera = new THREE.PerspectiveCamera( 45, 1, 0.1, 10000 );
	hudCamera.position.set(0,2,1);

	hudCamera.lookAt(hudScene.position);

	$("#hudView").append( hudRenderer.domElement );

}*/

function resizeMain() {
	const w = document.body.clientWidth;
	const h = document.body.clientHeight;
    mainRenderer.setSize(w, h);
    mainCamera.aspect = w / h;
    mainCamera.updateProjectionMatrix();
};

/*function resizeHUD(){
	const w = document.body.clientWidth;
	const h = document.body.clientHeight;
	var side;

    if( w > h ){
    	side = Math.round(h*0.30);
    	hudRenderer.setSize(side, side, true);
    	hudRenderer.setScissor(0, 0, side, side);
    }else{
    	side = Math.round(w*0.30);
    	hudRenderer.setSize(side, side, true);
    	hudRenderer.setScissor(0, 0, side, side);
    }

    
}*/

function numOn(){

	var j = 0;

	for( var i = 0; i < isOn.length; i++ )
		if( isOn[i] )
			j++;

	return j;
}

function render(){

	if( numOn() > 1 || !leftDown ){
		intersects.unshift( new THREE.Vector3(0.0,0.0,0.0) );
		intersects.pop();
		isOn.unshift( false );
		isOn.pop();
		uniforms.intersects.value = intersects;
		uniforms.isOn.value = isOn;
	}

	uniforms.time.value = clock.getElapsedTime() * 10;

	resizeMain();
	mainRenderer.render( mainScene, mainCamera );

	//resizeHUD();
	//hudRenderer.render( hudScene, hudCamera );

	requestAnimationFrame( render );

}

$('html').mousedown( function(e){

	if( !paused )
		if( e.which === 1 ){
			leftDown = true;
		}else if( e.which === 2 ){
			rotateDown = true;
		}else if( e.which === 3 ){
			rotateDown = true;
			e.preventDefault();
			return false; 
		}

});

document.oncontextmenu = function() {
    return false;
}

$('html').mouseup( function(e){

	if( !paused )
		if( e.which === 1 ){
			leftDown = false;
		}else if( e.which === 2 ){
			rotateDown = false;
		}else if( e.which === 3 ){
			rotateDown = false;
			e.preventDefault();
			return false; 

		}

});

window.addEventListener("mousemove", function(e){ handleMouseMovement(e); } , false);

function handleMouseMovement(e){

	const newX = ( event.clientX / window.innerWidth ) * 2 - 1;
	const newY = -( event.clientY / window.innerHeight ) * 2 + 1;

	const dX = newX - mouse.x;
	const dY = newY - mouse.y;

	if(rotateDown)
		rotateCamera(mainCamera, dX, dY);

	raycaster.setFromCamera( mouse, mainCamera );
	var rayIntersects = raycaster.intersectObject( sphere );

	if( leftDown && rayIntersects.length >= 1 ){
		var intersect = rayIntersects[0];
		intersects.unshift( intersect.point );
		intersects.pop();
		isOn.unshift( true );
		isOn.pop();
		uniforms.intersects.value = intersects;
		uniforms.isOn.value = isOn;
	}

	mouse.x = newX;
	mouse.y = newY;
	
}

document.addEventListener( 'wheel', function(e){

	if( !paused )
		if( e.deltaY < 0 ){
			var spherical = new THREE.Spherical();
			spherical.setFromVector3( mainCamera.position );
			spherical.radius = 10;
			var mis = new THREE.Vector3();
			mis.setFromSpherical(spherical);
			mainCamera.position.lerp( mis , 0.1 );
		}else{
			var spherical = new THREE.Spherical();
			spherical.setFromVector3( mainCamera.position );
			spherical.radius = 40;
			var max = new THREE.Vector3();
			max.setFromSpherical(spherical);
			mainCamera.position.lerp( max , 0.1 );
		}

}.bind(this) );

function rotateCamera(camera , dX, dY){
	var quat = new THREE.Quaternion().setFromUnitVectors( camera.up, new THREE.Vector3( 0, 1, 0 ) );
	var offset = camera.position.clone();

	offset.applyQuaternion( quat );

	var spherical = new THREE.Spherical();
	spherical.setFromVector3( offset );

	spherical.phi += dY*3;
	spherical.theta -= dX*3;

	spherical.phi = Math.max( Math.min(spherical.phi, Math.PI - 0.02) , 0.02);

	offset.setFromSpherical( spherical );

	offset.applyQuaternion( quat.clone().inverse() );

	camera.position.copy( offset );
	camera.lookAt( mainScene.position );
}