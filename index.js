module.exports = (values, asyncTransformer, opts) => {
  if (!Array.isArray(values)) {
    throw new TypeError('[fast-fallback] `values` must be an Array type!')
  }

  return Promise((resolve, reject) => {
    opts = Object.assign({ count: 1, concurrency: Infinity, silent: false }, opts)

    const queue = values.slice(0)
    const results = []
    const progressList = []

    let idx = -1

    const removeInProgressList = progress => progressList.splice(progressList.indexOf(progress), 1)
    const cancelAllProgress = _ => progressList.forEach(progress => progress.cancel && progress.cancel())

    const next = _ => {
      const promise = asyncTransformer(queue.shift(), ++idx)
      progressList.push(promise)

      promise
        .then(result => {
          removeInProgressList(promise)
          results.push(result)

          if (results.length === opts.count) {
            cancelAllProgress()
            resolve(results)
            return
          }

          if (queue.length !== 0) next()
          if (progressList.length === 0) resolve(results)
        })
        .catch(_ => {
          removeInProgressList(promise)

          if (queue.length !== 0) return next()
          if (progressList.length !== 0) return

          opts.silent || results.length > 0 ? resolve(results) : reject(new Error('[fast-fallback] All failed!'))
        })
    }

    queue.splice(0, opts.concurrency).map(next)
  })
}
