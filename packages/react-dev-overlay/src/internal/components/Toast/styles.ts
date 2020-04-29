import { noop as css } from '../../helpers/noop-template'

const styles = css`
  [data-nextjs-toast] {
    position: fixed;
    bottom: 1rem;
    left: 1rem;
    max-width: 420px;
    z-index: 9000;
  }

  @media (max-width: 440px) {
    [data-nextjs-toast] {
      max-width: 90vw;
      left: 5vw;
    }
  }

  [data-nextjs-toast-wrapper] {
    padding: 1rem;
    border-radius: 5px;
    font-weight: 600;
    color: var(--color-ansi-white);
    background-color: var(--color-ansi-bright-red);
    box-shadow: 0 5px 10px var(--color-ansi-bright-red);
  }
`

export { styles }
