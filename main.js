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

function init() {
    // select game type
    isMobile = testMobile();

    // initialize singletons
    canvasView = new GameView(document.getElementById('main-canvas'));
    mainController = new MainController();

    stepper.addEventListener("click", () => mainController.stepSequence());
    undobutton.addEventListener("click", () => mainController.undoStep());
    resetbutton.addEventListener("click", () => mainController.reset());

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
                break;
        }
    });

    addInteractionButton('Basic Hex', 0);
    // addInteractionButton('TestReplay', 1);
    addInteractionButton('SmallerBoard', 2);
    addInteractionButton('GiantLimitedBoard', 3);
    addInteractionButton('GiantLimitedPopulated', 4);
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

class MainController {
    ticker = new JMTicker(gameConfig.framerate);
    andDraw = true;
        
    data;
    historicData = {};

    paletteLeft = 200;
    paletteY = 650;
    paletteP = 140;

    pointerPosition;
    selectedPaletteIndex = -1;

    draggingBoard = null;

    constructor() {
        this.ticker.onTick = this.onTick;
        this.ticker.start();

        canvasView.canvas.onPointerDown = (e) => {
            this.pointerPosition = e;
            if (Math.abs(this.paletteY - e.y) < 100) {
                let x = Math.round((e.x - this.paletteLeft) / this.paletteP);

                if (x >= 0 && x < this.historicData.layout.numPalette && this.data.palette[x]) {
                    this.selectedPointerIndex = x;
                    return;
                }
            }
            if (e.y < this.paletteY - 100) {
                this.draggingBoard = {x: e.x - canvasView.offset.x, y: e.y - canvasView.offset.y};
            }
        }

        canvasView.canvas.onPointerUp = (e) => {
            this.draggingBoard = null;

            if (this.selectedPointerIndex >= 0) {
                let offset = 10;
                if (isMobile) {
                    offset = 10 - 80;
                }
                var loc = canvasView.getTileFromGlobal(e.x, e.y + offset);

                if (e.y < this.paletteY - 100) {
                    if (loc.x >= 0 && loc.y < this.data.width && loc.y >= 0) {
                        var index = loc.x + loc.y * this.data.width;
                        if (index < this.data.board.length && this.data.board[index].hp >= 0) {                        
                            if (this.data.board[index] && this.data.board[index].stack.length === 0) {
                                this.historicData.history.push(this.data);
                                SaveManager.saveHistoricData(this.historicData);
                                this.data = StackManager.cloneData(this.data);

                                if (this.data.board[index].hp > 0) {
                                    if (this.data.board[index].hp === 1) {
                                        this.data.board[index].hp = -1;
                                    } else {
                                        this.data.board[index].hp--;
                                    }
                                }
                                StackManager.placeFromPalette(this.data, index, this.selectedPointerIndex, this.historicData.layout);
                            }
                        }
                    }
                }

                this.selectedPointerIndex = -1;
            }
        }

        canvasView.canvas.onPointerMove = (e) => {
            if (isMobile) {
                this.pointerPosition = {x: e.x, y: e.y - 80};
            } else {
                this.pointerPosition = e;
            }

            if (this.draggingBoard) {
                canvasView.offset.x = e.x - this.draggingBoard.x;
                canvasView.offset.y = e.y - this.draggingBoard.y;
            }
        }
    }

    setupBoard(layout, historicData) {
        if (historicData) {
            this.historicData = historicData;
            this.data = this.historicData.history[this.historicData.history.length - 1];
            if (!this.data) this.setupBoard(layout);
            canvasView.offset = {x: this.historicData.layout.offset.x || 0, y: this.historicData.layout.offset.y || 0};
            return;
        } else {
            this.historicData = {
                layout,
                history: []
            };
            canvasView.offset = {x: this.historicData.layout.offset.x || 0, y: this.historicData.layout.offset.y || 0};

            SaveManager.clearHistoricData();
        }

        var board = [];
        var width = 0;

        var cells = layout.board.split(`
`).map(el => [...el.trim()]);
        
        width = cells[0].length;
        cells.forEach((row, y) => {
            row.forEach((el, x) => {
                if (el === '1') {
                    board[x + y * width] = {lastI: 0, x, y, stack: [], hp: layout.tileHp || 0};
                }
            });
        });

        layout.stacks.forEach(stack => {
            board[stack.x + stack.y * width].stack = stack.stack.map(el => el);
        });

        this.data = {board, width, palette: [], paletteSpawnIndex: 0, currentInteraction: 0, score: 0, time: 0};
        StackManager.nextPaletteSet(this.data, this.historicData.layout);
    }

