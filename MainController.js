
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

    autoStepDelay = 500;
    autoStepCount = 0;

    buttons = [];

    infoText = null;

    tileDraw = false;
    drawing = false;
    erasing = false;

    nextAction;

    constructor() {
        this.ticker.onTick = this.onTick;
        this.ticker.start();

        this.buttons.push(new ButtonElement('Destroy', 230, 730, 100, 50, button => {
            button.state = 'selected';
            this.infoText = 'Tap any stack to destroy it and score it.';
            this.nextAction = (e) => {
                var index = this.getTileIndexFromGlobal(e.x, e.y);
                this.infoText = null;

                if (index >= 0) {
                    var tile = this.data.board[index];
                    console.log(tile);
    
                    if (tile && tile.stack.length > 0) {
                        this.setupDataChange();
                        this.data.score += tile.stack.length;
                        tile.stack = [];
                        button.state = 'disabled';
                        this.data.powers[0] = 'disabled';
                        return;
                    }
                }

                button.state = 'normal';
            }
        }));
        this.buttons.push(new ButtonElement('AddSpot', 350, 730, 100, 50, button => {
            button.state = 'selected';
            this.infoText = 'Tap any empty spot to add a new one.';
            this.nextAction = (e) => {
                var index = this.getTileIndexFromGlobal(e.x, e.y, true);
                this.infoText = null;

                if (index >= 0) {
                    var tile = this.data.board[index];
                    console.log(tile);

                    if (!tile) {
                        this.setupDataChange();
                        var loc = canvasView.getTileFromGlobal(e.x, e.y);
                        this.data.board[index] = {lastI: 0, x: loc.x, y: loc.y, stack: [], hp: this.historicData.layout.tileHp || 0};
                        button.state = 'disabled';
                        this.data.powers[1] = 'disabled';
                        return;
                    } else if (tile.stack.length === 0 && tile.hp < 2) {
                        this.setupDataChange();
                        tile.hp = 2;
                        button.state = 'disabled';
                        this.data.powers[1] = 'disabled';
                        return;
                    }
                }

                button.state = 'normal';
            }
        }));
        this.buttons.push(new ButtonElement('Shuffle', 470, 730, 100, 50, button => {
            StackManager.nextPaletteSet(this.data, this.historicData.layout);
            button.state = 'disabled';
            this.data.powers[2] = 'disabled';
            this.infoText = 'Palette Randomized!';
            window.setTimeout(() => this.infoText = null, 1000);
        }));

        canvasView.canvas.onPointerDown = (e) => {
            if (this.tileDraw) {
                var index = this.getTileIndexFromGlobal(e.x, e.y + 20, true);
                if (index >= 0) {
                    if (this.data.board[index]) {
                        this.erasing = true;
                        this.data.board[index] = null;
                    } else {
                        this.drawing = true;
                        var loc = canvasView.getTileFromGlobal(e.x, e.y + 20);
                        this.data.board[index] = {lastI: 0, x: loc.x, y: loc.y, stack: [], hp: this.historicData.layout.tileHp || 0};
                    }
                }

                return;
            }

            if (this.nextAction) {
                this.nextAction(e);
                this.nextAction = null;
                return;
            }

            this.pointerPosition = e;

            for (var i = 0; i < this.buttons.length; i++) {
                if (this.buttons[i].hitTest(e)) {
                    this.buttons[i].onClick();
                    return;
                }
            }

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
            if (this.drawing || this.erasing) {
                var str = '';
                var count = 0;
                var connections = 0;
                this.data.board.forEach((el, i) => {
                    if (i % this.data.width === 0) str += `
                `;
                    str += el ? '1' : '0';
                    count += el ? 1 : 0;
                    if (el) {
                        var c = StackManager.getConnections(this.data, el);
                        connections += c.length / 2;
                    }
                });

                console.log(str);
                console.log(count, connections);
            }
            this.drawing = false;
            this.erasing = false;

            if (this.selectedPointerIndex >= 0) {
                let offset = 10;
                if (isMobile) {
                    offset = 10 - 80;
                }

                var index = this.getTileIndexFromGlobal(e.x, e.y + offset);
                if (index >= 0) {
                    var tile = this.data.board[index];
    
                    if (tile && tile.stack.length === 0) {
                        this.setupDataChange();
    
                        if (tile.hp > 0) {
                            if (tile.hp === 1) {
                                tile.hp = -1;
                            } else {
                                tile.hp--;
                            }
                        }
                        StackManager.placeFromPalette(this.data, index, this.selectedPointerIndex, this.historicData.layout);
                    }
                }

                this.selectedPointerIndex = -1;
            }
        }

        canvasView.canvas.onPointerMove = (e) => {
            if (this.drawing) {
                var index = this.getTileIndexFromGlobal(e.x, e.y + 20, true);
                if (index >= 0) {
                    if (!this.data.board[index]) {
                        this.drawing = true;
                        var loc = canvasView.getTileFromGlobal(e.x, e.y + 20);
                        this.data.board[index] = {lastI: 0, x: loc.x, y: loc.y, stack: [], hp: this.historicData.layout.tileHp || 0};
                    }
                }

                return;
            }

            if (this.erasing) {
                var index = this.getTileIndexFromGlobal(e.x, e.y + 20, true);
                if (index >= 0) {
                    if (this.data.board[index]) {
                        this.erasing = true;
                        this.data.board[index] = null;
                    }
                }

                return;
            }

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

        canvasView.canvas.onClick = (e) => {
        //     console.log('click');

        //     var index = this.getTileIndexFromGlobal(e.x, e.y);
        //     if (index >= 0) {
        //         var tile = this.data.board[index];

        //         console.log(tile.x, tile.y);
        //         if (tile && tile.x === 6 && tile.y === 7) {
        //             new PermaDot(e.x, e.y);
        //             canvasView.getTileFromGlobal(e.x, e.y, true);
        //         }

        //         var loc = canvasView.getGlobalFromTile(tile.x, tile.y);
        //         loc.x -= 10;
        //         loc.y += 10 - tile.stack.length * 3;

        //         var currentColor = -1;
        //         var numCurrent = 0;
        //         var numColors = 0;
        //         if (tile && tile.stack.length > 0) {
        //             for (var i = 0; i < tile.stack.length; i++) {
        //                 if (tile.stack[i] === currentColor) {
        //                     numCurrent++;
        //                 } else{
        //                     if (currentColor > 0) {
        //                         let flyingText = new FlyingText(loc.x, loc.y - numColors * 35, numCurrent, Colors.INDEXED[currentColor], 30, 1, 0.02);
        //                         canvasView.vfx.push(flyingText);    
        //                     }
        //                     numColors++;
        //                     currentColor = tile.stack[i];
        //                     numCurrent = 0;
        //                 }
        //             }

        //             if (currentColor > 0) {
        //                 let flyingText = new FlyingText(loc.x, loc.y - numColors * 35, numCurrent, Colors.INDEXED[currentColor], 30, 1, 0.02);
        //                 canvasView.vfx.push(flyingText);    

        //             }
        //         }
        //     }
        }
    }

    exportTileMap() {
        var str = this.data.board.filter(el => el).map(spot => `{x: ${spot.x}, y: ${spot.y}, stack: ['R', 3, 8]}`).join(`,
`);
        console.log(`[
${str}
]`)
    }

    setupBoard(layout, historicData) {
        if (historicData) {
            this.historicData = historicData;
            layout = this.historicData.layout;
            this.data = StackManager.cloneData(this.historicData.history[this.historicData.history.length - 1]);
            if (!this.data) {
                this.setupBoard(layout);
                return;
            }

            if (layout.randomizer) {
                StackManager.randomizer = new Randomizer(layout.randomizer.inc, layout.randomizer.div, this.data.randomIndex);
            } else {
                StackManager.randomizer = fakeRandomizer;
            }
        } else {
            this.historicData = {
                layout,
                history: []
            };

            SaveManager.clearHistoricData();

            if (layout.randomizer) {
                StackManager.randomizer = new Randomizer(layout.randomizer.inc, layout.randomizer.div, layout.randomizer.start);
            } else {
                StackManager.randomizer = fakeRandomizer;
            }
            this.data = StackManager.layoutToData(layout);
        }

        canvasView.offset = {x: layout.offset.x || 0, y: layout.offset.y || 0};
        canvasView.radius = layout.startingRadius || 50;
        canvasView.setShot();
        this.paletteLeft = gameConfig.canvasWidth / 2 - ((layout.numPalette - 1) / 2) * this.paletteP;
        
        
        this.buttons.forEach((button, i) => {
            button.state = this.data.powers[i];
        });

        let analysis = this.analysePosition({data: this.data});
        console.log("starting state: ", analysis);
    }

    reset = () => {
        this.historicData = {};
        SaveManager.clearHistoricData();
        this.setupBoard(layouts[gameConfig.defaultLayout]);
    }

    undoStep = () => {
        if (this.historicData.history.length > 0) this.data = StackManager.cloneData(this.historicData.history.pop());
        StackManager.randomizer.i = this.data.randomIndex;
        console.log('r', this.data.randomIndex);
        this.buttons.forEach((button, i) => {
            button.state = this.data.powers[i];
        });
        SaveManager.saveHistoricData(this.historicData);
    }

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

        this.buttons.forEach(el => el.draw(canvasView.canvas));

        if (this.infoText) {
            canvasView.canvas.drawRect(200, 0, 400, 100, '#ffff99');
            canvasView.canvas.addText(205, 30, this.infoText, 22, '#000000');
        }
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
                if (spot.stack.length > 0) {
                    canvasView.drawTileCap(spot.x, spot.y, spot.stack.length, spot.hp);
                }
            }
        });
    }

    getTileIndexFromGlobal(x, y, andDead) {
        if (y > this.paletteY - 100) return -1;

        var loc = canvasView.getTileFromGlobal(x, y);
        if (loc.x < 0 || loc.x >= this.data.width || loc.y < 0) return -1;

        var index = loc.x + loc.y * this.data.width;
        if (index >= this.data.board.length || (!andDead && !this.data.board[index]) || (!andDead && this.data.board[index].hp < 0)) return -1;
        return index;
    }

    setupDataChange() {
        this.data.randomIndex = StackManager.randomizer.i;
        console.log('r2', this.data.randomIndex);
        this.historicData.history.push(StackManager.cloneData(this.data));
        SaveManager.saveHistoricData(this.historicData);
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

            if (a.analysis.stacked > b.analysis.stacked) return -1;
            if (b.analysis.stacked > a.analysis.stacked) return 1;
            
            if (a.analysis.indexStacks > b.analysis.indexStacks) return -1;
            if (b.analysis.indexStacks > a.analysis.indexStacks) return 1;

            if (a.analysis.indexStacks === 1 && b.analysis.indexStacks !== 1) return -1;
            if (b.analysis.indexStacks === 1 && a.analysis.indexStacks !== 1) return 1;

            if (a.analysis.proximityToLastStack > b.analysis.proximityToLastStack) return -1;
            if (b.analysis.proximityToLastStack > a.analysis.proximityToLastStack) return 1;
        });

        if (closed.length > 0) {
            this.setupDataChange();
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
        let stacked = StackManager.numStackedSpots(obj.data);
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

        return {path, blanks, stacked, proximityToLastStack, sections, lastIndex, indexStacks, biggestSection};
    }

    updateInfo() {
        var txt = '';

        txt += `<br>Score: ${this.data.score}`;
        txt += `<br>Number of Moves: ${this.data.currentInteraction}`;
        
        txt += `<br>Time: ${makeTimeString(this.data.time)}`;
        infoblock.innerHTML = txt;
    }
}


class ButtonElement {
    x;
    y;
    width;
    height;
    callback;
    text;
    state = 'normal';

    constructor(text, x, y, width, height, callback) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.callback = callback;
    }

    hitTest = (loc) => loc.x > this.x && loc.x < (this.x + this.width) && loc.y > this.y && loc.y < (this.y + this.width);
    onClick = () => this.state !== 'disabled' && this.callback && this.callback(this);

    draw(canvas) {
        var color;
        color = this.state === 'normal' ? '#ffeeaa' : this.state === 'selected' ? '#aaffff' : '#aaaaaa';
        canvas.drawRect(this.x, this.y, this.width, this.height, color, '#000000');
        canvas.addText(this.x + 5, this.y + this.height / 2 + 5, this.text, 25);
    }
}