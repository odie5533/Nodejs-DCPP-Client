#ifdef NULL
/*
Copyright (c) David Bern

This file must be compiled using the following command:
cpp -P -undef -Wundef -std=c99 -nostdinc -Wtrigraphs -fdollars-in-identifiers -C tth.js | node

http://www.nongnu.org/espresso/js-cpp.html
has details on the idea of using gcc to compile preprocessor macros for JS*/
#endif

#define PASSES 3
// Copyright (c) David Bern

util = require('util')


#define save_abc \
aa = a; \
bb = b; \
cc = c;

#define round(a,b,c,x,mul) \
c ^= x; \
a -= t1[((c)>>(0*8))&0xFF] ^ t2[((c)>>(2*8))&0xFF] ^ \
t3[((c)>>(4*8))&0xFF] ^ t4[((c)>>(6*8))&0xFF] ; \
b += t4[((c)>>(1*8))&0xFF] ^ t3[((c)>>(3*8))&0xFF] ^ \
t2[((c)>>(5*8))&0xFF] ^ t1[((c)>>(7*8))&0xFF] ; \
b *= mul;

#define pass(a,b,c,mul) \
round(a,b,c,x0,mul) \
round(b,c,a,x1,mul) \
round(c,a,b,x2,mul) \
round(a,b,c,x3,mul) \
round(b,c,a,x4,mul) \
round(c,a,b,x5,mul) \
round(a,b,c,x6,mul) \
round(b,c,a,x7,mul)

#define key_schedule \
x0 = (x0 - x7 ^ 0xA5A5A5A5A5A5A5A5) & allf; \
x1 ^= x0; \
x2 = (x2 + x1) & allf; \
x3 = (x3 - (x2 ^ (~x1 & allf)<<19) & allf); \
x4 ^= x3; \
x5 = (x5 + x4) & allf; \
x6 = (x6 - (x5 ^ (~x4 & allf)>>23) & allf); \
x7 ^= x6; \
x0 = (x0 + x7) & allf; \
x1 = (x1 - (x0 ^ (~x7 & allf)<<19) & allf); \
x2 ^= x1; \
x3 = (x3 + x2) & allf; \
x4 = (x4 - (x3 ^ (~x2 & allf)>>23) & allf); \
x5 ^= x4; \
x6 = (x6 + x5) & allf; \
x7 = (x7 - (x6 ^ 0x0123456789ABCDEF) & allf) & allf;

#define feedforward \
a ^= aa; \
b = (b - bb) & allf; \
c = (c + cc) & allf;

#define compress \
      save_abc \
      for(pass_no=0; pass_no<PASSES; pass_no++) { \
        if(pass_no != 0) {key_schedule} \
	pass(a,b,c,(pass_no==0?5:pass_no==1?7:9)); \
	tmpa=a; a=c; c=b; b=tmpa;} \
      feedforward

#define unpack(str, off) \
    [ str.charCodeAt(off+4)<<8*4 | str.charCodeAt(off+5)<<8*5 | \
    str.charCodeAt(off+6)<<8*6 | str.charCodeAt(off+7)<<8*7, \
    str.charCodeAt(off+0)<<8*0 | str.charCodeAt(off+1)<<8*1 | \
    str.charCodeAt(off+2)<<8*2 | str.charCodeAt(off+3)<<8*3 ]
    
#define tohexstr(word64) \
    word64[0].toString(16) + word64[1].toString(16)

sboxes = require('./sboxes.js')
      
var TigerHash = new function() {
    this.tiger_compress = function(str, state) {
        var a, b, c, tmpa;
        var aa, bb, cc;
        
        console.log("Str: " + str);
        
        var x0 = unpack(str, 0);
        var x1 = unpack(str, 8);
        var x2 = unpack(str, 16);
        var x3 = unpack(str, 24);
        var x4 = unpack(str, 32);
        var x5 = unpack(str, 40);
        var x6 = unpack(str, 48);
        var x7 = unpack(str, 56);
        var pass_no;
        var i;
        var allf = 0xFFFFFFFFFFFFFFFF;
        var t1 = sboxes.t1;
        var t2 = sboxes.t2;
        var t3 = sboxes.t3;
        var t4 = sboxes.t4;
        
        a = state[0];
        b = state[1];
        c = state[2];
        
        util.puts("x0: " + tohexstr(x0));
        util.puts("x1: " + tohexstr(x1));
        
        //compress;
        save_abc;
        
        for (var pass_no = 0; pass_no < 3; pass_no++) {
            if (pass_no != 0) {
                key_schedule;
            }
            
            pass(a,b,c,(pass_no==0?5:pass_no==1?7:9));
            util.puts(a.toString(16));
            tmpa=a; a=c; c=b; b=tmpa;
        }
        
        feedforward;
        
        util.puts(a.toString(16));
        
        state[0] = a;
        state[1] = b;
        state[2] = c;
    }

    this.tiger = function(str, length) {
        var i, j;
        var temp = new Buffer(64);
        
        var res = [0x0123456789ABCDEF, 0xFEDCBA9876543210, 0xF096A5B4C3B2E187];

        for (i = length; i >=64; i-=64) {
            console.log("inner loop");
            this.tiger_compress(str.substr(strIdx, 64), res);
            strIdx += 64;
        }
        temp.write(str.substring(strIdx), 0, 'ascii');
        
        temp[j++] = 0x01;
        for(; j&7; j++)
            temp[j] = 0;
        
        if (j > 56) {
            for (; j < 64; j++)
                temp[j] = 0;
            this.tiger_compress(temp, res);
            j = 0;
        }
        
        for (; j < 56; j++)
            temp[j] = 0;
        
        temp[56] = length << 3;
        this.tiger_compress(temp.toString('ascii'), res);
        
        return res;
    }
}
    
var res = [0x0123456789ABCDEF, 0xFEDCBA9876543210, 0xF096A5B4C3B2E187];
TigerHash.tiger_compress("abcdefghijklmnopqrstuvqxyzabcdefghijklmnopqrstuvqxyzabcdefghijkl", res);
console.log(res[0].toString(16));
/*
Tiger_compress of "abcdefgh":
        6A393E27C8DD22E6 1946CF2164D833B5 68A4DD5DFD64B1B6
Hash of "":
        24F0130C63AC9332 16166E76B1BB925F F373DE2D49584E7A
Hash of "abc":
        F258C1E88414AB2A 527AB541FFC5B8BF 935F7B951C132951
Hash of "Tiger":
        9F00F599072300DD 276ABB38C8EB6DEC 37790C116F9D2BDF
*/
//res = TigerHash.tiger("");
//console.log(res[0].toString(16));
