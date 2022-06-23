import React from 'react'

export default class DynamicRoute extends React.Component {
  static async getInitialProps({ query }) {
    return {
      query,
    }
  }

  render() {
    return <p id="catch-all-page">{JSON.stringify(this.props.query.slug)}</p>
  }
}
