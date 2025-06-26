const gameConfig = {
    framerate: 30,
    startingMoney: 100,
    maxNodes: 30,
    canvasWidth: 800,
    canvasHeight: 800,
}

const testIndex = 0;

const layouts = [
    {
        board: `011100
                011110
                111110
                011110
                011100`,
        stacks: [
        ],
    },
    {
        board: `01111100
                01111110
                11000110
                01111110
                01111100
        `,
        stacks: [
            {x: 2, y: 1, stack: [4,4,4,2,2,2,0,0,0]},
            {x: 3, y: 1, stack: [0,0,0,3,3,3,4,4,4]},
            {x: 4, y: 1, stack: [2,2,2,4,4,4,1,1,1]},
            {x: 5, y: 1, stack: [1,1,1,3,3,3,0,0,0]},
            {x: 1, y: 2, stack: [3,3,3,1,1,1,2,2,2]},
            {x: 5, y: 2, stack: [0,0,0,2,2,2,3,3,3]},
            {x: 2, y: 3, stack: [2,2,2,0,0,0,1,1,1]},
            {x: 3, y: 3, stack: [1,1,1,4,4,4,3,3,3]},
            {x: 4, y: 3, stack: [3,3,3,0,0,0,4,4,4]},
            {x: 5, y: 3, stack: [4,4,4,1,1,1,2,2,2]}
        ],

        paletteStacks: [
            [2,2,2,0,0],
            [5,5,5,5,5],
            [0,0,0,0],
            [0,5,5,4,4],
            [5,5,4,4,4,2],
            [3,3,3,3,3,3],
            [2,1,1],
            [2,2,2,4,4,4],
            [1,3,4],
            [4,4,4,1],
            [4,4,3,3,3],
            [0,6,6],
            [2,2],
            [5,5,1],
            [2,1,1,1,1],
            [3,3,1,6],
            [3,3,3,3,3,3],
            [6,2],
            [1,1,1,1],
            [3,3,3],
            [2,2,2,6,6,6],
            [1,1,1,7],
            [3,3],
            [3,3,4,4,4,4],
            [4,1,1],
            [3,3],
            [6,6,3,3,1],
            [0,0,0,0,5,5],
            [6,6,6,4,4],
            [0,4,4],
            [0,0,0,0,0,0,0],
            [4,4,0,0,0],
            [1,1,1,1,1,1],
            [4,4,4],
            [2,3,5],
            [5,5,5],
            [3,3,7,7],
            [7,7,6,6,6],
            [5,5,4,4,0,0],
            [2,2],
            [6,4,4],
            [4,4,4],
            [3,3,3,3,3],
            [3,3,6,6,0,0],
            [5,6,2,2,2],
            [2,7,1,1],
            [6,6,6,6],
            [5,5,7,7,7]
        ]
    }
];

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
}

function testMobile() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

class MainController {
    ticker = new JMTicker(gameConfig.framerate);
    andDraw = true;
    
    layout;
    
    data;
    historicData = [];

    paletteLeft = 200;
    paletteY = 650;
    paletteP = 140;

    pointerPosition;
    selectedPaletteIndex = -1;

    constructor() {
        this.ticker.onTick = this.onTick;
        this.ticker.start();
        this.loadHistoricData();

        if (this.historicData.length > 0) {
            this.layout = layouts[testIndex];
            this.data = this.historicData[this.historicData.length - 1];
        } else {
            this.setupBoard(layouts[testIndex]);
        }

        canvasView.canvas.onPointerDown = (e) => {
            this.pointerPosition = e;
            if (Math.abs(this.paletteY - e.y) < 100) {
                let x = Math.round((e.x - this.paletteLeft) / this.paletteP);

                if (x >= 0 && x <= 2 && this.data.palette[x]) {
                    this.selectedPointerIndex = x;
                }
            }
        }

        canvasView.canvas.onPointerUp = (e) => {
            if (this.selectedPointerIndex >= 0) {
                var loc = canvasView.getTileFromGlobal(e.x, e.y);
                let boardX = loc.x;
                let boardY = loc.y;

                if (boardX >= 0 && boardY < this.data.width && boardY >= 0) {
                    var index = boardX + boardY * this.data.width;
                    if (index < this.data.board.length) {                        
                        if (this.data.board[index] && this.data.board[index].stack.length === 0) {
                            this.historicData.push(this.data);
                            this.saveHistoricData();
                            this.data = StackManager.cloneData(this.data);
                            StackManager.placeFromPalette(this.data, index, this.selectedPointerIndex, this.layout);
                        }
                    }
                }

                this.selectedPointerIndex = -1;
            }
        }
        canvasView.canvas.onPointerMove = (e) => {
            this.pointerPosition = e;
        }
    }

