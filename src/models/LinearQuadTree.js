import { contains, overlaps, TRUE, FALSE, NULL } from './helpers';

export const DIRECTIONS = [...Array(4)].map((_, o) => 
    [...Array(4)].map((_, i) => (i + o) % 4));

export const [NORTH, SOUTH, WEST, EAST ] = DIRECTIONS;

class LinearQuadTree
{
    constructor(maxDepth, defaultValue = null)
    {
        this._data = { 0: defaultValue };
        this._maxDepth = maxDepth;
        this._sizes = [...Array(maxDepth + 1)]
            .map((_, i) => Math.pow(2, i)).reverse();
        this._areas =  [...Array(maxDepth + 1)]
            .map((_, i) => Math.pow(4, i)).reverse();
    }

    get size()
    {
        return this._sizes[0];
    }

    get maxDepth()
    {
        return this._maxDepth;
    }

    set maxDepth(nextMaxDepth)
    {
        if (nextMaxDepth === this._maxDepth) return;

        let tempData;

        if (nextMaxDepth < this._maxDepth)
        {
            const recurseDecreaseDepth = (depth, key) =>
            {
                if (key in this._data)
                {
                    const decreasedKey = key - 
                        this._areas[this._maxDepth - depth];

                    tempData[decreasedKey] = this._data[key];
                }
                else
                {
                    const nextDepth = depth + 1;
                    const zeroIndexKey = key * 4 + 1;

                    for (let i = 0; i < 4; i++) 
                        recurseDecreaseDepth(nextDepth, zeroIndexKey + i);
                }
            }

            while (nextMaxDepth < this._maxDepth)
            {
                this._areas.shift();
                this._sizes.shift();
                
                if (!this._data.hasOwnProperty(0))
                {
                    tempData = {};
                    recurseDecreaseDepth(1, 1);
                    this._data = tempData;
                }

                this._maxDepth -= 1;
            }
        }
        else
        {
            const recurseIncreaseDepth = (depth, key) =>
            {
                if (key in this._data)
                {
                    const increasedDepthKey = key +
                        this._areas[this._maxDepth - depth];

                    tempData[increasedDepthKey] = this._data[key];
                }
                else
                {
                    const nextDepth = depth + 1;
                    const zeroIndexKey = key * 4 + 1;

                    for (let i = 0; i < 4; i++) 
                        recurseIncreaseDepth(nextDepth, zeroIndexKey + i);
                }
            }

            while (nextMaxDepth > this._maxDepth)
            {

                if (this._data[0] !== null)
                {
                    tempData = { 2: null, 3: null, 4: null };
                    recurseIncreaseDepth(0, 0);
                    this._data = tempData;
                }

                this._maxDepth += 1;
                this._areas.unshift(Math.pow(4, this._maxDepth));
                this._sizes.unshift(Math.pow(2, this._maxDepth));
            }

        }
    }

    _recurseAABB(xMin, yMin, xMax, yMax, key, depth, 
        nodeFilter, leafFilter, nodeCallback, leafCallback)
    {
        const value = this._data[key];
        const isLeaf = value !== undefined;

        if (isLeaf)
        {
            if (leafFilter(xMin, yMin, xMax, yMax, value, key, depth))
                leafCallback(xMin, yMin, xMax, yMax, value, key, depth);
        }
        else if (nodeFilter(xMin, yMin, xMax, yMax, key, depth))
        {
            nodeCallback(xMin, yMin, xMax, yMax, key, depth);

            const zeroIndexKey = key * 4 + 1;
            const nextDepth = depth + 1;
            const xMid = (xMin + xMax) / 2;
            const yMid = (yMin + yMax) / 2;

            this._recurseAABB(xMin, yMin, xMid, yMid, zeroIndexKey, nextDepth,
                nodeFilter, leafFilter, nodeCallback, leafCallback);
            this._recurseAABB(xMid, yMin, xMax, yMid, zeroIndexKey + 1, nextDepth,
                nodeFilter, leafFilter, nodeCallback, leafCallback);
            this._recurseAABB(xMid, yMid, xMax, yMax, zeroIndexKey + 2, nextDepth,
                nodeFilter, leafFilter, nodeCallback, leafCallback);
            this._recurseAABB(xMin, yMid, xMid, yMax, zeroIndexKey + 3, nextDepth,
                nodeFilter, leafFilter, nodeCallback, leafCallback);

        }
    }

