module.exports = (values, asyncTransformer, opts) => {
  if (!Array.isArray(values)) {
    throw new TypeError('[fast-fallback] `values` must be an Array type!')
  }

  opts = Object.assign({
    count: 1,
    concurrency: Infinity,
    silent: false
  }, opts)

  return new Promise((resolve, reject) => {
    const queue = values.slice(0)
    const results = []
    const progressList = []

    const removeInProgressList = progress => {
      progressList.splice(progressList.indexOf(progress), 1)
    }
    const cancelAllProgress = _ => {
      progressList.forEach(progress => progress.cancel && progress.cancel())
    }

    let idx = -1

    const next = _ => {
      const promise = asyncTransformer(queue.shift(), ++idx)
      progressList.push(promise)

      promise
        .then(result => {
          removeInProgressList(promise)
          if (results.length < opts.count) results.push(result)

          if (results.length === opts.count) {
            cancelAllProgress()
            return resolve(results)
          }

          if (queue.length !== 0) next()
          if (progressList.length === 0) resolve(results)
        })
        .catch(_ => {
          removeInProgressList(promise)

          if (queue.length !== 0) return next()
          if (progressList.length !== 0) return

          if (!opts.silent && results.length === 0) {
            return reject(new Error('[fast-fallback] All failed!'))
          }

          resolve(results)
        })
    }

    let times = Math.min(queue.length, opts.concurrency)
    while (times--) next()
  })
}
