// Copyright (c) David Bern


var child = require('child_process')
var Lazy = require('./lib/lazy.js')
var util = require('util');

# Testing hash of dcpp.js
var rhash = child.spawn('rhash', ['-p', '%s %T %{mtime}', 'dcpp.js']);
console.log("hashing...");
Lazy(rhash.stdout).lines.forEach(function(line) {
    line = line.toString('ascii');
    console.log(line);
});
