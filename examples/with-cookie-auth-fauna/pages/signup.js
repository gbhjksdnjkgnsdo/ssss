import React, { useState } from 'react'
import fetch from 'isomorphic-unfetch'
import Layout from '../components/layout'
import { login } from '../utils/auth'
import Router from 'next/router'

function Signup() {
  const [userData, setUserData] = useState({
    email: '',
    password: '',
    error: '',
  })

  async function handleSubmit(event) {
    event.preventDefault()
    setUserData(Object.assign({}, userData, { error: '' }))

    const email = userData.email
    const password = userData.password
    const url = '/api/signup'

    try {
      const response = await fetch(url, {
        method: 'POST',

        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (response.status === 200) {
        const { email } = await response.json()
        login({ email })
        Router.push('/profile')
      } else {
        console.log('Signup failed.')
        const { message } = await response.json()
        let error = new Error(message ? message : response.statusText)
        throw error
      }
    } catch (error) {
      console.error(
        'You have an error in your code or there are Network issues.',
        error
      )
      setUserData(
        Object.assign({}, userData, {
          error: error.message,
        })
      )
    }
  }

  return (
    <Layout>
      <div className="signup">
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>

          <input
            type="text"
            id="email"
            name="email"
            value={userData.email}
            onChange={event =>
              setUserData(
                Object.assign({}, userData, { email: event.target.value })
              )
            }
          />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={userData.password}
            onChange={event =>
              setUserData(
                Object.assign({}, userData, { password: event.target.value })
              )
            }
          />

          <button type="submit">Sign up</button>

          {userData.error && <p className="error">Error: {userData.error}</p>}
        </form>
      </div>
      <style jsx>{`
        .signup {
          max-width: 340px;
          margin: 0 auto;
          padding: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        form {
          display: flex;
          flex-flow: column;
        }

        label {
          font-weight: 600;
        }

        input {
          padding: 8px;
          margin: 0.3rem 0 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        .error {
          margin: 0.5rem 0 0;
          color: brown;
        }
      `}</style>
    </Layout>
  )
}

export default Signup
