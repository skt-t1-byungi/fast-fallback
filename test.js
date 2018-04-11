import test from 'ava'
import delay from 'delay'
import fallback from '.'

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

test('count', async t => {
  const results1 = await fallback([0.5, 0.4, 0.3, 0.2, 0.1], pOk, {count: 2})
  t.deepEqual(results1, [0.1, 0.2])

  const results2 = await fallback([0.5, 0.4, 0.3, 0.2, 0.1], pOk, {count: 3})
  t.deepEqual(results2, [0.1, 0.2, 0.3])

  t.throws(_ => fallback([0.1], pOk, {count: 2}))
})
