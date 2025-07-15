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
                }
            });
        });

        var data = {board, width, palette: [], paletteSpawnIndex: 0, currentInteraction: 0, score: 0, time: 0, powers: ['normal', 'normal', 'normal']};

        layout.stacks.forEach((stack, i) => {
            if (stack.stack[0] === 'R') {
                let connections = this.getConnections(data, stack);
                var numColors = stack.stack[2];
                var color;
                var foundColors = connections.map(el => el.stack.length > 0 ? el.stack[el.stack.length - 1] : -1);
                do {
                    color = Math.floor(Math.random() * numColors);
                } while (foundColors.includes(color));
                for (var i = 0; i < stack.stack[1]; i++) board[stack.x + stack.y * width].stack.push(color);
            } else {
                board[stack.x + stack.y * width].stack = stack.stack.map(el => el);
            }
        });

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

        return {board, width, palette, paletteSpawnIndex: data.paletteSpawnIndex, currentInteraction: data.currentInteraction, score: data.score, time: data.time, powers};
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
            21, //7
            // 36, //8 : BROWN
            // 57, // 9 : PINK
        ];

        for (var count = thresholds.length - 1; count >= 0; count--) {
            if (paletteSpawnIndex >= thresholds[count]) return count;
        }
    }
}
