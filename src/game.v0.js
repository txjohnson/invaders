var canvas = document.getElementById("renderCanvas");
var sceneToRender = null;
var camera = null;
var player = null;
var engine = null;
var scene  = null;

const PLAYER_MOVE_STEP = .1;
const CAMERA_MOVE_STEP = .1;
const LANE_HEIGHT      = 2;
const PLAYFIELD_TOP    = 14;
const PLAYFIELD_MINX   = -14;
const PLAYFIELD_MAXX   = 14;

let playerMoveDir  = 0;
let playerMaterial;

let cameraMoveDir = 0;

let invaders = [];
let invaderMaterial = [];
let invadersAlive = 0;
let invadersSoFar = 0;
let invaderDescent = [0, 0, 0, 0, 0, 4, 8, 12];

// games stats
let gameLevel = 5;

function createInvader(x, y, s, mny, mxy) {
    let invader = BABYLON.MeshBuilder.CreateBox("invader" + invadersSoFar, 
    { height: 0.5, depth: 1, width: 2 }, 
    scene);
    invadersSoFar++;
    invader  .position.y = 0.5;
    invader  .position.x = random (-14, 14);
    invader  .position.z = y;
    invader  .minHeight  = mny;
    invader  .maxHeight  = mxy;
    invader  .material = invaderMaterial[2];
    invader  .health  = invaderMaterial.length;
    invader  .direction = random(0, 1) === 0 ? -1 : 1
    invader  .isHit = false
    invader  .shipSpeed = s;
    invaders .push(invader)
}

function createInvaders () {
    invadersAlive = (gameLevel <= 4) ? 2 + (2 * gameLevel) : 10;
    const shipSpeed = Math.min(gameLevel * 0.05, 1);
    const descent
        = (gameLevel < invaderDescent.length) ? invaderDescent[gameLevel] : 16; 
    invaders = [];

    for (let i = 0; i < invadersAlive; i++) {
        const x = random(-20, 20);
        const y = PLAYFIELD_TOP - (descent + LANE_HEIGHT * i)
        createInvader (x, y, shipSpeed, y - 2, y + 2);
        console.log('ship ' + i + 'at x: ' + x + '; y: ' + y + ';');
    }
}

function createMaterials () {
    playerMaterial = new BABYLON.StandardMaterial("playerMaterial", scene);
	playerMaterial.diffuseColor = new BABYLON.Color3(0.25, 0.25, 1);

    let ic1 = new BABYLON.StandardMaterial("invaderMaterial1", scene);
	ic1.diffuseColor = new BABYLON.Color3(1.0, 0.25, 0.25);
    let ic2 = new BABYLON.StandardMaterial("invaderMaterial2", scene);
	ic2.diffuseColor = new BABYLON.Color3(0.75, 0.25, 0.25);
    let ic3 = new BABYLON.StandardMaterial("invaderMaterial3", scene);
	ic3.diffuseColor = new BABYLON.Color3(0.50, 0.25, 0.25);
    invaderMaterial .push(ic1);
    invaderMaterial .push(ic2);
    invaderMaterial .push(ic3);
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
    createInvaders();
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

function moveInvaders () {
    for (let i = 0; i < invaders.length; i++) {
        const ship = invaders [i]
        if (ship.health > 0) {
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
}

function moveCamera () {
    camera.position.y += cameraMoveDir * CAMERA_MOVE_STEP;
    camera.setTarget(BABYLON.Vector3.Zero());
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
        moveInvaders();
        moveCamera();
        sceneToRender.render();
    }
}