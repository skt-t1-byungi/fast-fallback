class PList {
  constructor () {
    this._list = []
  }

  add (p) {
    this._list.push(p)
  }

  remove (p) {
    const list = this._list
    list.splice(list.indexOf(p), 1)
  }

  isEmpty () {
    return this._list.length === 0
  }

  cancelAll () {
    this._list.forEach(p => p.cancel && p.cancel())
  }
}

class Defer {
  constructor () {
    this.completed = false
    this.promise = new Promise((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })
  }

  resolve (v) {
    if (this._completed) return
    this._completed = true
    this._resolve(v)
  }

  reject (err) {
    if (this._completed) return
    this._completed = true
    this._reject(err)
  }
}

const fallback = (values, asyncTransformer, opts) => {
  if (typeof values === 'function') {
    opts = asyncTransformer
    asyncTransformer = values
    return values => fallback(values, asyncTransformer, opts)
  }

  if (!Array.isArray(values)) {
    throw new TypeError('[fast-fallback] `values` must be an Array type!')
  }

  opts = {
    count: 1,
    concurrency: Infinity,
    silent: false,
    ...opts
  }

  if (values.length < opts.count) {
    throw new TypeError('[fast-fallback] `opts.count` value can not be larger than `values.length`!')
  }

  const defer = new Defer()
  const pList = new PList()
  const queue = [...values]
  const results = []
  let idx = -1

  const next = _ => {
    const p = asyncTransformer(queue.shift(), ++idx)
    pList.add(p)

    p.then(result => {
      if (defer.completed) return

      pList.remove(p)
      if (results.length < opts.count) results.push(result)

      if (results.length === opts.count) {
        pList.cancelAll()
        return defer.resolve(results)
      }

      if (queue.length !== 0) next()
      if (pList.length === 0) defer.resolve(results)
    }).catch(_ => {
      if (defer.completed) return

      pList.remove(p)

      if (queue.length > 0) return next()
      if (!pList.isEmpty()) return
      if (opts.silent || results.length > 0) return defer.resolve(results)

      defer.reject(new Error('[fast-fallback] All failed!'))
    })
  }

  let times = Math.min(queue.length, opts.concurrency)
  while (times--) next()

  return defer.promise
}

export default fallback