    recurseAABB(nodeFilter, leafFilter, nodeCallback, leafCallback)
    {
        return this._recurseAABB(0, 0, this.size, this.size, 0, 0,
            nodeFilter, leafFilter, nodeCallback, leafCallback);
    }

    nodes(callback)
    {
        return this._recurseAABB(0, 0, this.size, this.size, 0, 0, TRUE,
            FALSE, callback, NULL);
    }

    leafs(callback)
    {
        return this._recurseAABB(0, 0, this.size, this.size, 0, 0, TRUE, 
            TRUE, NULL, callback);
    }

    _recurseSetAABB(xMin, yMin, xMax, yMax, key, depth,
        nodeFilter, leafFilter, setLeaf)
    {
        const value = this._data[key];
        const isLeaf = value !== undefined;

        if (isLeaf && leafFilter(xMin, yMin, xMax, yMax, depth, value))
        {
            const nextValue = setLeaf(value, depth, xMin, yMin, xMax, yMax);

            if (value === nextValue) return false;
            this._data[key] = nextValue;

            return true;
        }

        if (depth === this._maxDepth) return false;

        if (nodeFilter(xMin, yMin, xMax, yMax, depth, value))
        {
            const zeroIndexKey = key * 4 + 1;

            if (isLeaf)
            {
                const nextValue = setLeaf(value, depth, xMin, yMin, xMax, yMax);
                const prevValue = this._data[key];

                if (nextValue === prevValue) return false;
                
                for (let i = 0; i < 4; i++)
                    this._data[zeroIndexKey + i] = prevValue;

                delete this._data[key];
            }

            const nextDepth = depth + 1;
            const xMid = (xMin + xMax) / 2;
            const yMid = (yMin + yMax) / 2;

            let updated = false;

            if (this._recurseSetAABB(xMin, yMin, xMid, yMid, zeroIndexKey, 
                nextDepth, nodeFilter, leafFilter, setLeaf)) updated = true;
            if (this._recurseSetAABB(xMid, yMin, xMax, yMid, zeroIndexKey + 1, 
                nextDepth, nodeFilter, leafFilter, setLeaf)) updated = true;
            if (this._recurseSetAABB(xMid, yMid, xMax, yMax, zeroIndexKey + 2, 
                nextDepth, nodeFilter, leafFilter, setLeaf)) updated = true;
            if (this._recurseSetAABB(xMin, yMid, xMid, yMax, zeroIndexKey + 3, 
                nextDepth, nodeFilter, leafFilter, setLeaf)) updated = true;


            const comparisonValue = this._data[zeroIndexKey];

            if (updated 
                && comparisonValue === this._data[zeroIndexKey + 1]
                && comparisonValue === this._data[zeroIndexKey + 2]
                && comparisonValue === this._data[zeroIndexKey + 3])
            {
                this._data[key] = comparisonValue;

                for (let i = 0; i < 4; i++) 
                    delete this._data[zeroIndexKey + i];

                return true;
            }
        }
        return false;
    }

    recurseSetAABB(nodeFilter, leafFilter, setLeaf)
    {
        this._recurseSetAABB(0, 0, this.size, this.size, 0, 0,
            nodeFilter, leafFilter, setLeaf);
    }

    setInside(xMin1, yMin1, xMax1, yMax1, setLeaf)
    {
        const leafFilter = (xMin2, yMin2, xMax2, yMax2, depth, value) =>
        {
            const overlappingArea = overlaps(
                xMin1, yMin1, xMax1, yMax1, xMin2, yMin2, xMax2, yMax2);
            const totalArea = this._areas[depth];

            return overlappingArea === totalArea;
        }
    
        const nodeFilter = (xMin2, yMin2, xMax2, yMax2, depth, value) =>
        {
            const overlappingArea = overlaps(
                xMin1, yMin1, xMax1, yMax1, xMin2, yMin2, xMax2, yMax2);
    
            return overlappingArea > 0;
        }
        
        return this.recurseSetAABB(nodeFilter, leafFilter, setLeaf);
    }

