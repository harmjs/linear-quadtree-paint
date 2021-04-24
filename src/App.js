import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

import Painter, { DrawTool, FillTool } from './models/Painter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFill, faPen, faSearchPlus, faSearchMinus, faBorderAll } 
    from '@fortawesome/free-solid-svg-icons';

const Header = styled.div`
    height: 4em;
    position: absolute;
    width: 100%;
    background-color: slateGrey;
    display: flex;
    padding: 0.5em 1em;
    box-sizing: border-box;

`;

const Footer = styled.div`
    box-sizing: border-box;
    height: 4em;
    bottom: 0px;
    left: 0;
    position: absolute;
    width: 100%;
    background-color: slateGrey;
    padding: 0.5em 1em;
    display: flex;
`;

const Content = styled.div`
    position: absolute;
    width: 100%;
    top: 4em;
    bottom: 4em;
    background-image: linear-gradient(to bottom, lightblue, lightcyan);
    box-sizing: border-box;
    overflow: auto;
`;

const CanvasContainer = styled.div`
    display: inline-block;
    min-height: 100%;
    padding: 1em;
    box-sizing: border-box;
`;

const ToolContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0.25rem;
`;

const ToolPadder = styled.div`
    padding: 0.5rem 0.5rem;
`;

const ToolTakeSpace = styled.div`
    margin: auto;
`;

const ColorInput = styled.input`
    cursor: pointer;
    display: inline-block;
    height: 2.4em;
    width: 2.4em;
    padding: 0px;
    margin: 0px;
    border: 4px solid white;
    border-radius: px;
`;

const NavText = styled.div`
    font-weight: bold;
    font-size: 2em;
    color: white;
    line-height: 1em;
    font-family: 'Roboto', sans-serif;
`;

const NavTextInput = styled.input`
    font-size: 2em;
    color: white;
    font-family: 'Roboto', sans-serif;
    outline: none;
    background-color: DimGrey;
    max-width: 2.5em;
    padding: 0px;
    margin: 0px;
    border: none;
    text-align: center;
    line-height: 1em;
    height: 1em;
`;

const Canvas = styled.canvas`
    cursor: crosshair;
    box-shadow: 6px 6px 6px grey;
`;

const SizeText = styled.div`
    line-height: 1em;
    font-size: 0.75em;
    font-family: 'Roboto', sans-serif;