    saveHistoricData() {
            window.localStorage.setItem('HexHistoricData', JSON.stringify(this.historicData));
    }

    loadHistoricData() {
        let historicStr = window.localStorage.getItem('HexHistoricData');
        if (historicStr && historicStr !== 'undefined') {
            this.historicData = JSON.parse(historicStr);
        }
    }

    clearHistoricData() {
        this.historicData = [];
        window.localStorage.setItem('HexHistoricData', undefined);
    }

    setupBoard(layout) {
        this.layout = layout;

        var board = [];
        var width = 0;

        var cells = layout.board.split(`
`).map(el => [...el.trim()]);
        
        width = cells[0].length;
        cells.forEach((row, y) => {
            row.forEach((el, x) => {
                if (el === '1') {
                    board[x + y * width] = {lastI: 0, x, y, stack: []};
                }
            });
        });

        layout.stacks.forEach(stack => {
            board[stack.x + stack.y * width].stack = stack.stack.map(el => el);
        });

        this.data = {board, width, palette: [], paletteSpawnIndex: 0, currentInteraction: 0, score: 0, time: 0};
        StackManager.nextPaletteSet(this.data, this.layout);
    }

    reset = () => {
        this.clearHistoricData();
        this.setupBoard(layouts[testIndex]);
    }

