"use client";

import {
    AppBar, Breadcrumbs,
    Button,
    Card,
    FormControlLabel,
    Link,
    Paper,
    Switch,
    TextField, Toolbar,
    Tooltip,
    Typography
} from "@mui/material";
import Grid from '@mui/material/Grid2';
import styles from '@/app/ui/emulator.module.css';
import {useEffect, useState} from "react";
import Canvas from "@/components/canvas/canvas";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FastForwardIcon from '@mui/icons-material/FastForward';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import MoveDownIcon from '@mui/icons-material/MoveDown';
import ViewInstructionComponent from "@/components/viewInstruction/viewInstructionComponent";

export enum instruction {
    NOP,
    MV,
    LI,
    LD,
    LDIND,
    LDIO,
    STIO,
    ADD,
    SUB,
    NEG,
    XOR,
    NAND,
    AND,
    OR,
    NOT,
    J,
    JNZ,
    JIMM,
    ADDI,
    ST,
    JZ,
    JN
}

export default function EmulatorComponent() {
    const [reg_PC, setReg_PC] = useState(0);
    const [reg_r0, setReg_r0] = useState(0);
    const [reg_r1, setReg_r1] = useState(0);
    const [reg_r2, setReg_r2] = useState(0);
    const [reg_r3, setReg_r3] = useState(0);
    const [reg_r4, setReg_r4] = useState(0);
    const [reg_r5, setReg_r5] = useState(0);
    const [reg_r6, setReg_r6] = useState(0);
    const [reg_r7, setReg_r7] = useState(0);

    const [ram, setRam] =  useState(Array<number>(32768));
    const [vram, setvram] = useState(Array<number>(32768));

    const [clockSpeed, setClockSpeed] = useState("100");
    const [clockSpeedModifier, setClockSpeedModifier] = useState(0);
    const [stepsPerMillis, setStepsPerMillis] = useState(1);
    const [millis, setMillis] = useState(1);

    const [loaded, setLoaded] = useState(false);
    const [running, setRunning] = useState(false);
    const [completedExecution, setCompletedExecution] = useState(false);

    const [code, setCode] = useState("");
    const [assemblerMessage, setAssemblerMessage] = useState("");
    const [assemblerError, setAssemblerError] = useState(false);
    const [assemblerComplete, setAssemblerComplete] = useState(false);
    const [dynamicAssemble, setDynamicAssemble] = useState(true);

    const [showHexValues, setShowHexValues] = useState(false);
    const [cpuTimeout, setCpuTimeout] = useState<NodeJS.Timeout>();
    const [canvasUpdateKey, setCanvasUpdateKey] = useState<string>();
    const [instructionsToRun, setInstructionsToRun] = useState(1000);
    const [advancedView, setAdvancedView] = useState(false);

    const setRandomRam = () => {
        setLoaded(false);
        setRunning(false);
        setAdvancedView(false);

        const newVram = Array<number>(32768);

        for(let i = 0; i < 32768; i++) {
            newVram[i] = Math.floor(Math.random() * 256);
        }

        const emptyRam = Array<number>(32768);

        for(let i = 0; i < 32768; i++) {
            emptyRam[i] = Math.floor(Math.random() * 65536);
        }

        setvram(newVram);
        setRam(emptyRam);

        setReg_PC(0);
        setReg_r0(Math.floor(Math.random() * 65536));
        setReg_r1(Math.floor(Math.random() * 65536));
        setReg_r2(Math.floor(Math.random() * 65536));
        setReg_r3(Math.floor(Math.random() * 65536));
        setReg_r4(Math.floor(Math.random() * 65536));
        setReg_r5(Math.floor(Math.random() * 65536));
        setReg_r6(Math.floor(Math.random() * 65536));
        setReg_r7(Math.floor(Math.random() * 65536));
    }

    useEffect(() => {
        if(loaded || running) {
            setRandomRam();
        }

        if(dynamicAssemble)
            assemble()

    }, [dynamicAssemble, code])

    useEffect(() => {
        console.log("Assembler finished.")
    }, [assemblerComplete])

    useEffect(() => {
        setRandomRam()
        setInterval(() => {
            setCanvasUpdateKey(Date.now().toString());
        }, 1000)

        console.log("Running 100 tests to determine clock modifier...");
        let sum = 0;

        for(let i = 0; i < 100; i++) {
            ram[0] = 8; //LI
            const clockStart = window.performance.now()
            cpuStep(1);
            const clockStop = window.performance.now()

            sum += (clockStop - clockStart) * 1000;
        }

        console.log("Tests complete. Result:", sum / 100);
        setClockSpeedModifier(sum / 100);

        setRandomRam()
    }, []);

    const recognisedArgType = [
        [],
        ['r', 'r'],
        ['r', 'a'],
        ['r', 'a'],
        ['r', 'r'],
        ['r', 'r', 'a'],
        ['r', 'r', 'a'],
        ['r', 'r', 'r'],
        ['r', 'r', 'r'],
        ['r', 'r'],
        ['r', 'r', 'r'],
        ['r', 'r', 'r'],
        ['r', 'r', 'r'],
        ['r', 'r', 'r'],
        ['r', 'r'],
        ['r'],
        ['r', 'a'],
        ['a'],
        ['r', 'r', 'a'],
        ['a', 'r'],
        ['r', 'a'],
        ['r', 'a']
    ]

    const getReg = (index: number): number  => {
        switch(index) {
            default:
                return 12345; //error
            case 0:
                return reg_r0;
            case 1:
                return reg_r1;
            case 2:
                return reg_r2;
            case 3:
                return reg_r3;
            case 4:
                return reg_r4;
            case 5:
                return reg_r5;
            case 6:
                return reg_r6;
            case 7:
                return reg_r7;
        }
    }

    const setReg = (index: number, value: number) => {
        switch(index) {
            case 0:
                setReg_r0(value);
                break;
            case 1:
                setReg_r1(value);
                break;
            case 2:
                setReg_r2(value);
                break;
            case 3:
                setReg_r3(value);
                break;
            case 4:
                setReg_r4(value);
                break;
            case 5:
                setReg_r5(value);
                break;
            case 6:
                setReg_r6(value);
                break;
            case 7:
                setReg_r7(value);
                break;
        }
    }

    const cpuStep = (steps: number) => {
        const memory = ram;
        const videoMemory = vram;

        let PC = reg_PC;
        const regs = [
            reg_r0,
            reg_r1,
            reg_r2,
            reg_r3,
            reg_r4,
            reg_r5,
            reg_r6,
            reg_r7
        ]

        for(let step = 0; step < steps; step++) {
            if(PC < 0)
                PC = 65535 + PC + 1

            // fetch
            const currentInstruction = ('000000000000000' + (PC > 32767? videoMemory[PC - 32768] : memory[PC])?.toString(2)).slice(-16);

            //decode
            const opcode = parseInt(currentInstruction.substring(9, 14), 2);
            const srcA = parseInt(currentInstruction.substring(6, 9).split("").reverse().join(""), 2)
            const srcB = parseInt(currentInstruction.substring(3, 6).split("").reverse().join(""), 2)
            const dest = parseInt(currentInstruction.substring(0, 3).split("").reverse().join(""), 2)

            let didJump = false;

            // execute
            switch(opcode as instruction) {
                case undefined:
                case instruction.NOP: {
                    //%PC = %PC + 1
                    break;
                }
                case instruction.MV: {
                    //%dest = %srcA
                    regs[dest] = regs[srcA];
                    //setReg(dest, getReg(srcA));
                    break;
                }
                case instruction.LI: {
                    //%dest = $imm
                    const addr = ++PC;
                    regs[dest] = addr > 32767? videoMemory[addr - 32768] : memory[addr];
                    //setReg(dest, memory[PC + 1]);
                    break;
                }
                case instruction.LD: {
                    //%dest = memory[$imm]
                    const addr = ++PC;
                    const imm = addr > 32767? videoMemory[addr - 32768] : memory[addr];

                    regs[dest] = imm > 32767? videoMemory[imm - 32768] : memory[imm];
                    //setReg(dest, memory[memory[PC + 1]]);
                    break;
                }
                case instruction.LDIND: {
                    //%dest = memory[%srcA]
                    const addr = regs[srcA];

                    regs[dest] = addr > 32767? videoMemory[addr - 32768] : memory[addr];
                    //setReg(dest, memory[getReg(srcA)]);
                    break;
                }
                case instruction.LDIO: {
                    //%dest = memory[%srcA + $imm]
                    let addr = regs[srcA] + (++PC > 32767? videoMemory[PC - 32768] : memory[PC]);
                    addr = addr > 65535? addr - 65536 : addr;

                    regs[dest] = addr > 32767? videoMemory[addr - 32768] : memory[addr];
                    //setReg(dest, memory[getReg(srcA) + memory[PC + 1]]);
                    break;
                }
                case instruction.STIO: {
                    //memory[%srcA + $imm] = %srcB
                    const val = regs[srcB];
                    const addr = regs[srcA] + (++PC > 32767? videoMemory[PC - 32768] : memory[PC]);

                    if(addr > 32767) {
                        videoMemory[addr - 32768] = val;
                    } else {
                        memory[addr] = val;
                    }
                    break;
                }
                case instruction.ADD: {
                    //%dest = %srcA + %srcB
                    const result = regs[srcA] + regs[srcB];
                    regs[dest] = result > 65535 ? result - 65536 : result
                    //setReg(dest, result > 65536 ? result % 65536 : result);
                    break;
                }
                case instruction.SUB: {
                    //%dest = %srcA – %srcB
                    const result = regs[srcA] - regs[srcB];
                    regs[dest] = result < 0 ? 65536 + result : result;
                    //setReg(dest, result < 0 ? 65536 - result : result);
                    break;
                }
                case instruction.NEG: {
                    //%dest = ~(%srcA) + 1
                    regs[dest] = parseInt(('0000000000000000' + ((regs[srcA]? regs[srcA] : 0).toString(2))).slice(-16).split("").map((el) => el === '0' ? '1' : '0').join(""), 2) + 1;
                    //setReg(dest, parseInt(('0000000000000000' + (getReg(srcA).toString(2))).slice(-16).split("").map((el) => el === '0' ? '1' : '0').join(""), 2) + 1);
                    break;
                }
                case instruction.XOR: {
                    //%dest = %srcA XOR %srcB
                    regs[dest] = regs[srcA] ^ regs[srcB];
                    //setReg(dest, getReg(srcA) ^ getReg(srcB));
                    break;
                }
                case instruction.NAND: {
                    //%dest = %srcA NAND %srcB
                    regs[dest] = parseInt((regs[srcA] & regs[srcB]).toString(2).split("").map((el) => el === '0' ? '1' : '0').join(""), 2);
                    //setReg(dest, parseInt(('0000000000000000' + (getReg(srcA) & getReg(srcB)).toString(2)).slice(-16).split("").map((el) => el === '0' ? '1' : '0').join(""), 2));
                    break;
                }
                case instruction.AND: {
                    //%dest = %srcA AND %srcB
                    regs[dest] = regs[srcA] & regs[srcB];
                    //setReg(dest, getReg(srcA) & getReg(srcB));
                    break;
                }
                case instruction.OR: {
                    //%dest = %srcA OR %srcB
                    regs[dest] = regs[srcA] | regs[srcB];
                    setReg(dest, getReg(srcA) | getReg(srcB));
                    break;
                }
                case instruction.NOT: {
                    //%dest = ~(%srcA)
                    regs[dest] = parseInt(('0000000000000000' + ((regs[srcA]? regs[srcA] : 0).toString(2))).slice(-16).split("").map((el) => el === '0' ? '1' : '0').join(""), 2);
                    //setReg(dest, parseInt(('0000000000000000' + (getReg(srcA).toString(2))).slice(-16).split("").map((el) => el === '0' ? '1' : '0').join(""), 2));
                    break;
                }
                case instruction.J: {
                    //%PC = %srcA
                    PC = regs[srcA];
                    didJump = true;
                    //jumpaddr = getReg(srcA);
                    break;
                }
                case instruction.JNZ: {
                    //%PC = %srcA == 0 ? %PC + 1 : $imm
                    PC = regs[srcA] == 0 ? PC + 2 : (++PC > 32767? videoMemory[PC - 32768] : memory[PC]);
                    didJump = true;
                    //jumpaddr = getReg(srcA) == 0 ? -1 : memory[PC + 1];
                    break;
                }
                case instruction.JIMM: {
                    //%PC = $imm
                    PC = ++PC > 32767? videoMemory[PC - 32768] : memory[PC];
                    didJump = true;
                    break;
                }
                case instruction.ADDI: {
                    //%dest = %srcA + $imm
                    const result = regs[srcA] + (++PC > 32767? videoMemory[PC - 32768] : memory[PC]);
                    regs[dest] = result > 65535 ? result - 65536 : result;
                    //setReg(dest, getReg(srcA) + memory[PC + 1]);
                    //PC 5
                    break;
                }
                case instruction.ST: {
                    //memory[%imm] = %srcA
                    const val = regs[srcA];
                    const addr = ++PC > 32767? videoMemory[PC - 32768] : memory[PC];

                    if(addr > 32767) {
                        videoMemory[addr - 32768] = val;
                    } else {
                        memory[addr] = val;
                    }
                    break;
                }
                case instruction.JZ: {
                    //%PC = %srcA != 0 ? %PC + 1 : $imm
                    PC = regs[srcA] != 0 ? PC + 2 : (++PC > 32767? videoMemory[PC - 32768] : memory[PC]);
                    didJump = true;
                    break;
                }
                case instruction.JN: {
                    //%PC = %srcA != 0 ? %PC + 1 : $imm
                    PC = regs[srcA] < 32768 ? PC + 2 : (++PC > 32767? videoMemory[PC - 32768] : memory[PC]);
                    didJump = true;
                    break;
                }
            }

            PC = didJump ? PC : PC + 1;

            if(PC > 65535) {
                PC = PC - 65536;
            }
        }

        setReg_PC(PC);
        setRam(memory);
        setvram(videoMemory);

        for(let reg = 0; reg < 8; reg++) {
            setReg(reg, regs[reg])
        }

        setCompletedExecution(!completedExecution);
    }

    const runProgram = () => {
        if(running) {
            setRunning(false);
        }else {
            assemble();

            const targetClock = parseFloat(clockSpeed) * 1000;
            console.log("Target clock speed:", targetClock + "Hz");
            console.log("Clock speed modifier:", clockSpeedModifier.toFixed(3)+"microseconds");

            const clocksPerMs = 100000/clockSpeedModifier;
            const stepsPerMs = targetClock/clocksPerMs;
            console.log("--> Clocks per millisecond:", 1000/clockSpeedModifier);
            console.log("--> Steps per millisecond:", stepsPerMs);

            if(stepsPerMs < 1) {
                setMillis(1000 / targetClock);
                setStepsPerMillis(1);
            } else {
                setMillis(1);
                setStepsPerMillis(Math.floor(stepsPerMs));
            }
            setLoaded(true);
            setRunning(true);
        }
    }

    const stopProgram = () => {
        setRandomRam();
        setRunning(false);
        setLoaded(false);
        setRunning(false);
    }

    const stepProgram = () => {
        if(loaded && running) {
            setRunning(false);
        } else if(!loaded) {
            setRandomRam();
            setLoaded(true);
            assemble()
        }

        cpuStep(1);
    }

    const fastProgram = () => {
        setTimeout(() => {
            cpuStep(instructionsToRun);

            setCanvasUpdateKey(Date.now().toString())
        }, 0);
    }

    useEffect(() => {
        if(running) {
            setCpuTimeout(setTimeout(() => {
                cpuStep(stepsPerMillis)
            }, millis));
        } else {
            clearInterval(cpuTimeout);
        }
    }, [running, completedExecution])

    const assemble = () => {
        setAssemblerComplete(false);

        if(code === "") {
            setAssemblerComplete(false);
            setAssemblerError(false);
            setAssemblerMessage("")
            return;
        }

        const lines = code.toLowerCase().split("\n");

        const labels:     string[] = [];
        const labelsAddr: number[] = [];
        let addr = 0;

        const usedLabels: string[] = [];
        const usedLablesLine: number[] = [];
        const usedLabelsAddr: number[] = [];

        let byteCount = 0;

        for(let line = 0; line < lines.length; line++) {
            let currentLine = lines[line].trim();

            const hasComment = currentLine.indexOf(";")

            if(hasComment != -1)
            {
                currentLine = currentLine.substring(0, hasComment).trim();
            }

            if(currentLine === "") {
                break;
            }

            if(currentLine.endsWith(":")) {
                for(let i = 0; i < labels.length; i++) {
                    if(labels[i] == currentLine.replace(":", "")) {
                        setAssemblerError(true);
                        setAssemblerMessage("[Line " + (line + 1) + "] Label redefinition.");
                        return;
                    }
                }
                labels.push(currentLine.replace(":", ""));
                labelsAddr.push(addr);
                continue;
            }

            const tokens = currentLine.split(" "); //fucking dumb

            if(tokens[0] === ".org") {
                const val = Number(tokens[1]);

                if(tokens.length - 1 != 1) {
                    setAssemblerError(true);
                    setAssemblerMessage("[Line " + (line + 1) + "] ORG command - invalid argument length.");
                    return;
                }

                if(isNaN(val)) {
                    setAssemblerError(true);
                    setAssemblerMessage("[Line " + (line + 1) + "] ORG command malformed around '" + tokens[0] + "'.");
                    return;
                }

                if(val < addr) {
                    setAssemblerError(true);
                    setAssemblerMessage("[Line " + (line + 1) + "] ORG command - ORG value cannot be less than the calculated address preceding it. '.org " + val + "' < " + addr + ".");
                    return;
                }

                addr = val;

                continue;
            }

            if(tokens[0] === ".val") {
                let val = Number(tokens[1]);

                if(tokens.length - 1 != 1) {
                    setAssemblerError(true);
                    setAssemblerMessage("[Line " + (line + 1) + "] VAL command - invalid argument length.");
                    return;
                }

                if (isNaN(val)) {
                    setAssemblerError(true);
                    setAssemblerMessage("[Line " + (line + 1) + "] VAL command - malformed around '" + tokens[0] + "'.");
                    return;
                }

                if(val > 65536) {
                    setAssemblerError(true);
                    setAssemblerMessage("[Line " + (line + 1) + "] VAL command - invalid IMM16 value.");
                    return;
                }

                if(val < 0)
                    val = 65536 + val

                ram[addr++] = val;

                byteCount += 2;

                continue;
            }

            const inst = instruction[tokens[0].toUpperCase() as keyof typeof instruction]

            // Check instruction is valid
            if(inst === undefined) {
                setAssemblerError(true);
                setAssemblerMessage("[Line " + (line + 1) + "] Unrecognised instruction '" + tokens[0] + "'.");
                return;
            }

            switch(inst) {
                case instruction.NOP: {
                    ram[addr++] = 0 << 2;
                    break;
                }
                case instruction.MV: {
                    ram[addr++] = 1 << 2;
                    break;
                }
                case instruction.LI: {
                    ram[addr++] = 2 << 2;
                    break;
                }
                case instruction.LD: {
                    ram[addr++] = 3 << 2;
                    break;
                }
                case instruction.LDIND: {
                    ram[addr++] = 4 << 2;
                    break;
                }
                case instruction.LDIO: {
                    ram[addr++] = 5 << 2;
                    break;
                }
                case instruction.STIO: {
                    ram[addr++] = 6 << 2;
                    break;
                }
                case instruction.ADD: {
                    ram[addr++] = 7 << 2;
                    break;
                }
                case instruction.SUB: {
                    ram[addr++] = 8 << 2;
                    break;
                }
                case instruction.NEG: {
                    ram[addr++] = 9 << 2;
                    break;
                }
                case instruction.XOR: {
                    ram[addr++] = 10 << 2;
                    break;
                }
                case instruction.NAND: {
                    ram[addr++] = 11 << 2;
                    break;
                }
                case instruction.AND: {
                    ram[addr++] = 12 << 2;
                    break;
                }
                case instruction.OR: {
                    ram[addr++] = 13 << 2;
                    break;
                }
                case instruction.NOT: {
                    ram[addr++] = 14 << 2;
                    break;
                }
                case instruction.J: {
                    ram[addr++] = 15 << 2;
                    break;
                }
                case instruction.JNZ: {
                    ram[addr++] = 16 << 2;
                    break;
                }
                case instruction.JIMM: {
                    ram[addr++] = 17 << 2;
                    break;
                }
                case instruction.ADDI: {
                    ram[addr++] = 18 << 2;
                    break;
                }
                case instruction.ST: {
                    ram[addr++] = 19 << 2;
                    break;
                }
                case instruction.JZ: {
                    ram[addr++] = 20 << 2;
                    break;
                }
                case instruction.JN: {
                    ram[addr++] = 21 << 2;
                    break;
                }
            }

            // Check length of arguments
            if(tokens.length - 1 != recognisedArgType[inst].length) {
                setAssemblerError(true);
                setAssemblerMessage("[Line " + (line + 1) + "] wrong amount of arguments for instruction '" + tokens[0] + "'.");
                return;
            }

            //addr += recognisedInstructionLength[opIndex];

            const setRegisterSrcDest = (memoryAddr: number, reg: number, type: number) => {
                ram[memoryAddr] |= parseInt(('000' + reg.toString(2)).slice(-3).split("").reverse().join(""), 2) << (7 + type * 3);
            }

            const findRegisterTokenOffset = (i: number, token: number) => {
                switch(inst) {
                    case instruction.ST: {
                        setRegisterSrcDest(addr - 2, i,token - 2);
                        break;
                    }
                    case instruction.LDIO:
                    case instruction.STIO:
                    case instruction.J:
                    case instruction.JZ:
                    case instruction.JN:
                    case instruction.JNZ: {
                        setRegisterSrcDest(addr - 1, i,token - 1);
                        break;
                    }
                    default: {
                        setRegisterSrcDest(addr - 1, i,token - 1 == 0? 2 : token - 2);
                        break;
                    }
                }
            }

            //Check args
            for(let token = 1; token < tokens.length; token++) {
                let error = true;
                const checkToken = tokens[token].replace("\n", ",")

                let currentlyChecking = "";

                switch(recognisedArgType[inst][token - 1]) {
                    case 'r': {
                        currentlyChecking = "REGISTER";

                        for(let i = 0; i < 8; i++)
                        {
                            if(checkToken === "r" + i +",") {
                                error = false;

                                findRegisterTokenOffset(i, token);
                            }

                            if(checkToken === "r" + i && token == tokens.length - 1) {
                                error = false;

                                findRegisterTokenOffset(i, token);
                            }
                        }

                        break;
                    }

                    case 'i': {
                        currentlyChecking = "IMM16";

                        if(checkToken === "") {
                            break;
                        }

                        let immVal = Number(checkToken.replace(",", ""))

                        if(isNaN(immVal))
                            break;

                        if(immVal > 65536)
                            break;

                        error = false;

                        if(immVal < 0)
                            immVal = 65536 + immVal;

                        ram[addr++] = immVal;

                        break;
                    }

                    case 'a': {
                        currentlyChecking = "IMM16LABEL"

                        if(checkToken === "") {
                            break;
                        }

                        let immVal = Number(checkToken.replace(",", ""))

                        if(isNaN(immVal))
                        {
                            usedLabels.push(checkToken.replace(",", ""));
                            usedLablesLine.push(line);
                            usedLabelsAddr.push(addr++);

                        } else {
                            if(immVal > 65536)
                                break;

                            if(immVal < 0)
                                immVal = 65536 + immVal;

                            ram[addr++] = immVal;
                        }

                        error = false;
                        break;
                    }

                    default: continue;
                }

                if(error) {
                    setAssemblerError(true);
                    setAssemblerMessage("[Line " + (line + 1) + "] Bad argument syntax around '" + checkToken + "'. Expected " + currentlyChecking + ".");

                    return;
                }
            }
        }

        for(let i = 0; i < usedLabels.length; i++) {
            const foundIndex = labels.findIndex((el) => el === usedLabels[i]);
            if(foundIndex === -1) {
                setAssemblerError(true);
                setAssemblerMessage("[Line " + (usedLablesLine[i] + 1) + "] Bad argument syntax around '" + usedLabels[i] + "'. Expected IMM16LABEL: label not found.")

                return;
            } else {
                ram[usedLabelsAddr[i]] = labelsAddr[foundIndex];
            }
        }

        setAssemblerComplete(true);
        setAssemblerError(false);
        setAssemblerMessage("Success - assembled " + byteCount + " bytes.");
    }

    return <>
        <AppBar className={styles.header} position={"static"} color="transparent">
            <Toolbar variant="dense">
                <Breadcrumbs aria-label="breadcrumb">
                    <Link href={"https://www.hackerspace-ntnu.no"} underline="hover" color="inherit">Hackerspace NTNU</Link>
                    <Typography color="inherit">Breadboard Computer</Typography>
                    <Typography color="inherit" sx={{ color: 'text.primary' }}>Emulator</Typography>
                </Breadcrumbs>
                <Typography variant={"subtitle2"} sx={{ color: 'text.secondary' }} className={styles.versionInfo}>
                    {process.env.BUILD_VERSION ? "v" + process.env.BUILD_VERSION : "v1.081224a"}
                </Typography>
            </Toolbar>
        </AppBar>
        <Grid container className={styles.grid}>
            <Grid size={8}>
                <Card className={styles.buttons}>
                    <Tooltip describeChild title={"Stop and reset the CPU."}>
                        <span>
                            <Button variant="contained" color="error" disabled={!(running || loaded)} onClick={() => stopProgram()} endIcon={<StopIcon />}>
                                Stop
                            </Button>
                        </span>
                    </Tooltip>
                    {" "}
                    <Tooltip describeChild title={loaded? "Step to the next instruction." : "Start the CPU and manually step through instructions."}>
                        <span>
                            <Button variant="contained" color="info" onClick={() => stepProgram()} endIcon={<MoveDownIcon />}>
                                Step
                            </Button>
                        </span>
                    </Tooltip>
                    {" "}
                    <Tooltip describeChild title={running? "Pause the CPU." : loaded? "Start running the CPU from this point." : "Start the CPU."}>
                        <span>
                            <Button sx={{width: "125px"}} variant="contained" color={running? 'warning': loaded? 'success' : 'success'} onClick={() => runProgram()} endIcon={running? <PauseIcon /> : loaded? <PlayArrowIcon /> : <PlayArrowIcon />}>
                                {running? 'Pause' : loaded? 'Continue' : 'Run'}
                            </Button>
                        </span>
                    </Tooltip>
                    {" "}
                    <Tooltip describeChild title={"The target speed for the CPU."}>
                        <TextField disabled={running} label={"Target clock speed (kHz)"}
                               value={clockSpeed}
                               error={isNaN(parseInt(clockSpeed))}
                               onChange={(e) => setClockSpeed(e.target.value)}
                               size="small"
                        />
                    </Tooltip>
                    {advancedView? <>
                        {" "}
                            <Tooltip describeChild title={"Run a pre-determined amount of cycles as fast as possible."}>
                                <Button variant="contained" color="secondary" onClick={() => fastProgram()} endIcon={<FastForwardIcon />}>
                                    Fast
                                </Button>
                            </Tooltip>
                            {" "}
                            <Tooltip describeChild title={"The amount of instructions to run before updating the emulator."}>
                            <TextField label={"Instructions to run"}
                                       value={instructionsToRun}
                                       type={"number"}
                                       onChange={(e) => setInstructionsToRun(parseInt(e.target.value))}
                                       size="small"
                            />
                            </Tooltip>
                        </> : "" }
                    {" "}
                    <TextField label={"Assembler output"}
                               className={styles.monospaceFont}
                               focused={assemblerMessage !== ""}
                               color={assemblerError? "error" : "success"}
                               value={assemblerMessage}
                               size="small"
                               fullWidth
                               sx={{marginTop: "10px"}}
                    />
                </Card>
                {" "}
                <Tooltip placement={"right"} describeChild title={"The assembler will run every time the code changes. May make the editor sluggish."}>
                    <FormControlLabel checked={dynamicAssemble} onChange={() => setDynamicAssemble(!dynamicAssemble)} sx={{marginLeft: "0px"}} control={<Switch />} label="Real-time assembling" />
                </Tooltip>
                {" "}
                <Paper className={styles.paper}>
                    <TextField
                        className={styles.code}
                        id="filled-multiline-static"
                        label="Assembly code"
                        multiline
                        variant="filled"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                </Paper>
                <Typography variant="h6" color={"textSecondary"} sx={{marginLeft: "5px"}}>Information</Typography>
                <Typography variant="body2" color={"textSecondary"} sx={{marginLeft: "5px"}}>ISA can be found <Link href="https://docs.google.com/spreadsheets/d/1mIsQ3Vdh5gI_Ev8K1EMr8evgGbL2lcfX5DoIiAMOvwg/edit?gid=0#gid=0">here</Link>.</Typography>
                <Typography variant="body2" color={"textSecondary"} sx={{marginLeft: "5px"}}>
                    <br />
                    Assembler specific information: <br />
                    <strong>; comment</strong> - will be ignored. <br />
                    <strong>.org $addr</strong> - set the address of the following instructions / data. Cannot be used to go backwards, as the assembler won&#39;t let you overwrite data. <br />
                    <strong>.val $val</strong> - put a 16-bit value at the address in memory which this instruction would occupy. <br />
                    <strong>Instructions using immediate addresses can take values and labels.</strong> Example: <i>jimm 64</i> and <i>jimm someLabel</i> are both valid.
                </Typography>
            </Grid>
            <Grid size={4}>
                <Paper className={`${styles.paper} ${styles.visualizer}`}>
                    <Typography variant="subtitle1" sx={{marginLeft: "5px"}}>BBC state</Typography>
                    <Card variant="outlined" className={styles.registers}>
                        <Typography variant="h6">Instruction</Typography>
                        <ViewInstructionComponent memoryContent={reg_PC > 32767? vram[reg_PC - 32768] : ram[reg_PC]} immContent={reg_PC + 1 > 32767? vram[reg_PC - 32767] : ram[reg_PC + 1]} />
                    </Card>
                    <Card variant="outlined" className={styles.registers}>
                        <Typography variant="h6" sx={{marginBottom: "10px"}}>Registers</Typography>
                        <TextField className={styles.register} label="PC" sx={{width: "65pt"}} value={showHexValues? "0x" + ('000' + reg_PC.toString(16)).slice(-4) : reg_PC} color="primary" focused />
                        <br />
                        <Tooltip describeChild arrow placement={"top"} title={reg_r0}>
                            <TextField className={styles.register} label="r0" sx={{width: "65pt"}} value={showHexValues? "0x" + ('000' + reg_r0.toString(16)).slice(-4) : reg_r0 < 32767? reg_r0 : reg_r0 - 65536} color="secondary" focused />
                        </Tooltip>
                        <Tooltip describeChild arrow placement={"top"} title={reg_r1}>
                            <TextField className={styles.register} label="r1" sx={{width: "65pt"}} value={showHexValues? "0x" + ('000' + reg_r1.toString(16)).slice(-4) : reg_r1 < 32767? reg_r1 : reg_r1 - 65536} color="secondary" focused />
                        </Tooltip>
                        <Tooltip describeChild arrow placement={"top"} title={reg_r2}>
                            <TextField className={styles.register} label="r2" sx={{width: "65pt"}} value={showHexValues? "0x" + ('000' + reg_r2.toString(16)).slice(-4) : reg_r2 < 32767? reg_r2 : reg_r2 - 65536} color="secondary" focused />
                        </Tooltip>
                        <Tooltip describeChild arrow placement={"top"} title={reg_r3}>
                            <TextField className={styles.register} label="r3" sx={{width: "65pt"}} value={showHexValues? "0x" + ('000' + reg_r3.toString(16)).slice(-4) : reg_r3 < 32767? reg_r3 : reg_r3 - 65536} color="secondary" focused />
                        </Tooltip>
                        <br />
                        <Tooltip describeChild arrow placement={"top"} title={reg_r4}>
                            <TextField className={styles.register} label="r4" sx={{width: "65pt"}} value={showHexValues? "0x" + ('000' + reg_r4.toString(16)).slice(-4) : reg_r4 < 32767? reg_r4 : reg_r4 - 65536} color="secondary" focused />
                        </Tooltip>
                        <Tooltip describeChild arrow placement={"top"} title={reg_r5}>
                            <TextField className={styles.register} label="r5" sx={{width: "65pt"}} value={showHexValues? "0x" + ('000' + reg_r5.toString(16)).slice(-4) : reg_r5 < 32767? reg_r5 : reg_r5 - 65536} color="secondary" focused />
                        </Tooltip>
                        <Tooltip describeChild arrow placement={"top"} title={reg_r6}>
                            <TextField className={styles.register} label="r6" sx={{width: "65pt"}} value={showHexValues? "0x" + ('000' + reg_r6.toString(16)).slice(-4) : reg_r6 < 32767? reg_r6 : reg_r6 - 65536} color="secondary" focused />
                        </Tooltip>
                        <Tooltip describeChild arrow placement={"top"} title={reg_r7}>
                            <TextField className={styles.register} label="r7" sx={{width: "65pt"}} value={showHexValues? "0x" + ('000' + reg_r7.toString(16)).slice(-4) : reg_r7 < 32767? reg_r7 : reg_r7 - 65536} color="secondary" focused />
                        </Tooltip>
                        <Tooltip describeChild title={"Change between showing base-16 and base-10 numbers."}>
                            <Button variant="contained" color={showHexValues? "success" : "error"} onClick={() => setShowHexValues(!showHexValues)}>Hexadecimal</Button>
                        </Tooltip>
                    </Card>
                    <Card variant="outlined" className={styles.registers}>
                        <Tooltip describeChild placement={"left"} title={"Visual representation of the video memory. Refreshes once per second."}>
                            <Typography variant="h6" sx={{marginBottom: "10px"}}>PPU</Typography>
                        </Tooltip>
                            <Canvas key={canvasUpdateKey} vram={vram}/>
                    </Card>
                </Paper>
            </Grid>
        </Grid>
    </>
}