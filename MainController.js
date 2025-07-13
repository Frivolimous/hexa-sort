
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
            canvasView.radius = this.historicData.layout.startingRadius || 50;
            canvasView.setShot();
            this.paletteLeft = gameConfig.canvasWidth / 2 - ((this.historicData.layout.numPalette - 1) / 2) * this.paletteP;

            let analysis = this.analysePosition({data: this.data});
            console.log("load state", analysis);
            return;   
        }

        this.historicData = {
            layout,
            history: []
        };
        canvasView.offset = {x: this.historicData.layout.offset.x || 0, y: this.historicData.layout.offset.y || 0};
        canvasView.radius = layout.startingRadius || 50;
        canvasView.setShot();
        this.paletteLeft = gameConfig.canvasWidth / 2 - ((layout.numPalette - 1) / 2) * this.paletteP;

        SaveManager.clearHistoricData();


        this.data = StackManager.layoutToData(layout);
        StackManager.nextPaletteSet(this.data, this.historicData.layout);
        var analysis = this.analysePosition({data: this.data});
        console.log("initial state", analysis);
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

            if (a.analysis.stacked > b.analysis.stacked) return -1;
            if (b.analysis.stacked > a.analysis.stacked) return 1;
            
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
