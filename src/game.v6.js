var canvas = document.getElementById("renderCanvas");
var sceneToRender = null;
var camera = null;
var player = null;
var engine = null;
var scene  = null;

const PLAYER_MOVE_STEP = 0.1;
const PLAYER_SHOT_STEP = 0.25;
const CAMERA_MOVE_STEP = 0.1;
const LANE_HEIGHT      = 2;
const PLAYFIELD_TOP    = 15;
const PLAYFIELD_BOTTOM = -15;
const PLAYFIELD_MINX   = -14;
const PLAYFIELD_MAXX   = 14;
const CANON_OFFSETX    = 0;
const CANON_OFFSETY    = 1;
const MAX_NUM_INVADERS = 10;

let playerMoveDir  = 0;
let playerMaterial = [];
let playerMesh;

let cameraMoveDir = 0;

let invaders = [];
let invaderMaterial = [];
let invadersAlive = 0;
let invaderDescent = [0, 0, 0, 0, 0, 4, 8, 12];
let invaderMesh;

let canons = [];

// games stats
let gameLevel = 0;
let gameScore = 0;
let gameOver = false;
let uid = 0;

var hud      = null;
var hudui    = null;
var hudscore = null;
var hudlevel = null;

function createUniqueName (name) {
    uid++;
    return name + uid.toString();
}

function loadAndCreate (scene) {
    BABYLON.SceneLoader.ImportMesh ("", "./assets/", "Challenger.glb", scene, 
    function (newmesh) {
        invaderMesh = newmesh[0];
        invaderMesh .scaling.x = 0.25;
        invaderMesh .scaling.y = 0.25;
        invaderMesh .scaling.z = 0.25;
        invaderMesh .isVisible = false;
        createInvaders ();
    });
}

function setupEvents () {
    for (let i = 0; i < invaders.length; i++) {
        const invader = invaders[i];
        invader .actionManager = new BABYLON.ActionManager(scene);
        invader .actionManager.registerAction (
            new BABYLON.ExecuteCodeAction (
                {trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                 parameter: player.canon },
                (who) => {
                    console.log (who.source.id, "(", who.source.health, ")", " hit by ", player.canon.id);
                    updateScore (20);
                    player .canon .hits++;
                    who .source .hits++; }
        ));

        const canon = invaders[i].canon;
        canon .actionManager = new BABYLON.ActionManager(scene);
        canon .actionManager.registerAction (
            new BABYLON.ExecuteCodeAction (
                {trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                 parameter: {mesh: player}},
                (who) => {
                    console.log (player.id, " hit by ", who.source.id);
                    player .hits++;
                    who .source .hits++; }
        ));

        canon .actionManager.registerAction (
            new BABYLON.ExecuteCodeAction (
                {trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                 parameter: {mesh: player.canon}},
                (who) => {
                    console.log (player.canon.id, " hit by ", who.source.id);
                    updateScore (1);
                    player .canon .hits++;
                    who .source .hits++; }
        ));
    }
}

function createCanon (size) {
    let canon = BABYLON.MeshBuilder.CreateBox(createUniqueName("canon"), 
    { height: 0.1, depth: size, width: 0.2 }, 
    scene);

    canon .position.y = 0.65;
    canon .speed = 0;
    canon .direction = 0;
    canon .hits = 0;
    canon .isLive = false;
    canon .setEnabled (false);
    canons .push(canon);
    return canon;
}

function resetCanon (canon) {
    canon .isLive = false;
    canon .setEnabled (false);
}

async function createInvaders () {
    console.log('doing createInvaders()');
    let result = await BABYLON.SceneLoader.ImportMeshAsync ("", "./assets/", "Challenger.glb", scene);
    invaderMesh = result.meshes[1];
    // invaderMesh .scaling.x = 0.50;
    // invaderMesh .scaling.y = 0.50;
    // invaderMesh .scaling.z = 0.1;
    invaderMesh .isVisible = false;
    invaderMesh .setParent (null);

    for (let i = 0; i < MAX_NUM_INVADERS; i++) {
        let invader = invaderMesh.createInstance (createUniqueName("invader"));
    
        invader  .rotation   = new BABYLON.Vector3(0.0, Math.PI, Math.PI);
        invader  .position.y = 0.5;
        invader  .position.x = 0;
        invader  .position.z = 0;
        invader  .minHeight  = 0;
        invader  .maxHeight  = 0;
//        invader  .material = invaderMaterial[invaderMaterial.length - 1];
        invader  .health     = 3;
        invader  .isLive     = false;
        invader  .direction  = 0;
        invader  .hits       = 0;
        invader  .shipSpeed  = 0;
        invader  .repair     = 0;
        invader  .canon = createCanon (0.2);
        invader  .setEnabled (false);
        console.log (invader);
        invaders .push(invader)
    }
}

