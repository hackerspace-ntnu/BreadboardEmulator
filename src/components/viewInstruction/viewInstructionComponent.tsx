import {TextField} from "@mui/material";
import {useEffect, useState} from "react";

import styles from '@/app/ui/viewInstruction.module.css';
import {Instruction} from "@/emulation/emulator";

interface IViewInstructionProps {
    memoryContent: number,
    immContent: number
}

export default function ViewInstructionComponent(props: IViewInstructionProps) {
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

        let instn = Instruction[parseInt(inst, 2)];
        let theRest = " "

        switch(Instruction[instn as keyof typeof Instruction]) {
            case Instruction.NOP: {
                break;
            }
            case Instruction.LDIND:
            case Instruction.MV:
            case Instruction.NEG:
            case Instruction.NOT: {
                theRest += dest + ", " + srcA;
                break;
            }
            case Instruction.LI:
            case Instruction.LD:  {
                theRest += dest + ", " + imm;
                break;
            }
            case Instruction.STIO:
            case Instruction.LDIO: {
                theRest += srcA + ", " + srcB + ", " + imm;
                break;
            }
            case Instruction.ADD:
            case Instruction.SUB:
            case Instruction.XOR:
            case Instruction.NAND:
            case Instruction.AND:
            case Instruction.OR: {
                theRest += dest + ", " + srcA + ", " + srcB;
                break;
            }
            case Instruction.J: {
                theRest += srcA;
                break;
            }
            case Instruction.JNZ:
            case Instruction.JZ:
            case Instruction.JN: {
                theRest += srcA + ", " + imm;
                break;
            }
            case Instruction.JIMM: {
                theRest += imm;
                break;
            }
            case Instruction.ADDI: {
                theRest += dest + ", " + srcA + ", " + imm;
                break;
            }
            case Instruction.ST: {
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