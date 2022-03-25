function startRenderLoop (engine, canvas) {
    engine.runRenderLoop (gameLoop);
}

window.initFunction = async function() {

    var asyncEngineCreation = async function() {
        try {
            return createDefaultEngine();

        } catch(e) {
            console.log("the available createEngine function failed. Creating the default engine instead");
            return createDefaultEngine();
        }
    }

    window.engine = await asyncEngineCreation();

    if (!engine) throw 'engine should not be null.';

    startRenderLoop(engine, canvas);

    // createScene ();
    // window.scene = scene;
    // startNextLevel ();

    createScene().then (s => {
        console.log('after createScene()');
        window.scene = s; 
        startNextLevel(); });
};

initFunction().then(() => {
    sceneToRender = scene                    
});

// Resize
window.addEventListener("resize", function () {
    engine.resize();
});
