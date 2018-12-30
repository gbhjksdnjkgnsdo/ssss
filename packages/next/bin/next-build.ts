#!/usr/bin/env node
import { resolve, join } from 'path'
import { existsSync } from 'fs'
import arg from 'arg'
import build from '../build'
import { printAndExit } from '../server/lib/utils'

const args = arg({
  // Types
  '--help': Boolean,
  '--lambdas': Boolean,

  // Aliases
  '-h': '--help',
  '-l': '--lambdas',
})

if (args['--help']) {
  printAndExit(`
    Description
      Compiles the application for production deployment

    Usage
      $ next build <dir>

    <dir> represents where the compiled dist folder should go.
    If no directory is provided, the dist folder will be created in the current directory.
    You can set a custom folder in config https://github.com/zeit/next.js#custom-configuration, otherwise it will be created inside '.next'
  `, 0)
}

const dir = resolve(args._[0] || '.')
const lambdas = args['--lambdas']

// Check if pages dir exists and warn if not
if (!existsSync(dir)) {
  printAndExit(`> No such directory exists as the project root: ${dir}`)
}

if (!existsSync(join(dir, 'pages'))) {
  if (existsSync(join(dir, '..', 'pages'))) {
    printAndExit('> No `pages` directory found. Did you mean to run `next` in the parent (`../`) directory?')
  }

  printAndExit('> Couldn\'t find a `pages` directory. Please create one under the project root')
}

build(dir, null, lambdas)
  .catch((err) => {
    // tslint:disable-next-line
    console.error('> Build error occured')
    printAndExit(err)
  })
