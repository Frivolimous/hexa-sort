const gameConfig = {
    framerate: 30,
    startingMoney: 100,
    maxNodes: 30,
    canvasWidth: 800,
    canvasHeight: 800,
}

const testIndex = 1;

const layouts = [
    {
        board: `011100
                011110
                111110
                011110
                011100`,
        stacks: [
            {x: 1, y: 1, stack: [0,0,0,0,0,2,2,2,3]},
            {x: 1, y: 2, stack: [0,0,2,2,2,3,3,3]},
            {x: 2, y: 1, stack: [3,3,2,2,2]},
            {x: 1, y: 3, stack: [0,0,0,0,0]}
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

function init() {
    // select game type
    isMobile = testMobile();

    // initialize singletons
    canvasView = new GameView(document.getElementById('main-canvas'));
    mainController = new MainController();

    stepper.addEventListener("click", mainController.stepSequence);

    window.addEventListener('keydown', (e) => {
        switch(e.key.toLowerCase()) {
            // case 'p': mainController.reset(); break;
            case ' ': mainController.stepSequence(); break;
            // case 'c': mainController.crash.crashed = true; break;
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
    
    tiles = [];
    width = 0;

    palette = [];
    paletteSpawnIndex = 0;
    paletteLeft = 200;
    paletteY = 650;
    paletteP = 140;

    currentInteraction = 0;

    pointerPosition;
    selectedStack;

    constructor() {
        this.ticker.onTick = this.onTick;
        this.ticker.start();
        this.setupBoard(layouts[testIndex]);

        canvasView.canvas.onPointerDown = (e) => {
            this.pointerPosition = e;
            if (Math.abs(this.paletteY - e.y) < 100) {
                let x = Math.round((e.x - this.paletteLeft) / this.paletteP);

                if (x >= 0 && x <= 2 && this.palette[x]) {
                    this.selectedStack = this.palette[x];
                    this.palette[x].dragging = true;
                }
            }
        }
        canvasView.canvas.onPointerUp = (e) => {
            if (this.selectedStack) {
                var loc = canvasView.getTileFromGlobal(e.x, e.y);
                let boardX = loc.x;
                let boardY = loc.y;

                if (boardX >= 0 && boardY < this.width && boardY >= 0) {
                    var index = boardX + boardY * this.width;
                    if (index < this.tiles.length) {
                        if (this.tiles[index].exists && this.tiles[index].stack.length === 0) {
                            this.tiles[index].addTileStack(this.selectedStack.stack.map(el => el.index));
                            this.palette[this.selectedStack.x] = null;
                            this.currentInteraction++;
                            this.tiles[index].lastInteraction = this.currentInteraction;
                        }
                    }
                }

                this.selectedStack.dragging = false;
                this.selectedStack = null;
            }
        }
        canvasView.canvas.onPointerMove = (e) => {
            this.pointerPosition = e;
        }
    }

    exportBoard() {
        var board = [];

        var board = this.tiles.map(spot => {
            if (!spot.exists) {
                return null;
            } else {
                return {lastI: spot.lastInteraction, x: spot.x, y: spot.y, stack: spot.stack.map(tile => tile.index)};
            }
        });
        return {board, width: this.width};
    }

    setupBoard(layout) {
        this.layout = layout;
        this.paletteSpawnIndex = 0;

        var cells = layout.board.split(`
`).map(el => [...el.trim()]);
        
        this.width = cells[0].length;
        cells.forEach((row, y) => {
            row.forEach((el, x) => {
                this.tiles.push(new BoardSpot(x, y, el === '1'));
            });
        });

        this.tiles.forEach(tile => {
            let left = this.getSpotAt(tile.x - 1, tile.y);
            let above = this.getSpotAt(tile.x, tile.y - 1);
            let skew = tile.y % 2 === 1 ? this.getSpotAt(tile.x - 1, tile.y - 1) : this.getSpotAt(tile.x + 1, tile.y - 1);
            
            if (left && left.exists) {
                tile.connections.push(left);
                left.connections.push(tile);
            }
            if (above && above.exists) {
                tile.connections.push(above);
                above.connections.push(tile);
            }
            if (skew && skew.exists) {
                tile.connections.push(skew);
                skew.connections.push(tile);
            }
        });

        layout.stacks.forEach(stack => {
            this.addTileStack(stack.x, stack.y, stack.stack);
        })
    }

    reset = () => {
    }

    onTick = () => {
        if (!this.palette[0] && !this.palette[1] && !this.palette[2]) {
            this.nextPaletteSet();
        }

        if (this.andDraw) {
            canvasView.drawFrame();
        }

        stepper.disabled = !this.canStep();
    }

    nextPaletteSet() {
        this.palette = [];
        for (var i = 0; i < 3; i++) {
            this.palette[i] = new BoardSpot(i, 0, true);
            this.palette[i].addTileStack(this.layout.paletteStacks[this.paletteSpawnIndex + i]);
        }

        this.paletteSpawnIndex += 3;
        if (this.paletteSpawnIndex >= this.layout.paletteStacks.length) {
            this.paletteSpawnIndex = 0;
        }
    }

    draw = () => {
        var exported = this.exportBoard();

        exported.board.forEach(spot => {
            if (spot) {
                canvasView.drawSpot(spot.x, spot.y);
            }
        });
        exported.board.forEach(spot => {
            if (spot) {
                spot.stack.forEach((color, i) => canvasView.drawTile(spot.x, spot.y, i, Colors.INDEXED[color]));
            }
        });

        this.palette.forEach((tile, i) => {
            if (tile) {
                tile.stack.forEach((el, j) => {
                    if (tile.dragging) {
                        canvasView.drawPaletteTile(this.pointerPosition.x, this.pointerPosition.y, j, el.color);
                    } else {
                        canvasView.drawPaletteTile(this.paletteLeft + i * this.paletteP, this.paletteY, j, el.color);
                    }
                });
            }
        });
    }

    addTileStack(x, y, stack) {
        this.tiles[x + y * this.width].addTileStack(stack);
    }

    moveTopTile(fromSpot, toSpot) {
        toSpot.stack.push(fromSpot.stack.pop());
    }

    getSpotAt(x, y) {
        if (x < 0 || y < 0 || x >= this.width) return null;
        if (x + y * this.width >= this.tiles.length) return null;

        return this.tiles[x + y * this.width];
    }

    getMatchingConnectedSpots(spot, index) {
        var m = [];
        spot.connections.forEach(c => {
            if (!excludes.includes(c) && c.getTopIndex() === index);
        });

        return m;
    }

    stepSequence = () => {
        var groups = this.findAllGroups();
        if (groups.length > 0) {
            groups.forEach(this.resolveGroup);
        } else {
            this.clearTens();
        }
    }

    numBlankSpots() {
        var count = 0;

        this.tiles.forEach(el => {
            if (el.exists && el.stack.length === 0) {
                count++;
            }
        });

        return count;
    }

    findAllGroups() {
        var groups = [];
        var closed = [];
        this.tiles.forEach(spot => {
            if (spot.stack.length > 0 && !closed.includes(spot)) {
                let top = spot.getTopIndex();
                let group = [spot];
                let open = [spot];

                while (open.length > 0) {
                    var checking = open.shift();
                    closed.push(checking);

                    checking.connections.forEach(c => {
                        if (!open.includes(c) && !closed.includes(c) && c.getTopIndex() === top) {
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
    }

    canStep() {
        return this.findAllGroups().length > 0 || this.findTens().length > 0;
    }

    resolveGroup = (group) => {
        if (group.length === 2) {
            let num0 = group[0].getNumColors();
            let num1 = group[1].getNumColors();

            if (num1 < num0) {
                group = [group[1], group[0]];
                num0 = group[0].getNumColors();
                num1 = group[1].getNumColors();
            }

            if (num0 === 1) {
                if (num1 === 1) {
                    if (group[0].lastInteraction >= group[1].lastInteraction) {
                        group[1].moveTopColorTo(group[0]);
                        console.log("two ones, move to DROPPED 0");
                    } else {
                        group[0].moveTopColorTo(group[1]);
                        console.log("two ones, move to DROPPED 1");
                    }
                } else {
                    if (this.numBlankSpots() >= 3) {
                        console.log("2+ -> 1 cus lots of space", this.numBlankSpots());
                        group[1].moveTopColorTo(group[0]);
                    } else {
                        console.log("1 -> 2+ cus low on space", this.numBlankSpots());
                        group[0].moveTopColorTo(group[1]);
                    }
                }
            } else {
                var secondColor = group[0].getSecondIndex();
                var numAdjacentSeconds = group[0].connections.filter(c => c.getTopIndex() === secondColor).length;

                var secondColor2 = group[1].getSecondIndex();
                var numAdjacentSeconds2 = group[1].connections.filter(c => c.getTopIndex() === secondColor2).length;

                console.log("SECOND CHECK", secondColor, secondColor2, numAdjacentSeconds, numAdjacentSeconds2);

                if (numAdjacentSeconds > 0 && numAdjacentSeconds2 === 0) {
                    group[0].moveTopColorTo(group[1]);
                    console.log('2+ -> 2+, clear way for next combo 1', numAdjacentSeconds);
                } else if (numAdjacentSeconds2 > 0 && numAdjacentSeconds === 0) {
                    group[1].moveTopColorTo(group[0]);
                    console.log('2+ -> 2+, clear way for next combo 0', numAdjacentSeconds2);
                } else {
                    if (group[0].lastInteraction > group[1].lastInteraction) {
                        group[1].moveTopColorTo(group[0]);
                        console.log("2+ -> 2+ favor PLACED 0", group[0].lastInteraction, group[1].lastInteraction);
                    } else if (group[0].lastInteraction < group[1].lastInteraction) {
                        console.log("2+ -> 2+ favor PLACED 1", group[0].lastInteraction, group[1].lastInteraction);
                        group[0].moveTopColorTo(group[1]);
                    } else {
                        group[1].moveTopColorTo(group[0]);
                        console.log("All Equal: Favor index 0");
                    }
                }
            }

            // group[1].moveTopColorTo(group[0]);
        } else {
            let first = group[0];
            for (let i = 1; i < group.length; i++) {
                group[i].moveTopColorTo(first);
                console.log("MULTI GROUP (not done yet) goes to index 0");
            }
        }
    }

    clearTens = () => {
        this.tiles.forEach(spot => {
            if (spot.stack.length >= 10) {
                if (spot.countTopColor() >= 10) {
                    spot.purgeTopColor();
                }
            }
        });
    }

    findTens() {
        return this.tiles.filter(spot => spot.stack.length >= 10 && spot.countTopColor() >= 10);
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

class BoardSpot {
    x;
    y;
    exists = false;
    dragging = false;
    lastInteraction = 0;
    stack = [];
    connections = [];

    constructor(x, y, exists) {
        this.x = x; this.y = y;
        this.exists = exists;
    }

    getNumColors() {
        return this.getIndexOrder().length;
    }

    getIndexOrder() {
        var m = [];
        var index = -1;

        for (var i = 0; i < this.stack.length; i++) {
            if (this.stack[i].index !== index) {
                index = this.stack[i].index;
                m.push(index);
            }
        }

        return m;
    }

    getTopColor() {
        return this.stack[this.stack.length - 1];
    }

    getSecondIndex() {
        var colors = this.getIndexOrder();
        if (colors.length >= 2) return colors[colors.length - 2];

        return -1;
    }

    getTopIndex() {
        if (this.stack.length > 0) {
            return this.stack[this.stack.length - 1].index;
        }

        return -1;
    }

    countTopColor() {
        let color = this.stack[this.stack.length - 1].index;
        var count = 0;
        for (var i = this.stack.length - 1; i >= 0; i--) {
            if (this.stack[i].index === color) {
                count++;
            } else {
                return count;
            }
        }
        
        return count;
    }

    purgeTopColor() {
        let color = this.stack[this.stack.length - 1].index;
        while(this.stack.length > 0 && this.stack[this.stack.length - 1].index === color) {
            this.stack.pop();
        }
    }

    addTile(color) {
        this.stack.push(new GameTile(color));
    }

    addTiles(color, count) {
        for (let i = 0; i < count; i++) {
            this.addTile(color);
        }
    }

    addTileStack(stack) {
        stack.forEach(i => this.addTile(i));
    }

    moveTopColorTo(target) {
        var color = this.getTopIndex();
        while(this.getTopIndex() === color) {
            target.stack.push(this.stack.pop());
        }
    }
}

class GameTile {
    color;
    index;
    addedAt = 0;

    constructor(index) {
        this.index = index;
        this.color = Colors.INDEXED[index];
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
