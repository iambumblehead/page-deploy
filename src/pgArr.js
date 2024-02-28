const pgArrFilterAsync = async (arr, fn, fin = []) => {
  if (arr.length === 0)
    return fin

  if (await fn(arr[0]))
    fin.push(arr[0])

  return pgArrFilterAsync(arr.slice(1), fn, fin)
}

const pgArrMapAsync = async (arr, fn, fin = []) => {
  if (arr.length === 0)
    return fin

  fin.push(await fn(arr[0]))

  return pgArrMapAsync(arr.slice(1), fn, fin)
}

const pgArrReduceAsync = async (arr, fn, acc) => {
  if (arr.length === 0)
    return acc

  return pgArrReduceAsync(arr.slice(1), fn, await fn(acc, arr[0]))
}

const pgArrSomeAsync = async (arr, fn) => {
  if (arr.length === 0)
    return false

  return (await fn(arr[0]) || pgArrSomeAsync(arr.slice(1), fn))
}

const pgArrEveryAsync = async (arr, fn) => {
  if (arr.length === 0)
    return true
  
  return (await fn(arr[0]) && pgArrEveryAsync(arr.slice(1), fn))
}

export {
  pgArrFilterAsync,
  pgArrMapAsync,
  pgArrReduceAsync,
  pgArrSomeAsync,
  pgArrEveryAsync
}
