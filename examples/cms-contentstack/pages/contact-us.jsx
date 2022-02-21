import React, { useState, useEffect } from 'react'
import { onEntryChange } from '../sdk-plugin/index'
import RenderComponents from '../components/render-components'
import { getContactRes } from '../helper/index'

export default function Contact(props) {
  const { result, entryUrl } = props
  const [getEntry, setEntry] = useState(result)

  async function fetchData() {
    try {
      console.info('fetching page entry live preview data...')
      const entryRes = await getContactRes(entryUrl)
      setEntry(entryRes)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    onEntryChange(() => {
      fetchData()
    })
  }, [])

  return (
    getEntry.page_components && (
      <RenderComponents
        pageComponents={getEntry.page_components}
        contentTypeUid="page"
        entryUid={getEntry.uid}
        locale={getEntry.locale}
      />
    )
  )
}
export async function getServerSideProps(context) {
  try {
    const entryRes = await getContactRes(context.resolvedUrl)
    return {
      props: {
        entryUrl: context.resolvedUrl,
        result: entryRes,
      },
    }
  } catch (error) {
    return { notFound: true }
  }
}
