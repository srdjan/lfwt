const ids = [1, 2, 3]

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

const fetchTodoPlain = async (id: number) => {
  console.log(`[baseline] fetching TODO ${id}`)
  const res = await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`)
  if (!res.ok) throw new Error(`fetch failed for ${id} (${res.status})`)
  const todo = await res.json() as { id: number; title: string }
  return todo
}

const main = async () => {
  console.log("[baseline] starting ingestion run")
  for (const id of ids) {
    try {
      const todo = await fetchTodoPlain(id)
      console.log(`[baseline] processed ${id}: ${todo.title}`)
      // simulate expensive downstream work
      await sleep(150)
    } catch (err) {
      console.error(`[baseline] failed permanently for ${id}:`, err)
    }
  }
  console.log("[baseline] ingestion complete")
}

if (import.meta.main) {
  await main()
}
