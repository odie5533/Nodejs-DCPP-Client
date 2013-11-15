// Copyright (c) David Bern


var util = require('util')
var fs = require('fs')
var net = require('net')
var Lazy = require('./lib/lazy.js')
var child = require('child_process')
var Tiny = require('./lib/tiny.js')
var Async = require('./lib/async.js')
var NodeWalk = require('./lib/node-utils-file.js')

function UserConfig(nick, pass) {
    this.nickname = nick;
    this.password = pass;
    this.email = nick;
    this.interest = 'Share';
    this.speed = '10';
    this.shares = {'My-Shared':'c:\\DCPP Shared'}
}

// A Dcpp function represents a connection to a single hub
var Dcpp = function(uconfig) {
    // DCPP Constants
    this.DCPP_VERSION = '<ApexDC++ V:1.4.3,M:A,H:1/0/0,S:4>';
    
    // User variables
    this.userConfig = uconfig;
    
    // Hub variables
    this.nicklist = {};
    this.oplist = [];
    this.connections = [];

    this.fileList = {};

    this.shareSize = 0;

    var self = this;

    this.hashQueue = Async.queue(function(task, callback) {
        var rhash = child.spawn('rhash', ['-p', '%s %T', task]);
        Lazy(rhash.stdout).lines.forEach(function(line) {
            line = line.toString('ascii');
            var splits = line.split(' ');
            var size = splits.shift();
            var hash = splits.shift();
            fs.stat(task, function(err, stats) {
                self.storeHash(hash, task, size, +stats.mtime);
                callback();
            });
        });
    }, 1);
    
    this.hashQueue.drain = self.saveFileList.bind(self);
}

Dcpp.prototype.constructor = {name: 'Dcpp'};

/*
    Loads the file list, refreshes the list, saves the list,
    calculates the share size, and then attempts to connect
    to a server if one has been specified.
*/
Dcpp.prototype.init = function() {
    var self = this;
    Async.series([
        self.loadFileList.bind(self),
        self.refreshFileList.bind(self),
        self.saveFileList.bind(self),
        function(cb) { self.calculateShareSize.apply(self); cb(); },
        function(){
            if (typeof(self.onInit) == 'undefined') {
                self.onInit = true;
                console.log('Ready to connect');
            } else {
                console.log('Finally ready to connect');
                self.onInit.call(self);
            }
        }
    ]);
}

Dcpp.prototype.storeHash = function(tth, path, size, timestamp) {
    var newEntry = [size, timestamp, path];
    if (!this.fileList[tth]) {
        this.fileList[tth] = [ newEntry ];
    } else {
        this.fileList[tth].push(newEntry);
    }
}

/*
    Cycles through the file list and adds together all the file sizes
    Stores this value into shareSize and returns it.
*/
Dcpp.prototype.calculateShareSize = function() {
    this.shareSize = 0;
    for (var key in this.fileList) {
        for (var e in this.fileList[key]) {
            this.shareSize += +this.fileList[key][e][0];
        }
    }
    console.log("Sharing a total of " + this.shareSize + " bytes");
    return this.shareSize;
}

Dcpp.prototype.saveFileList = function(callback) {
    var len = Object.keys(this.fileList).length;
    console.log("Saving file list: " + len);
    if (len) {
        var data = JSON.stringify(this.fileList, null, 2);
        fs.writeFile("FileList.json", data);
    }
    if (callback)
        callback();
}

Dcpp.prototype.loadFileList = function(callback) {
    var self = this;
    fs.readFile('FileList.json', function(err, data) {
        if (err) throw err;
        self.fileList = JSON.parse(data);
        console.log("Loaded " + Object.keys(self.fileList).length + ' files from file list');
        if (callback)
            callback();
    });
}

Dcpp.prototype.checkFileForUpdate = function(path, stats) {
    var list = this.fileList
    for (var key in list) {
        for (var e in list[key]) {
            if (list[key][e][2] == path) {
                // Found a match for the path in the database
                if (list[key][e][1] != +stats.mtime) {
                    // If the times differ then rehash the file
                    this.hashQueue.push(path);
                }
                return;
            }
        }
    }
    // If we didn't find the file, then add it to the list
    this.hashQueue.push(path);
}

Dcpp.prototype.cleanList = function(checkedFiles) {
    // Step 2: Check the file list and remove any files which were not found in the share walk
    var list = this.fileList;
    for (var key in list) {
        for (var e in list[key]) {
            var path = list[key][e][2];
            // If we didn't find the path during the directory walk then delete it
            if (!(path in checkedFiles)) {
                console.log("Deleting old index: " + list[key][e][2]);
                list[key].splice(e,1);
            }
            delete checkedFiles[key];
        }
    }
}

