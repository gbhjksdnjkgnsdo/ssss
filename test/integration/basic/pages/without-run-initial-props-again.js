import React from 'react'

const Component = ({ fromServer, fromFirstRender }) =>
  <div>
    {fromServer ? 'fromServer' : ''}
    {fromFirstRender ? 'fromFirstRender' : ''}
  </div>

Component.getInitialProps = async ({ req, serverProps }) => {
  if (req) return { fromServer: true }
  else if (serverProps) return { fromFirstRender: true }
}

// Don't include runInitialPropsAgain.

export default Component
