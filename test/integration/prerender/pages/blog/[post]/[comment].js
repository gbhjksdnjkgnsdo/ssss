import React from 'react'
import Link from 'next/link'

export async function getStaticParams() {
  return [
    '/blog/post-1/comment-1',
    { post: 'post-2', comment: 'comment-2' }
  ]
}

export async function getStaticProps({ params }) {
  return {
    props: {
      post: params.post,
      comment: params.comment,
      time: new Date().getTime()
    },
    revalidate: 5,
  }
}

export default ({ post, comment, time }) => {
  return (
    <>
      <p>Post: {post}</p>
      <p>Comment: {comment}</p>
      <span>time: {time}</span>
      <Link href='/'>
        <a id='home'>to home</a>
      </Link>
    </>
  )
}
