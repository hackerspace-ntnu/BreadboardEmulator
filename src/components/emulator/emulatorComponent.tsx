/* eslint-disable react-hooks/exhaustive-deps */
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
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import MoveDownIcon from '@mui/icons-material/MoveDown';
import ViewInstructionComponent from "@/components/viewInstruction/viewInstructionComponent";
import {CPUInit, CPUStep, ICPUState, Instruction, Register, verify16BitNum} from "@/emulation/emulator";

export default function EmulatorComponent() {
    const [CPUState, setCPUState] = useState<ICPUState>({PC: 0, memory: Array<number>(65535), registers: Array<Register>(8)});

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

    useEffect(() => {
        if(dynamicAssemble)
            assemble()

    }, [dynamicAssemble, code])

    useEffect(() => {
        setCPUState(CPUInit());

        setInterval(() => {
            setCanvasUpdateKey(Date.now().toString());
        }, 1000)

        console.log("Running 100 tests to determine clock modifier...");

        let sum = 0;

        for(let i = 0; i < 100; i++) {
            const state: ICPUState = {
                PC: 0,
                registers: [0, 0, 0, 0, 0, 0, 0, 0],
                memory: [8, 1]
            };

            const clockStart = window.performance.now();
            CPUStep(state, 1);
            const clockStop = window.performance.now();

            sum += (clockStop - clockStart);
        }

        console.log("Tests complete. Result:", sum / 100, "ms");
        setClockSpeedModifier(sum / 100);
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

    const runProgram = () => {
        if(running) {
            setRunning(false);
        }else {
            assemble();

            const targetClock = parseFloat(clockSpeed) * 1000;
            console.log("Target clock speed:", targetClock + "Hz");
            console.log("Clock speed modifier:", clockSpeedModifier.toFixed(3)+"ms");

            const stepsPerMs = targetClock/1000;
            console.log("steps", stepsPerMs)

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
        setCPUState(CPUInit());

        setRunning(false);
        setLoaded(false);
        setRunning(false);
    }

    const stepProgram = () => {
        if(loaded && running) {
            setRunning(false);
        } else if(!loaded) {
            setCPUState(CPUInit());
            setLoaded(true);
            assemble()
        }

        const state = CPUStep(CPUState, 1);
        setCPUState(state);
    }

    const CPUStepRunning = (steps: number) => {
        setCPUState(CPUStep(CPUState, steps));
        setCompletedExecution(!completedExecution);
    }

    useEffect(() => {
        if(running) {
            setCpuTimeout(setTimeout(() => {
                CPUStepRunning(stepsPerMillis);
            }, millis));
        } else {
            clearInterval(cpuTimeout);
        }
    }, [running, completedExecution])

    const assemble = () => {
        const state = CPUInit();

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

                state.memory[addr++] = val;

                byteCount += 2;

                continue;
            }

            const inst = Instruction[tokens[0].toUpperCase() as keyof typeof Instruction]

            // Check instruction is valid
            if(inst === undefined) {
                setAssemblerError(true);
                setAssemblerMessage("[Line " + (line + 1) + "] Unrecognised instruction '" + tokens[0] + "'.");
                return;
            }

            switch(inst) {
                case Instruction.NOP: {
                    state.memory[addr++] = 0 << 2;
                    break;
                }
                case Instruction.MV: {
                    state.memory[addr++] = 1 << 2;
                    break;
                }
                case Instruction.LI: {
                    state.memory[addr++] = 2 << 2;
                    break;
                }
                case Instruction.LD: {
                    state.memory[addr++] = 3 << 2;
                    break;
                }
                case Instruction.LDIND: {
                    state.memory[addr++] = 4 << 2;
                    break;
                }
                case Instruction.LDIO: {
                    state.memory[addr++] = 5 << 2;
                    break;
                }
                case Instruction.STIO: {
                    state.memory[addr++] = 6 << 2;
                    break;
                }
                case Instruction.ADD: {
                    state.memory[addr++] = 7 << 2;
                    break;
                }
                case Instruction.SUB: {
                    state.memory[addr++] = 8 << 2;
                    break;
                }
                case Instruction.NEG: {
                    state.memory[addr++] = 9 << 2;
                    break;
                }
                case Instruction.XOR: {
                    state.memory[addr++] = 10 << 2;
                    break;
                }
                case Instruction.NAND: {
                    state.memory[addr++] = 11 << 2;
                    break;
                }
                case Instruction.AND: {
                    state.memory[addr++] = 12 << 2;
                    break;
                }
                case Instruction.OR: {
                    state.memory[addr++] = 13 << 2;
                    break;
                }
                case Instruction.NOT: {
                    state.memory[addr++] = 14 << 2;
                    break;
                }
                case Instruction.J: {
                    state.memory[addr++] = 15 << 2;
                    break;
                }
                case Instruction.JNZ: {
                    state.memory[addr++] = 16 << 2;
                    break;
                }
                case Instruction.JIMM: {
                    state.memory[addr++] = 17 << 2;
                    break;
                }
                case Instruction.ADDI: {
                    state.memory[addr++] = 18 << 2;
                    break;
                }
                case Instruction.ST: {
                    state.memory[addr++] = 19 << 2;
                    break;
                }
                case Instruction.JZ: {
                    state.memory[addr++] = 20 << 2;
                    break;
                }
                case Instruction.JN: {
                    state.memory[addr++] = 21 << 2;
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
                state.memory[memoryAddr] |= parseInt(('000' + reg.toString(2)).slice(-3).split("").reverse().join(""), 2) << (7 + type * 3);
            }

            const findRegisterTokenOffset = (i: number, token: number) => {
                switch(inst) {
                    case Instruction.ST: {
                        setRegisterSrcDest(addr - 2, i,token - 2);
                        break;
                    }
                    case Instruction.LDIO:
                    case Instruction.STIO:
                    case Instruction.J:
                    case Instruction.JZ:
                    case Instruction.JN:
                    case Instruction.JNZ: {
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

                        state.memory[addr++] = immVal;

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

                            state.memory[addr++] = immVal;
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
                state.memory[usedLabelsAddr[i]] = labelsAddr[foundIndex];
            }
        }

        setAssemblerComplete(true);
        setAssemblerError(false);
        setCPUState(state);
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
                    {" "}
                    <TextField label={"Assembler output"}
                               className={styles.monospaceFont}
                               focused={assemblerMessage !== ""}
                               color={assemblerError? "error" : assemblerComplete? "success" : "info"}
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
                        <ViewInstructionComponent memoryContent={CPUState.memory[CPUState.PC]} immContent={CPUState.memory[verify16BitNum(CPUState.PC + 1)]} />
                    </Card>
                    <Card variant="outlined" className={styles.registers}>
                        <Typography variant="h6" sx={{marginBottom: "10px"}}>Registers</Typography>
                        <TextField className={styles.register} label="PC" sx={{width: "65pt"}} value={showHexValues? "0x" + ('000' + CPUState.PC.toString(16)).slice(-4) : CPUState.PC} color="primary" focused />
                        <br />
                        <Tooltip describeChild arrow placement={"top"} title={CPUState.registers[0]}>
                            <TextField className={styles.register} label="r0" sx={{width: "65pt"}} value={showHexValues? "0x" + ('000' + CPUState.registers[0].toString(16)).slice(-4) : CPUState.registers[0] < 32767? CPUState.registers[0] : CPUState.registers[0] - 65536} color="secondary" focused />
                        </Tooltip>
                        <Tooltip describeChild arrow placement={"top"} title={CPUState.registers[1]}>
                            <TextField className={styles.register} label="r1" sx={{width: "65pt"}} value={showHexValues? "0x" + ('000' + CPUState.registers[1].toString(16)).slice(-4) : CPUState.registers[1] < 32767? CPUState.registers[1] : CPUState.registers[1] - 65536} color="secondary" focused />
                        </Tooltip>
                        <Tooltip describeChild arrow placement={"top"} title={CPUState.registers[2]}>
                            <TextField className={styles.register} label="r2" sx={{width: "65pt"}} value={showHexValues? "0x" + ('000' + CPUState.registers[2].toString(16)).slice(-4) : CPUState.registers[2] < 32767? CPUState.registers[2] : CPUState.registers[2] - 65536} color="secondary" focused />
                        </Tooltip>
                        <Tooltip describeChild arrow placement={"top"} title={CPUState.registers[3]}>
                            <TextField className={styles.register} label="r3" sx={{width: "65pt"}} value={showHexValues? "0x" + ('000' + CPUState.registers[3].toString(16)).slice(-4) : CPUState.registers[3] < 32767? CPUState.registers[3] : CPUState.registers[3] - 65536} color="secondary" focused />
                        </Tooltip>
                        <br />
                        <Tooltip describeChild arrow placement={"top"} title={CPUState.registers[4]}>
                            <TextField className={styles.register} label="r4" sx={{width: "65pt"}} value={showHexValues? "0x" + ('000' + CPUState.registers[4].toString(16)).slice(-4) : CPUState.registers[4] < 32767? CPUState.registers[4] : CPUState.registers[4] - 65536} color="secondary" focused />
                        </Tooltip>
                        <Tooltip describeChild arrow placement={"top"} title={CPUState.registers[5]}>
                            <TextField className={styles.register} label="r5" sx={{width: "65pt"}} value={showHexValues? "0x" + ('000' + CPUState.registers[5].toString(16)).slice(-4) : CPUState.registers[5] < 32767? CPUState.registers[5] : CPUState.registers[5] - 65536} color="secondary" focused />
                        </Tooltip>
                        <Tooltip describeChild arrow placement={"top"} title={CPUState.registers[6]}>
                            <TextField className={styles.register} label="r6" sx={{width: "65pt"}} value={showHexValues? "0x" + ('000' + CPUState.registers[6].toString(16)).slice(-4) : CPUState.registers[6] < 32767? CPUState.registers[6] : CPUState.registers[6] - 65536} color="secondary" focused />
                        </Tooltip>
                        <Tooltip describeChild arrow placement={"top"} title={CPUState.registers[7]}>
                            <TextField className={styles.register} label="r7" sx={{width: "65pt"}} value={showHexValues? "0x" + ('000' + CPUState.registers[7].toString(16)).slice(-4) : CPUState.registers[7] < 32767? CPUState.registers[7] : CPUState.registers[7] - 65536} color="secondary" focused />
                        </Tooltip>
                        <Tooltip describeChild title={"Change between showing base-16 and base-10 numbers."}>
                            <Button variant="contained" color={showHexValues? "success" : "error"} onClick={() => setShowHexValues(!showHexValues)}>Hexadecimal</Button>
                        </Tooltip>
                    </Card>
                    <Card variant="outlined" className={styles.registers}>
                        <Tooltip describeChild placement={"left"} title={"Visual representation of the video memory. Refreshes once per second."}>
                            <Typography variant="h6" sx={{marginBottom: "10px"}}>PPU</Typography>
                        </Tooltip>
                            <Canvas key={canvasUpdateKey} memory={CPUState.memory}/>
                    </Card>
                </Paper>
            </Grid>
        </Grid>
    </>
}