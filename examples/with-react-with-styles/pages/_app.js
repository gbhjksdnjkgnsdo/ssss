import React from 'react'
import { DIRECTIONS } from 'react-with-direction'
import AphroditeInterface from 'react-with-styles-interface-aphrodite'
import WithStylesContext from 'react-with-styles/lib/WithStylesContext'
import defaultTheme from '../defaultTheme'

function MyApp(props) {
  const { Component, pageProps } = props

  return (
    <WithStylesContext.Provider
      value={{
        stylesInterface: AphroditeInterface,
        stylesTheme: defaultTheme,
        direction: DIRECTIONS.LTR,
      }}
    >
      <Component {...pageProps} />
    </WithStylesContext.Provider>
  )
}

export default MyApp
