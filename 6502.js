/****************************************************************************
******************************************************************************
**                                                                          **
**  Copyright (c) 2012 by Andrea Griffini                                   **
**                                                                          **
**  Permission is hereby granted, free of charge, to any person obtaining   **
**  a copy of this software and associated documentation files (the         **
**  "Software"), to deal in the Software without restriction, including     **
**  without limitation the rights to use, copy, modify, merge, publish,     **
**  distribute, sublicense, and/or sell copies of the Software, and to      **
**  permit persons to whom the Software is furnished to do so, subject to   **
**  the following conditions:                                               **
**                                                                          **
**  The above copyright notice and this permission notice shall be          **
**  included in all copies or substantial portions of the Software.         **
**                                                                          **
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,         **
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF      **
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND                   **
**  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE  **
**  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION  **
**  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION   **
**  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.         **
**                                                                          **
******************************************************************************
 ****************************************************************************/

// Note: special read/write only works for LDA/STA absolute

// key=address, value=function(data){...}
var special_write = { };

// key=address, value=function(){...}
var special_read = { };

// Utility ////////////////////////////////////////////////////////////

function hex(n,x)
{
    var r = "";
    for (var i=0; i<n; i++)
    {
        r = "0123456789ABCDEF"[x & 15] + r;
        x >>= 4;
    }
    return r;
}

function parseHex(x)
{
    var r = 0;
    for (var i=0; i<x.length; i++)
        r = (r << 4) + "0123456789ABCDEF".indexOf(x[i].toUpperCase());
    return r;
}

function parseBin(x)
{
    var r = 0;
    for (var i=0; i<x.length; i++)
        r = (r << 1) + (x[i]=="1");
    return r;
}

// Virtual CPU ////////////////////////////////////////////////////////

var m = new Uint8Array(65536);
var jitcode = [];
var jitmap = [];
var alive = true;
var current_f = null;
var a=0, x=0, y=0, c=0, z=0, w=0, s=0, d=0, v=0, ip=0, sp=0;

// Lazy Z/S evaluation; set_[sz] contains the code to set the flag
// s[sz](x) sets this code, f[sz]() returns the code and clears it.
var set_z = "";
var set_s = "";

function sz(x)  { set_z = "z=!(" + x + ");"; }
function ss(x)  { set_s = "s=((" + x + ")>127);"; }
function ssz(x) { sz(x); ss(x); }
function fz()   { var oz=set_z; set_z=""; return oz; }
function fs()   { var os=set_s; set_s=""; return os; }
function fsz()  { return fz()+fs(); }

function fszm()
{
    // Special case; if current delayed S/Z flags are
    // from memory then we must evaluate them before any
    // memory write. If they're from registers then
    // we can instead just keep delaying...
    return ((set_z.indexOf("m")!=-1 ? fz() : "") +
            (set_s.indexOf("m")!=-1 ? fs() : ""));
}

// Addressing modes

function imm() { return ""+m[ip++]; }
function zpg() { return "m["+m[ip++]+"]"; }
function zpx() { return "m[(x+"+m[ip++]+")&255]"; }
function zpy() { return "m[(y+"+m[ip++]+")&255]"; }
function abs() { ip+=2; return "m["+(m[ip-2]+(m[ip-1]<<8))+"]"; }
function abx() { ip+=2; return "m[(x+"+(m[ip-2]+(m[ip-1]<<8))+")&65535]"; }
function aby() { ip+=2; return "m[(y+"+(m[ip-2]+(m[ip-1]<<8))+")&65535]"; }
function iix() { var z=m[ip++]; return "m[m[("+z+"+x)&255]+(m[("+(z+1)+"+x)&255]<<16)]"; }
function iiy() { var z=m[ip++]; return "m[(m["+z+"]+(m["+((z+1)&255)+"]<<16)+y)&65535]"; }
function rel() { var delta=m[ip++]; if(delta>=128)delta-=256; return ""+((ip+delta)&65535); }
function adr() { ip+=2; return ""+(m[ip-2]+(m[ip-1]<<8)); }
function ind() { var z=m[ip]+m[ip+1]*256; ip+=2; return "m["+z+"]+(m["+((z+1)&65535)+"]<<8)"; }
function acc() { return "a"; }

// Disassembling addressing modes

