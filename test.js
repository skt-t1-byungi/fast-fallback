const test = require('ava')
const delay = require('delay')
const fallback = require('.')

const delaySec = sec => {
  return delay(sec * 1000).then(_ => sec)
}

test('basic', async t => {
  const results = await fallback([3, 2, 1, 0.5], delaySec)
  t.deepEqual(results, [0.5])
})

test('concurrency limit', async t => {
  const results1 = await fallback([1.5, 1, 0.5, 0.3, 0.1], delaySec, {concurrency: 1})
  t.deepEqual(results1, [1.5])

  const results2 = await fallback([1.5, 1, 0.5, 0.3, 0.1], delaySec, {concurrency: 2})
  t.deepEqual(results2, [1])
})
