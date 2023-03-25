import Link from 'next/link'

type HeaderProps = {
  user?: any
  loading: boolean
}

const Header = ({ user, loading }: HeaderProps) => {
  return (
    <header>
      <nav>
        <ul>
          <li>
            {/* You need to add a link tag `<a></a>` in <Link /> for next.js-12.1 and below */}
            <Link href="/" legacyBehavior>
              Home
            </Link>
          </li>
          <li>
            <Link href="/about" legacyBehavior>
              About
            </Link>
          </li>
          <li>
            <Link href="/advanced/api-profile" legacyBehavior>
              API rendered profile (advanced)
            </Link>
          </li>
          {!loading &&
            (user ? (
              <>
                <li>
                  <Link href="/profile" legacyBehavior>
                    Client rendered profile
                  </Link>
                </li>
                <li>
                  <Link href="/advanced/ssr-profile" legacyBehavior>
                    Server rendered profile (advanced)
                  </Link>
                </li>
                <li>
                  <a href="/api/auth/logout">Logout</a>
                </li>
              </>
            ) : (
              <li>
                <a href="/api/auth/login">Login</a>
              </li>
            ))}
        </ul>
      </nav>

      <style jsx>{`
        header {
          padding: 0.2rem;
          color: #fff;
          background-color: #333;
        }
        nav {
          max-width: 42rem;
          margin: 1.5rem auto;
        }
        ul {
          display: flex;
          list-style: none;
          margin-left: 0;
          padding-left: 0;
        }
        li {
          margin-right: 1rem;
          padding-right: 2rem;
        }
        li:nth-child(3) {
          margin-right: auto;
        }
        a {
          color: #fff;
          text-decoration: none;
        }
        button {
          font-size: 1rem;
          color: #fff;
          cursor: pointer;
          border: none;
          background: none;
        }
      `}</style>
    </header>
  )
}

export default Header
