const test = require('ava')
const delay = require('delay')
const fallback = require('.')

const delaySec = sec =>
  delay(sec * 1000).then(_ => sec)

test('basic', async t => {
  const results = await fallback([3, 2, 1, 0.5], delaySec)
  t.deepEqual(results, [0.5])
})

test('concurrency limit', async t => {
  let actives = 0
  let max = 0

  const testRun = async sec => {
    actives++
    max = Math.max(max, actives)
    await delaySec(sec)
    actives--
    return sec
  }

  const results1 = await fallback([1, 0.8, 0.6, 0.4, 0.2, 0.1], testRun, {concurrency: 2})
  t.deepEqual(results1, [0.8])
  t.is(max, 2)

  actives = 0
  max = 0
  const results2 = await fallback([1, 0.8, 0.6, 0.4, 0.2, 0.1], testRun, {concurrency: 3})
  t.deepEqual(results2, [0.6])
  t.is(max, 3)
})
