import { parse } from '@fortawesome/fontawesome-svg-core';
import { scale } from 'chroma-js';
import LinearQuadTree, { DIRECTIONS } from './LinearQuadTree';
import { TRUE, FALSE, NULL } from './helpers';

const DEFAULT_GRID_DRAWN_STATE = 2;

const LINE_DEPTH_CONSTANT = 3;
const LABEL_DEPTH_CONSTANT = 6;

const COLOR_1 = '#000000';
const COLOR_2 = '#ffffff';

const OVERLAY_ALPHA = 0.5;

const LEFT_CLICK = 0;

class Controller
{
    constructor(props)
    {
        for (let propName in props)
            this[propName] = props[propName];
    }

    update(that, then)
    {
        for (let prop of Object.getOwnPropertyNames(this)) 
            if (!that.hasOwnProperty(prop)) that[prop] = this[prop];

        const updated = new this.constructor(that);
        
        if (then) then(updated);
        
        return updated;
    }
}

class Painter extends Controller
{
    static create(width, height, scale)
    {
        const colors = [COLOR_1, COLOR_2];
        
        const maxDepth = Math.ceil(Math.max(
            Math.log2(width), Math.log2(height)));

        const linearQuadTree = new LinearQuadTree(maxDepth, null);
        linearQuadTree.setInside(0, 0, width, height, () => colors[1]);

        const gridDrawnState = DEFAULT_GRID_DRAWN_STATE;

        const tool = new DrawTool();

        const painter = new Painter({ linearQuadTree, width, height, 
             scale, colors, tool, gridDrawnState });

        /*
        // Fill randomly for testing
        for (let x = 0; x < Math.floor(width * height) / 10; x++)
        {
            const randX = Math.floor(Math.random() * width);
            const randY = Math.floor(Math.random() * height);

            linearQuadTree.setInside(randX, randY, 
                randX + 1, randY + 1, () => COLOR_1);
        }
        */
    
        return painter;

    }

    setCtx(ctx)
    {
        ctx.canvas.width = this.width * this.scale;
        ctx.canvas.height = this.height * this.scale;

        return this.update({ ctx }, (updated) => updated.draw());
    }


    getPoint(event)
    {
        const rect = this.ctx.canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / this.scale);
        const y = Math.floor((event.clientY - rect.top) / this.scale);

        return [x, y];
    }

    setColor(event, index)
    {
        const colors = this.colors.slice();
        colors[index] = event.target.value;

        return this.update({ colors });
    }

    setSize(width, height)
    {
        const newMaxDepth = Math.ceil(Math.max(
            Math.log2(width), Math.log2(height)));
        
        this.linearQuadTree.maxDepth = newMaxDepth;
        this.linearQuadTree.setOutside(0, 0, width, height, () => null);
        
        this.linearQuadTree.setInside(0, 0, width, height, 
            (value) => value === null ? this.colors[1] : value);

        this.ctx.canvas.width = width * this.scale;
        this.ctx.canvas.height = height * this.scale;
        
        return this.update({ width, height }, (updated) => updated.draw());
    }

    setScale(scale)
    {
        this.ctx.canvas.width = this.width * scale;
        this.ctx.canvas.height = this.height * scale;

        return this.update({ scale }, (next) => next.draw());
    }

    onMouseDown(event)
    {
        const [x, y] = this.getPoint(event);
        this.tool.onMouseDown(event.button, x, y, this);

        event.preventDefault();
    }

    onMouseMove(event)
    {
        const [x, y] = this.getPoint(event);
        this.tool.onMouseMove(x, y, this);

        event.preventDefault();
    }

    onMouseUp(event)
    {
        this.tool.onMouseUp(this);

        event.preventDefault();
    }

    draw()
    {
        if(this.ctx === undefined) return;

        this.linearQuadTree.leafs((xMin, yMin, xMax, yMax, color) =>
        {
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.rect(
                xMin * this.scale, 
                yMin * this.scale, 
                (xMax - xMin) * this.scale,
                (yMax - yMin) * this.scale);

            this.ctx.fill();
        });

        if (this.gridDrawnState !== 0)
        {
            const scalePow = Math.log2(this.scale);
            const maxDepth = this.linearQuadTree.maxDepth;

            this.ctx.globalAlpha = OVERLAY_ALPHA;

            this.ctx.fillStyle = "white";
            this.ctx.fillRect(0, 0, 
                this.width * this.scale, 
                this.height * this.scale);

            this.ctx.globalAlpha = 1;


            const drawGridLines = (xMin, yMin, xMax, yMax) =>
            {
                const xMid = (xMin + xMax) / 2;
                const yMid = (yMin + yMax) / 2;
        
                this.ctx.beginPath();
                this.ctx.moveTo(xMid * this.scale, yMin * this.scale);
                this.ctx.lineTo(xMid * this.scale, yMax * this.scale);
                this.ctx.moveTo(xMin * this.scale, yMid * this.scale);
                this.ctx.lineTo(xMax * this.scale, yMid * this.scale);
                this.ctx.stroke();
            };


            this.linearQuadTree.recurseAABB(
                (xMin, yMin, yMax, xMax, key, depth) => 
                    depth < scalePow + maxDepth - LINE_DEPTH_CONSTANT,
                FALSE, drawGridLines, NULL);
            if (this.gridDrawnState === 2)
            {
                this.ctx.textAlign = "center";
                this.ctx.textBaseline = "middle";
                this.ctx.fillStyle = "black";
                this.ctx.font = "12px Arial";

                const drawLeafKeys = (xMin, yMin, xMax, yMax, color, key) =>
                {
                    this.ctx.fillText(key, 
                        (xMin + xMax) / 2 * this.scale, 
                        (yMin + yMax) / 2 * this.scale);
                };
    
                this.linearQuadTree.recurseAABB(
                    (xMin, yMin, yMax, xMax, key, depth) => 
                        depth < scalePow + maxDepth - LABEL_DEPTH_CONSTANT,
                    TRUE, NULL, drawLeafKeys);
            }
        }
    }
}