    setOutside(xMin1, yMin1, xMax1, yMax1, setLeaf)
    {
        const leafFilter = (xMin2, yMin2, xMax2, yMax2) =>
        {
            const overlappingArea = overlaps(
                xMin1, yMin1, xMax1, yMax1, xMin2, yMin2, xMax2, yMax2);

            return overlappingArea === 0;
        }
    
        const nodeFilter = (xMin2, yMin2, xMax2, yMax2, depth) =>
        {
            const overlappingArea = overlaps(
                xMin1, yMin1, xMax1, yMax1, xMin2, yMin2, xMax2, yMax2);
            const totalArea = this._areas[depth];
    
            return overlappingArea !== totalArea;
        }
        
        return this.recurseSetAABB(nodeFilter, leafFilter, setLeaf);
    }

    getLeafContaining(x, y)
    {
        let leafArgv = null;

        const check = (xMin, yMin, xMax, yMax) => 
            contains(x, y, xMin, yMin, xMax, yMax);
            
        this.recurseAABB(check, check, NULL,
            (...argv) => leafArgv = argv);

        return leafArgv;
    }

    getLeafValue(key)
    {
        return this._data[key];
    }

    setLeafValue(key, nextValue)
    {
        const value = this._data[key]; 
        if (value === undefined) return;

        this._data[key] = nextValue;

        this._recurseBalanceLeaf(key);
    }

    _recurseBalanceLeaf(key)
    {
        const parentKey = Math.floor((key - 1) / 4);
        const zeroIndexKey = parentKey * 4 + 1;
        const comparisonValue = this._data[zeroIndexKey];

        if (parentKey >= 0
            && comparisonValue === this._data[zeroIndexKey + 1]
            && comparisonValue === this._data[zeroIndexKey + 2]
            && comparisonValue === this._data[zeroIndexKey + 3])
        {
            for (let i = 0; i < 4; i++) delete this._data[zeroIndexKey + i];

            this._data[parentKey] = comparisonValue;

            this._recurseBalanceLeaf(parentKey);
        }
    }


    findNeighbouringLeafKeys(key, direction)
    {
        const neighbouringLeafKeys = [];

        const greaterOrEqualNeighbourKey = 
            this.findGreaterOrEqualNeighbourKey(key, direction);

        if (greaterOrEqualNeighbourKey !== null) 
            this.findNeighbouringLeafKeysOnBorder(
                greaterOrEqualNeighbourKey, 
                direction, (leaf) => neighbouringLeafKeys.push(leaf));

        return neighbouringLeafKeys;
    }

    findGreaterOrEqualNeighbourKey(key, direction)
    {
        const childIndex = (key - 1) % 4;
        const zeroIndexKey = key - childIndex;

        if (childIndex < 0) return null;
        if (childIndex === direction[3]) return zeroIndexKey + direction[0];
        if (childIndex === direction[2]) return zeroIndexKey + direction[1];

        const parentKey = Math.floor((key - 1) / 4);
        const neighbourKey = this.findGreaterOrEqualNeighbourKey(
            parentKey, direction);

        if (this._data[neighbourKey] !== undefined || neighbourKey === null) 
            return neighbourKey;

        const neighbourZeroIndexKey = neighbourKey * 4 + 1;

        if (childIndex === direction[0]) 
            return neighbourZeroIndexKey + direction[3];
        if (childIndex === direction[1]) 
            return neighbourZeroIndexKey + direction[2];
    }

    findNeighbouringLeafKeysOnBorder(key, direction, callback)
    {
        if (this._data[key] === undefined)
        {
            const zeroIndexKey = key * 4 + 1;

            this.findNeighbouringLeafKeysOnBorder(
                zeroIndexKey + direction[2], direction, callback);
            this.findNeighbouringLeafKeysOnBorder(
                zeroIndexKey + direction[3], direction, callback);
        }
        else
        {
            callback(key);
        }
    }
}

export default LinearQuadTree;