// constants that can be tweaked
const PLAYER_MOVE_STEP = 0.1;
const PLAYER_SHOT_STEP = 0.25;
const CAMERA_MOVE_STEP = 0.1;
const LANE_HEIGHT      = 3;
const PLAYFIELD_TOP    = 28;
const PLAYFIELD_MINX   = -14;
const PLAYFIELD_MAXX   = 14;
const CANON_OFFSETX    = 0;
const CANON_OFFSETY    = 1;

// game variables
var canvas = document.getElementById("renderCanvas");
var sceneToRender = null;
var camera = null;
var player = null;
var engine = null;
var scene  = null;

let uid = 0;
let playerMoveDir  = 0;
let playerMaterial;

let cameraMoveDir = 0;

let invaders = [];
let invaderMaterial = [];
let invadersAlive = 0;
let invaderDescent = [0, 0, 0, 0, 0, 1, 2, 4, 6];

let canons = [];

// games stats
let gameLevel = 10;

function createCanon (size, target) {
    let canon = BABYLON.MeshBuilder.CreateBox(getUID('canon'), 
    { height: 0.1, depth: size, width: 0.2 }, 
    scene);
    canon .speed = 0;
    canon .isHit = false;
    canon .isLive = false;
    canon .direction = 0;
    canon .setEnabled (false);
    canon .actionManager = new BABYLON.ActionManager(scene);
    canon .actionManager.registerAction (
        new BABYLON.ExecuteCodeAction (
            {trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
             parameter: target},
            (who) => {
                target .isHit = true;
                who .isHit = true; }
    ));

    canons .push (canon);
    return canon;
}

function createPlayer () {
    player = BABYLON.MeshBuilder.CreateBox("playerShip", 
    { height: 0.5, depth: 1, width: 2 }, 
    scene);
    player .position.y = 0.5;
    player .position.z = -14.0
    player .material = playerMaterial;
    player .canon = createCanon (0.8);
}

function createInvader(x, y, s, mny, mxy) {
    let invader = BABYLON.MeshBuilder.CreateBox(getUID('invader'), 
    { height: 0.5, depth: 1, width: 2 }, scene);
    invader  .position.y = 0.5;
    invader  .position.x = x;
    invader  .position.z = y;
    invader  .minHeight  = mny;
    invader  .maxHeight  = mxy;
    invader  .material = invaderMaterial[2];
    invader  .health  = invaderMaterial.length;
    invader  .direction = random(0, 1) === 0 ? -1 : 1
    invader  .isHit = false
    invader  .shipSpeed = s;
    invader  .canon = createCanon (0.4);

    invaders .push(invader)
}

function createInvaders () {
    invadersAlive = (gameLevel <= 4) ? 2 + (2 * gameLevel) : 10;
    const shipSpeed = Math.min(gameLevel * 0.05, 1);
    const descent
        = (gameLevel < invaderDescent.length) ? invaderDescent[gameLevel] : invaderDescent[invaderDescent.length - 1]; 
    invaders = [];

    for (let i = 0; i < invadersAlive; i++) {
        const x = random(-14, 14);
        const y = PLAYFIELD_TOP - (descent + LANE_HEIGHT * i)
        createInvader (x, y, shipSpeed, y - 2, y + 2);
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

    // Our built-in 'ground' shape.
    var ground = BABYLON.MeshBuilder.CreateGround("ground", {
        width: 30, height: 60}, scene);

    scene.onKeyboardObservable.add (playerInput);
    createPlayer ();
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

function tryFireInvaderCanon(ship) {
    const minSpeed = scale (bounded(Math.floor(gameLevel / 2), 1, 10), 1, 10, 0.02, 0.2);
    const maxSpeed = scale (bounded(gameLevel, 4, 15), 4, 15, 0.08, 0.3);

    if (ship.canon.isLive === false) {
        ship.canon.position.x = ship.position.x + CANON_OFFSETX;
        ship.canon.position.z = ship.position.z - CANON_OFFSETY;
        ship.canon.speed = frandom(minSpeed, maxSpeed)
        console.log ("speed is ", ship.canon.speed);
        ship.canon.direction = -1;
        ship.canon.isHit = false
        ship.canon.isLive = true
        ship.canon.material = ship.material;
        ship.canon.setEnabled (true);
    }
}

function movePlayer () {
    player.position.x += playerMoveDir * PLAYER_MOVE_STEP;
    if (player.canon.isLive === false) {
        player.canon.position.x = player.position.x + CANON_OFFSETX;
        player.canon.position.z = player.position.z + CANON_OFFSETY;
        player.canon.speed = PLAYER_SHOT_STEP;
        player.canon.direction = 1;
        player.canon.isHit = false;
        player.canon.isLive = true;
        player.canon.material = player.material;
        player.canon.setEnabled (true);
    }
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

            tryFireInvaderCanon (ship);
        }
    }
}

function moveCanons () {
    for (let i = 0; i < canons.length; i++) {
        const canon = canons[i];
        if (canon.isLive === true) {
            canon.position.z += canon.direction * canon.speed;
            if (canon.position.z < -15 || canon.position.z > PLAYFIELD_TOP + LANE_HEIGHT) {
                canon.isLive = false;
                canon.setEnabled (false);
            }
        }
    }
}

function moveCamera () {
    camera.position.y += cameraMoveDir * CAMERA_MOVE_STEP;
    camera.setTarget(BABYLON.Vector3.Zero());
}

function scale (n, nmin, nmax, rmin, rmax) {
/*
           (b-a)(x - min)
    f(x) = --------------  + a
              max - min
*/
    return ((rmax - rmin) * (n - nmin))/(nmax - nmin) + rmin;
}

function random (min, max) {
    return min + Math.floor(Math.random() * (max - min + 1))
}

function frandom (min, max) {
    return min + Math.random() * (max - min + 1);
}

function bounded (x, min, max) {
    return Math.max(Math.min(x, max), min)
}

function getUID (s) {
    uid++;
    return `${s}${uid}`;
}

function gameLoop () {
    if (sceneToRender && sceneToRender.activeCamera) {
        movePlayer ();
        moveInvaders();
        moveCanons ();
        moveCamera();
        sceneToRender.render();
    }
}