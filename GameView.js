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

    imageData;
    stripeOffset = 0;

    constructor(canvasElement) {
        this.canvas = new CanvasRender(gameConfig.canvasWidth, gameConfig.canvasHeight, canvasElement);
        this.setShot();
    }

    setShot() {
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

    drawTileCap(x, y, height, hp) {
        if (hp > 0) return;
        var baseX = x - (y % 2 === 1 ? 0.5 : 0);
        var baseY = y;
        var color = '#333333';
        this.canvas.drawHexagon2(this.offset.x + this.left + baseX * this.xx * this.short + baseY * this.yx * this.short,
                                this.offset.y + (this.top + baseX * this.xy * this.short + baseY * this.yy * this.short) * this.tilt - height * this.heightAmount,
                                this.radius * 0.5, 0.5, color, 0.3, this.tilt);

    }

    drawPaletteTile(x, y, height, color) {
        this.canvas.drawHexagon2(x, y - height * this.heightAmount, this.radius, 0.7, color, 1, this.tilt);
    }

    getTileFromGlobal(x, y, andDraw = false) {
        x -= this.offset.x;
        y -= this.offset.y;
        var point = {x: 0, y: 0};
        var point0 = {x: this.left, y: this.top};
        var point1 = {x: point0.x + this.short * this.xx * 5, y: point0.y + this.short * this.xy * this.tilt * 5};
        var point2 = {x: point0.x + this.short * this.yx * 5, y: point0.y + this.short * this.yy * this.tilt * 5};
        var p2x = point2.x - point0.x;
        var p2y = point2.y - point0.y;
        var p1x = point1.x - point0.x;
        var p1y = point1.y - point0.y;
        var dX = (p2y * x - p2x * y + point2.x * point0.y - point2.y * point0.x) / Math.sqrt(p2y * p2y + p2x * p2x);
        var dY =-(p1y * x - p1x * y + point1.x * point0.y - point1.y * point0.x) / Math.sqrt(p1y * p1y + p1x * p1x);
        
        if (andDraw) {
            new PermaLine(point0.x + this.offset.x, point0.y + this.offset.y, point1.x + this.offset.x, point1.y + this.offset.y);
            new PermaLine(point0.x + this.offset.x, point0.y + this.offset.y, point2.x + this.offset.x, point2.y + this.offset.y);
            // var local = this.getGlobalFromTile(point.x, point.y);
            // new PermaLine(point0.x + this.offset.x, point0.y + this.offset.y, local.x, local.y);
            new PermaLine(point0.x + this.offset.x, point0.y + this.offset.y,
                point0.x + this.offset.x + dX, point0.y + this.offset.y + dY
            );
            // new PermaLine(point0.x + this.offset.x, point0.y + this.offset.y, x + this.offset.x, y + this.offset.y);
        }
        
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
        /**
         w = L + s * (x * a + y * b) + o
         z = i * (T + s * (x * c + y * d)) + p
         * 
         */

        return point;
    }

    drawFrame() {
        this.canvas.clear();
        if (!this.imageData) {
            this.imageData = this.makeImageData();
        }
        this.cycleStripes(this.imageData, this.stripeOffset++);
        
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

    cycleStripes(imageData, offset) {
        var red = 0;
        var green = 1;
        var blue = 2;
        var alpha = 3;
        var width = 57;
        var lowValue = 220;
        var highValue = 230;

        for (var i = 0; i < imageData.data.length; i++) {
            if (i % 4 === alpha) {
                imageData.data[i] = 255;
            } else {
                var amt = Math.floor(i / 4) + offset;
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
