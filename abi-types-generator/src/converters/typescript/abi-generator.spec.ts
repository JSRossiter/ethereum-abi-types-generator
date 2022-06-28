import fs from 'fs-extra';
import path from 'path';
import prettierTS from 'prettier/parser-typescript';
import prettier from 'prettier/standalone';
import Helpers from '../../common/helpers';
import AbiGenerator from './abi-generator';
import { GeneratorContext } from './contexts/generator-context';
import { EthersVersion } from './enums/ethers-version';
import { Provider } from './enums/provider';
// tslint:disable-next-line: no-var-requires
const abiJson = require('./mocks/fake-contract-abi.json');

const generatorContext: GeneratorContext = {
  provider: Provider.web3,
  // tslint:disable-next-line: quotemark
  abiFileLocation: "'abi.json'",
  // tslint:disable-next-line: quotemark
  outputPathDirectory: "'here'",
};

type abiGeneratorOptionsType = {
  existsSync: boolean;
  lstatSync: boolean;
  callGenerate: boolean;
};

const abiGenertorOptions: abiGeneratorOptionsType = {
  existsSync: true,
  lstatSync: true,
  callGenerate: true,
};

let existsSyncSpy: jasmine.Spy;
let lstatSyncSpy: jasmine.Spy;
let readFileSyncSpy: jasmine.Spy;
let writeFileSyncSpy: jasmine.Spy;
let watchSpy: jasmine.Spy;

let pathDirnameSpy: jasmine.Spy;
let pathResolveSpy: jasmine.Spy;

let preitterFormatSpy: jasmine.Spy;

const callSuccessAbiGeneratorInstance = (
  options: abiGeneratorOptionsType = abiGenertorOptions,
  context: GeneratorContext = generatorContext
) => {
  const instance = new AbiGenerator(context);

  existsSyncSpy = spyOn(fs, 'existsSync').and.returnValue(options.existsSync);
  if (options.lstatSync) {
    lstatSyncSpy = spyOn(fs, 'lstatSync').and.returnValue({
      isDirectory: () => {
        return true;
      },
    });
  }
  readFileSyncSpy = spyOn(fs, 'readFileSync').and.returnValue(
    JSON.stringify(abiJson)
  );

  writeFileSyncSpy = spyOn(fs, 'writeFileSync').and.returnValue(true);
  watchSpy = spyOn(fs, 'watch').and.returnValue(true);

  pathDirnameSpy = spyOn(path, 'dirname').and.returnValue(
    generatorContext.outputPathDirectory
  );
  pathResolveSpy = spyOn(path, 'resolve').and.callThrough();

  preitterFormatSpy = spyOn(prettier, 'format').and.callThrough();

  if (options.callGenerate) {
    instance.generate();
  }
  return instance;
};

const prettierFormat = (value: string) => {
  return prettier.format(value, {
    parser: 'typescript',
    trailingComma: 'es5',
    singleQuote: true,
    bracketSpacing: true,
    printWidth: 80,
    plugins: [prettierTS],
  });
};

