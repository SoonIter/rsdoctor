import type {
  Linter as LinterType,
  Common,
  Plugin,
  SDK,
} from '@rsdoctor/types';
import type { RsdoctorSlaveSDK, RsdoctorWebpackSDK } from '@rsdoctor/sdk';
import { ModuleGraph } from '@rsdoctor/graph';
// import { rules } from '@web-doctor/webpack-rules';

// type InternalRules = Common.UnionToTuple<typeof rules[number]>;
type InternalRules = any; // TODO: add webpack-rules later;

export interface RsdoctorWebpackPluginOptions<
  Rules extends LinterType.ExtendRuleData[],
> {
  /** Checker configuration */
  linter?: LinterType.Options<Rules, InternalRules>;
  /**
   * the switch for the Rsdoctor features.
   */
  features?:
    | Plugin.RsdoctorWebpackPluginFeatures
    | Array<keyof Plugin.RsdoctorWebpackPluginFeatures>;
  /**
   * configuration of the interceptor for webpack loaders.
   * @description worked when the `features.loader === true`.
   */
  loaderInterceptorOptions?: {
    /**
     * loaders which you want to skip it (will not report the target loader data when webpack compile).
     */
    skipLoaders?: string[];
  };
  /**
   * turn on it if you don't need to see profile in browser.
   * @default false
   */
  disableClientServer?: boolean;
  /**
   * sdk instance of outside
   */
  sdkInstance?: RsdoctorWebpackSDK;
  /**
   * control the Rsdoctor reporter codes records.
   */
  reportCodeType?:
    | { noModuleSource?: boolean; noAssetsAndModuleSource?: boolean }
    | undefined;
  /**
   * control the Rsdoctor upload data to TOS.
   * @default false
   */
  disableTOSUpload?: boolean;
}

export interface RsdoctorWebpackMultiplePluginOptions<
  Rules extends LinterType.ExtendRuleData[] = LinterType.ExtendRuleData[],
> extends Omit<RsdoctorWebpackPluginOptions<Rules>, 'sdkInstance'>,
    Pick<ConstructorParameters<typeof RsdoctorSlaveSDK>[0], 'stage'> {
  /**
   * name of builder
   */
  name?: string;
}

export interface RsdoctorPluginOptionsNormalized<
  Rules extends LinterType.ExtendRuleData[] = [],
> extends Common.DeepRequired<
    Omit<
      RsdoctorWebpackPluginOptions<Rules>,
      'sdkInstance' | 'linter' | 'reportCodeType'
    >
  > {
  features: Common.DeepRequired<Plugin.RsdoctorWebpackPluginFeatures>;
  linter: Required<LinterType.Options<Rules, InternalRules>>;
  sdkInstance?: RsdoctorWebpackSDK;
  reportCodeType?: SDK.ToDataType;
}

export interface BasePluginInstance<T extends Plugin.BaseCompiler> {
  apply: (compiler: T) => void;
  [k: string]: any;
}

export interface InternalPlugin<
  T extends Plugin.BaseCompiler,
  Rules extends LinterType.ExtendRuleData[] = [],
> extends BasePluginInstance<T> {
  readonly name: string;
  readonly scheduler: RsdoctorPluginInstance<T, Rules>;
}

export interface RsdoctorPluginInstance<
  T extends Plugin.BaseCompiler,
  Rules extends LinterType.ExtendRuleData[] = [],
> extends BasePluginInstance<T> {
  readonly name: string;
  readonly options: RsdoctorPluginOptionsNormalized<Rules>;
  readonly sdk: RsdoctorWebpackSDK;
  modulesGraph: ModuleGraph;
  ensureModulesChunksGraphApplied(compiler: T): void;
}

export interface RsdoctorRspackPluginOptions<
  Rules extends LinterType.ExtendRuleData[],
> extends RsdoctorWebpackPluginOptions<Rules> {}