Dcpp.prototype.refreshFileList = function(callback) {
    var self = this;

    // Refreshing is done in two steps:
    // Step 1: Walk the share paths and update all files which exist in the paths
    // Step 2: Clean the list of files not found during the walk
    console.log("Refreshing file list...");
    var len = Object.keys(this.userConfig.shares).length; // Counter to determine when we are done walking
    var totalFiles = 0; // Total number of files found
    var checkedFiles = {}; // Stores paths of files which have been checked

    for (var shareName in this.userConfig.shares) {
        // Subtract for the share folder, since they get counted too
        len--;
        var share = this.userConfig.shares[shareName];
        console.log("Reading share folder: " + share);

        NodeWalk.walk(share, function(d, dirPath, dirs, files) {
            len += files.length;
            totalFiles += files.length;
            files.forEach(function(f) {
                checkedFiles[f] = 1;
                fs.stat(f, function(err, stats) {
                    self.checkFileForUpdate.call(self, f, stats);

                    // Done
                    if (!--len) {
                        console.log("Total files found: " + totalFiles);
                        self.cleanList(checkedFiles);
                        callback();
                    }
                });
            });
        });

    }
}

/*
    Connects to a server. If init has not been completed then
    queue the connect for when the init finishes.
*/
Dcpp.prototype.connect = function(port, host) {
    this.port = port;
    this.host = host;
    
    var doConnect = function() {
        this.socket = net.createConnection(port, host, function(){
            console.log('Connected to ' + host + ':' + port);
        });
        Lazy(this.socket).cmds.forEach( this.handleCommand.bind(this) );
    };

    if (typeof(this.onInit) != 'undefined') {
        doConnect();
    } else {
        console.log('Delaying connect until file list is loaded');
        this.onInit = doConnect;
    }
}

// The protocl is split into |-delimited units known as commands
// in the form: $Action Params|
Dcpp.prototype.handleCommand = function(command) {
    command = command.toString('ascii');
    if (!command.length) return;
    if (command.charAt(0) != '$') {
        //console.log(command);
        return;
    }
    
    var splits = command.split(' ');
    var action = splits.shift().slice(1);
    var params = splits.join(' ');
    
    switch(action) {
        case 'Lock':
            this.handleLock(params);
            break;
        case 'GetPass':
            this.socket.write('$MyPass ' + this.userConfig.password + '|');
            break;
        case 'Hello':
            this.handleHello(params);
            break;
        case 'Supports':
            break;
        case 'NickList':
            var nicklist = params.substring(0,params.length-2).split('$$');
            for (var nick in nicklist)
                this.nicklist[nick] = 1;
            break;
        case 'OpList':
            this.oplist = params.substring(0, params.length-2).split('$$');
        case 'MyINFO':
            // Inform client of different users' infos
            break;
        case 'Quit':
            delete this.nicklist[nick];
        case 'HubName':
            this.hubname = params;
            break;
        case 'ForceMove':
            console.log('Hub is redirecting to: ' + params);
            this.socket.end();
            break;
        case 'Search':
            this.handleSearch(params);
            break;
        case 'ConnectToMe':
            this.handleConnectToMe(params);
            break;
        case 'UserCommand':
            // Not yet implemeneted
            break;
        case 'To':
            console.log('Msg: ' + params);
            break;
        default:
            console.log('  unknown action: '+ action +' -> '+ params);
    }
    
}

