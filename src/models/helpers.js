export const contains = (x, y, xMin, yMin, xMax, yMax) =>
    x >= xMin && x < xMax && y >= yMin && y < yMax;

export const overlaps = (
    xMin1, yMin1, xMax1, yMax1, 
    xMin2, yMin2, xMax2, yMax2) => 
    Math.max(0, Math.min(xMax1, xMax2) - Math.max(xMin1, xMin2))
    * Math.max(0, Math.min(yMax1, yMax2) - Math.max(yMin1, yMin2));


export const NULL = () => null;
export const TRUE = () => true;
export const FALSE = () => false;