    undoStep = () => {
        if (this.historicData.length > 0) this.data = this.historicData.pop();
        this.saveHistoricData();
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
            if (spot) {
                canvasView.drawSpot(spot.x, spot.y);
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

        this.historicData.push(this.data);
        this.saveHistoricData();

        this.data = closed[Math.min(closed.length -1, finalIndex)].analysis.path[1].data;

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

function makeTimeString(ms) {
    var seconds = Math.floor(ms / 1000);
    var minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

const StackManager = {
    countTopColor(stack) {
        let color = stack[stack.length - 1];
        var count = 0;

        for (var i = stack.length - 1; i >= 0; i--) {
            if (stack[i] === color) {
                count++;
            } else {
                return count;
            }
        }

        return count;
    },

    getTopIndex(stack) {
        if (stack.length > 0) {
            return stack[stack.length - 1];
        }

        return -1;
    },

    purgeTopColor(stack) {
        var numPurged = 0;
        let color = stack[stack.length - 1];
        while(stack.length > 0 && stack[stack.length - 1] === color) {
            stack.pop();
            numPurged++;
        }

        return numPurged;
    },

    getSpot(data, x, y) {
        if ((x < 0) || (y < 0) || x > data.width) return null;

        var index = x + y * data.width;
        if (index > data.board.length - 1) return null;

        return data.board[index];
    },

    getColorOrder(stack) {
        var m = [];
        var index = -1;

        for (var i = 0; i < stack.length; i++) {
            if (stack[i] !== index) {
                index = stack[i];
                m.push(index);
            }
        }

        return m;
    },

    getConnections(data, spot) {
        var connections = [];
        var c;

        var skewDirection = spot.y % 2 === 1 ? -1 : 1;

        c = StackManager.getSpot(data, spot.x - 1, spot.y);
        if (c) connections.push(c);
        
        c = StackManager.getSpot(data, spot.x + 1, spot.y);
        if (c) connections.push(c);

        c = StackManager.getSpot(data, spot.x, spot.y - 1);
        if (c) connections.push(c);
        c = StackManager.getSpot(data, spot.x, spot.y + 1);
        if (c) connections.push(c);

        c = StackManager.getSpot(data, spot.x + skewDirection, spot.y - 1);
        if (c) connections.push(c);
        c = StackManager.getSpot(data, spot.x + skewDirection, spot.y + 1);
        if (c) connections.push(c);

        return connections;
    },

    moveTopColorFromTo(from, to) {
        var color = StackManager.getTopIndex(from);
        while(StackManager.getTopIndex(from) === color) {
            to.push(from.pop());
        }
    },

    moveGroupToLoc(data, x, y) {
        var target = data.board[x + y * data.width];
        connections = StackManager.getConnections(data, target);

        connections.forEach(c => {
            if (StackManager.getTopIndex(c.stack) === StackManager.getTopIndex(target.stack)) {
                StackManager.moveTopColorFromTo(c.stack, target.stack);
            }
        });
    },

    findTens(data) {
        return data.board.filter(spot => spot && spot.stack.length >= 10 && StackManager.countTopColor(spot.stack) >= 10);
    },

    clearTens(data) {
        data.board.forEach(spot => {
            if (spot && spot.stack.length >= 10) {
                if (spot.stack.length >= 10 && StackManager.countTopColor(spot.stack) >= 10) {
                    data.score += StackManager.purgeTopColor(spot.stack);
                }
            }
        });
    },

    findAllGroups(data) {
        var groups = [];
        var closed = [];
        data.board.forEach(spot => {
            if (spot && spot.stack.length > 0 && !closed.includes(spot)) {
                let top = StackManager.getTopIndex(spot.stack);
                let group = [spot];
                let open = [spot];

                while (open.length > 0) {
                    var checking = open.shift();
                    closed.push(checking);

                    var connections = StackManager.getConnections(data, checking);

                    connections.forEach(c => {
                        if (!open.includes(c) && !closed.includes(c) && StackManager.getTopIndex(c.stack) === top) {
                            open.push(c);
                            group.push(c);
                        }
                    });
                }

                if (group.length > 1) {
                    groups.push(group);
                }
            }
        });

        return groups;
    },

    measureDistance(a, b) {
        var aQ = a.x - (a.y + a.y % 2) / 2;
        var bQ = b.x - (b.y + b.y % 2) / 2;

        return (Math.abs(bQ - aQ) + Math.abs(b.y - a.y) + Math.abs(aQ + a.y - bQ - b.y)) / 2;
    },

    numBlankSpots(data) {
        var count = 0;

        data.board.forEach(el => {
            if (el && el.stack.length === 0) {
                count++;
            }
        });

        return count;
    },

    numSections(data) {
        var count = 0;

        data.board.forEach(el => {
            if (el && el.stack.length > 0) {
                count += StackManager.getColorOrder(el.stack).length;
            }
        });

        return count;
    },

    getBiggestSection(data) {
        var biggest = 0;

        data.board.forEach(el => {
            if (el && el.stack.length > 0) {
                let size = 0;
                let color = -1;
                for (let i = 0; i < el.stack.length; i++) {
                    if (el.stack[i] !== color) {
                        size = 0;
                        color = el.stack[i];
                    } else {
                        size++;
                        biggest = Math.max(biggest, size);
                    }
                }
            }
        });

        return biggest;
    },

    cloneData(data) {
        let board = data.board.map(spot => {
            if (!spot) return null;
            return {lastI: spot.lastI, x: spot.x, y: spot.y, stack: spot.stack.map(el => el)};
        });
        let width = data.width;

        let palette = data.palette.map(stack => {
            if (!stack) return null;
            return stack.map(el => el);
        })

        return {board, width, palette, paletteSpawnIndex: data.paletteSpawnIndex, currentInteraction: data.currentInteraction, score: data.score, time: data.time};
    },

    placeFromPalette(data, boardIndex, paletteIndex, layout) {
        data.board[boardIndex].stack = data.palette[paletteIndex].map(el => el);
        data.palette[paletteIndex] = null;
        data.currentInteraction++;
        data.board[boardIndex].lastI = data.currentInteraction;

        if (!data.palette[0] && !data.palette[1] && !data.palette[2]) {
            StackManager.nextPaletteSet(data, layout);
        }
    },

    nextPaletteSet(data, layout) {
        if (layout.paletteStacks) {
            data.palette = [];
            for (var i = 0; i < 3; i++) {
                data.palette.push(layout.paletteStacks[data.paletteSpawnIndex + i].map(el => el));
            }
    
            if (data.paletteSpawnIndex >= layout.paletteStacks.length) {
                data.paletteSpawnIndex = 0;
            }
        } else {
            data.palette = [];
            for (var i = 0; i < 3; i++) {
                data.palette.push(StackManager.generateRandomPaletteStack(data.paletteSpawnIndex));
            }
        }
           
        data.paletteSpawnIndex += 3;
    },

    generateRandomPaletteStack(paletteSpawnIndex) {
        var maxColor = StackManager.getMaxColorIndex(paletteSpawnIndex);

        let total = StackManager.getRandomTotalSize(paletteSpawnIndex);
        let count = StackManager.getRandomNumColors(paletteSpawnIndex, total);

        let counts = [0, 0, 0];
        let colors = [-1, -1, -1];

        
        colors[0] = Math.floor(Math.random() * (maxColor + 1));
        if (count > 1) {
            counts[0] = Math.ceil(Math.random() * (total - count + 1));
        } else {
            counts[0] = total;
        }

        if (count >= 2) {
            do {
                colors[1] = Math.floor(Math.random() * (maxColor + 1));
            } while (colors[1] === colors[0]);
            if (count > 2) {
                counts[1] = Math.ceil(Math.random() * (total - counts[0] - count + 2));
            } else {
                counts[1] = total - counts[0];
            }
        }

        if (count === 3) {
            do {
                colors[2] = Math.floor(Math.random() * (maxColor + 1));
            } while (colors[2] === colors[0] || colors[2] === colors[1]);

            counts[2] = total - counts[0] - counts[1];
        }

        let stack = [];

        for (var i = 0; i < count; i++) {
            for (var j = 0; j < counts[i]; j++) {
                stack.push(colors[i]);
            }
        }

        return stack;
    },

    getRandomTotalSize(paletteSpawnIndex) {
        var min = Math.min(4, Math.floor(paletteSpawnIndex / 20) + 2);
        var max = 6;
        return min + Math.floor(Math.random() * (max + 1 - min));
    },

    getRandomNumColors(paletteSpawnIndex, stackSize) {
        return Math.min(stackSize, 3, Math.ceil(Math.random() * (2 + paletteSpawnIndex / 20)));
    },

    getMaxColorIndex(paletteSpawnIndex) {
        var thresholds = [
            0,
            0,
            0,
            3,  //3
            6, //4
            12, //5
            15, //6
            21 //7
            // 38 = DEAD
        ];

        for (var count = thresholds.length - 1; count >= 0; count--) {
            if (paletteSpawnIndex >= thresholds[count]) return count;
        }
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

    constructor(canvasElement) {
        this.canvas = new CanvasRender(gameConfig.canvasWidth, gameConfig.canvasHeight, canvasElement);

        this.short = this.radius * Math.sin(2 * Math.PI / 6) * 2;
    }

    drawSpot(x, y) {
        var global = this.getGlobalFromTile(x, y);
        this.canvas.drawHexagon2(global.x,
                                global.y,
                                this.radius, 0.6, '#cccccc', 1, this.tilt);
    }

    drawTile(x, y, height, color) {
        var baseX = x - (y % 2 === 1 ? 0.5 : 0);
        var baseY = y;
        this.canvas.drawHexagon2(this.left + baseX * this.xx * this.short + baseY * this.yx * this.short,
                                (this.top + baseX * this.xy * this.short + baseY * this.yy * this.short) * this.tilt - height * this.heightAmount,
                        this.radius, 0.7, color, 1, this.tilt);

    }

    drawPaletteTile(x, y, height, color) {
        this.canvas.drawHexagon2(x, y - height * this.heightAmount, this.radius, 0.7, color, 1, this.tilt);
    }

    getTileFromGlobal(x, y) {
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

        point.x = this.left + this.short * (x * this.xx + y * this.yx);
        point.y = (this.top + this.short * (x * this.xy + y * this.yy)) * this.tilt;

        return point;
    }

    drawFrame() {
        this.canvas.clear();
        this.canvas.drawBackground('#eeeeee');

        // draw the game and any added vfx
        mainController.draw(this.canvas);

        for (var i = this.vfx.length - 1; i >= 0; i--) {
            this.vfx[i].update(this.canvas);
            if (this.vfx[i].isComplete) {
                this.vfx.splice(i, 1);
            }
        }
    }
}

const Colors = {
    RED: '#ff0000',
    GREEN: '#00ff00',
    BLUE: '#0000ff',
    YELLOW: '#ffff00',
    TEAL: '#00ffff',
    MAGENTA: '#ff00ff',
    WHITE: '#ffffff',
    BLACK: '#333333',

    INDEXED: [],
}

Colors.INDEXED = [
    Colors.RED,
    Colors.BLUE,
    Colors.GREEN,
    Colors.YELLOW,
    Colors.TEAL,
    Colors.MAGENTA,
    Colors.WHITE,
    Colors.BLACK,
];

init();