function resetInvaders () {
    invadersAlive = (gameLevel <= 4) ? 2 + (2 * gameLevel) : MAX_NUM_INVADERS;
    const shipSpeed = Math.min(gameLevel * 0.05, 1);
    const descent
        = (gameLevel < invaderDescent.length) ? invaderDescent[gameLevel] : 16; 

    for (let i = 0; i < invadersAlive; i++) {
        const invader = invaders [i];
        const x = random(PLAYFIELD_MINX, PLAYFIELD_MAXX);
        const y = PLAYFIELD_TOP - (descent + LANE_HEIGHT * i)
        invader  .position.x = x;
        invader  .position.z = y;
        invader  .minHeight  = y - 2.0;
        invader  .maxHeight  = y + 2.0;
        invader  .material   = invaderMaterial[invaderMaterial.length - 1];
        invader  .health     = invaderMaterial.length;
        invader  .direction  = random(0, 1) === 0 ? -1 : 1
        invader  .hits       = 0;
        invader  .shipSpeed  = shipSpeed;
        invader  .repair     = 0;
        invader  .isLive     = true;
        invader  .setEnabled (true);
        resetCanon (invader .canon);
    }
}

function resetPlayer () {
    player .health = playerMaterial.length;
    player .hits   = 0;
    player .setEnabled (true);
}

function createMaterials () {
    playerMaterial = [
        new BABYLON.StandardMaterial("playerMaterial1", scene),
        new BABYLON.StandardMaterial("playerMaterial2", scene),
        new BABYLON.StandardMaterial("playerMaterial3", scene) ];

    playerMaterial[2].diffuseColor = new BABYLON.Color3(0.10, 1.00, 1.00);
	playerMaterial[1].diffuseColor = new BABYLON.Color3(0.10, 0.75, 0.75);
	playerMaterial[0].diffuseColor = new BABYLON.Color3(0.10, 0.50, 0.50);

    invaderMaterial = [
        new BABYLON.StandardMaterial("invaderMaterial1", scene),
        new BABYLON.StandardMaterial("invaderMaterial2", scene),
        new BABYLON.StandardMaterial("invaderMaterial3", scene) ];

    invaderMaterial[2].diffuseColor = new BABYLON.Color3(1.0, 0.25, 0.25);
	invaderMaterial[1].diffuseColor = new BABYLON.Color3(0.75, 0.25, 0.25);
	invaderMaterial[0].diffuseColor = new BABYLON.Color3(0.50, 0.25, 0.25);
}

function createHUD () {
    hud   = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    hudui = new BABYLON.GUI.StackPanel();
    hudui .verticalAlignment  = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    hudui .horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT; 
    hudui .widthInPixels = 600;
    hudui .heightInPixels = 100;
    hudui .isVertical = false;
    hud   .addControl(hudui);

    hudscore = new BABYLON.GUI.TextBlock("hudscore", "Score 0");
    hudscore .widthInPixels = 300;
    hudscore .heightInPixels = 100;
    hudscore .fontSizeInPixels = 32;
    hudscore .color = "white";
    hudscore .textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    hudscore .horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT; 
    hudscore .paddingLeft = "50px";
    hudui    .addControl(hudscore);

    hudlevel = new BABYLON.GUI.TextBlock("hudlevel", "[Level 1]");
    hudlevel .widthInPixels = 300;
    hudlevel .heightInPixels = 100;
    hudlevel .fontSizeInPixels = 32;
    hudlevel .color = "white";
    hudlevel .textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    hudlevel .horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT; 
    hudlevel .paddingLeft = "50px";
    hudui    .addControl(hudlevel);
}

function createDefaultEngine() { 
    return new BABYLON.Engine(canvas, true, { 
        preserveDrawingBuffer: true, 
        stencil: true,  
        disableWebGL2Support: false});
};

async function createScene () {
    scene = new BABYLON.Scene(engine);
    createMaterials ();

    camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 10, -30), scene);

    camera.setTarget(BABYLON.Vector3.Zero());