`;

const UNACTIVE_1_ICON_COLOR = "White";
const ACTIVE_1_ICON_COLOR = "Orange";
const ACTIVE_2_ICON_COLOR = "#ffba00";

const UI_ICON_STATE_COLORS = [
    UNACTIVE_1_ICON_COLOR, 
    ACTIVE_2_ICON_COLOR,
    ACTIVE_1_ICON_COLOR, 
   ];

const MIN_SCALE = 1;
const MAX_SCALE = 64;

const IntController = ({ title, modelValue, submitValue }) =>
{
    const [controllerValue, setControllerValue] = useState(modelValue);

    useEffect(() => setControllerValue(modelValue), [modelValue]);

    const handleSubmit = (event) =>
    {
        event.preventDefault();

        const parsedValue = parseInt(controllerValue);

        if (parsedValue === modelValue) return;
        if (parsedValue <= 0) return;
        if (Number.isNaN(parsedValue)) return;

        submitValue(parsedValue);
    }

    const handleChange = (event) =>
    {
        const value = event.target.value;

        if (/^\d*$/.test(value)) setControllerValue(value);
    }

    return (
        <form
            title={title}
            onSubmit={(e) => handleSubmit(e)}
        >
            <NavTextInput
                maxLength="4"
                value={controllerValue}
                onChange={(e) => handleChange(e)}
                onBlur={(e) => handleSubmit(e)}
            />
        </form>
    );
}

const App = () =>
{
    const canvasRef = useRef(null);

    const [painter, setPainter] = useState(Painter.create(640, 480, 1));

    useEffect(() => setPainter(painter.setCtx(
        canvasRef.current.getContext('2d'))), [canvasRef]);

    return (
        <>
            <Header>
                <ToolContainer>
                    <FontAwesomeIcon
                        cursor="pointer"
                        title="Use the Pencil Tool"
                        color={painter.tool instanceof DrawTool ? 
                            ACTIVE_1_ICON_COLOR : UNACTIVE_1_ICON_COLOR }
                        icon={faPen}
                        size="2x"
                        onClick={() => setPainter(
                            painter.update({ tool: new DrawTool( )}))}
                    />
                </ToolContainer>
                <ToolContainer>
                    <FontAwesomeIcon
                        cursor="pointer"
                        title="Use the Bucket Tool"
                        color={
                            painter.tool instanceof FillTool ? 
                                ACTIVE_1_ICON_COLOR : UNACTIVE_1_ICON_COLOR }
                        icon={faFill}
                        size="2x"
                        onClick={() => setPainter(
                            painter.update({ tool: new FillTool() }))}
                    />
                </ToolContainer>
                <ToolPadder></ToolPadder>
                <ToolContainer>
                    <ColorInput 
                        title="Change the Primary Color"
                        type="color"
                        value={painter.colors[0]} 
                        onChange={(e) => setPainter(painter.setColor(e, 0))}
                    />
                </ToolContainer>
                <ToolContainer>
                    <ColorInput 
                        title="Change the Secondary Color"
                        type="color" 
                        value={painter.colors[1]} 
                        onChange={(e) => setPainter(painter.setColor(e, 1))}
                    />
                </ToolContainer>
                <ToolTakeSpace></ToolTakeSpace>
                <ToolContainer>
                    <FontAwesomeIcon
                        cursor="pointer"
                        title="Toggle Quadtree Render"
                        color={UI_ICON_STATE_COLORS[painter.gridDrawnState]}
                        icon={faBorderAll}
                        size="2x"
                        onClick={() => setPainter(painter.update(
                            { gridDrawnState: 
                                (painter.gridDrawnState + 1) % 3 },
                            (painter) => painter.draw()))}
                    />
                </ToolContainer>
            </Header>
            <Content>
                <CanvasContainer>
                    <Canvas
                        ref={canvasRef}
                        onMouseDown={(e) => painter.onMouseDown(e)}
                        onMouseUp={(e) => painter.onMouseUp(e)}
                        onMouseMove={(e) => painter.onMouseMove(e)}
                        onContextMenu={(e) => e.preventDefault()}
                        onMouseLeave={(e) => painter.onMouseUp(e)}
                    >
                    </Canvas>
                </CanvasContainer>
            </Content>
            <Footer>
                <ToolContainer>
                    <IntController 
                        cursor="pointer"
                        title="Change Canvas Width"
                        modelValue={painter.width}
                        submitValue={(width) => setPainter(
                            painter.setSize(width, painter.width))}
                    />
                </ToolContainer>
                <ToolContainer>
                    <NavText>x</NavText>
                </ToolContainer>
                <ToolContainer>
                    <IntController
                        cursor="pointer"
                        title="Change Canvas Height"
                        modelValue={painter.height}
                        submitValue={(height) => setPainter(
                            painter.setSize(painter.width, height))}
                    />
                </ToolContainer>
                <ToolTakeSpace></ToolTakeSpace>
                <ToolContainer>
                    <NavText
                        cursor="pointer"
                        title="Current Scale"
                    >
                        { painter.scale + "x"}
                    </NavText>
                </ToolContainer>
                <ToolPadder></ToolPadder>
                <ToolContainer>
                    <FontAwesomeIcon 
                        cursor="pointer"
                        title="Zoom In"
                        color={UNACTIVE_1_ICON_COLOR}
                        icon={faSearchPlus}
                        size="2x"
                        onClick={() => setPainter(painter.scale < MAX_SCALE 
                            ? painter.setScale(painter.scale * 2)
                            : painter)}
                    />
                </ToolContainer>
                <ToolContainer>
                    <FontAwesomeIcon 
                        cursor="pointer"
                        title="Zoom Out"
                        color={UNACTIVE_1_ICON_COLOR}
                        icon={faSearchMinus}
                        size="2x"
                        onClick={() => setPainter(painter.scale > MIN_SCALE 
                            ? painter.setScale(painter.scale / 2)
                            : painter)}
                    />
                </ToolContainer>
            </Footer>
        </>
    );
}

export default App;