    reset = () => {
        this.historicData = {};
        SaveManager.clearHistoricData();
        this.setupBoard(layouts[gameConfig.defaultLayout]);
    }

    undoStep = () => {
        if (this.historicData.history.length > 0) this.data = this.historicData.history.pop();
        SaveManager.saveHistoricData(this.historicData);
    }

    autoStepDelay = 500;
    autoStepCount = 0;

    onTick = () => {
        if (this.andDraw) {
            canvasView.drawFrame();
        }

        stepper.disabled = !this.canStep();

        if (autostepper.checked) {
            this.autoStepCount -= this.ticker.framerate;
            if (this.autoStepCount <= 0) {
                this.autoStepCount = this.autoStepDelay;
                this.stepSequence();
            }
        }

        this.data.time += this.ticker.framerate;

        this.updateInfo();
    }

    draw = () => {
        this.drawFromData(this.data);

        canvasView.canvas.drawRect(0, this.paletteY - 100, gameConfig.canvasWidth, gameConfig.canvasHeight - this.paletteY + 100, "#eeeeee", '#eeeeee');

        this.data.palette.forEach((stack, i) => {
            if (stack) {
                stack.forEach((el, j) => {
                    if (i === this.selectedPointerIndex) {
                        canvasView.drawPaletteTile(this.pointerPosition.x, this.pointerPosition.y, j, Colors.INDEXED[el]);
                    } else {
                        canvasView.drawPaletteTile(this.paletteLeft + i * this.paletteP, this.paletteY, j, Colors.INDEXED[el]);
                    }
                });
            }
        });
    }

    drawFromData(data) {
        data.board.forEach(spot => {
            if (spot && spot.hp >= 0) {
                canvasView.drawSpot(spot.x, spot.y, spot.hp);
            }
        });
        data.board.forEach(spot => {
            if (spot) {
                spot.stack.forEach((color, i) => canvasView.drawTile(spot.x, spot.y, i, Colors.INDEXED[color]));
            }
        });
    }

    /////

    canStep() {
        return StackManager.findAllGroups(this.data).length > 0 || StackManager.findTens(this.data).length > 0;
    }

    stepSequence = (i = 0) => {
        var groups = StackManager.findAllGroups(this.data);
        // console.log(groups);
        if (groups.length > 0) {
            this.resolveGroups(i);
        } else {
            StackManager.clearTens(this.data);
        }
    }

