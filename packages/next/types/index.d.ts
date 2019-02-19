declare module '@babel/plugin-transform-modules-commonjs';
declare module 'next-server/next-config';
declare module 'next-server/constants';
declare module 'webpack/lib/GraphHelpers';

declare module 'arg' {
  function arg<T extends arg.Spec>(spec: T, options?: {argv?: string[], permissive?: boolean}): arg.Result<T>;

  namespace arg {
    export type Handler = (value: string) => any;

    export interface Spec {
      [key: string]: string | Handler | [Handler];
    }

    export type Result<T extends Spec> = { _: string[] } & {
      [K in keyof T]: T[K] extends string
        ? never
        : T[K] extends Handler
        ? ReturnType<T[K]>
        : T[K] extends [Handler]
        ? Array<ReturnType<T[K][0]>>
        : never
    };
  }

  export = arg;
}
declare module 'autodll-webpack-plugin' {
  import {WebpackOptions, WebpackPluginInstance, Entry} from 'webpack/declarations/WebpackOptions'
  class AutoDllPlugin implements WebpackPluginInstance {
    constructor(settings?: {
      inject?: boolean,
      plugins?: WebpackOptions["plugins"],
      context?: string,
      debug?: boolean,
      filename?: string,
      path?: string,
      inherit?: boolean,
      entry?: Entry
    })
    apply: WebpackPluginInstance["apply"]
    [k: string]: any
  }

  export = AutoDllPlugin
}

// This "hack" is needed because typescript doesn't support recursive type definitions
// It's referenced from "ruleSet-conditions" in schemas/WebpackOptions.json
interface RuleSetConditionsRecursive
	extends Array<import("webpack/declarations/WebpackOptions").RuleSetCondition> {}
interface RuleSetConditionsAbsoluteRecursive
	extends Array<
		import("webpack/declarations/WebpackOptions").RuleSetConditionAbsolute
	> {}