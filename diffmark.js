(function () {
  'use strict';

  var validate = function (pattern) {
    var type = '';
    var prepend = false;
    var count = 0;
    for (var i = 0; i < pattern.length; i++) {
      switch (pattern[i]) {
        case '\\':
          if (prepend || ++i === pattern.length) { return false; }
          count++;
          break;
        case '+':
          if (type) { return false; }
          if (count > 0) { prepend = true; }
          type = '+';
          break;
        case '-':
          if ((type && type !== '-' && type !== '|') ||
              (prepend && pattern[i-1] === ' ')) {
            return false;
          }
          if (type === '|') {
            if (pattern[i-1] === ' ') { return false; }
            count++;
          } else {
            if (count > 0) { prepend = true; }
            type = '-';
          }
          break;
        case '*':
          if ((count > 0 && pattern[i-1] === ' ') ||
              (type && (type !== '*' || pattern[i-1] === ' '))) {
            return false;
          }
          if (count > 0) { prepend = true; }
          type = '*';
          break;
        case '|':
          if (type || count > 0) { return false; }
          prepend = true;
          type = '|';
          break;
        case ';':
          if (count < 1 && /^[+*|]/.test(type)) { return false; }
          type = '';
          prepend = false;
          count = 0;
          break;
        case ' ':
          if ((type && !prepend) || count > 0) {
            count++;
          }
          break;
        default:
          if (prepend) { return false; }
          count++;
      }
    }
    if (count < 1 && /^[+*|]$/.test(type)) { return false; }
    return true;
  };

  var unescape = function (pattern) {
    return pattern.replace(/\\([\s\S])/g, function (_, c) {
      switch (c) {
        case 'n': return '\n';
        case 's': return ' ';
        case 'r': return '\r';
        case 't': return '\t';
        default: return c;
      }
      return '';
    });
  };

  var escape = function (s, l, r) {
    var pattern = s.replace(/./g, function (c, i) {
      if (c === '\n') {
        return '\\n';
      } else if (c === '\r') {
        return '\\r';
      } else if (c === '\t') {
        return '\\t';
      } else if (c === ' ') {
        if ((i === 0 && l) || (i + 1 === s.length && r)) {
          return '\\s';
        }
        return ' ';
      } else if (/^[\\+\-*|;]$/.test(c)) {
        return '\\' + c;
      }
      return c;
    });
    return pattern;
  };

  var lcount = function (s, c) {
    var len = 0;
    for (var i = 0; s[i] === c; i++) {
      len++;
    }
    return len;
  };

  var rcount = function (s, c) {
    var len = 0;
    for (var i = s.length - 1; s[i] === c; i--) {
      len++;
    }
    if (s[s.length-len-1] !== '\\') {
      return len;
    }
    // Is the slash right before s[s.length-len] balanced?
    for (var i = s.length - len - 1; i >= 0; i--) {
      if (s[i] === '\\') {
        if (s[i-1] !== '\\') {
          return len - 1;
        }
        i--;
      } else {
        return len;
      }
    }
    return len;
  };

  var trimPattern = function (pattern) {
    return pattern.replace(/^ +/, '').replace(/(\\ )? *$/, '$1');
  };

  var mark = function (string, pattern) {
    if (!validate(pattern)) {
      return null;
    }
    var start = 0;
    for (var i = start; i < pattern.length; i++) {
      if (pattern[i] === '\\') {
        i++;
      }
      if (i + 1 < pattern.length &&
          (pattern[i] !== ';' || pattern[i-1] === '\\')) {
        continue;
      }
      var end = pattern[i] === ';' && pattern[i-1] !== '\\' ?
          i : pattern.length;
      var p = trimPattern(pattern.substr(start, end - start));
      var plen = p.length;
      start = end + 1;
      var cnt = 0;
      if (p[0] === '+') {
        string += unescape(p.substr(1));
      } else if (rcount(p, '+') > 0) {
        string = unescape(p.substr(0, plen - 1)) + string;
      } else if (p[0] === '|') {
        string = string.substr(plen - 1);
      } else if (p[0] === '-') {  // also deals with /^-+$/
        cnt = lcount(p, '-');
        string = string.substr(0, string.length - cnt) + unescape(p.substr(cnt));
      } else if ((cnt = rcount(p, '-')) > 0) {
        string = unescape(p.substr(0, plen - cnt)) + string.substr(cnt);
      } else if (p[0] === '*') {
        cnt = lcount(p, '*');
        var re = new RegExp('[^ ]+(?=(?: +[^ ]+){' + (cnt - 1) + '}$)');
        string = string.replace(re, function (_) {
          return unescape(p.substr(cnt));  // in case p contains '$'
        });
      } else if ((cnt = rcount(p, '*')) > 0) {
        var re = new RegExp('^((?:[^ ]+ +){' + (cnt - 1) + '})[^ ]+');
        string = string.replace(re, function (_, capture) {
          return capture + unescape(p.substr(0, plen - cnt));
        });
      } else {
        string += unescape(p);
      }
    }
    return string;
  };

  var pad = function (c, n) {
    var s = '';
    var t = '';
    if (n <= 0x7FFFFFFF) {
      while (n > 0) {
        t += (t || c);
        if ((n & 0x1) === 0x1) { s += t; }
        n >>>= 1;
      }
    } else {
      while (n > 0) {
        t += (t || c);
        if (n % 2 === 1) { s += t; }
        n = Math.floor(n / 2);
      }
    }
    return s;
  };

  var longestLeftMatch = function (a, b) {
    if (!(a.length && b.length)) { return 0; }
    var i = 0;
    while (a[i] && b[i] && a[i] === b[i]) { i++; }
    return i;
  };

  var longestRightMatch = function (a, b) {
    if (!(a.length && b.length)) { return 0; }
    var n = 0;
    var i = a.length - 1;
    var j = b.length - 1;
    while (a[i] && b[j] && a[i] === b[j]) { n++; i--; j--; }
    return n;
  };

  var findLongestCommonSubstring = function (before, after, data) {
    data.startBefore = data.startAfter = data.length = 0;
    if (!(before.length && after.length)) { return false; }

    var shortStr, longStr;
    if (before.length < after.length) {
      shortStr = before;
      longStr = after;
    } else {
      shortStr = after;
      longStr = before;
    }
    var shortStart = 0;
    var longStart = 0;
    for (var i = 0; i < longStr.length; i++) {
      for (var j = i + 1; j <= longStr.length; j++) {
        if (j - i > data.length) {
          var idx = shortStr.indexOf(longStr.substr(i, j - i));
          if (idx > -1) {
            shortStart = idx;
            longStart = i;
            data.length = j - i;
          }
        }
      }
    }
    if (before.length < after.length) {
      data.startBefore = shortStart;
      data.startAfter = longStart;
    } else {
      data.startBefore = longStart;
      data.startAfter = shortStart;
    }
    return data.length > 0;
  };

  var lcsDiff = function (data) {
    var result = [];
    var res = null;
    var before = data.before;
    var after = data.after;
    var startBefore = data.startBefore;
    var startAfter = data.startAfter;
    var lcsLength = data.length;
    var endBefore = startBefore + lcsLength;
    var endAfter = startAfter + lcsLength;
    if (startBefore === 0 && startAfter > 0) {
      // e.g. "....", "AB...." -> "AB+"
      res = escape(after.substr(0, startAfter), 1, 0) + '+';
    } else if (startAfter === 0 && startBefore > 0) {
      // e.g. "AB....", "...." -> "|--"
      res = '|' + pad('-', startBefore);
    } else /*if (startBefore > 0 && startAfter > 0)*/ {
      // e.g. "ABC....", "AB...." -> "AB---"
      // e.g. "AB....", "ABC...." -> "ABC--"
      var afterLeft = after.substr(0, startAfter);
      res = escape(afterLeft, 1, 0) + pad('-', startBefore);
    }
    if (res) {
      result.push(res);
    }
    if (endBefore === before.length && endAfter < after.length) {
      // e.g. "....", "....AB" -> "AB"
      res = escape(after.substr(endAfter), 1, 1);
    } else if (endBefore < before.length && endAfter === after.length) {
      // e.g. "....AB", "...." -> "--"
      res = pad('-', before.length - endBefore);
    } else /*if (endBefore < before.length && endAfter < after.length)*/ {
      // e.g. "....BC", "....ABC" -> "--ABC"
      // e.g. "....ABC", "....BC" -> "---BC"
      var afterRight = after.substr(startAfter + lcsLength);
      res = pad('-', before.length - endBefore) + escape(afterRight, 0, 1);
    }
    if (res) {
      result.push(res);
    }
    return result.join(';');
  };

  var diff = function (before, after) {
    if (before.length === 0) { return after; }
    if (after.length === 0) { return before.replace(/./g, '-'); }
    if (before === after) { return ''; }

    var result = null;
    var lm = longestLeftMatch(before, after);
    var rm = longestRightMatch(before, after);

    if (before[lm-1] === ' ' && after[lm-1] === ' ' &&
        before[before.length-rm] === ' ' && after[after.length-rm] === ' ' &&
        before.indexOf(' ', lm) === before.length - rm) {
      // e.g. "A B C", "A X C" -> "X**"
      // e.g. "A B C", "A X X C" -> "X X**"
      return escape(after.substr(lm, after.length - rm - lm), 1, 0) + '**';
    }
    if (before[lm-1] === ' ' && after[lm-1] === ' ') {
      if (before.indexOf(' ', lm) < 0 && before[before.length-1] !== ' ') {
        // e.g. "A B", "A X" -> "*X"
        // e.g. "A B", "A X X" -> "*X X"
        return '*' + escape(after.substr(lm), 0, 1);
      } else if (before.length < after.length) {
        // e.g. "A ", "A X" -> "X"
        return escape(after.substr(lm), 1, 1);
      } else {
        // e.g. "A B ", "A X" -> "--X"
        return pad('-', before.length - lm) + escape(after.substr(lm), 0, 1);
      }
    }
    if (before[before.length-rm] === ' ' && after[after.length-rm] === ' ') {
      // Thanks to dear JavaScript: ' A'.lastIndexOf(' ', -1) -> 0 (Don't care.)
      if (before.lastIndexOf(' ', before.length - rm - 1) < 0) {
        // e.g. "A B", "X B" -> "X*"
        // e.g. "A B", "X X B" -> "X X*"
        return escape(after.substr(0, after.length - rm), 1, 0) + '*';
      } else if (before.length < after.length) {
        // e.g. " B", "X B" -> "X+"
        return escape(after.substr(0, after.length - rm), 1, 0) + '+';
      } else {
        // e.g. " B B", "X B" -> "X--"
        return (after.length === rm ? '|' :
                   escape(after.substr(0, after.length - rm), 1, 0)) +
            pad('-', before.length - rm);
      }
    }

    if (before.length > after.length) {
      if (lm > 0 && lm >= rm) {  // append
        // e.g. "ABC", "AB" -> "-"
        // e.g. "ABC", "AD" -> "--D"
        result = pad('-', before.length - lm) + escape(after.substr(lm), 0, 1);
      } else if (rm > 0) {  // prepend
        if (after.length === rm) {
          // e.g. "ABC", "BC" -> "|-"
          result = '|' + pad('-', before.length - rm);
        } else {
          // e.g. "ABC", "DC" -> "D--"
          result = escape(after.substr(0, after.length - rm), 1, 0) +
              pad('-', before.length - rm);
        }
      }
    } else {
      if (lm > 0 && lm >= rm) {  // append
        if (before.length === lm) {
          // e.g. "AB", "ABC" -> "C"
          result = escape(after.substr(lm), 1, 1);
        } else {
          // e.g. "AD", "ABC" -> "-BC"
          result = pad('-', before.length - lm) +
              escape(after.substr(lm), 0, 1);
        }
      } else if (rm > 0) {  // prepend
        if (before.length === rm) {
          // e.g. "BC", "ABC" -> "A+"
          result = escape(after.substr(0, after.length - rm), 1, 0) + '+';
        } else {
          // e.g. "DC", "ABC" -> "AB-"
          result = escape(after.substr(0, after.length - rm), 1, 0) +
              pad('-', before.length - rm);
        }
      }
    }
    if (result) {
      // be shorter?
      if (before.indexOf(' ') < 0) {
        var ret = '*' + escape(after, 0, 1);
        return result.length < ret.length ? result : ret;
      }
      return result;
    }

    var lcsData = {startBefore: 0, startAfter: 0, length: 0};
    if (findLongestCommonSubstring(before, after, lcsData)) {
      lcsData.before = before;
      lcsData.after = after;
      var retA = lcsDiff(lcsData);
      // be more legible?
      if (before.indexOf(' ') < 0) {
        var retB = '*' + escape(after, 0, 1);
        return retA.length < retB.length ? retA : retB;
      }
      return retA;
    } else if (before.indexOf(' ') > -1) {
      return pad('-', before.length) + escape(after, 0, 1);
    } else {
      return '*' + escape(after, 0, 1);
    }
  };


  // TODO: Unicode support
  var diffmark = {
    mark: mark,
    diff: diff
  };

  if ((typeof module !== 'undefined' && module !== null ? module.exports : void 0) != null) {
    module.exports = diffmark;
  } else if (typeof define === 'function' && define.amd) {
    define([], function() {
      return diffmark;
    });
  } else {
    this.diffmark = diffmark;
  }
}).call(this);
