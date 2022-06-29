import {
  BlockTag,
  Listener,
  Provider,
  TransactionReceipt,
  TransactionRequest,
  TransactionResponse,
} from '@ethersproject/abstract-provider';
import {
  BigNumber,
  BigNumberish,
  EventFilter,
  PopulatedTransaction,
  Signer,
  Transaction,
} from 'ethersv5';
import {
  AbiCoder,
  BytesLike as Arrayish,
  EventFragment,
  Fragment,
  FunctionFragment,
  Interface,
  LogDescription,
  ParamType,
  Result,
  TransactionDescription,
} from 'ethersv5/lib/utils';

export type EthersContractContextV5<
  TMethods extends {
    [key in TMethodNames]: (...args: any[]) => any;
  },
  TMethodNames extends string,
  TEventsContext,
  TEventType
> = EthersContractV5<TMethods, TMethodNames, TEventsContext, TEventType> &
  TMethods;

// tslint:disable-next-line: no-any
type ContractFunction<T = any> = (
  // tslint:disable-next-line: no-any
  ...args: any[]
) => Promise<T>;

declare class InternalInterface<TMethodNames> {
  readonly fragments: Fragment[];
  readonly errors: {
    // tslint:disable-next-line: no-any
    [name: string]: any;
  };
  readonly events: {
    [name: string]: EventFragment;
  };
  readonly functions: {
    [name: string]: FunctionFragment;
  };
  readonly structs: {
    // tslint:disable-next-line: no-any
    [name: string]: any;
  };
  // tslint:disable-next-line: no-any
  readonly deploy: any;
  format(format?: string): string | string[];
  static getAbiCoder(): AbiCoder;
  static getAddress(address: string): string;
  static getSighash(functionFragment: FunctionFragment): string;
  static getEventTopic(eventFragment: EventFragment): string;
  getFunction(nameOrSignatureOrSighash: string): FunctionFragment;
  getEvent(nameOrSignatureOrTopic: string): EventFragment;
  getSighash(functionFragment: FunctionFragment | string): string;
  getEventTopic(eventFragment: EventFragment | string): string;
  _decodeParams(params: ParamType[], data: Arrayish): Result;
  // tslint:disable-next-line: no-any
  _encodeParams(params: ParamType[], values: any[]): string;
  // tslint:disable-next-line: no-any
  encodeDeploy(values?: any[]): string;
  decodeFunctionData(functionFragment: TMethodNames, data: Arrayish): Result;
  encodeFunctionData(
    functionFragment: FunctionFragment | TMethodNames,
    // tslint:disable-next-line: no-any
    values?: any[]
  ): string;
  decodeFunctionResult(
    functionFragment: FunctionFragment | TMethodNames,
    data: Arrayish
  ): Result;
  encodeFunctionResult(
    functionFragment: FunctionFragment | TMethodNames,
    // tslint:disable-next-line: no-any
    values?: any[]
  ): string;
  encodeFilterTopics(
    eventFragment: EventFragment,
    // tslint:disable-next-line: no-any
    values: any[]
    // tslint:disable-next-line: array-type
  ): Array<string | Array<string>>;
  encodeEventLog(
    eventFragment: EventFragment,
    // tslint:disable-next-line: no-any
    values: any[]
  ): {
    data: string;
    topics: string[];
  };
  decodeEventLog(
    eventFragment: EventFragment | string,
    data: Arrayish,
    topics?: string[]
  ): Result;
  parseTransaction(tx: {
    data: string;
    value?: BigNumberish;
  }): TransactionDescription;
  parseLog(log: { topics: string[]; data: string }): LogDescription;
  // tslint:disable-next-line: no-any
  static isInterface(value: any): value is Interface;
}

type ReplaceReturnType<T extends (...a: any) => any, TNewReturn> = (
  ...a: Parameters<T>
) => TNewReturn;

interface ContractVersionV5<
  TMethods extends {
    [key in TMethodNames]: (...args: any[]) => any;
  },
  TMethodNames extends string
