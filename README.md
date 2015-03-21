# diff-mark

[![Build Status](https://travis-ci.org/jakwings/diff-mark.svg)](https://travis-ci.org/jakwings/diff-mark)
[![NPM version](https://badge.fury.io/js/diff-mark.svg)](http://badge.fury.io/js/diff-mark)

A variant of [Diffmark](https://github.com/TheBerkin/Diffmark) implemented in
JavaScript.

Some important difference to the original C# version:

* Diff strings are strictly validated before marking.
* The derived diff strings are less ambiguous and more legible.

### Demo

<http://jakwings.github.io/diff-mark/>

### Usage

You can install it via `npm install diff-mark`, or just include the script
`diffmark.js` in your web pages.

```javascript
var diffmark = diffmark || require('diff-mark');

diffmark.diff('grow', 'grew');  // -> '--ew'
diffmark.mark('grow', 'ing');   // -> 'growing'
```

Specification: <https://github.com/TheBerkin/Diffmark>