//    camera.attachControl(canvas, true);

    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    createHUD ();

    player = BABYLON.MeshBuilder.CreateBox("playerShip", 
    { height: 0.5, depth: 1, width: 2 }, 
    scene);
    player .position.y = 0.5;
    player .position.z = -14.0
    player .hits = 0;
    player .repairSince = 0;
    player .health = playerMaterial.length;
    player .material = playerMaterial[player.health - 1];
    player .canon = createCanon (1.0);
    resetPlayer ();

    // Our built-in 'ground' shape.
    var ground = BABYLON.MeshBuilder.CreateGround("ground", {
        width: 30, 
        height: 30}, scene);

    scene.onKeyboardObservable.add (playerInput);
    await createInvaders ();
    setupEvents();
    // createInvaders().then (_ => {
    //     setupEvents (); });
    console.log('createScene finished');
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

function fireCanon (ship, dir, spd) {
    const minSpeed = scale (bounded(Math.floor(gameLevel / 2), 1, 10), 1, 10, 0.02, 0.2);
    const maxSpeed = scale (bounded(gameLevel, 4, 15), 4, 15, 0.08, 0.3);

    ship.canon.position.x = ship.position.x + CANON_OFFSETX;
    ship.canon.position.z = ship.position.z + (CANON_OFFSETY * dir);
    ship.canon.speed = (spd > 0.0) ? spd : frandom(minSpeed, maxSpeed);
    ship.canon.direction = dir;
    ship.canon.isHit = false
    ship.canon.isLive = true
    ship.canon.material = ship.material;
    ship.canon.setEnabled (true);
}

function movePlayer () {
    const repairDelta = gameScore - player.repairSince;
    if (repairDelta >= 100) {
        player .repairSince = gameScore;
        player .health = Math.min (player.health + 1, playerMaterial.length);
    }

    player .health -= player .hits;
    player .hits = 0;

    if (player .health > 0) {
        player.material = playerMaterial [player.health - 1];
        player.position.x += playerMoveDir * PLAYER_MOVE_STEP;

        if (player.canon.isLive === false) {
            fireCanon (player, 1, 0.5);
        }
    }
    else {
        player .setEnabled (0);
        gameOver = true;
    }
}

function moveCanons () {
    for (let i = 0; i < canons.length; i++) {
        const canon = canons[i];
        if (canon.hits > 0) {
            canon.isLive = false;
            canon.setEnabled (false);
            canon.hits = 0;
        }

        if (canon.isLive === true) {
            canon.position.z += canon.direction * canon.speed;
            if (canon.position.z < PLAYFIELD_BOTTOM || canon.position.z > PLAYFIELD_TOP + LANE_HEIGHT) {
                canon.isLive = false;
                canon.setEnabled (false);
            }
        }
    }
}

function moveInvaders () {
    for (let i = 0; i < invaders.length; i++) {
        const ship = invaders [i];
        if (ship .isLive === false) continue;

        ship .health -= ship.hits;
        ship .hits = 0;

        if (ship.health > 0) {
            ship.material = invaderMaterial [ship.health - 1];
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

            if (ship.canon.isLive === false) {
                fireCanon (ship, -1, 0);
            }
        }
        else {
            updateScore (10);
            ship .isLive = false;
            ship .health = 0;
            ship .setEnabled (false);
            invadersAlive --;
            if (invadersAlive <= 0) startNextLevel();
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

function frandom (min, max) {
    return min + Math.random() * (max - min + 1);
}

function bounded (x, min, max) {
    return Math.max(Math.min(x, max), min)
}

function scale (n, nmin, nmax, rmin, rmax) {
    /*
               (b-a)(x - min)
        f(x) = --------------  + a
                  max - min
    */
        return ((rmax - rmin) * (n - nmin))/(nmax - nmin) + rmin;
}

function updateScore (delta) {
    gameScore += delta;
    hudscore .text = "Score " + gameScore.toString();
}

function updateLevel () {
    hudlevel .text = "[Level " + gameLevel.toString() + "]";
}

function startNextLevel () {
    gameLevel ++;
    updateLevel ();
    resetInvaders ();
    resetPlayer ();
}
    
function gameLoop () {
    if (gameOver === true) return;

    if (sceneToRender && sceneToRender.activeCamera) {
        movePlayer ();
        moveInvaders();
        moveCanons();
        moveCamera();
        sceneToRender.render();
    }
}