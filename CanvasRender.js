class CanvasRender {
    Element;
    Graphic;
    Width;
    Height;
    
    onPointerDown;
    onPointerUp;
    onPointerUpAnywhere;
    onPointerMove;
    onSwipe;
    onClick;

    constructor(width, height, element) {
        this.Element = element;
        this.Graphic = element.getContext('2d');
        this.Width = width;
        this.Height = height;

        element.width = this.Width;
        element.height = this.Height;

        var swiping;
        var swipeMinDistance = 100;
        var swipeMaxTime = 200;

        element.addEventListener('pointerdown', e => {
            let r = element.getBoundingClientRect();
            
            var location = {x: e.offsetX * element.width / r.width, y: e.offsetY * element.height / r.height};
            this.onPointerDown && this.onPointerDown(location);

            swiping = {x: location.x, y: location.y};
            window.setTimeout(e => swiping = null, swipeMaxTime);
        });

        element.addEventListener('mouseup', e => {
            let r = element.getBoundingClientRect();
            
            var location = {x: e.offsetX * element.width / r.width, y: e.offsetY * element.height / r.height};
            this.onPointerUp && this.onPointerUp(location);

            if (this.onClick && swiping && (Math.abs(swiping.x - location.x) + Math.abs(swiping.y - location.y)) < 20) {
                this.onClick(location);
            }

            swiping = null;
        });

        element.addEventListener('touchend', e => {
            let r = element.getBoundingClientRect();
            
            var x = e.changedTouches[0].pageX * element.width / r.width - r.x;
            var y = e.changedTouches[0].pageY * element.height / r.height - r.y;

            var location = {x, y};
            this.onPointerUp && this.onPointerUp(location);
            
            swiping = null;
        });

        element.addEventListener('pointerleave', e => {
            this.onPointerUpAnywhere && this.onPointerUpAnywhere();
        });

        element.addEventListener('touchmove', e => {
            let r = element.getBoundingClientRect();
            var x = e.changedTouches[0].pageX * element.width / r.width - r.x;
            var y = e.changedTouches[0].pageY * element.height / r.height - r.y;
            var location = {x, y};
            this.onPointerMove && this.onPointerMove(location);

            if (swiping) {
                var distance = Math.sqrt(Math.pow(x - swiping.x, 2) + Math.pow(y - swiping.y, 2));

                if (distance > swipeMinDistance) {
                    var angle = Math.atan2(y - swiping.y, x - swiping.x);
                    swiping = null;

                    this.onSwipe && this.onSwipe(angle);
                }
            }
        });

        element.addEventListener('mousemove', e => {
            let r = element.getBoundingClientRect();
            
            var location = {x: e.offsetX * element.width / r.width, y: e.offsetY * element.height / r.height};
            this.onPointerMove && this.onPointerMove(location);

            if (swiping) {
                var distance = Math.sqrt(Math.pow(location.x - swiping.x, 2) + Math.pow(location.y - swiping.y, 2));

                if (distance > swipeMinDistance) {
                    var angle = Math.atan2(location.y - swiping.y, location.x - swiping.x);
                    swiping = null;

                    this.onSwipe && this.onSwipe(angle);
                }
            }
        });
    }

    clear() {
        this.Graphic.clearRect(0, 0, this.Width, this.Height);
    }
    
    drawBackground(bgColor) {
        this.Graphic.beginPath();
        this.Graphic.rect(0, 0, this.Width, this.Height);
        this.Graphic.fillStyle = bgColor;
        this.Graphic.fill();
    }

    drawRect(x, y, width, height, color, strokeColor, alpha = 1) {
        this.Graphic.beginPath();
        this.Graphic.rect(x, y, width, height);
        this.Graphic.fillStyle = color;
        this.Graphic.strokeStyle = strokeColor;
        this.Graphic.lineWidth = 2;
        this.Graphic.globalAlpha = Math.max(alpha, 0);
        this.Graphic.fill();
        this.Graphic.stroke();
        this.Graphic.globalAlpha = 1;
    }

    drawHexagon(x, y, radius, strokeColor, fillColor, alpha = 1){
        this.Graphic.beginPath();
        this.Graphic.beginPath();
        var a = 2 * Math.PI / 6;
        for (var i = 0.5; i < 6.5; i++) {
            this.Graphic.lineTo(x + radius * Math.cos(a * i), y + radius * Math.sin(a * i));
        }
        this.Graphic.closePath();
        this.Graphic.stroke();
        this.Graphic.lineWidth = "3";
        this.Graphic.strokeStyle = strokeColor;
        this.Graphic.fillStyle = fillColor;
        this.Graphic.globalAlpha = Math.max(alpha, 0);
        this.Graphic.fill();
        this.Graphic.stroke();
        this.Graphic.globalAlpha = 1;
    }

    drawHexagon2(x, y, radius, strokeWeight, fillColor, alpha = 1, tilt = 0.5){
        this.Graphic.beginPath();
        var a = 2 * Math.PI / 6;
        for (var i = 0; i < 6; i++) {
            this.Graphic.lineTo(x + radius * Math.cos(a * i), y + tilt * (radius * Math.sin(a * i)));
        }
        this.Graphic.closePath();
        this.Graphic.lineWidth = "3";
        this.Graphic.strokeStyle = Color.luminance(fillColor, strokeWeight);
        this.Graphic.fillStyle = fillColor;
        this.Graphic.globalAlpha = Math.max(alpha, 0);
        this.Graphic.fill();
        this.Graphic.stroke();
        this.Graphic.globalAlpha = 1;
    }
    
    drawCircle(x, y, radius, strokeColor, fillColor, alpha = 1) {
        this.Graphic.beginPath();
        this.Graphic.arc(x, y, radius, 0, 2 * Math.PI);
        this.Graphic.lineWidth = "3";
        this.Graphic.strokeStyle = strokeColor;
        this.Graphic.fillStyle = fillColor;
        this.Graphic.globalAlpha = Math.max(alpha, 0);
        this.Graphic.fill();
        this.Graphic.stroke();
        this.Graphic.globalAlpha = 1;
    }

    drawElipse(x, y, radiusX, radiusY, strokeColor, fillColor, alpha = 1) {
        this.Graphic.beginPath();
        // this.Graphic.elipse(x, y, radius, 0, 2 * Math.PI);
        this.Graphic.ellipse(x, y, radiusX, radiusY, 0, 0, 2 * Math.PI);
        this.Graphic.lineWidth = "3";
        this.Graphic.strokeStyle = strokeColor;
        this.Graphic.fillStyle = fillColor;
        this.Graphic.globalAlpha = Math.max(alpha, 0);
        this.Graphic.fill();
        this.Graphic.stroke();
        this.Graphic.globalAlpha = 1;
    }

    drawRing(x, y, radius, strokeColor, fillColor, alpha = 1) {
        this.Graphic.beginPath();
        this.Graphic.arc(x, y, radius, 0, 2 * Math.PI);
        this.Graphic.lineWidth = "10";
        this.Graphic.strokeStyle = fillColor;
        // this.Graphic.fillStyle = fillColor;
        this.Graphic.globalAlpha = Math.max(alpha, 0);
        // this.Graphic.fill();
        this.Graphic.stroke();
        this.Graphic.globalAlpha = 1;
    }

    drawPartialCirclePercent(x, y, radius, color, percent) {
        this.Graphic.beginPath();
        this.Graphic.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * percent);
        this.Graphic.lineWidth = "10";
        this.Graphic.strokeStyle = color;
        this.Graphic.globalAlpha = 1;
        this.Graphic.stroke();
        this.Graphic.globalAlpha = 1;
    }

    drawPartialCircle(x, y, radius, color, startAngle, endAngle) {
        this.Graphic.beginPath();
        this.Graphic.arc(x, y, radius, startAngle, endAngle);
        this.Graphic.lineWidth = "10";
        this.Graphic.strokeStyle = color;
        this.Graphic.globalAlpha = 1;
        this.Graphic.stroke();
        this.Graphic.globalAlpha = 1;
    }

    drawParticle(x, y, radius, fillColor, alpha) {
        this.Graphic.beginPath();
        this.Graphic.arc(x, y, radius, 0, 2 * Math.PI);
        this.Graphic.lineWidth = "1";
        this.Graphic.strokeStyle = '#000000';
        this.Graphic.globalAlpha = Math.max(alpha, 0);
        this.Graphic.fillStyle = fillColor;
        this.Graphic.fill();
        this.Graphic.stroke();
        this.Graphic.globalAlpha = 1;
    }

    drawLine(x0, y0, x1, y1, color) {
        this.Graphic.beginPath();
        this.Graphic.moveTo(x0, y0);
        this.Graphic.lineTo(x1, y1);
        this.Graphic.closePath();

        this.Graphic.lineWidth = "3";
        this.Graphic.strokeStyle = color;
        this.Graphic.globalAlpha = 1;
        this.Graphic.stroke();
    }
    
    addText(x, y, text, size = 50, color = '#000000', alpha = 1) {
        this.Graphic.font = `${size}px Arial`;
        this.Graphic.fillStyle = color;
        this.Graphic.strokeStyle = '#000000';
        this.Graphic.lineWidth = '1';
        this.Graphic.globalAlpha = Math.max(alpha, 0);
        this.Graphic.fillText(text, x, y);
        this.Graphic.strokeText(text, x, y);
        this.globalAlpha = 1;
    }
}