> {
  readonly address: string;
  readonly interface: InternalInterface<TMethodNames>;
  readonly signer: Signer;
  readonly provider: Provider;
  readonly callStatic: {
    // tslint:disable-next-line: no-any
    [name in TMethodNames]: ContractFunction;
  };
  readonly estimateGas: {
    [name in keyof TMethods]: ReplaceReturnType<
      TMethods[name],
      Promise<BigNumber>
    >;
  };
  readonly populateTransaction: {
    [name in keyof TMethods]: ReplaceReturnType<
      TMethods[name],
      Promise<PopulatedTransaction>
    >;
  };
  readonly addressPromise: Promise<string>;
  readonly deployTransaction: TransactionResponse;
  fallback(overrides?: TransactionRequest): Promise<TransactionResponse>;
  // static isIndexed(value: any): value is Indexed;
  // tslint:disable-next-line: no-any
  emit(eventName: EventFilter | string, ...args: any[]): boolean;
  listenerCount(eventName?: EventFilter | string): number;
  listeners(eventName: EventFilter | string): Listener[];
}

interface EthersContractV5<
  TMethods extends {
    [key in TMethodNames]: (...args: any[]) => any;
  },
  TMethodNames extends string,
  TEventsContext,
  TEventType
> extends ContractVersionV5<TMethods, TMethodNames> {
  // readonly estimate: TMethods => Promise<BigNumber>;
  readonly functions: TMethods;
  readonly filters: TEventsContext;
  deployed(): Promise<
    EthersContractContextV5<TMethods, TMethodNames, TEventsContext, TEventType>
  >;
  _deployed(
    blockTag?: BlockTag
  ): Promise<
    EthersContractContextV5<TMethods, TMethodNames, TEventsContext, TEventType>
  >;

  /**
   * Type any here so if you are using a different version of ethers then
   * installed it will still compile
   * @param signerOrProvider should be type of Wallet | Signer | Provider | string
   */
  connect(
    // tslint:disable-next-line: no-any
    signerOrProvider: any
  ): EthersContractContextV5<
    TMethods,
    TMethodNames,
    TEventsContext,
    TEventType
  >;
  attach(
    addressOrName: string
  ): EthersContractContextV5<
    TMethods,
    TMethodNames,
    TEventsContext,
    TEventType
  >;
  // need to overwrite the event filters for strongly typed events
  on(
    event: EventFilter | TEventType,
    listener: Listener
  ): EthersContractContextV5<
    TMethods,
    TMethodNames,
    TEventsContext,
    TEventType
  >;
  once(
    event: EventFilter | TEventType,
    listener: Listener
  ): EthersContractContextV5<
    TMethods,
    TMethodNames,
    TEventsContext,
    TEventType
  >;
  addListener(
    eventName: EventFilter | TEventType,
    listener: Listener
  ): EthersContractContextV5<
    TMethods,
    TMethodNames,
    TEventsContext,
    TEventType
  >;
  removeAllListeners(
    eventName: EventFilter | TEventType
  ): EthersContractContextV5<
    TMethods,
    TMethodNames,
    TEventsContext,
    TEventType
  >;
  removeListener(
    eventName: TEventType,
    listener: Listener
  ): EthersContractContextV5<
    TMethods,
    TMethodNames,
    TEventsContext,
    TEventType
  >;
}

export interface TransactionExceptionError extends Error {
  code: 'CALL_EXCEPTION';
  transaction: Transaction;
  transactionHash: string;
  receipt: TransactionReceipt;
}
export interface TransactionReplacedError extends Error {
  code: 'TRANSACTION_REPLACED';
  hash: string;
  reason: 'repriced' | 'cancelled' | 'replaced';
  cancelled: boolean;
  replacement: TransactionResponse;
  receipt: TransactionReceipt;
}

export type TransactionResponseError =
  | TransactionExceptionError
  | TransactionReplacedError;
