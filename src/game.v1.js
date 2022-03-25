var canvas = document.getElementById("renderCanvas");
var sceneToRender = null;
var camera = null;
var player = null;
var engine = null;
var scene  = null;

const PLAYER_MOVE_STEP = .1;
let playerMoveDir  = 0;
const CAMERA_MOVE_STEP = .1;
let cameraMoveDir = 0;

let invaders = [];
let playerMaterial;
let invaderMaterial;
let invadersSoFar = 0;

function createInvader(x, y) {
    let invader = BABYLON.MeshBuilder.CreateBox("invader" + invadersSoFar, 
    { height: 0.5, depth: 1, width: 2 }, 
    scene);
    invadersSoFar++;
    invader .position.y = 0.5;
    invader .position.x = x;
    invader .position.z = y;
    invader .material = invaderMaterial;
    invaders .push(invader)
}

function createMaterials () {
    playerMaterial = new BABYLON.StandardMaterial("playerMaterial", scene);
	playerMaterial.diffuseColor = new BABYLON.Color3(0.25, 0.25, 1);

    invaderMaterial = new BABYLON.StandardMaterial("invaderMaterial", scene);
	invaderMaterial.diffuseColor = new BABYLON.Color3(1.0, 0.25, 0.25);
}

function createDefaultEngine() { 
    return new BABYLON.Engine(canvas, true, { 
        preserveDrawingBuffer: true, 
        stencil: true,  
        disableWebGL2Support: false});
};

function createScene () {
    var scene = new BABYLON.Scene(engine);
    createMaterials ();

    camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 10, -30), scene);

    camera.setTarget(BABYLON.Vector3.Zero());
//    camera.attachControl(canvas, true);

    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    player = BABYLON.MeshBuilder.CreateBox("playerShip", 
    { height: 0.5, depth: 1, width: 2 }, 
    scene);
    player .position.y = 0.5;
    player.position.z = -14.0
    player .material = playerMaterial;

    // Our built-in 'ground' shape.
    var ground = BABYLON.MeshBuilder.CreateGround("ground", {
        width: 30, 
        height: 30}, scene);

    scene.onKeyboardObservable.add (playerInput);
    createInvader (0, 14);
    createInvader (4, 12);

    return scene;
}


function onKeyDown (kb) {
    console.log("KEY DOWN: ", kb.event.key);
    switch (kb.event.key) {
    case "ArrowLeft":
        playerMoveDir = -1;
        break;
    case "ArrowRight":
        playerMoveDir = 1;
        break;
    case "ArrowUp":
        cameraMoveDir = 1;
        break;
    case "ArrowDown":
        cameraMoveDir = -1;
        break;
    }
}

function onKeyUp (kb) {
    console.log("KEY UP: ", kb.event.code);
    switch (kb.event.key) {
    case "ArrowLeft":
        playerMoveDir = 0;
        hasLeftArrow = false;
        break;
    case "ArrowRight":
        playerMoveDir = 0;
        hasRightArrow = false;
        break;
    case "ArrowUp":
        cameraMoveDir = 0;
        break;
    case "ArrowDown":
        cameraMoveDir = 0;
        break;
    }
}

function playerInput (kb) {
    if (kb.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
        onKeyDown (kb);
    }
    else if (kb.type === BABYLON.KeyboardEventTypes.KEYUP) {
        onKeyUp (kb);
    }
}

function movePlayer () {
    player.position.x += playerMoveDir * PLAYER_MOVE_STEP;
}

function moveCamera () {
    camera.position.y += cameraMoveDir * CAMERA_MOVE_STEP;
    camera.setTarget(BABYLON.Vector3.Zero());
}

function gameLoop () {
    if (sceneToRender && sceneToRender.activeCamera) {
        movePlayer ();
        moveCamera();
        sceneToRender.render();
    }
}