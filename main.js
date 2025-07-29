const header = {
    interactions: document.getElementById('interaction-select-container'),
};

// GameControl
var mainController;

// Views
var canvasView;
var isMobile;
var stepper = document.getElementById('stepper');
var autostepper = document.getElementById('auto-stepper');
var infoblock = document.getElementById('infoblock');
var undobutton = document.getElementById('undobutton');
var resetbutton = document.getElementById('resetbutton');
var zoomOutButton = document.getElementById('zoom-out');
var zoomInButton = document.getElementById('zoom-in');

function init() {
    // select game type
    isMobile = testMobile();

    // initialize singletons
    canvasView = new GameView(document.getElementById('main-canvas'));
    mainController = new MainController();

    stepper.addEventListener("click", () => mainController.stepSequence());
    undobutton.addEventListener("click", () => mainController.undoStep());
    resetbutton.addEventListener("click", () => mainController.reset());
    zoomOutButton.addEventListener("click", () => {
        canvasView.radius-= 5;
        canvasView.setShot();
    });
    zoomInButton.addEventListener("click", () => {
        canvasView.radius+= 5;
        canvasView.setShot();
    });

    window.addEventListener('keydown', (e) => {
        switch(e.key.toLowerCase()) {
            case ' ': mainController.stepSequence(); break;
            case 'q': case 'backspace': mainController.undoStep(); break;
            case 'p': mainController.reset(); break;
            case 'v': autostepper.checked = !autostepper.checked; break;
            case '2': mainController.stepSequence(1); break;
            case '3': mainController.stepSequence(2); break;
            case '4': mainController.stepSequence(3); break;
            case '5': mainController.stepSequence(4); break;
            case '6': mainController.stepSequence(5); break;
            case '7': mainController.stepSequence(6); break;
            case '8': mainController.stepSequence(7); break;
            case '9': mainController.stepSequence(8); break;
            case '-': canvasView.radius -= 5; canvasView.setShot(); break;
            case '=': canvasView.radius += 5; canvasView.setShot(); break;
            case 't': mainController.tileDraw = !mainController.tileDraw; mainController.exportTileMap(); break;
                break;
        }
    });

    layouts.forEach((el, i) => {
        if (el.active) {
            addInteractionButton(el.name, i);
        }
    })

    let data = SaveManager.loadHistoricData();
    mainController.setupBoard(layouts[gameConfig.defaultLayout], data);
}

function addInteractionButton(text, index) {
    var newButton = document.createElement('button');
    newButton.classList.add('interaction-select-button');
    newButton.innerHTML = text;
    newButton.onclick = () => {
        mainController.setupBoard(layouts[index]);
        document.activeElement.blur();
    }
    header.interactions.appendChild(newButton);
}

init();
