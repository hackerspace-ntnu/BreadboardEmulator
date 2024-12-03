import React, {useEffect, useRef, useState} from 'react'
import {Button} from "@mui/material";

interface ICanvasProps {
    className?: string
    vram: Array<number>
}

export default function Canvas(props: ICanvasProps) {
    const [vram, setVram] = useState(Array<number>(32768));
    const canvasRef = useRef(null);

    useEffect(() => {
        setVram(props.vram);
    }, [props.vram])

    useEffect(() => {
        if(vram[0] != undefined) {
            const canvas = canvasRef.current;

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const context = canvas.getContext('2d');

            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, context.canvas.width, context.canvas.height);

            //each addr contains 2 pixels, with 8bpp
            //xxx xxx xx | xxx xxx xx

            let pixel = 0;

            for(let x = 0; x < 120; x++){
                for(let y = 0; y < 160; y++) {
                    const data = vram[pixel];

                    const red = Math.floor(((data & 224) / 7) * 255);
                    const green = Math.floor(((data & 28) / 7) * 255);
                    const blue = Math.floor(((data & 3) / 3) * 255);

                    const hexRed = ('00' + red.toString(16)).slice(-2);
                    const hexGreen = ('00' + green.toString(16)).slice(-2);
                    const hexBlue = ('00' + blue.toString(16)).slice(-2);

                    context.fillStyle = '#'+ hexRed + hexGreen + hexBlue;
                    context.fillRect(y*2, x*2, 2, 2)
                    pixel++;
                }
            }
        }
    }, [vram])

    return <canvas suppressHydrationWarning ref={canvasRef} width={320} height={240} {...props}/>
}