/*
 * Handles a search command given the command's `params`
 *
 * @param {String} params
*/
Dcpp.prototype.handleSearch = function(params) {

    var searchResult;

    var splits = params.split(' ');
    var client = splits.shift();

    var search = splits.join(' ');
    var ip = client.split(':')[0];
    var port = client.split(':')[1];

    splits = search.split('?');
    var sizerestricted = splits.shift();
    var isminimumsize = splits.shift();
    var size = splits.shift();
    var datatype = splits.shift();
    var searchpattern = splits.join('?');
    

    // Tries to find TTH or searches the database for a single file entry
    var entry;
    var tth; // Contains TTH either if found or if given
    if (~searchpattern.indexOf('TTH:')) {
        tth = searchpattern.split(':')[1];
        if (!(tth in this.fileList) || !this.fileList[tth].length)
            return;
        entry = this.fileList[tth][0];
    } else {
        // Regular search should be performed
        return;
        searchpattern =searchpattern.replace(/\$/g, ' ').replace(/&#36;/g, '$');
    }

    console.log("Search results found at " + entry);

    if (!entry)
        return;

    // Attempts to find a share alias for the given entry
    var alias;
    for (var shareName in this.userConfig.shares) {
        var share = this.userConfig.shares[shareName];
        if (!~entry[2].indexOf(share)) {
            alias = shareName + share.slice(shareName.length+1);
            break;
        }
    }

    if (!alias)
        return;
    
    console.log('Search results were found at ' + alias);

    var searchResponse = alias + String.fromCharCode(5) + entry[0] + ' ' +
                         '1/1' + String.fromCharCode(5) + 'TTH:' + tth;
    var msg = '$SR ' + this.userConfig.username + ' ' + searchResponse + ' (' +
              this.hubIP + ':' + this.hubPort + ')';

    if (ip == 'Hub') {
        // Passive
        msg += String.fromCharCode(5) + port + '|';
        this.socket.write(msg);
    } else {
        // Active
        msg += '|';
        var client = dgram.createSocket("udp4");
        client.send(msg, 0, msg.length, port, ip);
        client.close();
    }
}

Dcpp.prototype.handleConnectToMe = function(params) {
    var splits = params.split(' ');
    var remoteNick = splits[0];
    var ip = splits[1].split(':')[0];
    var port = splits[1].split(':')[1];

    console.log("Connecting to user: " + remoteNick);
    var conn = new Dcc2c(this.userConfig, ip, port, remoteNick);
    this.connections.push(conn);
}

function lockToKey(lock) {
    function pad3( number ) {
        return new Array(4 - number.toString().length).join('0') + number;
    }
    function swap(c){
        c = ((c<<4) | (c>>4)) & 255;
        return (~[0,5,36,96,124,126].indexOf(c))?'/%DCN'+pad3(c)+'%/':
                String.fromCharCode(c);
    }
    var key =swap(lock.charCodeAt(0)^lock.charCodeAt(-1)^lock.charCodeAt(-2)^5);
    for (var i = 1; i < lock.length; i++) {
        key += swap(lock.charCodeAt(i) ^ lock.charCodeAt(i-1));
    }
    return key;
}

// Command: $Lock <lock> Pk=<pk>|
Dcpp.prototype.handleLock = function(params) {
    // Pk is ignored
    var lock = params.split(' ')[0];
    var key = lockToKey(lock);

    //var sendBuffer = 
    //'$Supports UserCommand NoGetINFO NoHello UserIP2 TTHSearch ZPipe0 TLS |';
    var sendBuffer = '$Supports None|';
    sendBuffer += '$Key ' + key + '|';
    sendBuffer += '$ValidateNick ' + this.userConfig.nickname + '|';
    this.socket.write(sendBuffer);
}

Dcpp.prototype.handleHello = function(params) {
    if (typeof(this.handledHello) != 'undefined')
        return;
    this.handledHello = true;
    var uc = this.userConfig; // shorthand alias
    var sendBuffer = '$Version 1,0091|';
    sendBuffer += '$GetNickList|';
    sendBuffer += '$MyINFO $ALL '+ uc.nickname +' '+ uc.interest +
                  this.DCPP_VERSION +'$ $'+ uc.speed +'$'+ uc.email +
                  '$' + this.shareSize + '$|';
    this.socket.write(sendBuffer);
}


/********************
    Client 2 Client *
********************/
var Dcc2c = function(userConfig, ip, port, nick) {
    this.userConfig = userConfig;
    this.ip = ip;
    this.port = port;
    this.remoteNick = nick;

    this.connect(port, ip);
};
        
Dcc2c.prototype.connect = function(port, host) {
    console.log('Connecing to ' + host + ':' + port);
    this.socket = net.createConnection(port, host, function(){
        console.log('Connected to ' + host + ':' + port);
    });
    Lazy(this.socket).cmds.forEach( this.handleCommand.bind(this) );
}

Dcc2c.prototype.handleCommand = function() {
    command = command.toString('ascii');
    if (command.charAt(0) != '$') {
        console.log('Client Notice: ' + command);
        return;
    }
    var splits = command.split(' ');
    var action = splits.shift();
    var params = splits.join(' ');

    switch(action) {
        case 'MyNick':
            this.remoteNick = params;
            break;
        case 'Lock':
            this.handleLock(params);
            break;
        default:
            console.log('unknown action: ' + command);
            break;
    }
}

Dcc2c.prototype.constructor = {name:'Dcc2c'};

Dcc2c.prototype.handleLock = function(params) {
    this.key = lockToKey(params.split(' ')[0]); // Pk is ignored

    var sendBuffer = '$MyNick '+ this.userConfig.username + '|';
    sendBuffer+= '$Lock EXTENDEDPROTOCOLABCABCABCABCABCABC Pk=DCPLUSPLUS0.782|';
    sendBuffer += '$Supports XmlBZList ADCGet TTHL TTHF ZLIG |';
    sendBuffer += '$Direction Download 24180|';
    sendBuffer += '$Key ' + key + '|';
    this.socket.write(sendBuffer);
}

var uconfig = new UserConfig('username', 'password');
var client = new Dcpp(uconfig);
client.init();
client.connect(777, 'hostname.com');
