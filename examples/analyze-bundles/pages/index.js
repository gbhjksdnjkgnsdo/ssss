import React from 'react'
import Link from 'next/link'

export default ({ name }) => (
  <div>
    <h1>Home Page</h1>
    <p>Welcome, {name}</p>
    <div>
      <Link href="/about">
        <a>About Page</a>
      </Link>
    </div>
  </div>
)

export async function getStaticProps() {
  const faker = require('faker')
  const name = faker.name.findName()
  return {
    props: { name },
  }
}
