var should = require('should');
var diffmark = require(__dirname + '/..');
var mark = diffmark.mark;
var diff = diffmark.diff;


describe('Diffmark.mark', function () {

  describe('Default: Append', function () {

    it('<word>, <text> -> <word><text>', function () {
      should(mark('play', 'ground')).equal('playground');
      should(mark('yes', ', sir')).equal('yes, sir');
      should(mark('ok', 'ay')).equal('okay');
    });

  });

  describe('Escape: \\', function () {

    describe('\\n: linefeed', function () {
      it('<word>, "\\n" -> "<word><LF>"', function () {
        should(mark('play', '\\n')).equal('play\n');
        should(mark('yes', '\\n\\n')).equal('yes\n\n');
        should(mark('ok', '\\n\\n\\n')).equal('ok\n\n\n');
      });
    });

    describe('\\r: carriage return', function () {
      it('<word>, "\\r" -> "<word><LF>"', function () {
        should(mark('play', '\\r')).equal('play\r');
        should(mark('yes', '\\r\\r')).equal('yes\r\r');
        should(mark('ok', '\\r\\r\\r')).equal('ok\r\r\r');
      });
    });

    describe('\\s: space', function () {
      it('<word>, "\\s" -> "<word><SP>"', function () {
        should(mark('play', '\\s')).equal('play ');
        should(mark('yes', '\\s\\s')).equal('yes  ');
        should(mark('ok', '\\s\\s\\s')).equal('ok   ');
      });
    });

    describe('\\t: horizontal tab', function () {
      it('<word>, "\\t" -> "<word><HT>"', function () {
        should(mark('play', '\\t')).equal('play\t');
        should(mark('yes', '\\t\\t')).equal('yes\t\t');
        should(mark('ok', '\\t\\t\\t')).equal('ok\t\t\t');
      });
    });

    describe('\\_: any normal character _', function () {
      it('<word>, "\\_" -> "<word>_"', function () {
        should(mark('play', '\\a')).equal('play\a');
        should(mark('yes', '\\a\\a')).equal('yes\a\a');
        should(mark('ok', '\\a\\a\\a')).equal('ok\a\a\a');
      });
      it('<word>, "\\+" -> "<word>+"', function () {
        should(mark('play', '\\+')).equal('play+');
        should(mark('yes', '\\+\\+')).equal('yes++');
        should(mark('ok', '\\+\\+\\+')).equal('ok+++');
      });
      it('<word>, "\\-" -> "<word>-"', function () {
        should(mark('play', '\\-')).equal('play-');
        should(mark('yes', '\\-\\-')).equal('yes--');
        should(mark('ok', '\\-\\-\\-')).equal('ok---');
      });
      it('<word>, "\\*" -> "<word>*"', function () {
        should(mark('play', '\\*')).equal('play*');
        should(mark('yes', '\\*\\*')).equal('yes**');
        should(mark('ok', '\\*\\*\\*')).equal('ok***');
      });
      it('<word>, "\\|" -> "<word>|"', function () {
        should(mark('play', '\\|')).equal('play|');
        should(mark('yes', '\\|\\|')).equal('yes||');
        should(mark('ok', '\\|\\|\\|')).equal('ok|||');
      });
      it('<word>, "\\ " -> "<word> "', function () {
        should(mark('play', '\\ ')).equal('play ');
        should(mark('yes', '\\ \\ ')).equal('yes  ');
        should(mark('ok', '\\ \\   ')).equal('ok  ');
      });
      it('<word>, "\\;" -> "<word>;"', function () {
        should(mark('play', '\\;')).equal('play;');
        should(mark('yes', '\\;\\;')).equal('yes;;');
        should(mark('ok', '\\;\\;\\;')).equal('ok;;;');
      });
    });

  });

  describe('Add: +', function () {

    it('<word>, "+<suffix>" -> <word><suffix>', function () {
      should(mark('play', '+ cards')).equal('play cards');
      should(mark('yes', '+, sir')).equal('yes, sir');
      should(mark('ok', '+ then')).equal('ok then');
    });

    it('<word>, "<prefix>+" -> <prefix><word>', function () {
      should(mark('cards', 'play +')).equal('play cards');
      should(mark('sir', 'yes, +')).equal('yes, sir');
      should(mark('then', 'ok +')).equal('ok then');
    });

  });

  describe('Delete: -', function () {

    it('"word", "--" -> "wo"', function () {
      should(mark('play', '-')).equal('pla');
      should(mark('yes', '--')).equal('y');
      should(mark('ok', '----')).equal('');
    });

    it('"word", "--<suffix>" -> "wo<suffix>"', function () {
      should(mark('play', '-yground')).equal('playground');
      should(mark('yes', '--ear')).equal('year');
      should(mark('ok', '----fail')).equal('fail');
    });

    it('"word", "<prefix>--" -> "<prefix>rd"', function () {
      should(mark('round', 'playgr-')).equal('playground');
      should(mark('sir', 'dee--')).equal('deer');
      should(mark('then', 'when-----')).equal('when');
    });

    it('"word", "|--" -> "rd"', function () {
      should(mark('play', '|-')).equal('lay');
      should(mark('yes', '|--')).equal('s');
      should(mark('ok', '|----')).equal('');
    });

  });

  describe('Replace: *', function () {

    it('"A B C D", "**X" -> "A B X D"', function () {
      should(mark('A B C D', '*X')).equal('A B C X');
      should(mark('A B C D', '**X')).equal('A B X D');
      should(mark('A B C D', '***X')).equal('A X C D');
      should(mark('A B C D', '****X')).equal('X B C D');
      should(mark('A B C D', '*****X')).equal('A B C D');
    });

    it('"A B C D", "X**" -> "A X C D"', function () {
      should(mark('A B C D', 'X*')).equal('X B C D');
      should(mark('A B C D', 'X**')).equal('A X C D');
      should(mark('A B C D', 'X***')).equal('A B X D');
      should(mark('A B C D', 'X****')).equal('A B C X');
      should(mark('A B C D', 'X*****')).equal('A B C D');
    });

  });

  describe('Delimiter: ;', function () {

    it('"A B", "\\sC ; + D E ; -- ; |-- ; **A" -> "B A D"', function () {
      should(mark('A B C D', ';;;;')).equal('A B C D');
      should(mark('A B C D', ' ; ; ; ; ')).equal('A B C D');
      should(mark('', ' ; \\; ; \\; ')).equal(';;');
      should(mark('A B', '\\sC ; + D E ; -- ; |-- ; **A')).equal('B A D');
    });

  });

});


describe('Diffmark.diff', function () {
  var fs = require('fs');
  var readline = require('readline');

  it('Testing with Rantionary', function (done) {
    var rl = readline.createInterface({
      input: fs.createReadStream(__dirname + '/fixtures/RantionaryDump.txt'),
      output: process.stdout,
      terminal: false
    });
    rl.on('line', function (line) {
      line.split('/').forEach(function (item, i, arr) {
        if (i > 0) {
          var pattern = diff(arr[0], item);
          should(pattern).be.String;
          should(mark(arr[0], pattern)).equal(item);
        }
      });
    });
    rl.on('close', done);
  });

});
