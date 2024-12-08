export type Register = number;
export type RegisterFile = Array<Register>;
export type Memory = Array<number>;

export interface ICPUState {
    PC: Register;
    registers: RegisterFile;
    memory: Memory;
}

export enum Instruction {
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

export function CPUInit(): ICPUState {
    const cpuState: ICPUState = {
        PC: 0,
        registers: [
            Math.floor(Math.random() * 65535),
            Math.floor(Math.random() * 65535),
            Math.floor(Math.random() * 65535),
            Math.floor(Math.random() * 65535),
            Math.floor(Math.random() * 65535),
            Math.floor(Math.random() * 65535),
            Math.floor(Math.random() * 65535),
            Math.floor(Math.random() * 65535)
        ],
        memory: Array<number>(65535)
    };

    for (let i = 0; i < 65535; i++) {
        cpuState.memory[i] = Math.floor(Math.random() * 65535);
    }

    return cpuState;
}

export function verify16BitNum(value: number): number { return value < 0 ? 65535 + value : value > 65535 ? value - 65536 : value; }

export function CPUStep(state_0: ICPUState, steps: number): ICPUState {
    const state: ICPUState = {
        PC: state_0.PC,
        registers: state_0.registers,
        memory: state_0.memory
    };

    for(let step = 0; step < steps; step++)
    {
        // Fetch
        const fetchedInstruction = ('0000000000000000' + state.memory[state.PC].toString(2)).slice(-16);

        // Decode
        const opcode = parseInt(fetchedInstruction.substring(9, 14), 2);
        const srcA   = parseInt(fetchedInstruction.substring(6, 9).split("").reverse().join(""), 2)
        const srcB   = parseInt(fetchedInstruction.substring(3, 6).split("").reverse().join(""), 2)
        const dest   = parseInt(fetchedInstruction.substring(0, 3).split("").reverse().join(""), 2)

        // Execute
        const instruction = opcode as Instruction;

        switch(instruction) {
            default:
            case undefined: // If instruction doesn't exist
            case Instruction.NOP:
                // No operation

                state.PC = verify16BitNum(++state.PC);
                break;
            case Instruction.MV:
                // Move register to another register
                state.registers[dest] = state.registers[srcA];

                state.PC = verify16BitNum(++state.PC);
                break;
            case Instruction.LI:
                // Load immediate into register
                state.registers[dest] = state.memory[verify16BitNum(++state.PC)];

                state.PC = verify16BitNum(++state.PC);
                break;
            case Instruction.LD:
                // Load indirect through immediate into register
                state.registers[dest] = state.memory[state.memory[verify16BitNum(++state.PC)]];

                state.PC = verify16BitNum(++state.PC);
                break;
            case Instruction.LDIND:
                // Load indirect through register into register
                state.registers[dest] = state.memory[state.registers[srcA]];

                state.PC = verify16BitNum(++state.PC);
                break;
            case Instruction.LDIO:
                // Load indirect through register + immediate offset into register
                state.registers[dest] = state.memory[verify16BitNum(state.registers[srcA] + state.memory[verify16BitNum(++state.PC)])];

                state.PC = verify16BitNum(++state.PC);
                break;
            case Instruction.STIO:
                // Store at register + immediate offset a register
                state.memory[verify16BitNum(state.registers[srcA] + state.memory[verify16BitNum(++state.PC)])] = state.registers[srcB];

                state.PC = verify16BitNum(++state.PC);
                break;
            case Instruction.ADD:
                // Add two registers
                state.registers[dest] = verify16BitNum(state.registers[srcA] + state.registers[srcB]);

                state.PC = verify16BitNum(++state.PC);
                break;
            case Instruction.SUB:
                // Subtract two registers
                state.registers[dest] = verify16BitNum(state.registers[srcA] - state.registers[srcB]);

                state.PC = verify16BitNum(++state.PC);
                break;
            case Instruction.NEG:
                // Take 2's complement of number and store it
                state.registers[dest] = parseInt(
                    ('0000000000000000' + state.registers[srcA].toString(2))
                        .slice(-16)
                        .split("")
                        .map((el) => el === '0' ? '1' : '0')
                        .join(""), 2) + 1;

                state.PC = verify16BitNum(++state.PC);
                break;
            case Instruction.XOR:
                // XOR two registers
                state.registers[dest] = state.registers[srcA] ^ state.registers[srcB];

                state.PC = verify16BitNum(++state.PC);
                break;
            case Instruction.NAND:
                state.registers[dest] = parseInt(
                    (state.registers[srcA] & state.registers[srcB])
                        .toString(2)
                        .split("")
                        .map((el) => el === '0' ? '1' : '0')
                        .join(""), 2);

                state.PC = verify16BitNum(++state.PC);
                break;
            case Instruction.AND:
                // AND two registers
                state.registers[dest] = state.registers[srcA] & state.registers[srcB];

                state.PC = verify16BitNum(++state.PC);
                break;
            case Instruction.OR:
                // OR two registers
                state.registers[dest] = state.registers[srcA] | state.registers[srcB];

                state.PC = verify16BitNum(++state.PC);
                break;
            case Instruction.NOT:
                // Take the NOT of a register
                state.registers[dest] = parseInt(
                    ('0000000000000000' + state.registers[srcA].toString(2))
                        .slice(-16)
                        .split("")
                        .map((el) => el === '0' ? '0' : '1')
                        .join(""), 2);

                state.PC = verify16BitNum(++state.PC);
                break;
            case Instruction.J:
                // Set PC to a register value
                state.PC = state.registers[srcA];

                break;
            case Instruction.JNZ:
                // Jump if register is not zero
                state.PC = state.registers[srcA] !== 0 ? state.memory[verify16BitNum(++state.PC)] : verify16BitNum(state.PC + 2);

                break;
            case Instruction.JIMM:
                // Jump to immediate value
                state.PC = state.memory[verify16BitNum(++state.PC)];

                break;
            case Instruction.ADDI:
                // Add a register with an immediate value
                state.registers[dest] = verify16BitNum(state.registers[srcA] + state.memory[verify16BitNum(++state.PC)]);

                state.PC = verify16BitNum(++state.PC);
                break;
            case Instruction.ST:
                // Store register at immediate address
                state.memory[verify16BitNum(++state.PC)] = state.registers[srcA];

                state.PC = verify16BitNum(++state.PC);
                break;
            case Instruction.JZ:
                // Jump if register is zero
                state.PC = state.registers[srcA] === 0 ? state.memory[verify16BitNum(++state.PC)] : verify16BitNum(state.PC + 2);

                break;
            case Instruction.JN:
                // Jump if register is negative
                state.PC = state.registers[srcA] > 32767 ? state.memory[verify16BitNum(++state.PC)] : verify16BitNum(state.PC + 2);

                break;
        }
    }

    return state;
}