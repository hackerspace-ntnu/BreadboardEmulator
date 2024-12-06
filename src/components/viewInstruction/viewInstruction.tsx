import {TextField} from "@mui/material";
import {useEffect, useState} from "react";

import styles from '@/app/ui/viewInstruction.module.css';
import {instruction} from "@/components/emulator/emulator";

interface IViewInstructionProps {
    memoryContent: number,
    immContent: number
}

export default function ViewInstruction(props: IViewInstructionProps) {
    const [decodedInstruction, setDecodedInstruction] = useState("");

    useEffect(() => {
        if(props.memoryContent === undefined || props.immContent === undefined) {
            setDecodedInstruction("Memory undefined.")
            return;
        }

        const val = ('00000000000000' + props.memoryContent.toString(2)).slice(-16);
        const inst = val.slice(9, 14);

        const srcA = "r" + parseInt(val.slice(6, 9).split("").reverse().join(("")), 2);
        const srcB = "r" + parseInt(val.slice(3, 6).split("").reverse().join(("")), 2);
        const dest = "r" + parseInt(val.slice(0, 3).split("").reverse().join(("")), 2);
        const imm = parseInt(('0000000000000000' + props.immContent.toString(2)).slice(-16), 2);

        let instn = instruction[parseInt(inst, 2)];
        let theRest = " "

        switch(instruction[instn as keyof typeof instruction]) {
            case instruction.NOP: {
                break;
            }
            case instruction.LDIND:
            case instruction.MV:
            case instruction.NEG:
            case instruction.NOT: {
                theRest += dest + ", " + srcA;
                break;
            }
            case instruction.LI:
            case instruction.LD:  {
                theRest += dest + ", " + imm;
                break;
            }
            case instruction.STIO:
            case instruction.LDIO: {
                theRest += srcA + ", " + srcB + ", " + imm;
                break;
            }
            case instruction.ADD:
            case instruction.SUB:
            case instruction.XOR:
            case instruction.NAND:
            case instruction.AND:
            case instruction.OR: {
                theRest += dest + ", " + srcA + ", " + srcB;
                break;
            }
            case instruction.J: {
                theRest += srcA;
                break;
            }
            case instruction.JNZ:
            case instruction.JZ:
            case instruction.JN: {
                theRest += srcA + ", " + imm;
                break;
            }
            case instruction.JIMM: {
                theRest += imm;
                break;
            }
            case instruction.ADDI: {
                theRest += dest + ", " + srcA + ", " + imm;
                break;
            }
            case instruction.ST: {
                theRest += imm + ", " + srcA;
                break;
            }
            case undefined: {
                theRest += "";
                instn = "???"
            }
        }

        setDecodedInstruction(instn? instn.toString().toLowerCase() + theRest : "")
    }, [props.memoryContent, props.immContent]);

    return <>
        <TextField className={styles.viewInstruction}
                   value={decodedInstruction}
                   size="small"
        />
    </>
}