export default Painter;


class PointMap
{
    constructor()
    {
        this.map = {};
    }

    add(x, y)
    {
        if (this.map[x] === undefined) this.map[x] = {};
        this.map[x][y] = true;
    }

    forEach(callback)
    {
        for (let x in this.map) for (let y in this.map[x]) 
            callback(parseInt(x), parseInt(y));
    }
}


class ITool
{
    onMouseDown(){};
    onMouseUp(){};
    onMouseMove(){};
}

export class DrawTool extends ITool
{
    constructor()
    {
        super();

        this.activeColorIndex = null;
        this.previous = null;
        this.pointMap = null;
    }

    onMouseDown(clickType, x, y, painter)
    {
        if (this.previous !== null) return false;

        this.activeColorIndex = clickType === LEFT_CLICK ? 0 : 1;
        this.previous = [x, y];
        this.pointMap = new PointMap();

        painter.ctx.fillStyle = painter.colors[this.activeColorIndex];
        this.drawAndAddToPointMap(x, y, painter);
    }

    onMouseMove(x2, y2, painter)
    {
        if (!this.previous) return;

        const [x1, y1] = this.previous;

        const dx = x2 - x1;
        const dy = y2 - y1;

        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        const steps = absX > absY ? absX : absY;

        const points = [];

        if (steps !== 0)
        {
            const xInc = dx / steps;
            const yInc = dy / steps;

            let x = x1;
            let y = y1;

            for (let i = 0; i < steps; i++)
            {
                x += xInc;
                y += yInc;
                points.push([Math.round(x), Math.round(y)]);
            }

            this.previous = [x2, y2];

            for (let [x, y] of points)
                this.drawAndAddToPointMap(x, y, painter);
        }
    }

    drawAndAddToPointMap(x, y, painter)
    {
        painter.ctx.beginPath();
        painter.ctx.rect(x * painter.scale, y * painter.scale, 
            painter.scale, painter.scale);
        painter.ctx.fill();
        
        this.pointMap.add(x, y);
    }

    onMouseUp(painter)
    {
        if (!this.previous) return;

        this.pointMap.forEach((x, y) => painter.linearQuadTree.setInside(
            x, y, x + 1, y + 1, () => painter.colors[this.activeColorIndex]));

        painter.draw();
        
        this.previous = null;
        this.pointMap = null;
    }
}

export class FillTool extends ITool
{

    onMouseDown(clickType, x, y, painter)
    {
        const { colors, linearQuadTree } = painter;

        const fillColor = clickType === LEFT_CLICK
            ? colors[0] : colors[1];
            
        const [,,,, targetColor, key] = 
            linearQuadTree.getLeafContaining(x, y);

        const keyHistory = {};

        const recurseFill = (key) =>
        {
            const color = linearQuadTree.getLeafValue(key);
            if (color !== targetColor) return;
            keyHistory[key] = true;

            for (let direction of DIRECTIONS)
            {
                const neighbouringLeafKeys = 
                    linearQuadTree.findNeighbouringLeafKeys(key, direction);

                for (let neighbouringLeafKey of neighbouringLeafKeys)
                {
                    if (neighbouringLeafKey in keyHistory) continue;

                    recurseFill(neighbouringLeafKey);
                }
            }

            // Delayed setting leaf value because passing balanced keys to
            // findNeighbouringLeafKey throws an infinite loop and I'm lazy.

            // Solution: return rebalanced key from setLeafValue and 
            // disjunct flow as appopriate

            linearQuadTree.setLeafValue(key, fillColor)
        }

        recurseFill(key);
    }

    onMouseUp(painter)
    {
        painter.draw();
    }
}