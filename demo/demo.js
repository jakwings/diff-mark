var fs = require('fs');
var readline = require('readline');
var chalk = require('chalk');
var mark = require(__dirname + '/..').mark;
var diff = require(__dirname + '/..').diff;

var rl = readline.createInterface({
  input: fs.createReadStream(__dirname + '/../test/fixtures/RantionaryDump.txt'),
  output: process.stdout,
  terminal: false
});

rl.on('line', function (line) {
  var words = line.split('/');
  var diffs = words.map(function (item, i, arr) {
    if (i > 0) {
      return diff(arr[0], item);
    }
    return item;
  });
  words = diffs.map(function (item, i, arr) {
    if (i > 0) {
      return mark(arr[0], item);
    }
    return item;
  });
  console.log(
      chalk.green('>> ' + diffs.join('/')) +
      chalk.white('\n > ' + words.join('/')));
});