function s_imm(ip)  { return [1, "#$" + hex(2,m[ip])]; }
function s_zpg(ip)  { return [1, "$" + hex(2,m[ip])]; }
function s_zpx(ip)  { return [1, "$" + hex(2,m[ip]) + ",x"]; }
function s_zpy(ip)  { return [1, "$" + hex(2,m[ip]) + ",y"]; }
function s_abs(ip)  { return [2, "$" + hex(4,m[ip]+m[(ip+1)&65535]*256)]; }
function s_abx(ip)  { return [2, "$" + hex(4,m[ip]+m[(ip+1)&65535]*256) + ",x"]; }
function s_aby(ip)  { return [2, "$" + hex(4,m[ip]+m[(ip+1)&65535]*256) + ",y"]; }
function s_iix(ip)  { return [1, "($" + hex(2,m[ip]) + ",x)"]; }
function s_iiy(ip)  { return [1, "($" + hex(2,m[ip]) + "),y"]; }
function s_rel(ip)  { var delta = m[ip]; if (delta>=128) delta-=256; return [1, "$" + hex(4,ip+1+delta)]; }
function s_adr(ip)  { return [2, "$" + hex(4,m[ip]+m[ip+1]*256)]; }
function s_ind(ip)  { return [2, "($" + hex(4,m[ip]+m[ip+1]*256) + ")"]; }
function s_acc(ip)  { return [0, "a"]; }

// Opcode implentation

function ___()  { return "{*Invalid opcode*}"; }

function adc(m) { ssz("a"); return "w="+m+"+a+c;c=(w>255);v=((a&0x80)!=(w&0x80));a=(w&255);"; }
function and(m) { ssz("a"); return "a&="+m+";"; }
function asl(m) { ssz(m); return "w=("+m+"<<1);c=(w>255);"+m+"=w&255;"; }
function bcc(m) { return "if(!c){"+fsz()+"ip="+m+";return;}"; }
function bcs(m) { return "if(c){"+fsz()+"ip="+m+";return;}"; }
function beq(m) { return fz()+"if(z){"+fs()+"ip="+m+";return;}"; }
function bit(m) { sz("a&"+m); ss(m); return "v=(("+m+"&0x40)!=0);"; }
function bmi(m) { return fs()+"if(s){"+fz()+"ip="+m+";return;}"; }
function bne(m) { return fz()+"if(!z){"+fs()+"ip="+m+";return;}"; }
function bpl(m) { return fs()+"if(!s){"+fz()+"ip="+m+";return;}"; }
function brk(m) { return fsz()+"alert(\"BRK #$" + hex(2, m) + "\");ip=0;return;"; }
function bvc(m) { return "if(!v){"+fsz()+"ip="+m+";return;}"; }
function bvs(m) { return "if(v){"+fsz()+"ip="+m+";return;}"; }
function clc(m) { return "c=0;"; }
function cld(m) { return "d=0;"; }
function cli(m) { throw "Not implemented"; }
function clv(m) { return "v=0;"; }
function cmp(m) { ssz("w"); return "c=(a>="+m+");w=(a-"+m+")&255;"; }
function cpx(m) { ssz("w"); return "c=(x>="+m+");w=(x-"+m+")&255;"; }
function cpy(m) { ssz("w"); return "c=(y>="+m+");w=(y-"+m+")&255;"; }
function dec(m) { ssz(m); return "maykill("+m.substr(2,m.length-3)+");"+m+"=("+m+"-1)&255;if(!alive){ip="+ip+";return;}"; }
function dex(m) { ssz("x"); return "x=(x-1)&255;"; }
function dey(m) { ssz("y"); return "y=(y-1)&255;"; }
function eor(m) { ssz("a"); return "a^="+m+";"; }
function inc(m) { ssz(m); return "maykill("+m.substr(2,m.length-3)+");"+m+"=("+m+"+1)&255;if(!alive){ip="+ip+";return;}"; }
function inx(m) { ssz("x"); return "x=(x+1)&255;"; }
function iny(m) { ssz("y"); return "y=(y+1)&255;"; }
function jmp(m) { return fsz()+"ip="+m+"; return;"; }
function jsr(m) { return fsz()+"m[256+sp]="+((ip-1)&255)+";m[256+((sp+1)&255)]="+((ip-1)>>8)+";sp=(sp+2)&255;ip="+m+";return;"; }
function lda(m) { ssz("a"); return "a="+m+";"; }
function ldx(m) { ssz("x"); return "x="+m+";"; }
function ldy(m) { ssz("y"); return "y="+m+";"; }
function lsr(m) { ssz(m); return "c="+m+"&1;"+m+">>=1;"; }
function nop(m) { return ""; }
function ora(m) { ssz("a"); return "a|="+m+";"; }
function pha(m) { return "m[256+sp]=a;sp=(sp+1)&255;"; }
function php(m) { throw "Not implemented"; }
function pla(m) { ssz("a"); return "sp=(sp-1)&255;a=m[256+sp];"; }
function plp(m) { throw "Not implemented"; }
function rol(m) { ssz(m); return "w="+m+";"+m+"=((w<<1)+c)&255;c=(w>127);"; }
function ror(m) { ssz(m); return "w="+m+";"+m+"=((w>>1)+(c<<7));c=(w&1);"; }
function rti(m) { throw "Not implemented"; }
function rts(m) { return fsz()+"sp=(sp-2)&255;ip=(m[sp+256]+(m[256+((sp+1)&255)]<<8)+1)&65535;"; }
function sbc(m) { ssz("w"); return "w=a-"+m+"-(1-c);c=(w>=0);v=((a&0x80)!=(w&0x80));a=(w&255);"; }
function sec(m) { return "c=1;"; }
function sed(m) { throw "Not implemented"; }
function sei(m) { throw "Not implemented"; }
function sta(m) { return "maykill("+m.substr(2,m.length-3)+");"+fszm()+m+"=a;if(!alive){ip="+ip+";return;}"; }
function stx(m) { return "maykill("+m.substr(2,m.length-3)+");"+fszm()+m+"=x;if(!alive){ip="+ip+";return;}"; }
function sty(m) { return "maykill("+m.susbtr(2,m.length-3)+");"+fszm()+m+"=y;if(!alive){ip="+ip+";return;}"; }
function tax(m) { ssz("a"); return "x=a;"; }
function tay(m) { ssz("a"); return "y=a;"; }
function tsx(m) { ssz("x"); return "x=sp;"; }
function txa(m) { ssz("a"); return "a=x;"; }
function txs(m) { return "sp=x;"; }
function tya(m) { ssz("a"); return "a=y;"; }

