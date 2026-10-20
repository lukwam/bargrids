"""Run a classic Mac HyperCard XFCN code resource under Unicorn with a fake HyperCard host."""
import struct

from unicorn import UC_ARCH_M68K, UC_HOOK_CODE, UC_MODE_BIG_ENDIAN, Uc
from unicorn.m68k_const import (UC_CPU_M68K_M68030, UC_M68K_REG_A0, UC_M68K_REG_A1,
                                UC_M68K_REG_A7, UC_M68K_REG_D0, UC_M68K_REG_PC)

LOWMEM, CODE, BLOCK, CALLBACK, HEAP, STACK_TOP, RETURN = (
    0x0, 0x10000, 0x30000, 0x31000, 0x40000, 0x1F0000, 0x32000)
MEM_SIZE = 0x200000


class HyperCardHost:
    def __init__(self, code):
        self.uc = Uc(UC_ARCH_M68K, UC_MODE_BIG_ENDIAN)
        self.uc.ctl_set_cpu_model(UC_CPU_M68K_M68030)  # default is ColdFire
        self.uc.mem_map(0, MEM_SIZE)
        self.uc.mem_write(CODE, code)
        self.uc.mem_write(CALLBACK, b"\x4e\x75")  # rts
        self.uc.mem_write(RETURN, b"\x4e\x71")    # nop; emulation stops here
        self.heap = HEAP
        self.handle_sizes = {}
        self.messages = []
        # Hook each A-line trap word so we can emulate the Toolbox call in Python.
        self.traps = {CODE + i: struct.unpack(">H", code[i:i + 2])[0]
                      for i in range(0, len(code) - 1, 2)
                      if code[i] in (0xA0, 0xA1, 0xA8, 0xA9)}
        self.uc.hook_add(UC_HOOK_CODE, self._on_code)

    # memory helpers
    def r16(self, a): return struct.unpack(">H", self.uc.mem_read(a, 2))[0]
    def r32(self, a): return struct.unpack(">I", self.uc.mem_read(a, 4))[0]
    def w16(self, a, v): self.uc.mem_write(a, struct.pack(">H", v & 0xFFFF))
    def w32(self, a, v): self.uc.mem_write(a, struct.pack(">I", v & 0xFFFFFFFF))
    def reg(self, r): return self.uc.reg_read(r)
    def set(self, r, v): self.uc.reg_write(r, v & 0xFFFFFFFF)

    def alloc(self, n):
        a = self.heap
        self.heap += (n + 3) & ~3
        return a

    def new_handle(self, data):
        ptr = self.alloc(len(data) + 1)
        self.uc.mem_write(ptr, data)
        h = self.alloc(4)
        self.w32(h, ptr)
        self.handle_sizes[h] = len(data)
        return h

    def resize_handle(self, h, size):
        """Move a handle's block to a fresh allocation of the new size, keeping its contents."""
        old = self.handle_sizes.get(h, 0)
        ptr = self.alloc(size + 1)
        if old:
            self.uc.mem_write(ptr, bytes(self.uc.mem_read(self.r32(h), min(old, size))))
        self.w32(h, ptr)
        self.handle_sizes[h] = size

    def cstr(self, a):
        out = bytearray()
        while (b := self.uc.mem_read(a + len(out), 1)[0]) != 0:
            out.append(b)
        return bytes(out)

    def pstr(self, a):
        n = self.uc.mem_read(a, 1)[0]
        return bytes(self.uc.mem_read(a + 1, n))

    def _on_code(self, uc, addr, size, _):
        if addr == CALLBACK:
            self._callback()
        elif addr == RETURN:
            uc.emu_stop()
        elif addr in self.traps:
            self._trap(self.traps[addr])
            self.set(UC_M68K_REG_PC, addr + 2)

    def _callback(self):
        req = self.r16(BLOCK + 0x4C)
        a1, a2 = self.r32(BLOCK + 0x50), self.r32(BLOCK + 0x54)
        if req == 7:    # PasToZero(str) -> handle
            self.w32(BLOCK + 0x70, self.new_handle(self.pstr(a1)))
        elif req == 8:  # ZeroToPas(zstr, str255)
            s = self.cstr(a1)[:255]
            self.uc.mem_write(a2, bytes([len(s)]) + s)
        elif req == 27:  # ReturnToPas(ptr, str255): copy up to the next CR
            out = bytearray()
            while (b := self.uc.mem_read(a1 + len(out), 1)[0]) not in (0, 13) and len(out) < 255:
                out.append(b)
            self.uc.mem_write(a2, bytes([len(out)]) + bytes(out))
        elif req == 28:  # ScanToReturn(var ptr): advance to the next CR
            p = self.r32(a1)
            while self.uc.mem_read(p, 1)[0] not in (0, 13):
                p += 1
            self.w32(a1, p)
        elif req == 1:  # SendCardMessage
            self.messages.append(self.pstr(a1).decode("mac_roman"))
        else:
            raise RuntimeError(f"unhandled callback {req}")
        self.w16(BLOCK + 0x4E, 0)

    def _trap(self, word):
        sp = self.reg(UC_M68K_REG_A7)
        if word in (0xA029, 0xA02A):         # HLock / HUnlock
            self.set(UC_M68K_REG_D0, 0)
        elif word & 0xF0FF == 0xA022:        # NewHandle(d0) -> a0
            self.set(UC_M68K_REG_A0, self.new_handle(bytes(self.reg(UC_M68K_REG_D0))))
            self.set(UC_M68K_REG_D0, 0)
        elif word & 0xF0FF == 0xA024:        # SetHandleSize(a0, d0)
            self.resize_handle(self.reg(UC_M68K_REG_A0), self.reg(UC_M68K_REG_D0))
            self.set(UC_M68K_REG_D0, 0)
        elif word & 0xF0FF == 0xA025:        # GetHandleSize(a0) -> d0
            self.set(UC_M68K_REG_D0, self.handle_sizes[self.reg(UC_M68K_REG_A0)])
        elif word == 0xA9EF:                 # PtrAndHand(a0 ptr, a1 handle, d0 size): append
            src, h, n = (self.reg(UC_M68K_REG_A0), self.reg(UC_M68K_REG_A1),
                         self.reg(UC_M68K_REG_D0))
            data = bytes(self.uc.mem_read(src, n))
            old = self.handle_sizes[h]
            self.resize_handle(h, old + n)
            self.uc.mem_write(self.r32(h) + old, data)
            self.set(UC_M68K_REG_D0, 0)
        elif word == 0xA04C:                 # CompactMem
            self.set(UC_M68K_REG_D0, 0x100000)
        elif word == 0xA9EE:                 # Pack7: binary/decimal conversion
            sel = self.r16(sp)
            self.set(UC_M68K_REG_A7, sp + 2)
            a0 = self.reg(UC_M68K_REG_A0)
            if sel == 0:                     # NumToString(d0, a0)
                n = struct.unpack(">i", struct.pack(">I", self.reg(UC_M68K_REG_D0)))[0]
                s = str(n).encode()
                self.uc.mem_write(a0, bytes([len(s)]) + s)
            elif sel == 1:                   # StringToNum(a0) -> d0
                txt = self.pstr(a0).decode("mac_roman").strip()
                try:
                    n = int(txt)
                except ValueError:
                    n = 0
                self.set(UC_M68K_REG_D0, n)
            else:
                raise RuntimeError(f"Pack7 selector {sel}")
        else:
            raise RuntimeError(f"unhandled trap {word:04x} at sp={sp:x}")

    def call(self, *params):
        """Call the XFCN with string params; return its result string."""
        self.heap, self.handle_sizes = HEAP, {}  # calls are independent, so start each with a fresh heap
        self.uc.mem_write(BLOCK, bytes(0x80))
        self.w16(BLOCK, len(params))
        for i, p in enumerate(params):
            self.w32(BLOCK + 2 + 4 * i, self.new_handle(p.encode("mac_roman") + b"\0"))
        self.w32(BLOCK + 0x48, CALLBACK)
        sp = STACK_TOP
        sp -= 4; self.w32(sp, BLOCK)
        sp -= 4; self.w32(sp, RETURN)
        self.set(UC_M68K_REG_A7, sp)
        self.uc.emu_start(CODE, RETURN + 2, count=50_000_000)
        h = self.r32(BLOCK + 0x42)
        return self.cstr(self.r32(h)).decode("mac_roman") if h else None
