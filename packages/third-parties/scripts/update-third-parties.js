const fs = require('fs/promises')
const path = require('path')
const AllThirdParties = require('third-party-capital')
// eslint-disable-next-line import/no-extraneous-dependencies
const prettier = require('prettier')
// eslint-disable-next-line import/no-extraneous-dependencies
const { outdent } = require('outdent')

const scriptStrategy = {
  server: 'beforeInteractive',
  client: 'afterInteractive',
  idle: 'lazyOnload',
  worker: 'worker',
}

const SRC = path.join(__dirname, '../src')
const CONFIG_FILE_NAME = 'tpc-config.json'

function generateComponent(thirdParty) {
  let thirdPartyFunctions = ''

  const insertScripts = (id, scripts, stylesheets) => {
    let props = ''

    if (stylesheets?.length > 0) {
      props += ` stylesheets={${JSON.stringify(stylesheets)}}`
    }

    return scripts
      .map((script) => {
        if (typeof script === 'string') {
          // External script with only URL
          return `<Script src="${script}"${props} />`
        } else if (script.url) {
          // External script with additional properties
          // TODO: Validate the strategy. Set fallback if an inpnpvalid strategy is passed
          const { url, strategy } = script
          return `<Script src={\`${url}\`} strategy="${scriptStrategy[strategy]}"${props} />`
        } else if (script.code) {
          // Inline script with additional properties
          const { code, strategy } = script
          return outdent`<Script
            id="${id}"
            strategy="${scriptStrategy[strategy]}"
            dangerouslySetInnerHTML={{
              __html: \`${code}\`,
            }}${props}
          />`
        }

        return ''
      })
      .join('')
  }

  const { id, description, content, scripts, stylesheets } =
    AllThirdParties[thirdParty]

  thirdPartyFunctions += outdent`
    // ${description}
    export function ${thirdParty}(args: any) {
      return (
        <Base
          ${content ? 'height={args.height || null}' : ''}
          ${content ? 'width={args.width || null}' : ''}
          ${content ? `content={\`${content}\`}` : ''}>
          ${scripts?.length > 0 ? insertScripts(id, scripts, stylesheets) : ''}
          </Base>
      )
    }
    `

  return thirdPartyFunctions
}

;(async () => {
  const dirs = (await fs.readdir(SRC, { withFileTypes: true }))
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  console.log(SRC)
  for (let dir of dirs) {
    // Fetch the list of third-parties from tpc-config.json
    // Then retrieve its loading instructions from Third Party Capital
    const dirPath = path.join(SRC, dir)
    console.log(dirPath)
    const configFile = (await fs.readdir(dirPath)).find(
      (file) => file === CONFIG_FILE_NAME
    )
    console.log('configFile ', configFile)

    if (!configFile) continue

    const config = JSON.parse(await fs.readFile(path.join(dirPath, configFile)))

    let thirdPartyFunctions = `/**
    * This is an autogenerated file by update-third-parties.js
    */
    import React from 'react'
    import Script from 'next/script'

    import Base from './base'
    `
    for (const thirdParty of Object.values(config)) {
      thirdPartyFunctions += generateComponent(thirdParty)
    }

    await Promise.all([
      fs.writeFile(
        path.join(dirPath, 'index.tsx'),
        prettier.format(thirdPartyFunctions, { semi: false, parser: 'babel' })
      ),
    ])
  }
})()