var jitstoppers = ["jmp", "jsr", "rts", "brk"];

var opcodes =
/*    0,8           1,9           2,A           3,B           4,C           5,D           6,E           7,F  */
[["brk","imm"],["ora","iix"],["___","___"],["___","___"],["___","___"],["ora","zpg"],["asl","zpg"],["___","___"],  // 00
 ["php","___"],["ora","imm"],["asl","acc"],["___","___"],["___","___"],["ora","abs"],["asl","abs"],["___","___"],  // 08
 ["bpl","rel"],["ora","iiy"],["___","___"],["___","___"],["___","___"],["ora","zpx"],["asl","zpx"],["___","___"],  // 10
 ["clc","___"],["ora","aby"],["___","___"],["___","___"],["___","___"],["ora","abx"],["asl","abx"],["___","___"],  // 18
 ["jsr","adr"],["and","iix"],["___","___"],["___","___"],["bit","zpg"],["and","zpg"],["rol","zpg"],["___","___"],  // 20
 ["plp","___"],["and","imm"],["rol","acc"],["___","___"],["bit","abs"],["and","abs"],["rol","abs"],["___","___"],  // 28
 ["bmi","rel"],["and","iiy"],["___","___"],["___","___"],["___","___"],["and","zpx"],["rol","zpx"],["___","___"],  // 30
 ["sec","___"],["and","aby"],["___","___"],["___","___"],["___","___"],["and","abx"],["rol","abx"],["___","___"],  // 38
 ["rti","___"],["eor","iix"],["___","___"],["___","___"],["___","___"],["eor","zpg"],["lsr","zpg"],["___","___"],  // 40
 ["pha","___"],["eor","imm"],["lsr","acc"],["___","___"],["jmp","adr"],["eor","abs"],["lsr","abs"],["___","___"],  // 48
 ["bvc","rel"],["eor","iiy"],["___","___"],["___","___"],["___","___"],["eor","zpx"],["lsr","zpx"],["___","___"],  // 50
 ["cli","___"],["eor","aby"],["___","___"],["___","___"],["___","___"],["eor","abx"],["lsr","abx"],["___","___"],  // 58
 ["rts","___"],["adc","iix"],["___","___"],["___","___"],["___","___"],["adc","zpg"],["ror","zpg"],["___","___"],  // 60
 ["pla","___"],["adc","imm"],["ror","acc"],["___","___"],["jmp","ind"],["adc","abs"],["ror","abs"],["___","___"],  // 68
 ["bvs","rel"],["adc","iiy"],["___","___"],["___","___"],["___","___"],["adc","zpx"],["ror","zpx"],["___","___"],  // 70
 ["sei","___"],["adc","aby"],["___","___"],["___","___"],["___","___"],["adc","abx"],["ror","abx"],["___","___"],  // 78
 ["___","___"],["sta","iix"],["___","___"],["___","___"],["sty","zpg"],["sta","zpg"],["stx","zpg"],["___","___"],  // 80
 ["dey","___"],["___","___"],["txa","___"],["___","___"],["sty","abs"],["sta","abs"],["stx","abs"],["___","___"],  // 88
 ["bcc","rel"],["sta","iiy"],["___","___"],["___","___"],["sty","zpx"],["sta","zpx"],["stx","zpy"],["___","___"],  // 90
 ["tya","___"],["sta","aby"],["txs","___"],["___","___"],["___","___"],["sta","abx"],["___","___"],["___","___"],  // 98
 ["ldy","imm"],["lda","iix"],["ldx","imm"],["___","___"],["ldy","zpg"],["lda","zpg"],["ldx","zpg"],["___","___"],  // A0
 ["tay","___"],["lda","imm"],["tax","___"],["___","___"],["ldy","abs"],["lda","abs"],["ldx","abs"],["___","___"],  // A8
 ["bcs","rel"],["lda","iiy"],["___","___"],["___","___"],["ldy","zpx"],["lda","zpx"],["ldx","zpy"],["___","___"],  // B0
 ["clv","___"],["lda","aby"],["tsx","___"],["___","___"],["ldy","abx"],["lda","abx"],["ldx","aby"],["___","___"],  // B8
 ["cpy","imm"],["cmp","iix"],["___","___"],["___","___"],["cpy","zpg"],["cmp","zpg"],["dec","zpg"],["___","___"],  // C0
 ["iny","___"],["cmp","imm"],["dex","___"],["___","___"],["cpy","abs"],["cmp","abs"],["dec","abs"],["___","___"],  // C8
 ["bne","rel"],["cmp","iiy"],["___","___"],["___","___"],["___","___"],["cmp","zpx"],["dec","zpx"],["___","___"],  // D0
 ["cld","___"],["cmp","aby"],["___","___"],["___","___"],["___","___"],["cmp","abx"],["dec","abx"],["___","___"],  // D8
 ["cpx","imm"],["sbc","iix"],["___","___"],["___","___"],["cpx","zpg"],["sbc","zpg"],["inc","zpg"],["___","___"],  // E0
 ["inx","___"],["sbc","imm"],["nop","___"],["___","___"],["cpx","abs"],["sbc","abs"],["inc","abs"],["___","___"],  // E8
 ["beq","rel"],["sbc","iiy"],["___","___"],["___","___"],["___","___"],["sbc","zpx"],["inc","zpx"],["___","___"],  // F0
 ["sed","___"],["sbc","aby"],["___","___"],["___","___"],["___","___"],["sbc","abx"],["inc","abx"],["___","___"]]; // F8

