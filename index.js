class PList {
  constructor () {
    this._list = []
    this._isCanceled = false
  }

  get isCanceled () {
    return this._isCanceled
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
    this._isCanceled = true
    this._list.forEach(p => p.cancel && p.cancel())
  }
}

export default function (values, asyncTransformer, opts) {
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
    throw new TypeError('[fast-fallback] `opts.count` value can not be larger than `values` array size!')
  }

  return new Promise((resolve, reject) => {
    const queue = [...values]
    const results = []
    const pList = new PList()
    let idx = -1

    const next = _ => {
      const p = asyncTransformer(queue.shift(), ++idx)
      pList.add(p)

      p.then(result => {
        pList.remove(p)
        if (results.length < opts.count) results.push(result)

        if (results.length === opts.count) {
          pList.cancelAll()
          return resolve(results)
        }

        if (queue.length !== 0) next()
        if (pList.length === 0) resolve(results)
      }).catch(_ => {
        // If `pList.isCanceled` is true, it is already resolved
        if (pList.isCanceled) return

        pList.remove(p)

        if (queue.length > 0) return next()
        if (!pList.isEmpty()) return
        if (opts.silent || results.length > 0) return resolve(results)

        reject(new Error('[fast-fallback] All failed!'))
      })
    }

    let times = Math.min(queue.length, opts.concurrency)
    while (times--) next()
  })
}
