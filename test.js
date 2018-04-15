import test from 'ava'
import delay from 'delay'
import fallback from '.'
import PCancel from 'p-cancelable'

const pOk = async sec => {
  await delay(sec * 1000)
  return sec
}
const pErr = async sec => {
  await delay(sec * 1000)
  throw new Error('fail')
}

test('basic', async t => {
  let calls = 0
  const results = await fallback([0.5, 0.4, 0.3, 0.2, 0.1], v => pOk(v).then(v => ++calls && v))

  t.is(calls, 1)
  t.deepEqual(results, [0.1])

  await delay(500)
  t.is(calls, 5)
})

test('curring', async t => {
  const fback = fallback(pOk)
  const results = await fback([0.5, 0.4, 0.3, 0.2, 0.1])
  t.deepEqual(results, [0.1])
})

test('count', async t => {
  const results1 = await fallback([0.5, 0.4, 0.3, 0.2, 0.1], pOk, {count: 2})
  t.deepEqual(results1, [0.1, 0.2])

  const results2 = await fallback([0.5, 0.4, 0.3, 0.2, 0.1], pOk, {count: 3})
  t.deepEqual(results2, [0.1, 0.2, 0.3])

  t.throws(_ => fallback([0.1], pOk, {count: 2}))
})

test('silent', async t => {
  const results = await fallback([0.1, 0.2, 0.3, 0.4, 0.5], pErr, {silent: true})
  t.deepEqual(results, [])

  await t.throws(fallback([0.1, 0.2, 0.3, 0.4, 0.5], pErr))
})

test('concurrency', async t => {
  let actives = 0
  let max = 0

  const results = await fallback([
    {t: 0.5, r: true},
    {t: 0.1, r: false},
    {t: 0.2, r: false},
    {t: 0.3, r: true},
    {t: 0, r: true}
  ], async ({t, r}) => {
    actives++
    max = Math.max(actives, max)
    await delay(t * 1000)
    actives--
    if (!r) throw new Error('fail!')
    return t
  }, {concurrency: 2})

  t.is(max, 2)
  t.deepEqual(results, [0.5])
})

test('supports cancel', async t => {
  const cancelList = []

  const results = await fallback(
    [0.1, 0.2, 0.3],
    sec => new PCancel((resolve, reject, onCancel) => {
      onCancel(_ => cancelList.push(sec))
      delay(sec * 1000).then(_ => resolve(sec))
    })
  )

  t.deepEqual(results, [0.1])
  t.deepEqual(cancelList, [0.2, 0.3])
})