var revopcodes = {};
(function() {
    for (var i=0; i<256; i++)
        revopcodes[opcodes[i][0]+"/"+opcodes[i][1]] = i;
})();

function disassemble(ip)
{
    var op = opcodes[m[ip]];
    if (op[0] == "___")
    {
        return [0, hex(4, ip) + ": " + hex(2, m[ip]) + "       ???"];
    }
    else if (op[1] == "___")
    {
        return [0, hex(4, ip) + ": " + hex(2, m[ip]) + "       " + op[0]];
    }
    else
    {
        var ds = window["s_" + op[1]]((ip+1)&65535);
        return [ds[0], (hex(4, ip) + ": " + hex(2, m[ip]) + " " +
                        (ds[0] > 0 ? hex(2, m[(ip+1)&65535]) : "  ") + " " +
                        (ds[0] > 1 ? hex(2, m[(ip+2)&65535]) : "  ") + " " +
                        op[0] + " " + ds[1])];
    }
}

function maykill(m)
{
    var aL = jitmap[m];
    while (aL && aL.length)
    {
        var f = aL.pop();
        if (f === current_f) alive = false;
        for (var i=f.ip0; i<f.ip; i++)
        {
            var L = jitmap[i];
            var j = L.indexOf(f, L);
            L.splice(j, 1);
        }
        jitcode[f.ip0] = undefined;
    }
}

