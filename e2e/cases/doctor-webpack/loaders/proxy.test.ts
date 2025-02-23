import { expect, test } from '@playwright/test';
import { getSDK, setSDK } from '@rsdoctor/core/plugins';
import { RsdoctorWebpackSDK } from '@rsdoctor/sdk/sdk';
import { SDK } from '@rsdoctor/types';
import { compileByWebpack5 } from '@rsbuild/test-helper';
import os from 'os';
import path from 'path';
import { Compiler } from 'webpack';
import { createRsdoctorPlugin } from '../test-utils';

const file = path.resolve(__dirname, '../fixtures/a.js');
const loaderPath = path.resolve(__dirname, '../fixtures/loaders/comment.js');
const codeTransformed = `console.log('a');\n\n// hello world`;

async function webpack5(mode: 'async' | 'callback' | 'sync', pitchResult = '') {
  const res = await compileByWebpack5(file, {
    module: {
      rules: [
        {
          test: /\.js$/,
          use: [
            {
              loader: loaderPath,
              options: {
                mode,
                pitchResult,
              },
            },
          ],
        },
      ],
    },
    // @ts-ignore
    plugins: [createRsdoctorPlugin()],
  });
  return res;
}

test('webpack5', async () => {
  const mode = 'sync';
  const { modules } = await webpack5(mode);

  expect(modules!.length).toEqual(1);
  expect(getSDK()).toBeInstanceOf(RsdoctorWebpackSDK);

  const { loader } = getSDK().getStoreData();

  expect(loader).toHaveLength(1);
  expect(loader[0].resource).toStrictEqual({
    path: file,
    query: {},
    queryRaw: '',
    ext: 'js',
  } as SDK.ResourceData);
  expect(loader[0].loaders[0].isPitch).toBeFalsy();
  expect(loader[0].loaders[0].loaderIndex).toEqual(0);
  expect(loader[0].loaders[0].path).toEqual(loaderPath);
  os.EOL === '\n' &&
    expect(loader[0].loaders[0].result).toEqual(codeTransformed);
  expect(loader[0].loaders[0].options).toStrictEqual({
    mode,
    pitchResult: '',
  });
  expect(loader[0].loaders[0].errors).toHaveLength(0);
});

test('test async', async () => {
  const mode = 'async';
  const { modules } = await webpack5(mode);

  expect(modules!.length).toEqual(1);
  expect(getSDK()).toBeInstanceOf(RsdoctorWebpackSDK);

  const { loader } = getSDK().getStoreData();

  expect(loader).toHaveLength(1);
  expect(loader[0].resource).toStrictEqual({
    path: file,
    query: {},
    queryRaw: '',
    ext: 'js',
  } as SDK.ResourceData);
  expect(loader[0].loaders[0].isPitch).toBeFalsy();
  expect(loader[0].loaders[0].loaderIndex).toEqual(0);
  expect(loader[0].loaders[0].path).toEqual(loaderPath);
  os.EOL === '\n' &&
    expect(loader[0].loaders[0].result).toEqual(codeTransformed);
  expect(loader[0].loaders[0].options).toStrictEqual({
    mode,
    pitchResult: '',
  });
  expect(loader[0].loaders[0].errors).toHaveLength(0);
});

test('test callback', async () => {
  const mode = 'callback';
  const { modules } = await webpack5(mode);

  expect(modules!.length).toEqual(1);
  expect(getSDK()).toBeInstanceOf(RsdoctorWebpackSDK);

  const { loader } = getSDK().getStoreData();

  expect(loader).toHaveLength(1);
  expect(loader[0].resource).toStrictEqual({
    path: file,
    query: {},
    queryRaw: '',
    ext: 'js',
  } as SDK.ResourceData);
  expect(loader[0].loaders[0].isPitch).toBeFalsy();
  expect(loader[0].loaders[0].loaderIndex).toEqual(0);
  expect(loader[0].loaders[0].path).toEqual(loaderPath);
  os.EOL === '\n' &&
    expect(loader[0].loaders[0].result).toEqual(codeTransformed);
  expect(loader[0].loaders[0].options).toStrictEqual({
    mode,
    pitchResult: '',
  });
  expect(loader[0].loaders[0].errors).toHaveLength(0);
});

test('test pitch', async () => {
  const mode = 'callback';
  const pitchResult = '// pitch success';
  const { modules } = await webpack5(mode, pitchResult);

  expect(modules!.length).toEqual(1);
  expect(getSDK()).toBeInstanceOf(RsdoctorWebpackSDK);

  const { loader } = getSDK().getStoreData();

  expect(loader).toHaveLength(1);
  expect(loader[0].resource).toStrictEqual({
    path: file,
    query: {},
    queryRaw: '',
    ext: 'js',
  } as SDK.ResourceData);
  expect(loader[0].loaders[0].isPitch).toBeTruthy();
  expect(loader[0].loaders[0].loaderIndex).toEqual(0);
  expect(loader[0].loaders[0].path).toEqual(loaderPath);
  expect(loader[0].loaders[0].result).toEqual(pitchResult);
  expect(loader[0].loaders[0].options).toStrictEqual({ mode, pitchResult });
  expect(loader[0].loaders[0].errors).toHaveLength(0);
});

test('set sdk.reportLoader as null to mock this scene', async () => {
  const mode = 'sync';
  const plugin = createRsdoctorPlugin();
  const { modules } = await compileByWebpack5(file, {
    module: {
      rules: [
        {
          test: /\.js$/,
          use: [
            {
              loader: loaderPath,
              options: {
                mode,
                pitchResult: '',
              },
            },
          ],
        },
      ],
    },
    plugins: [
      // @ts-ignore
      plugin,
      // @ts-ignore
      {
        name: 'XXX',
        apply(compiler: Compiler) {
          compiler.hooks.beforeRun.tapPromise(
            { name: 'XXX', stage: 99999 },
            async () => {
              const sdk = getSDK();
              setSDK(
                new Proxy(sdk, {
                  get(target, key, receiver) {
                    switch (key) {
                      case 'reportLoader':
                        return null;
                      default:
                        return Reflect.get(target, key, receiver);
                    }
                  },
                  set(target, key, value, receiver) {
                    return Reflect.set(target, key, value, receiver);
                  },
                  defineProperty(target, p, attrs) {
                    return Reflect.defineProperty(target, p, attrs);
                  },
                }),
              );
            },
          );
        },
      },
    ],
  });

  expect(modules!.length).toEqual(1);
  expect(getSDK().reportLoader).toEqual(null);

  // @ts-ignore
  const { loader } = plugin.sdk.getStoreData();

  expect(loader).toHaveLength(1);
  expect(loader[0].resource).toStrictEqual({
    path: file,
    query: {},
    queryRaw: '',
    ext: 'js',
  } as SDK.ResourceData);
  expect(loader[0].loaders[0].isPitch).toBeFalsy();
  expect(loader[0].loaders[0].loaderIndex).toEqual(0);
  expect(loader[0].loaders[0].path).toEqual(loaderPath);
  os.EOL === '\n' &&
    expect(loader[0].loaders[0].result).toEqual(codeTransformed);
  expect(loader[0].loaders[0].options).toStrictEqual({
    mode,
    pitchResult: '',
  });
  expect(loader[0].loaders[0].errors).toHaveLength(0);
});