    resolveGroups = (finalIndex = 0) => {
        let closed = [];
        let open = [{data: this.data, prev: null}];

        while(open.length > 0) {
            let obj = open.shift();

            let groups = StackManager.findAllGroups(obj.data);
            if (groups.length > 0) {
                groups.forEach(group => {
                    for (var a = 0; a < group.length; a++) {
                        for (var b = a + 1; b < group.length; b++) {
                            if (StackManager.measureDistance(group[a], group[b]) === 1) {
                                newData = StackManager.cloneData(obj.data);
                                StackManager.moveTopColorFromTo(newData.board[group[b].x + group[b].y * newData.width].stack, newData.board[group[a].x + group[a].y * newData.width].stack);
                                open.push({data: newData, prev: obj});
    
                                var newData = StackManager.cloneData(obj.data);
                                StackManager.moveTopColorFromTo(newData.board[group[a].x + group[a].y * newData.width].stack, newData.board[group[b].x + group[b].y * newData.width].stack);
                                open.push({data: newData, prev: obj});
                            }
                        }
                    }
                });
            } else {
                closed.push(obj);
            }
        }

        closed.forEach(obj => obj.analysis = this.analysePosition(obj));

        closed.sort((a, b) => {
            if (a.analysis.sections < b.analysis.sections) return -1;
            if (b.analysis.sections < a.analysis.sections) return 1;

            if (a.analysis.biggestSection >= 10 && b.analysis.biggestSection < 10) return -1;
            if (b.analysis.biggestSection >= 10 && a.analysis.biggestSection < 10) return 1;

            if (b.analysis.blanks < 3 && a.analysis.blanks > b.analysis.blanks) return -1;
            if (a.analysis.blanks < 3 && b.analysis.blanks > a.analysis.blanks) return 1;

            if (a.analysis.blanks < b.analysis.blanks) return -1;
            if (b.analysis.blanks < a.analysis.blanks) return 1;

            if (a.analysis.indexStacks > b.analysis.indexStacks) return -1;
            if (b.analysis.indexStacks > a.analysis.indexStacks) return 1;

            if (a.analysis.indexStacks === 1 && b.analysis.indexStacks !== 1) return -1;
            if (b.analysis.indexStacks === 1 && a.analysis.indexStacks !== 1) return 1;

            if (a.analysis.proximityToLastStack > b.analysis.proximityToLastStack) return -1;
            if (b.analysis.proximityToLastStack > a.analysis.proximityToLastStack) return 1;
        });

        this.historicData.history.push(this.data);
        SaveManager.saveHistoricData(this.historicData);
        if (closed.length > 0) {
            this.data = StackManager.cloneData(closed[Math.min(closed.length -1, finalIndex)].analysis.path[1].data);
        }

        console.log(closed.map(el => el.analysis));
        console.log(closed);
    }

    analysePosition(obj) {

        let path = [obj];
        let prev = obj;
        while (prev.prev) {
            path.unshift(prev.prev);
            prev = prev.prev;
        }

        let blanks = StackManager.numBlankSpots(obj.data);
        let sections = StackManager.numSections(obj.data);
        let lastIndex = obj.data.board.reduce((top, c) => c ? Math.max(c.lastI, top) : top, 0);
        let lastStack = obj.data.board.find(el => el && el.lastI === lastIndex);
        let indexStacks = StackManager.getColorOrder(lastStack.stack).length;
        let biggestSection = StackManager.getBiggestSection(obj.data);

        let proximityToLastStack = obj.data.board.reduce((total, c) => {
            if (!c) return total;
            var distance = StackManager.measureDistance(c, lastStack);
            return total + StackManager.getColorOrder(c.stack).length / (distance + 1);
        }, 0)

        return {path, blanks, proximityToLastStack, sections, lastIndex, indexStacks, biggestSection};
    }

    updateInfo() {
        var txt = '';

        txt += `<br>Score: ${this.data.score}`;
        txt += `<br>Number of Moves: ${this.data.currentInteraction}`;
        
        txt += `<br>Time: ${makeTimeString(this.data.time)}`;
        infoblock.innerHTML = txt;
    }
}

class GameView {
    canvas;
    vfx = [];
    left = 200;
    top = 100;
    radius = 50;
    heightAmount = 5;
    short;

    tilt = 0.9;

    xx = 0.85;
    xy = 0.5;
    yx = -0.42;
    yy = 0.75;

    offset = {x: 0, y: 0};

    constructor(canvasElement) {
        this.canvas = new CanvasRender(gameConfig.canvasWidth, gameConfig.canvasHeight, canvasElement);

        this.short = this.radius * Math.sin(2 * Math.PI / 6) * 2;
    }

    drawSpot(x, y, hp) {
        var global = this.getGlobalFromTile(x, y);
        var color = '#cccccc';
        if (hp === 1) {
            color = '#ffcccc';
        } else if (hp === -1) {
            color = '#eeeeee';
        }
        this.canvas.drawHexagon2(global.x,
                                global.y,
                                this.radius, 0.6, color, 1, this.tilt);
    }

    drawTile(x, y, height, color) {
        var baseX = x - (y % 2 === 1 ? 0.5 : 0);
        var baseY = y;
        this.canvas.drawHexagon2(this.offset.x + this.left + baseX * this.xx * this.short + baseY * this.yx * this.short,
                                this.offset.y + (this.top + baseX * this.xy * this.short + baseY * this.yy * this.short) * this.tilt - height * this.heightAmount,
                                this.radius, 0.7, color, 1, this.tilt);

    }

