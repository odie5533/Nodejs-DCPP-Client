// Copyright (c) David Bern

util = require('util')
sboxes = require('./sboxes.js')
var TigerHash = new function() {
    this.tiger_compress = function(str, state) {
        var a, b, c, tmpa;
        var aa, bb, cc;
        var x0 = str.charCodeAt(0 +0)<<4*0 | str.charCodeAt(0 +1)<<4*1 | str.charCodeAt(0 +2)<<4*2 | str.charCodeAt(0 +3)<<4*3 | str.charCodeAt(0 +4)<<4*4 | str.charCodeAt(0 +5)<<4*5 | str.charCodeAt(0 +6)<<4*6 | str.charCodeAt(0 +7)<<4*7;
        var x1 = str.charCodeAt(8 +0)<<4*0 | str.charCodeAt(8 +1)<<4*1 | str.charCodeAt(8 +2)<<4*2 | str.charCodeAt(8 +3)<<4*3 | str.charCodeAt(8 +4)<<4*4 | str.charCodeAt(8 +5)<<4*5 | str.charCodeAt(8 +6)<<4*6 | str.charCodeAt(8 +7)<<4*7;
        var x2 = str.charCodeAt(16 +0)<<4*0 | str.charCodeAt(16 +1)<<4*1 | str.charCodeAt(16 +2)<<4*2 | str.charCodeAt(16 +3)<<4*3 | str.charCodeAt(16 +4)<<4*4 | str.charCodeAt(16 +5)<<4*5 | str.charCodeAt(16 +6)<<4*6 | str.charCodeAt(16 +7)<<4*7;
        var x3 = str.charCodeAt(3);
        var x4 = str.charCodeAt(4);
        var x5 = str.charCodeAt(5);
        var x6 = str.charCodeAt(6);
        var x7 = str.charCodeAt(7);
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
        util.puts("x0: " + x0.toString(16));
        //compress;
        aa = a; bb = b; cc = c;;
        for (var pass_no = 0; pass_no < 3; pass_no++) {
            if (pass_no != 0) {
                x0 = (x0 - x7 ^ 0xA5A5A5A5A5A5A5A5) & allf; x1 ^= x0; x2 = (x2 + x1) & allf; x3 = (x3 - (x2 ^ (~x1 & allf)<<19) & allf); x4 ^= x3; x5 = (x5 + x4) & allf; x6 = (x6 - (x5 ^ (~x4 & allf)>>23) & allf); x7 ^= x6; x0 = (x0 + x7) & allf; x1 = (x1 - (x0 ^ (~x7 & allf)<<19) & allf); x2 ^= x1; x3 = (x3 + x2) & allf; x4 = (x4 - (x3 ^ (~x2 & allf)>>23) & allf); x5 ^= x4; x6 = (x6 + x5) & allf; x7 = (x7 - (x6 ^ 0x0123456789ABCDEF) & allf) & allf;;
            }
            c ^= x0; a -= t1[((c)>>(0*8))&0xFF] ^ t2[((c)>>(2*8))&0xFF] ^ t3[((c)>>(4*8))&0xFF] ^ t4[((c)>>(6*8))&0xFF] ; b += t4[((c)>>(1*8))&0xFF] ^ t3[((c)>>(3*8))&0xFF] ^ t2[((c)>>(5*8))&0xFF] ^ t1[((c)>>(7*8))&0xFF] ; b *= (pass_no==0?5:pass_no==1?7:9); a ^= x1; b -= t1[((a)>>(0*8))&0xFF] ^ t2[((a)>>(2*8))&0xFF] ^ t3[((a)>>(4*8))&0xFF] ^ t4[((a)>>(6*8))&0xFF] ; c += t4[((a)>>(1*8))&0xFF] ^ t3[((a)>>(3*8))&0xFF] ^ t2[((a)>>(5*8))&0xFF] ^ t1[((a)>>(7*8))&0xFF] ; c *= (pass_no==0?5:pass_no==1?7:9); b ^= x2; c -= t1[((b)>>(0*8))&0xFF] ^ t2[((b)>>(2*8))&0xFF] ^ t3[((b)>>(4*8))&0xFF] ^ t4[((b)>>(6*8))&0xFF] ; a += t4[((b)>>(1*8))&0xFF] ^ t3[((b)>>(3*8))&0xFF] ^ t2[((b)>>(5*8))&0xFF] ^ t1[((b)>>(7*8))&0xFF] ; a *= (pass_no==0?5:pass_no==1?7:9); c ^= x3; a -= t1[((c)>>(0*8))&0xFF] ^ t2[((c)>>(2*8))&0xFF] ^ t3[((c)>>(4*8))&0xFF] ^ t4[((c)>>(6*8))&0xFF] ; b += t4[((c)>>(1*8))&0xFF] ^ t3[((c)>>(3*8))&0xFF] ^ t2[((c)>>(5*8))&0xFF] ^ t1[((c)>>(7*8))&0xFF] ; b *= (pass_no==0?5:pass_no==1?7:9); a ^= x4; b -= t1[((a)>>(0*8))&0xFF] ^ t2[((a)>>(2*8))&0xFF] ^ t3[((a)>>(4*8))&0xFF] ^ t4[((a)>>(6*8))&0xFF] ; c += t4[((a)>>(1*8))&0xFF] ^ t3[((a)>>(3*8))&0xFF] ^ t2[((a)>>(5*8))&0xFF] ^ t1[((a)>>(7*8))&0xFF] ; c *= (pass_no==0?5:pass_no==1?7:9); b ^= x5; c -= t1[((b)>>(0*8))&0xFF] ^ t2[((b)>>(2*8))&0xFF] ^ t3[((b)>>(4*8))&0xFF] ^ t4[((b)>>(6*8))&0xFF] ; a += t4[((b)>>(1*8))&0xFF] ^ t3[((b)>>(3*8))&0xFF] ^ t2[((b)>>(5*8))&0xFF] ^ t1[((b)>>(7*8))&0xFF] ; a *= (pass_no==0?5:pass_no==1?7:9); c ^= x6; a -= t1[((c)>>(0*8))&0xFF] ^ t2[((c)>>(2*8))&0xFF] ^ t3[((c)>>(4*8))&0xFF] ^ t4[((c)>>(6*8))&0xFF] ; b += t4[((c)>>(1*8))&0xFF] ^ t3[((c)>>(3*8))&0xFF] ^ t2[((c)>>(5*8))&0xFF] ^ t1[((c)>>(7*8))&0xFF] ; b *= (pass_no==0?5:pass_no==1?7:9); a ^= x7; b -= t1[((a)>>(0*8))&0xFF] ^ t2[((a)>>(2*8))&0xFF] ^ t3[((a)>>(4*8))&0xFF] ^ t4[((a)>>(6*8))&0xFF] ; c += t4[((a)>>(1*8))&0xFF] ^ t3[((a)>>(3*8))&0xFF] ^ t2[((a)>>(5*8))&0xFF] ^ t1[((a)>>(7*8))&0xFF] ; c *= (pass_no==0?5:pass_no==1?7:9);;
            util.puts(a.toString(16));
            tmpa=a; a=c; c=b; b=tmpa;
        }
        a ^= aa; b = (b - bb) & allf; c = (c + cc) & allf;;
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
TigerHash.tiger_compress("abcdefghabcdefghabcdefghabcdefghabcdefghabcdefghabcdefghabcdefgh", res);
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