describe('AbiGenerator', () => {
  it('should clear all quotes from generatorContext.abiFileLocation', () => {
    callSuccessAbiGeneratorInstance();

    expect(generatorContext.abiFileLocation).toEqual('abi.json');
  });

  it('should clear all quotes from generatorContext.outputPathDirectory', () => {
    callSuccessAbiGeneratorInstance();

    expect(generatorContext.outputPathDirectory).toEqual('here');
  });

  it('should throw an error if output path does not exist', () => {
    const abiGenertorOptionsClone = Helpers.deepClone(abiGenertorOptions);
    abiGenertorOptionsClone.existsSync = false;

    expect(() => {
      callSuccessAbiGeneratorInstance(abiGenertorOptionsClone);
    }).toThrowError('output path must be a directory');
  });

  it('should throw an error if output path is not a dirctory', () => {
    const abiGenertorOptionsClone = Helpers.deepClone(abiGenertorOptions);
    abiGenertorOptionsClone.lstatSync = false;
    abiGenertorOptionsClone.callGenerate = false;

    spyOn(fs, 'lstatSync').and.returnValue({
      isDirectory: () => {
        return false;
      },
    });

    const instance = callSuccessAbiGeneratorInstance(abiGenertorOptionsClone);

    expect(() => {
      instance.generate();
    }).toThrowError('output path must be a directory');
  });

  it('should not call path.dirname if `this._context.outputPathDirectory` is defined', () => {
    callSuccessAbiGeneratorInstance();

    expect(pathDirnameSpy).toHaveBeenCalledTimes(0);
  });

  it('should call path.dirname 3 times if `this._context.outputPathDirectory` is not defined', () => {
    const generatorContextClone = Helpers.deepClone(generatorContext);
    generatorContextClone.outputPathDirectory = undefined;

    callSuccessAbiGeneratorInstance(abiGenertorOptions, generatorContextClone);

    expect(pathDirnameSpy).toHaveBeenCalledTimes(3);
  });

  it('should call path.resolve 5 time if `this._context.outputPathDirectory` is defined', () => {
    callSuccessAbiGeneratorInstance();

    expect(pathResolveSpy).toHaveBeenCalled();
  });

  it('should call path.resolve if `this._context.outputPathDirectory` is not defined', () => {
    const generatorContextClone = Helpers.deepClone(generatorContext);
    generatorContextClone.outputPathDirectory = undefined;

    callSuccessAbiGeneratorInstance(abiGenertorOptions, generatorContextClone);

    expect(pathResolveSpy).toHaveBeenCalled();
  });

  it('should call fs.existsSync 2 time', () => {
    callSuccessAbiGeneratorInstance();

    expect(existsSyncSpy).toHaveBeenCalledTimes(2);
  });

  it('should call fs.readFileSync 1 time', () => {
    callSuccessAbiGeneratorInstance();

    expect(readFileSyncSpy).toHaveBeenCalledTimes(1);
  });

  it('should call fs.writeFileSyncSpy 1 time', () => {
    callSuccessAbiGeneratorInstance();

    expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
  });

  it('should throw an error if provider passed in is not valid', () => {
    const generatorContextClone = Helpers.deepClone(generatorContext);
    // tslint:disable-next-line: no-any
    generatorContextClone.provider = 'blah' as any;

    expect(() => {
      callSuccessAbiGeneratorInstance(
        abiGenertorOptions,
        generatorContextClone
      );
    }).toThrowError('blah is not a known supported provider');
  });

  it('should not call `fs.watch` if watch is not defined', () => {
    callSuccessAbiGeneratorInstance();

    expect(watchSpy).toHaveBeenCalledTimes(0);
  });

  it('should call `fs.watch` once if watch is set to true', () => {
    const generatorContextClone = Helpers.deepClone(generatorContext);
    generatorContextClone.watch = true;

    callSuccessAbiGeneratorInstance(abiGenertorOptions, generatorContextClone);
    expect(watchSpy).toHaveBeenCalledTimes(1);
  });

  it('should call prettier once with the default options', () => {
    callSuccessAbiGeneratorInstance();

    expect(preitterFormatSpy).toHaveBeenCalledTimes(1);
    expect(
      JSON.stringify(preitterFormatSpy.calls.mostRecent().args[1])
    ).toEqual(
      '{"parser":"typescript","trailingComma":"es5","singleQuote":true,"bracketSpacing":true,"printWidth":80,"plugins":[{"parsers":{"typescript":{"astFormat":"estree"}}}]}'
    );
  });

  describe('Web3', () => {
    it('round trip', () => {
      callSuccessAbiGeneratorInstance();

      expect(writeFileSyncSpy.calls.mostRecent().args[0]).not.toBeUndefined();
      expect(writeFileSyncSpy.calls.mostRecent().args[1]).toMatchSnapshot();
      expect(writeFileSyncSpy.calls.mostRecent().args[2]).toEqual({
        mode: 493,
      });
    });

    it('should call _web3Factory.buildWeb3Interfaces once', () => {
      const abiGenertorOptionsClone = Helpers.deepClone(abiGenertorOptions);
      abiGenertorOptionsClone.callGenerate = false;

      const instance = callSuccessAbiGeneratorInstance(abiGenertorOptionsClone);

      const buildWeb3InterfacesSpy = spyOn(
        // @ts-ignore
        instance._web3Factory,
        'buildWeb3Interfaces'
      ).and.callThrough();

      const buildEthersInterfacesSpy = spyOn(
        // @ts-ignore
        instance._ethersFactory,
        'buildEthersInterfaces'
      ).and.callThrough();

      instance.generate();

      expect(buildWeb3InterfacesSpy).toHaveBeenCalledTimes(1);
      expect(buildWeb3InterfacesSpy).toHaveBeenCalledWith('Abi');

      expect(buildEthersInterfacesSpy).toHaveBeenCalledTimes(0);
    });

    it('should call _web3Factory.buildEventInterfaceProperties once', () => {
      const abiGenertorOptionsClone = Helpers.deepClone(abiGenertorOptions);
      abiGenertorOptionsClone.callGenerate = false;

      const instance = callSuccessAbiGeneratorInstance(abiGenertorOptionsClone);

      const web3BuildEventInterfacePropertiesSpy = spyOn(
        // @ts-ignore
        instance._web3Factory,
        'buildEventInterfaceProperties'
      ).and.callThrough();

      const ethersBuildEventInterfacePropertiesSpy = spyOn(
        // @ts-ignore
        instance._ethersFactory,
        'buildEventInterfaceProperties'
      ).and.callThrough();

      instance.generate();

      expect(web3BuildEventInterfacePropertiesSpy).toHaveBeenCalledTimes(1);
      expect(web3BuildEventInterfacePropertiesSpy).toHaveBeenCalledWith([
        {
          anonymous: false,
          inputs: [
            { indexed: true, name: 'token', type: 'address' },
            { indexed: true, name: 'exchange', type: 'address' },
            { indexed: false, name: 'user', type: 'address' },
            { indexed: true, name: '_value', type: 'uint256' },
          ],
          name: 'Event1',
          type: 'event',
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, name: '_owner', type: 'address' },
            { indexed: true, name: '_spender', type: 'address' },
            { indexed: false, name: '_value', type: 'uint256' },
          ],
          name: 'Event2',
          type: 'event',
        },
        {
          constant: false,
          inputs: [
            {
              components: [
                { name: 'address', type: 'address' },
                { name: 'timestamps', type: 'uint8[2]' },
              ],
              name: 'o',
              type: 'tuple',
            },
          ],
          name: 'tupleInputOnly',
          outputs: [],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: true,
          inputs: [
            { name: 'exchangeAddress', type: 'address' },
            { name: 'internalAddress', type: 'address' },
          ],
          name: 'tupleInputAndOutput',
          outputs: [
            { name: 'affiliate', type: 'address' },
            { name: 'offerID', type: 'bytes32' },
            { name: 'creationTime', type: 'uint256' },
            { name: 'timestamp', type: 'uint8' },
            { name: 'timestamps', type: 'uint8[5]' },
          ],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: true,
          inputs: [
            { name: '', type: 'address' },
            { name: '', type: 'address' },
          ],
          name: 'tupleNoInputNames',
          outputs: [
            { name: 'affiliate', type: 'address' },
            { name: 'offerID', type: 'bytes32' },
            { name: 'creationTime', type: 'uint256' },
            { name: 'timestamp', type: 'uint8' },
            { name: 'timestamps', type: 'uint8[5]' },
          ],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: true,
          inputs: [
            { name: 'address1', type: 'address' },
            { name: 'address2', type: 'address' },
          ],
          name: 'tupleWithParametersNames',
          outputs: [
            { name: 'affiliate', type: 'address' },
            { name: 'offerID', type: 'bytes32' },
            { name: 'creationTime', type: 'uint256' },
            { name: 'timestamp', type: 'uint8' },
            { name: 'timestamps', type: 'uint8[5]' },
          ],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: false,
          inputs: [{ name: 'inputData', type: 'bytes32[2]' }],
          name: 'byteArrayInputExample',
          outputs: [],
          payable: true,
          stateMutability: 'payable',
          type: 'function',
        },
        {
          constant: true,
          gas: 783,
          inputs: [],
          name: 'int8ReturnExample',
          outputs: [{ name: 'out', type: 'uint8' }],
          payable: false,
          type: 'function',
        },
        {
          constant: true,
          gas: 783,
          inputs: [],
          name: 'int256ReturnExample',
          outputs: [{ name: 'out', type: 'uint256' }],
          payable: false,
          type: 'function',
        },
        {
          constant: true,
          gas: 783,
          inputs: [
            { name: 'valid', type: 'boolean' },
            { name: 'exchangeAddress', type: 'address' },
            { name: 'timestamp', type: 'uint8' },
          ],
          name: 'easyExample',
          outputs: [{ name: 'out', type: 'uint256' }],
          payable: false,
          type: 'function',
        },
        {
          name: '__init__',
          outputs: [],
          inputs: [
            { type: 'bytes32', name: '_name' },
            { type: 'bytes32', name: '_symbol' },
            { type: 'uint256', name: '_decimals' },
            { type: 'uint256', name: '_supply' },
          ],
          constant: false,
          payable: false,
          type: 'constructor',
        },
        {
          inputs: [
            {
              internalType: 'address',
              name: 'owner',
              type: 'address',
            },
          ],
          name: 'getCars',
          outputs: [
            {
              components: [
                {
                  internalType: 'uint256',
                  name: 'tokenId',
                  type: 'uint256',
                },
                {
                  internalType: 'uint256[3]',
                  name: 'attachedComponents',
                  type: 'uint256[3]',
                },
                {
                  internalType: 'uint256[10]',
                  name: 'detachedComponents',
                  type: 'uint256[10]',
                },
                {
                  internalType: 'address',
                  name: 'owner',
                  type: 'address',
                },
                {
                  internalType: 'uint256',
                  name: 'detachedComponentsCount',
                  type: 'uint256',
                },
              ],
              internalType: 'struct Car.CarInstance[]',
              name: 'ownedCars',
              type: 'tuple[]',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [
            {
              components: [
                {
                  components: [
                    {
                      internalType: 'address',
                      name: 'offerer',
                      type: 'address',
                    },
                    {
                      components: [
                        {
                          internalType: 'enum ItemType',
                          name: 'itemType',
                          type: 'uint8',
                        },
                        {
                          internalType: 'uint256',
                          name: 'endAmount',
                          type: 'uint256',
                        },
                      ],
                      internalType: 'struct OfferItem[]',
                      name: 'offer',
                      type: 'tuple[]',
                    },
                    {
                      components: [
                        {
                          internalType: 'enum ItemType',
                          name: 'itemType',
                          type: 'uint8',
                        },
                        {
                          internalType: 'address',
                          name: 'token',
                          type: 'address',
                        },
                        {
                          internalType: 'uint256',
                          name: 'identifierOrCriteria',
                          type: 'uint256',
                        },
                        {
                          internalType: 'uint256',
                          name: 'startAmount',
                          type: 'uint256',
                        },
                        {
                          internalType: 'uint256',
                          name: 'endAmount',
                          type: 'uint256',
                        },
                        {
                          internalType: 'address payable',
                          name: 'recipient',
                          type: 'address',
                        },
                      ],
                      internalType: 'struct ConsiderationItem[]',
                      name: 'consideration',
                      type: 'tuple[]',
                    },
                    {
                      internalType: 'uint256',
                      name: 'totalOriginalConsiderationItems',
                      type: 'uint256',
                    },
                  ],
                  internalType: 'struct OrderParameters',
                  name: 'parameters',
                  type: 'tuple',
                },
                { internalType: 'uint120', name: 'numerator', type: 'uint120' },
                {
                  internalType: 'uint120',
                  name: 'denominator',
                  type: 'uint120',
                },
                { internalType: 'bytes', name: 'signature', type: 'bytes' },
                { internalType: 'bytes', name: 'extraData', type: 'bytes' },
              ],
              internalType: 'struct AdvancedOrder',
              name: 'advancedOrder',
              type: 'tuple',
            },
            {
              components: [
                {
                  internalType: 'uint256',
                  name: 'orderIndex',
                  type: 'uint256',
                },
                { internalType: 'enum Side', name: 'side', type: 'uint8' },
                { internalType: 'uint256', name: 'index', type: 'uint256' },
                {
                  internalType: 'uint256',
                  name: 'identifier',
                  type: 'uint256',
                },
                {
                  internalType: 'bytes32[]',
                  name: 'criteriaProof',
                  type: 'bytes32[]',
                },
              ],
              internalType: 'struct CriteriaResolver[]',
              name: 'criteriaResolvers',
              type: 'tuple[]',
            },
          ],
          name: 'deeplyNestedStructs',
          outputs: [
            { internalType: 'bool[]', name: 'availableOrders', type: 'bool[]' },
          ],
          stateMutability: 'view',
          type: 'function',
        },
      ]);

      expect(ethersBuildEventInterfacePropertiesSpy).toHaveBeenCalledTimes(0);
    });

    it('should call _web3Factory.buildMethodReturnContext 11 times', () => {
      const abiGenertorOptionsClone = Helpers.deepClone(abiGenertorOptions);
      abiGenertorOptionsClone.callGenerate = false;

      const instance = callSuccessAbiGeneratorInstance(abiGenertorOptionsClone);

      const web3BuildMethodReturnContextSpy = spyOn(
        // @ts-ignore
        instance._web3Factory,
        'buildMethodReturnContext'
      ).and.callThrough();

      const ethersBuildMethodReturnContextSpy = spyOn(
        // @ts-ignore
        instance._ethersFactory,
        'buildMethodReturnContext'
      ).and.callThrough();

      instance.generate();

      expect(web3BuildMethodReturnContextSpy).toHaveBeenCalledTimes(11);
      expect(ethersBuildMethodReturnContextSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Ethers v4 or below', () => {
    it('round trip', () => {
      const generatorContextClone = Helpers.deepClone(generatorContext);
      generatorContextClone.provider = Provider.ethers;

      callSuccessAbiGeneratorInstance(
        abiGenertorOptions,
        generatorContextClone
      );

      expect(writeFileSyncSpy.calls.mostRecent().args[0]).not.toBeUndefined();
      expect(writeFileSyncSpy.calls.mostRecent().args[1]).toMatchSnapshot();
      expect(writeFileSyncSpy.calls.mostRecent().args[2]).toEqual({
        mode: 493,
      });
    });

    it('should call _ethersFactory.buildEthersInterfaces once', () => {
      const abiGenertorOptionsClone = Helpers.deepClone(abiGenertorOptions);
      abiGenertorOptionsClone.callGenerate = false;

      const generatorContextClone = Helpers.deepClone(generatorContext);
      generatorContextClone.provider = Provider.ethers;

      const instance = callSuccessAbiGeneratorInstance(
        abiGenertorOptionsClone,
        generatorContextClone
      );

      const buildEthersInterfacesSpy = spyOn(
        // @ts-ignore
        instance._ethersFactory,
        'buildEthersInterfaces'
      ).and.callThrough();

      const buildWeb3InterfacesSpy = spyOn(
        // @ts-ignore
        instance._web3Factory,
        'buildWeb3Interfaces'
      ).and.callThrough();

      instance.generate();

      expect(buildEthersInterfacesSpy).toHaveBeenCalledTimes(1);
      expect(buildEthersInterfacesSpy).toHaveBeenCalledWith(
        'Abi',
        EthersVersion.four_or_below
      );

      expect(buildWeb3InterfacesSpy).toHaveBeenCalledTimes(0);
    });

    it('should call _ethersFactory.buildEventInterfaceProperties once', () => {
      const abiGenertorOptionsClone = Helpers.deepClone(abiGenertorOptions);
      abiGenertorOptionsClone.callGenerate = false;

      const generatorContextClone = Helpers.deepClone(generatorContext);
      generatorContextClone.provider = Provider.ethers;

      const instance = callSuccessAbiGeneratorInstance(
        abiGenertorOptionsClone,
        generatorContextClone
      );

      const ethersBuildEventInterfacePropertiesSpy = spyOn(
        // @ts-ignore
        instance._ethersFactory,
        'buildEventInterfaceProperties'
      ).and.callThrough();

      const web3BuildEventInterfacePropertiesSpy = spyOn(
        // @ts-ignore
        instance._web3Factory,
        'buildEventInterfaceProperties'
      ).and.callThrough();

      instance.generate();

      expect(ethersBuildEventInterfacePropertiesSpy).toHaveBeenCalledTimes(1);
      expect(ethersBuildEventInterfacePropertiesSpy).toHaveBeenCalledWith([
        {
          anonymous: false,
          inputs: [
            { indexed: true, name: 'token', type: 'address' },
            { indexed: true, name: 'exchange', type: 'address' },
            { indexed: false, name: 'user', type: 'address' },
            { indexed: true, name: '_value', type: 'uint256' },
          ],
          name: 'Event1',
          type: 'event',
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, name: '_owner', type: 'address' },
            { indexed: true, name: '_spender', type: 'address' },
            { indexed: false, name: '_value', type: 'uint256' },
          ],
          name: 'Event2',
          type: 'event',
        },
        {
          constant: false,
          inputs: [
            {
              components: [
                { name: 'address', type: 'address' },
                { name: 'timestamps', type: 'uint8[2]' },
              ],
              name: 'o',
              type: 'tuple',
            },
          ],
          name: 'tupleInputOnly',
          outputs: [],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: true,
          inputs: [
            { name: 'exchangeAddress', type: 'address' },
            { name: 'internalAddress', type: 'address' },
          ],
          name: 'tupleInputAndOutput',
          outputs: [
            { name: 'affiliate', type: 'address' },
            { name: 'offerID', type: 'bytes32' },
            { name: 'creationTime', type: 'uint256' },
            { name: 'timestamp', type: 'uint8' },
            { name: 'timestamps', type: 'uint8[5]' },
          ],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: true,
          inputs: [
            { name: '', type: 'address' },
            { name: '', type: 'address' },
          ],
          name: 'tupleNoInputNames',
          outputs: [
            { name: 'affiliate', type: 'address' },
            { name: 'offerID', type: 'bytes32' },
            { name: 'creationTime', type: 'uint256' },
            { name: 'timestamp', type: 'uint8' },
            { name: 'timestamps', type: 'uint8[5]' },
          ],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: true,
          inputs: [
            { name: 'address1', type: 'address' },
            { name: 'address2', type: 'address' },
          ],
          name: 'tupleWithParametersNames',
          outputs: [
            { name: 'affiliate', type: 'address' },
            { name: 'offerID', type: 'bytes32' },
            { name: 'creationTime', type: 'uint256' },
            { name: 'timestamp', type: 'uint8' },
            { name: 'timestamps', type: 'uint8[5]' },
          ],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: false,
          inputs: [{ name: 'inputData', type: 'bytes32[2]' }],
          name: 'byteArrayInputExample',
          outputs: [],
          payable: true,
          stateMutability: 'payable',
          type: 'function',
        },
        {
          constant: true,
          gas: 783,
          inputs: [],
          name: 'int8ReturnExample',
          outputs: [{ name: 'out', type: 'uint8' }],
          payable: false,
          type: 'function',
        },
        {
          constant: true,
          gas: 783,
          inputs: [],
          name: 'int256ReturnExample',
          outputs: [{ name: 'out', type: 'uint256' }],
          payable: false,
          type: 'function',
        },
        {
          constant: true,
          gas: 783,
          inputs: [
            { name: 'valid', type: 'boolean' },
            { name: 'exchangeAddress', type: 'address' },
            { name: 'timestamp', type: 'uint8' },
          ],
          name: 'easyExample',
          outputs: [{ name: 'out', type: 'uint256' }],
          payable: false,
          type: 'function',
        },
        {
          name: '__init__',
          outputs: [],
          inputs: [
            { type: 'bytes32', name: '_name' },
            { type: 'bytes32', name: '_symbol' },
            { type: 'uint256', name: '_decimals' },
            { type: 'uint256', name: '_supply' },
          ],
          constant: false,
          payable: false,
          type: 'constructor',
        },
        {
          inputs: [
            {
              internalType: 'address',
              name: 'owner',
              type: 'address',
            },
          ],
          name: 'getCars',
          outputs: [
            {
              components: [
                {
                  internalType: 'uint256',
                  name: 'tokenId',
                  type: 'uint256',
                },
                {
                  internalType: 'uint256[3]',
                  name: 'attachedComponents',
                  type: 'uint256[3]',
                },
                {
                  internalType: 'uint256[10]',
                  name: 'detachedComponents',
                  type: 'uint256[10]',
                },
                {
                  internalType: 'address',
                  name: 'owner',
                  type: 'address',
                },
                {
                  internalType: 'uint256',
                  name: 'detachedComponentsCount',
                  type: 'uint256',
                },
              ],
              internalType: 'struct Car.CarInstance[]',
              name: 'ownedCars',
              type: 'tuple[]',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [
            {
              components: [
                {
                  components: [
                    {
                      internalType: 'address',
                      name: 'offerer',
                      type: 'address',
                    },
                    {
                      components: [
                        {
                          internalType: 'enum ItemType',
                          name: 'itemType',
                          type: 'uint8',
                        },
                        {
                          internalType: 'uint256',
                          name: 'endAmount',
                          type: 'uint256',
                        },
                      ],
                      internalType: 'struct OfferItem[]',
                      name: 'offer',
                      type: 'tuple[]',
                    },
                    {
                      components: [
                        {
                          internalType: 'enum ItemType',
                          name: 'itemType',
                          type: 'uint8',
                        },
                        {
                          internalType: 'address',
                          name: 'token',
                          type: 'address',
                        },
                        {
                          internalType: 'uint256',
                          name: 'identifierOrCriteria',
                          type: 'uint256',
                        },
                        {
                          internalType: 'uint256',
                          name: 'startAmount',
                          type: 'uint256',
                        },
                        {
                          internalType: 'uint256',
                          name: 'endAmount',
                          type: 'uint256',
                        },
                        {
                          internalType: 'address payable',
                          name: 'recipient',
                          type: 'address',
                        },
                      ],
                      internalType: 'struct ConsiderationItem[]',
                      name: 'consideration',
                      type: 'tuple[]',
                    },
                    {
                      internalType: 'uint256',
                      name: 'totalOriginalConsiderationItems',
                      type: 'uint256',
                    },
                  ],
                  internalType: 'struct OrderParameters',
                  name: 'parameters',
                  type: 'tuple',
                },
                { internalType: 'uint120', name: 'numerator', type: 'uint120' },
                {
                  internalType: 'uint120',
                  name: 'denominator',
                  type: 'uint120',
                },
                { internalType: 'bytes', name: 'signature', type: 'bytes' },
                { internalType: 'bytes', name: 'extraData', type: 'bytes' },
              ],
              internalType: 'struct AdvancedOrder',
              name: 'advancedOrder',
              type: 'tuple',
            },
            {
              components: [
                {
                  internalType: 'uint256',
                  name: 'orderIndex',
                  type: 'uint256',
                },
                { internalType: 'enum Side', name: 'side', type: 'uint8' },
                { internalType: 'uint256', name: 'index', type: 'uint256' },
                {
                  internalType: 'uint256',
                  name: 'identifier',
                  type: 'uint256',
                },
                {
                  internalType: 'bytes32[]',
                  name: 'criteriaProof',
                  type: 'bytes32[]',
                },
              ],
              internalType: 'struct CriteriaResolver[]',
              name: 'criteriaResolvers',
              type: 'tuple[]',
            },
          ],
          name: 'deeplyNestedStructs',
          outputs: [
            { internalType: 'bool[]', name: 'availableOrders', type: 'bool[]' },
          ],
          stateMutability: 'view',
          type: 'function',
        },
      ]);

      expect(web3BuildEventInterfacePropertiesSpy).toHaveBeenCalledTimes(0);
    });

    it('should call _ethersFactory.buildMethodReturnContext 11 times', () => {
      const abiGenertorOptionsClone = Helpers.deepClone(abiGenertorOptions);
      abiGenertorOptionsClone.callGenerate = false;

      const generatorContextClone = Helpers.deepClone(generatorContext);
      generatorContextClone.provider = Provider.ethers;

      const instance = callSuccessAbiGeneratorInstance(
        abiGenertorOptionsClone,
        generatorContextClone
      );

      const ethersBuildMethodReturnContextSpy = spyOn(
        // @ts-ignore
        instance._ethersFactory,
        'buildMethodReturnContext'
      ).and.callThrough();

      const web3BuildMethodReturnContextSpy = spyOn(
        // @ts-ignore
        instance._web3Factory,
        'buildMethodReturnContext'
      ).and.callThrough();

      instance.generate();

      expect(ethersBuildMethodReturnContextSpy).toHaveBeenCalledTimes(11);
      expect(web3BuildMethodReturnContextSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Ethers v5', () => {
    it('round trip', () => {
      const generatorContextClone = Helpers.deepClone(generatorContext);
      generatorContextClone.provider = Provider.ethers_v5;

      callSuccessAbiGeneratorInstance(
        abiGenertorOptions,
        generatorContextClone
      );

      expect(writeFileSyncSpy.calls.mostRecent().args[0]).not.toBeUndefined();
      expect(writeFileSyncSpy.calls.mostRecent().args[1]).toMatchSnapshot();
      expect(writeFileSyncSpy.calls.mostRecent().args[2]).toEqual({
        mode: 493,
      });
    });

    it('should call _ethersFactory.buildEthersInterfaces once', () => {
      const abiGenertorOptionsClone = Helpers.deepClone(abiGenertorOptions);
      abiGenertorOptionsClone.callGenerate = false;

      const generatorContextClone = Helpers.deepClone(generatorContext);
      generatorContextClone.provider = Provider.ethers_v5;

      const instance = callSuccessAbiGeneratorInstance(
        abiGenertorOptionsClone,
        generatorContextClone
      );

      const buildEthersInterfacesSpy = spyOn(
        // @ts-ignore
        instance._ethersFactory,
        'buildEthersInterfaces'
      ).and.callThrough();

      const buildWeb3InterfacesSpy = spyOn(
        // @ts-ignore
        instance._web3Factory,
        'buildWeb3Interfaces'
      ).and.callThrough();

      instance.generate();

      expect(buildEthersInterfacesSpy).toHaveBeenCalledTimes(1);
      expect(buildEthersInterfacesSpy).toHaveBeenCalledWith(
        'Abi',
        EthersVersion.five
      );

      expect(buildWeb3InterfacesSpy).toHaveBeenCalledTimes(0);
    });

    it('should call _ethersFactory.buildEventInterfaceProperties once', () => {
      const abiGenertorOptionsClone = Helpers.deepClone(abiGenertorOptions);
      abiGenertorOptionsClone.callGenerate = false;

      const generatorContextClone = Helpers.deepClone(generatorContext);
      generatorContextClone.provider = Provider.ethers_v5;

      const instance = callSuccessAbiGeneratorInstance(
        abiGenertorOptionsClone,
        generatorContextClone
      );

      const ethersBuildEventInterfacePropertiesSpy = spyOn(
        // @ts-ignore
        instance._ethersFactory,
        'buildEventInterfaceProperties'
      ).and.callThrough();

      const web3BuildEventInterfacePropertiesSpy = spyOn(
        // @ts-ignore
        instance._web3Factory,
        'buildEventInterfaceProperties'
      ).and.callThrough();

      instance.generate();

      expect(ethersBuildEventInterfacePropertiesSpy).toHaveBeenCalledTimes(1);
      expect(ethersBuildEventInterfacePropertiesSpy).toHaveBeenCalledWith([
        {
          anonymous: false,
          inputs: [
            { indexed: true, name: 'token', type: 'address' },
            { indexed: true, name: 'exchange', type: 'address' },
            { indexed: false, name: 'user', type: 'address' },
            { indexed: true, name: '_value', type: 'uint256' },
          ],
          name: 'Event1',
          type: 'event',
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, name: '_owner', type: 'address' },
            { indexed: true, name: '_spender', type: 'address' },
            { indexed: false, name: '_value', type: 'uint256' },
          ],
          name: 'Event2',
          type: 'event',
        },
        {
          constant: false,
          inputs: [
            {
              components: [
                { name: 'address', type: 'address' },
                { name: 'timestamps', type: 'uint8[2]' },
              ],
              name: 'o',
              type: 'tuple',
            },
          ],
          name: 'tupleInputOnly',
          outputs: [],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: true,
          inputs: [
            { name: 'exchangeAddress', type: 'address' },
            { name: 'internalAddress', type: 'address' },
          ],
          name: 'tupleInputAndOutput',
          outputs: [
            { name: 'affiliate', type: 'address' },
            { name: 'offerID', type: 'bytes32' },
            { name: 'creationTime', type: 'uint256' },
            { name: 'timestamp', type: 'uint8' },
            { name: 'timestamps', type: 'uint8[5]' },
          ],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: true,
          inputs: [
            { name: '', type: 'address' },
            { name: '', type: 'address' },
          ],
          name: 'tupleNoInputNames',
          outputs: [
            { name: 'affiliate', type: 'address' },
            { name: 'offerID', type: 'bytes32' },
            { name: 'creationTime', type: 'uint256' },
            { name: 'timestamp', type: 'uint8' },
            { name: 'timestamps', type: 'uint8[5]' },
          ],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: true,
          inputs: [
            { name: 'address1', type: 'address' },
            { name: 'address2', type: 'address' },
          ],
          name: 'tupleWithParametersNames',
          outputs: [
            { name: 'affiliate', type: 'address' },
            { name: 'offerID', type: 'bytes32' },
            { name: 'creationTime', type: 'uint256' },
            { name: 'timestamp', type: 'uint8' },
            { name: 'timestamps', type: 'uint8[5]' },
          ],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: false,
          inputs: [{ name: 'inputData', type: 'bytes32[2]' }],
          name: 'byteArrayInputExample',
          outputs: [],
          payable: true,
          stateMutability: 'payable',
          type: 'function',
        },
        {
          constant: true,
          gas: 783,
          inputs: [],
          name: 'int8ReturnExample',
          outputs: [{ name: 'out', type: 'uint8' }],
          payable: false,
          type: 'function',
        },
        {
          constant: true,
          gas: 783,
          inputs: [],
          name: 'int256ReturnExample',
          outputs: [{ name: 'out', type: 'uint256' }],
          payable: false,
          type: 'function',
        },
        {
          constant: true,
          gas: 783,
          inputs: [
            { name: 'valid', type: 'boolean' },
            { name: 'exchangeAddress', type: 'address' },
            { name: 'timestamp', type: 'uint8' },
          ],
          name: 'easyExample',
          outputs: [{ name: 'out', type: 'uint256' }],
          payable: false,
          type: 'function',
        },
        {
          name: '__init__',
          outputs: [],
          inputs: [
            { type: 'bytes32', name: '_name' },
            { type: 'bytes32', name: '_symbol' },
            { type: 'uint256', name: '_decimals' },
            { type: 'uint256', name: '_supply' },
          ],
          constant: false,
          payable: false,
          type: 'constructor',
        },
        {
          inputs: [
            {
              internalType: 'address',
              name: 'owner',
              type: 'address',
            },
          ],
          name: 'getCars',
          outputs: [
            {
              components: [
                {
                  internalType: 'uint256',
                  name: 'tokenId',
                  type: 'uint256',
                },
                {
                  internalType: 'uint256[3]',
                  name: 'attachedComponents',
                  type: 'uint256[3]',
                },
                {
                  internalType: 'uint256[10]',
                  name: 'detachedComponents',
                  type: 'uint256[10]',
                },
                {
                  internalType: 'address',
                  name: 'owner',
                  type: 'address',
                },
                {
                  internalType: 'uint256',
                  name: 'detachedComponentsCount',
                  type: 'uint256',
                },
              ],
              internalType: 'struct Car.CarInstance[]',
              name: 'ownedCars',
              type: 'tuple[]',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [
            {
              components: [
                {
                  components: [
                    {
                      internalType: 'address',
                      name: 'offerer',
                      type: 'address',
                    },
                    {
                      components: [
                        {
                          internalType: 'enum ItemType',
                          name: 'itemType',
                          type: 'uint8',
                        },
                        {
                          internalType: 'uint256',
                          name: 'endAmount',
                          type: 'uint256',
                        },
                      ],
                      internalType: 'struct OfferItem[]',
                      name: 'offer',
                      type: 'tuple[]',
                    },
                    {
                      components: [
                        {
                          internalType: 'enum ItemType',
                          name: 'itemType',
                          type: 'uint8',
                        },
                        {
                          internalType: 'address',
                          name: 'token',
                          type: 'address',
                        },
                        {
                          internalType: 'uint256',
                          name: 'identifierOrCriteria',
                          type: 'uint256',
                        },
                        {
                          internalType: 'uint256',
                          name: 'startAmount',
                          type: 'uint256',
                        },
                        {
                          internalType: 'uint256',
                          name: 'endAmount',
                          type: 'uint256',
                        },
                        {
                          internalType: 'address payable',
                          name: 'recipient',
                          type: 'address',
                        },
                      ],
                      internalType: 'struct ConsiderationItem[]',
                      name: 'consideration',
                      type: 'tuple[]',
                    },
                    {
                      internalType: 'uint256',
                      name: 'totalOriginalConsiderationItems',
                      type: 'uint256',
                    },
                  ],
                  internalType: 'struct OrderParameters',
                  name: 'parameters',
                  type: 'tuple',
                },
                { internalType: 'uint120', name: 'numerator', type: 'uint120' },
                {
                  internalType: 'uint120',
                  name: 'denominator',
                  type: 'uint120',
                },
                { internalType: 'bytes', name: 'signature', type: 'bytes' },
                { internalType: 'bytes', name: 'extraData', type: 'bytes' },
              ],
              internalType: 'struct AdvancedOrder',
              name: 'advancedOrder',
              type: 'tuple',
            },
            {
              components: [
                {
                  internalType: 'uint256',
                  name: 'orderIndex',
                  type: 'uint256',
                },
                { internalType: 'enum Side', name: 'side', type: 'uint8' },
                { internalType: 'uint256', name: 'index', type: 'uint256' },
                {
                  internalType: 'uint256',
                  name: 'identifier',
                  type: 'uint256',
                },
                {
                  internalType: 'bytes32[]',
                  name: 'criteriaProof',
                  type: 'bytes32[]',
                },
              ],
              internalType: 'struct CriteriaResolver[]',
              name: 'criteriaResolvers',
              type: 'tuple[]',
            },
          ],
          name: 'deeplyNestedStructs',
          outputs: [
            { internalType: 'bool[]', name: 'availableOrders', type: 'bool[]' },
          ],
          stateMutability: 'view',
          type: 'function',
        },
      ]);

      expect(web3BuildEventInterfacePropertiesSpy).toHaveBeenCalledTimes(0);
    });

    it('should call _ethersFactory.buildMethodReturnContext 11 times', () => {
      const abiGenertorOptionsClone = Helpers.deepClone(abiGenertorOptions);
      abiGenertorOptionsClone.callGenerate = false;

      const generatorContextClone = Helpers.deepClone(generatorContext);
      generatorContextClone.provider = Provider.ethers_v5;

      const instance = callSuccessAbiGeneratorInstance(
        abiGenertorOptionsClone,
        generatorContextClone
      );

      const ethersBuildMethodReturnContextSpy = spyOn(
        // @ts-ignore
        instance._ethersFactory,
        'buildMethodReturnContext'
      ).and.callThrough();

      const web3BuildMethodReturnContextSpy = spyOn(
        // @ts-ignore
        instance._web3Factory,
        'buildMethodReturnContext'
      ).and.callThrough();

      instance.generate();

      expect(ethersBuildMethodReturnContextSpy).toHaveBeenCalledTimes(11);
      expect(web3BuildMethodReturnContextSpy).toHaveBeenCalledTimes(0);
    });
  });
});