    drawPaletteTile(x, y, height, color) {
        this.canvas.drawHexagon2(x, y - height * this.heightAmount, this.radius, 0.7, color, 1, this.tilt);
    }

    getTileFromGlobal(x, y) {
        x -= this.offset.x;
        y -= this.offset.y;
        var point = {x: 0, y: 0};
        var point0 = {x: this.left, y: this.top};
        var point1 = {x: this.left + this.short * this.xx, y: this.top + this.short * this.xy * this.tilt};
        var point2 = {x: this.left + this.short * this.yx, y: this.top + this.short * this.yy * this.tilt};
        var dX = ((point2.y - point0.y) * x - (point2.x - point0.x) * y + point2.x * point0.y - point2.y * point0.x) / Math.sqrt((point2.y - point0.y) * (point2.y - point0.y) + (point2.x - point0.x) * (point2.x - point0.x));
        var dY = -((point1.y - point0.y) * x - (point1.x - point0.x) * y + point1.x * point0.y - point1.y * point0.x) / Math.sqrt((point1.y - point0.y) * (point1.y - point0.y) + (point1.x - point0.x) * (point1.x - point0.x));
        dX /= this.short;
        dY /= this.short * this.tilt * this.tilt;


        point.y = Math.round(dY);
        if (point.y % 2 === 1) {
            dX += 1;
        }
        point.x = Math.round(dX);
        return point;
    }

    getGlobalFromTile(x, y) {
        var point = {x: 0, y: 0};

        x = x - (y % 2 === 1 ? 0.5 : 0);

        point.x = this.left + this.short * (x * this.xx + y * this.yx) + this.offset.x;
        point.y = (this.top + this.short * (x * this.xy + y * this.yy)) * this.tilt + this.offset.y;

        return point;
    }

    drawFrame() {
        this.canvas.clear();
        if (!this.imageData) {
            this.imageData = this.makeImageData();
            this.cycleStripes(this.imageData);
        }
        
        this.canvas.Graphic.putImageData(this.imageData, 0, 0);
        // this.canvas.drawBackground('#eeeeee');

        // draw the game and any added vfx
        mainController.draw(this.canvas);

        for (var i = this.vfx.length - 1; i >= 0; i--) {
            this.vfx[i].update(this.canvas);
            if (this.vfx[i].isComplete) {
                this.vfx.splice(i, 1);
            }
        }
    }

    imageData;

    randomImage(imageData) {
        var red = 0;
        var green = 1;
        var blue = 2;
        var alpha = 3;
        var per = 0.5;
        var value = 220;

        for (var i = 0; i < imageData.data.length; i++) {
            if (i % 4 === alpha) {
                imageData.data[i] = 255;
                // imageData.data[i] = (Math.random() < per) ? value : 0;
            } else if (i % 4 === red) {
                imageData.data[i] = (Math.random() < per) ? value : 255;
                // imageData.data[i] = (Math.random() < per) ? value : 0;
            } else if (i % 4 === blue) {
                imageData.data[i] = (Math.random() < per) ? value : 255;
                // imageData.data[i] = (Math.random() < per) ? value : 0;
            } else if (i % 4 === green) {
                imageData.data[i] = (Math.random() < per) ? value : 255;
            }
        }
    }

    stripeWidth = 0;

    cycleStripes(imageData) {
        var red = 0;
        var green = 1;
        var blue = 2;
        var alpha = 3;
        // var per = 0.5;
        // var width = 32;
        var width = 57;
        // this.stripeWidth += 0.1;
        // var width = Math.floor(this.stripeWidth);
        var lowValue = 220;
        var highValue = 230;

        for (var i = 0; i < imageData.data.length; i++) {
            if (i % 4 === alpha) {
                imageData.data[i] = 255;
            } else {
                var amt = Math.floor(i / 4);
                if (amt % (width * 2) < width) {
                    imageData.data[i] = lowValue;
                } else {
                    imageData.data[i] = highValue;
                }
            }
        }

    }

    makeImageData() {
        return this.canvas.Graphic.createImageData(gameConfig.canvasWidth, gameConfig.canvasHeight);
    }
}

init();
