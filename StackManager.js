const StackManager = {
    randomizer: fakeRandomizer,

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

    layoutToData(layout) {
        var board = [];
        var width = 0;

        var cells = layout.board.split(`
`).map(el => [...el.trim()]);
        
        width = cells[0].length;
        cells.forEach((row, y) => {
            row.forEach((el, x) => {
                if (el === '1') {
                    board[x + y * width] = {lastI: 0, x, y, stack: [], hp: layout.tileHp || 0};
                } else {
                    board[x + y * width] = null;
                }
            });
        });

        var data = {board, width, palette: [], paletteSpawnIndex: 0, currentInteraction: 0, score: 0, time: 0, powers: ['normal', 'normal', 'normal'], randomIndex: 1};

        layout.stacks.forEach((stack, i) => {
            if (stack.stack[0] === 'R') {
                let connections = this.getConnections(data, stack);
                var numColors = stack.stack[2];
                var color;
                var foundColors = connections.map(el => el.stack.length > 0 ? el.stack[el.stack.length - 1] : -1);
                do {
                    color = Math.floor(StackManager.randomizer.next() * numColors);
                } while (foundColors.includes(color));
                for (var i = 0; i < stack.stack[1]; i++) board[stack.x + stack.y * width].stack.push(color);
            } else {
                board[stack.x + stack.y * width].stack = stack.stack.map(el => el);
            }
        });

        StackManager.nextPaletteSet(data, layout);

        return data;
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
        if ((x < 0) || (y < 0) || x >= data.width) return null;

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
                    var loc = canvasView.getGlobalFromTile(spot.x, spot.y);
                    loc.y -= spot.stack.length * 3 + 20;
                    loc.x -= 15;
                    var count = StackManager.purgeTopColor(spot.stack);
                    
                    var score = this.getScoreAmount(count, data);
                    var calc = this.getScoreCalc(count, data);
                    
                    data.score += score;

                    flyingText = new FlyingText(loc.x - 2, loc.y - 2, calc, '#ffffff', 30, 1, 0.02);
                    canvasView.vfx.push(flyingText);
                    var flyingText = new FlyingText(loc.x, loc.y, calc, '#000000', 30, 1, 0.02);
                    canvasView.vfx.push(flyingText);
                }
            }
        });
    },

    getScoreCalc(count, data) {
        if (count === 10) {
            return count.toFixed(0);
        } else {
            return `10 + ${(count - 10).toFixed(0)} x 2`;
        }
    },

    getScoreAmount(count, data) {
        return 10 + (count - 10) * 2;
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
            if (el && el.stack.length === 0 && el.hp >= 0) {
                count++;
            }
        });

        return count;
    },

    numStackedSpots(data) {
        var count = 0;

        data.board.forEach(el => {
            if (el && el.stack.length > 0) {
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
            return {lastI: spot.lastI, x: spot.x, y: spot.y, stack: spot.stack.map(el => el), hp: spot.hp};
        });
        let width = data.width;

        let palette = data.palette.map(stack => {
            if (!stack) return null;
            return stack.map(el => el);
        })

        let powers = data.powers ? data.powers.map(el => el) : ['disabled', 'disabled', 'disabled'];

        return {board, width, palette, paletteSpawnIndex: data.paletteSpawnIndex, currentInteraction: data.currentInteraction, score: data.score, time: data.time, powers, randomIndex: data.randomIndex};
    },

    placeFromPalette(data, boardIndex, paletteIndex, layout) {
        data.board[boardIndex].stack = data.palette[paletteIndex].map(el => el);
        data.palette[paletteIndex] = null;
        data.currentInteraction++;
        data.board[boardIndex].lastI = data.currentInteraction;

        var paletteClear = true;
        data.palette.forEach(el => {
            if (el) {
                paletteClear = false;
            }
        });

        if (paletteClear) {
            console.log('clear');
            StackManager.nextPaletteSet(data, layout);
        }
    },

    nextPaletteSet(data, layout) {
        if (layout.paletteStacks) {
            data.palette = [];
            for (var i = 0; i < layout.numPalette; i++) {
                data.palette.push(layout.paletteStacks[data.paletteSpawnIndex + i].map(el => el));
            }
    
            if (data.paletteSpawnIndex >= layout.paletteStacks.length) {
                data.paletteSpawnIndex = 0;
            }
        } else {
            data.palette = [];
            for (var i = 0; i < layout.numPalette; i++) {
                data.palette.push(StackManager.generateRandomPaletteStack(data.paletteSpawnIndex));
            }
        }
           
        data.paletteSpawnIndex += layout.numPalette;
    },

    generateRandomPaletteStack(paletteSpawnIndex) {
        var config = StackManager.getPaletteOrderConfig(paletteSpawnIndex);
        let total = config.minSize + Math.floor(StackManager.randomizer.next() * (config.maxSize + 1 - config.minSize));
        let count = Math.min(total, 3, Math.ceil(StackManager.randomizer.next() * config.numStacks));

        let counts = [0, 0, 0];
        let colors = [-1, -1, -1];
        
        colors[0] = Math.floor(StackManager.randomizer.next() * (config.maxColorIndex + 1));
        if (count > 1) {
            counts[0] = Math.ceil(StackManager.randomizer.next() * (total - count + 1));
        } else {
            counts[0] = total;
        }

        if (count >= 2) {
            do {
                colors[1] = Math.floor(StackManager.randomizer.next() * (config.maxColorIndex + 1));
            } while (colors[1] === colors[0]);
            if (count > 2) {
                counts[1] = Math.ceil(StackManager.randomizer.next() * (total - counts[0] - count + 2));
            } else {
                counts[1] = total - counts[0];
            }
        }

        if (count === 3) {
            do {
                colors[2] = Math.floor(StackManager.randomizer.next() * (config.maxColorIndex + 1));
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

    getPaletteOrderConfig(paletteSpawnIndex) {
        for (var count = PaletteOrderConfigs.length - 1; count >= 0; count--) {
            if (paletteSpawnIndex >= PaletteOrderConfigs[count].minStackPlaced) return PaletteOrderConfigs[count];
        }
    }
}

const PaletteOrderConfigs = [
    { minStackPlaced: 0,   maxColorIndex: 2, minSize: 3, maxSize: 6, numStacks: 2 },
    { minStackPlaced: 3,   maxColorIndex: 3, minSize: 3, maxSize: 6, numStacks: 2.1 },
    { minStackPlaced: 6,   maxColorIndex: 4, minSize: 3, maxSize: 6, numStacks: 2.3 },
    { minStackPlaced: 12,  maxColorIndex: 5, minSize: 3, maxSize: 6, numStacks: 2.6 },
    { minStackPlaced: 15,  maxColorIndex: 6, minSize: 3, maxSize: 6, numStacks: 2.8 },
    { minStackPlaced: 21,  maxColorIndex: 7, minSize: 4, maxSize: 6, numStacks: 3 },
    { minStackPlaced: 30,  maxColorIndex: 7, minSize: 4, maxSize: 6, numStacks: 3.5 },
    { minStackPlaced: 40,  maxColorIndex: 7, minSize: 4, maxSize: 6, numStacks: 4 },
]
