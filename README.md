# fast-fallback
Fast fallback Lib that supports P-cancelable.

[![npm](https://img.shields.io/npm/v/fast-fallback.svg?style=flat-square)](https://www.npmjs.com/package/fast-fallback)

## Install
```sh
yarn add fast-fallback
```
```js
//es6
import fallback from "fast-fallback";

//commonjs
const fallback = require("fast-fallback");
```
### browser
```html
<script src="https://unpkg.com/fast-fallback"></script>
<script>
 var fallback = fastFallback;
</script>
```

## Usage
### Basic
```js
const fallback = require("fast-fallback");
const PCancelable = require('promise-cancelable');

const servers = ['121.25.1.100', '121.25.1.101', '121.2.15.102']

const asyncTransformer = server => new PCancelable((resolve, reject, onCancel)=>{
  const ws = new WebSocket('ws://' + server)

  // Cancel late-successful connections.
  onCancel(_ => ws.close())

  ws.onopen = _ => resolve(ws)
  ws.onerror = err => reject(err)
});

(async_ => {
  const [ws] = await fallback(servers, asyncTransformer, {
    count: 1 // Number of fallback results
  })

  ws.send(...)
})()
```

### Currying
```js
const curried = fallback(asyncTransformer, opts) 
const results1 = await curried(servers)
const results2 = await curried(otherSevers)
```

## API

### fallback(values, asyncTransformer [, options])

#### values: array
Candidate values.

#### asyncTransformer: (val, idx) => PCancelable\<Any>|Promise\<Any>
Transform functions that generate promise using candidate value.

#### options: object 
##### count
Number of fallback results. defaults `1`.

##### concurrency
Number of concurrently processing promises. defaults `Infinity`.

##### silent
When all promises fail, return an empty array if true, or throw an exception if false.
defaults `false`.

## Related
- [promise-cancelable](https://www.npmjs.com/package/promise-cancelable) - for browser
- [p-cancelable](https://github.com/sindresorhus/p-cancelable) - for node

## License
MIT