function jit()
{
    var count = 0, code = "(function(){";
    var ip0 = ip, addr;
    var NN = 2;
    while (count < NN)
    {
        count += 1;
        if (m[ip] == 0x8D && special_write[addr=m[ip+1]+256*m[ip+2]])
        {
            code += special_write[addr].name + "(a);\n";
            ip += 3;
        }
        else if (m[ip] == 0xAD && special_read[addr=m[ip+1]+256*m[ip+2]])
        {
            code += "a="+special_read[addr].name+"();\n";
            ssz("a");
            ip += 3;
        }
        else
        {
            var op = opcodes[m[ip++]];
            code += window[op[0]](window[op[1]]()) + "\n";
            if (jitstoppers.indexOf(op[0]) > -1)
                break;
        }
        if (count == NN)
            code += "ip=" + ip + ";";
    }
    code += fsz()+"})";
    var f = eval(code);

    for (var i=ip0; i<ip; i++)
    {
        var L = jitmap[i] = (jitmap[i] || []);
        L.push(f);
    }
    f.ip0 = ip0;
    f.ip = ip;
    f.alive = true;

    ip = ip0;

    return f;
}

function assemble(s)
{
    var labels = {};
    var fixups = [];
    var mm, opcode, mr, addr;
    s = s.split("\n");
    ip = 0x200;
    for (var i=0; i<s.length; i++)
    {
        var L = s[i];
        if (L.indexOf(";") != -1)
            L = L.substr(0, L.indexOf(";"));
        if (/^ *$/.exec(L))
            continue;
        if ((mm = /^([a-zA-Z][a-zA-Z0-9_]*): *$/.exec(L)))
        {
            if (labels[mm[1]]) throw "Duplicated label '" + mm[1] + "'";
            labels[mm[1]] = "$" + hex(4, ip);
        }
        else if ((mm = /^ +\.org +\$([0-9A-Fa-f]{4}) *$/.exec(L)))
        {
            ip = parseHex(mm[1]);
        }
        else if ((mm = /^ +\.db +((\$[0-9A-Fa-f]{2}|[0-9]+|%[01]{8})( *, *(\$[0-9A-Fa-f]{2}|[0-9]+|%[01]{8}))*) *$/.exec(L)))
        {
            var bytes = mm[1].split(",");
            for (var j=0; j<bytes.length; j++)
            {
                var bb = bytes[j];
                if ((mm = /\$([0-9A-Fa-f]{2})/.exec(bb)))
                    m[ip++] = parseHex(mm[1]);
                else if ((mm = /%([01]{8})/.exec(bb)))
                    m[ip++] = parseBin(mm[1]);
                else
                    m[ip++] = parseInt(bb);
            }
        }
        else if ((mm = /^([a-zA-Z][a-zA-Z_0-9]*) *= * (\$[0-9A-Fa-f]+) *$/.exec(L)))
        {
            if (labels[mm[1]]) throw "Duplicated label '" + mm[1] + "'";
            labels[mm[1]] = mm[2];
        }
        else
        {
            function value(x)
            {
                if (labels[x])
                    x = labels[x];
                var mm;
                if ((mm = /^\$([0-9a-fA-F]{2})$/.exec(x)))
                    return [parseHex(mm[1])];
                if ((mm = /^\$([0-9a-fA-F]{4})$/.exec(x)))
                {
                    var x16 = parseHex(mm[1]);
                    return [x16&255, x16>>8];
                }
                if ((mm = /^([0-9]+)$/.exec(x)))
                {
                    var x16 = parseInt(x);
                    return [x16&255, x16>>8];
                }
                if ((mm = /^([a-zA-Z][a-zA-Z0-9_]*)$/.exec(x)))
                {
                    fixups.push([ip+1, mm[1], "abs"]);
                    return [null, null];
                }
                throw "Unable to parse value '" + x + "'";
            }

            if ((mm = /^ +([a-z]{3}) *$/.exec(L)))
            {
                opcode = mm[1];
                mr = ["___"];
            }
            else if ((mm = /^ +([a-z]{3}) +[aA] *$/.exec(L)))
            {
                opcode = mm[1];
                mr = ["acc"];
            }
            else if ((mm = /^ +([a-z]{3}) +#(\$[0-9A-Fa-f]+|[0-9]+|[a-zA-Z][a-zA-Z0-9_]*) *$/.exec(L)))
            {
                opcode = mm[1];
                mr = ["imm", value(mm[2])[0]];
            }
            else if ((mm = /^ +([a-z]{3}) +(\$[0-9A-Fa-f]+|[0-9]+|[a-zA-Z][a-zA-Z0-9_]*) *$/.exec(L)))
            {
                opcode = mm[1];
                addr = value(mm[2]);
                if (addr.length == 2)
                    mr = ["abs", addr[0], addr[1]];
                else
                    mr = ["zpg", addr[0]];
            }
            else if ((mm = /^ +([a-z]{3}) +(\$[0-9A-Fa-f]+|[0-9]+|[a-zA-Z][a-zA-Z0-9_]*),x *$/.exec(L)))
            {
                opcode = mm[1];
                addr = value(mm[2]);
                if (addr.length == 2)
                    mr = ["abx", addr[0], addr[1]];
                else
                    mr = ["zpx", addr[0]];
            }
            else if ((mm = /^ +([a-z]{3}) +(\$[0-9A-Fa-f]+|[0-9]+|[a-zA-Z][a-zA-Z0-9_]*),y *$/.exec(L)))
            {
                opcode = mm[1];
                addr = value(mm[2]);
                if (addr.length == 2)
                    mr = ["aby", addr[0], addr[1]];
                else
                    mr = ["zpy", addr[0]];
            }
            else if ((mm = /^ +([a-z]{3}) +\((\$[0-9A-Fa-f]+|[0-9]+|[a-zA-Z][a-zA-Z0-9_]*),x\) *$/.exec(L)))
            {
                opcode = mm[1];
                mr = ["iix", value(mm[2])[0]];
            }
            else if ((mm = /^ +([a-z]{3}) +\((\$[0-9A-Fa-f]+|[0-9]+|[a-zA-Z][a-zA-Z0-9_]*)\),y *$/.exec(L)))
            {
                opcode = mm[1];
                mr = ["iiy", value(mm[2])];
            }
            else if ((mm = /^ +([a-z]{3}) +\((\$[0-9A-Fa-f]+|[0-9]+|[a-zA-Z][a-zA-Z0-9_]*)\) *$/.exec(L)))
            {
                opcode = mm[1];
                var addr = value(mm[2]);
                mr = ["ind", addr[0], addr[1]];
            }
            else
            {
                throw "Unable to parse '" + L + "'";
            }

            if (opcode[0] == "b" && opcode != "bit" && opcode != "brk" && mr[0] == "abs")
            {
                if (mr[1] == null)
                {
                    fixups[fixups.length-1][2] = "rel";
                    mr = ["rel", null];
                }
                else
                {
                    var delta = mr[1] + mr[2]*256 - (ip + 2);
                    if (delta < -128 || delta > 127)
                        throw "Relative jump out of range";
                    mr = ["rel", delta & 255];
                }
            }

            if (opcode[0] == "j" && mr[0] == "abs")
                mr[0] = "adr";

            var rop = revopcodes[opcode + "/" + mr[0]];
            if (rop == undefined) throw "Invalid operation/addressing mode";
            m[ip] = rop; ip = (ip + 1)&65535;
            for (var j=1; j<mr.length; j++)
            {
                m[ip] = mr[j];
                ip = (ip + 1) & 65535;
            }
        }
    }
    if (labels["start"])
    {
        ip = parseHex(labels["start"].substr(1));
    }
    else
    {
        throw "Missing 'start' label";
    }
    for (var i=0; i<fixups.length; i++)
    {
        var fu = fixups[i];
        var addr = labels[fu[1]];
        if (addr == undefined) throw "Undefined label '" + fu[1] + "'";
        if (fu[2] == "rel")
        {
            var delta = parseHex(addr.substr(1)) - (fu[0] + 1);
            if (delta < -128 || delta > 127) throw "Relative jump to '" + fu[1] + "' out of range";
            m[fu[0]] = delta & 255;
        }
        else
        {
            var target = parseHex(addr.substr(1));
            m[fu[0]] = target & 255;
            m[fu[0]+1] = target >> 8;
        }
    }
}

function run()
{
    if (ip == 0)
    {
        alert("Program execution completed");
    }
    else
    {
        var start = (new Date).getTime();
        var now;
        while (ip != 0 && (now = (new Date).getTime()) < start + 50)
        {
            for (var k=0; ip && k<100; k++)
            {
                alive = true;
                (current_f=(jitcode[ip]||(jitcode[ip]=jit())))();
            }
        }
        ctx.putImageData(data, 0, 0);
        setTimeout(run, 0);
    }
}
