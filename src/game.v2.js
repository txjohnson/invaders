var canvas = document.getElementById("renderCanvas");
var sceneToRender = null;
var camera = null;
var player = null;
var engine = null;
var scene  = null;

// some constants to make it easier to tweak game settings
const PLAYER_MOVE_STEP = .1;
const CAMERA_MOVE_STEP = .1;
const LANE_HEIGHT      = 4;
const PLAYFIELD_TOP    = 14;
const PLAYFIELD_MINX   = -14;
const PLAYFIELD_MAXX   = 14;

// variables that handle motion for the player and camera
let playerMoveDir  = 0;
let cameraMoveDir = 0;

// variables that represent the appearance of objects on screen
let playerMaterial;
let invaderMaterial = [];

// invader details
let invaders = [];
let invadersSoFar = 0;
let invadersAlive = 0;
let invaderDescent = [0, 0, 0, 0, 0, 4, 8, 12];
// games stats
let gameLevel = 1;

let invader

function createInvader(x, y, s, mny, mxy) {
    let invader = BABYLON.MeshBuilder.CreateBox("invader" + invadersSoFar, 
    { height: 0.5, depth: 1, width: 2 }, 
    scene);
    invadersSoFar++;
    invader  .position.y = 0.5;
    invader  .position.x = random (-20, 20);
    invader  .position.z = y;
    invader  .minHeight  = mny;
    invader  .maxHeight  = mxy;
    invader  .material = invaderMaterial[2];
    invader  .isAlive = true;
    invader  .health  = invaderMaterial.length;
    invader  .direction = random(0, 1) === 0 ? -1 : 1
    invader  .isHit = false
    invader  .shipSpeed = s;
    invaders .push(invader)
}

function createInvaders () {
    const shipSpeed = Math.min(gameLevel * 0.05, 1);
    const descent
        = (gameLevel < invaderDescent.length) ? invaderDescent[gameLevel] : 16; 
    invadersAlive = (gameLevel <= 4) ? 2 + (2 * gameLevel) : 10
    invaders = [];
    
    for (let i = 0; i < invadersAlive; i++) {
        const ship = {}
        const x = random(-20, 20);
        const y = PLAYFIELD_TOP - (descent + LANE_HEIGHT * i)
        createInvader (x, y, shipSpeed, y - 2, y + 2);
        console.log('ship ' + i + 'at x: ' + x + '; y: ' + y + ';');
    }
}

function createMaterials () {
    playerMaterial = new BABYLON.StandardMaterial("playerMaterial", scene);
	playerMaterial.diffuseColor = new BABYLON.Color3(0.25, 0.25, 1);

    let c1 = new BABYLON.StandardMaterial("invaderMaterial1", scene);
	c1.diffuseColor = new BABYLON.Color3(1.0, 0.25, 0.25);
    let c2 = new BABYLON.StandardMaterial("invaderMaterial2", scene);
	c2.diffuseColor = new BABYLON.Color3(0.75, 0.25, 0.25);
    let c3 = new BABYLON.StandardMaterial("invaderMaterial3", scene);
	c3.diffuseColor = new BABYLON.Color3(0.50, 0.25, 0.25);

    invaderMaterial.push(c1);
    invaderMaterial.push(c2);
    invaderMaterial.push(c3);
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
    createInvaders ();
    return scene;
}


function onKeyDown (kb) {
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

function moveInvaders () {
    for (let i = 0; i < invaders.length; i++) {
        const ship = invaders [i]
        ship.position.x += ship.direction * ship.shipSpeed;
        if (ship.position.x < PLAYFIELD_MINX) {
            ship.position.x = PLAYFIELD_MINX;
            ship.direction *= -1
        } 
        else if (ship.position.x >= PLAYFIELD_MAXX) {
            ship.position.x = PLAYFIELD_MAXX;
            ship.direction *= -1
        }

        ship.position.z += random(-1, 1) / 20;
        ship.position.z = bounded(ship.position.z, ship.minHeight, ship.maxHeight);
        if (random(1, 100) === 1) {
            ship.direction *= -1
        }
    }
}

function random (min, max) {
    return min + Math.floor(Math.random() * (max - min + 1))
}

function bounded (x, min, max) {
    return Math.max(Math.min(x, max), min)
}

function gameLoop () {
    if (sceneToRender && sceneToRender.activeCamera) {
        movePlayer ();
        moveCamera();
        moveInvaders ();
        sceneToRender.render();
    }
}