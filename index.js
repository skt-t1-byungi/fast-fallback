import Defer from 'p-state-defer'

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
  opts.count = Math.min(values.length, opts.count)

  const defer = new Defer()
  const pList = new PList()
  const queue = [...values]
  const results = []
  let idx = -1

  const next = _ => {
    const p = asyncTransformer(queue.shift(), ++idx)
    pList.add(p)

    p.then(result => {
      if (defer.isCompleted) return

      pList.remove(p)
      if (results.length < opts.count) results.push(result)

      if (results.length === opts.count) {
        pList.cancelAll()
        return defer.resolve(results)
      }

      if (queue.length !== 0) next()
      if (pList.length === 0) defer.resolve(results)
    }).catch(_ => {
      if (defer.isCompleted) return

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
