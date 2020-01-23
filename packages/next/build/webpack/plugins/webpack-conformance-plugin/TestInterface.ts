import { NodePath } from 'ast-types/lib/node-path'

export interface IConformanceAnomaly {
  message: string
  stack_trace?: string
}

export interface IConformanceTestResult {
  result: 'SUCCESS' | 'FAILED'
  warnings?: Array<IConformanceAnomaly>
  errors?: Array<IConformanceAnomaly>
}

export interface IParsedModuleDetails {
  request: string
}

export type NodeInspector = (
  node: NodePath,
  details: IParsedModuleDetails
) => IConformanceTestResult

export interface IGetAstNodeResult {
  visitor: string
  inspectNode: NodeInspector
}

export interface IWebpackConformanceTest {
  buildStared?: (options: any) => IConformanceTestResult
  getAstNode?: () => IGetAstNodeResult[]
  buildCompleted?: (assets: any) => IConformanceTestResult
}
