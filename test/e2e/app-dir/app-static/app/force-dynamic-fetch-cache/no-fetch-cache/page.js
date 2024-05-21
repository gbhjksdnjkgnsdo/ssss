export const dynamic = 'force-dynamic'
// override root layout fetchCache = 'default-cache'
export const fetchCache = 'default-no-store'

export default async function Page() {
  const data = await fetch(
    'https://next-data-api-endpoint.vercel.app/api/random'
  ).then((res) => res.text())

  return (
    <>
      <p id="page">/force-dynamic-fetch-cache/no-fetch-cache</p>
      <p id="data">{data}</p>
    </>
  )
}
