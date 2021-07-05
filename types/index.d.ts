import { RequestHandler, Response, Request, NextFunction, Application } from 'express';
import * as Sequelize from 'sequelize';

// Everything related to Forest initialization

export interface LianaOptions {
  objectMapping: typeof Sequelize;
  envSecret: string;
  authSecret: string;
  connections: Record<string, Sequelize.Sequelize>;
  includedModels?: string[];
  excludedModels?: string[];
  configDir?: string;
}

export function init(options: LianaOptions): Promise<Application>;

export interface DatabaseConfiguration {
  name: string,
  modelsDir: string,
  connection: {
    url: string,
    options: Sequelize.Options,
  }
}

// Everything related to Forest Authentication

export function ensureAuthenticated(request: Request, response: Response, next: NextFunction): void;

// Everything related to Forest constants

export const PUBLIC_ROUTES: string[];

// Everything related to record manipulation

interface RecordsSerialized {
  data: Record<string, unknown>[],
  included: Record<string, unknown>[],
}

export class AbstractRecordTool<M extends Sequelize.Model> {
  constructor(model: Sequelize.ModelCtor<M>)
  serialize(records: M | M[]): Promise<RecordsSerialized>;
}

export class RecordGetter<M extends Sequelize.Model> extends AbstractRecordTool<M> {
  get(recordId: string): Promise<M>;
}

export class RecordsGetter<M extends Sequelize.Model> extends AbstractRecordTool<M> {
  getAll(query: Query): Promise<M[]>;
  getIdsFromRequest(request: Request): Promise<string[]>;
}

export class RecordsCounter<M extends Sequelize.Model> extends AbstractRecordTool<M> {
  count(query: Query): Promise<number>;
}

export class RecordsExporter<M extends Sequelize.Model> extends AbstractRecordTool<M> {
  streamExport(response: Response, query: Query): Promise<void>;
}

export class RecordUpdater<M extends Sequelize.Model> extends AbstractRecordTool<M> {
  deserialize(body: Record<string, unknown>): Promise<Record<string, unknown>>;
  update(record: Record<string, unknown>, recordId: string): Promise<M>;
}

export class RecordCreator<M extends Sequelize.Model> extends AbstractRecordTool<M> {
  deserialize(body: Record<string, unknown>): Promise<Record<string, unknown>>;
  create(record: Record<string, unknown>): Promise<M>;
}

export class RecordRemover<M extends Sequelize.Model> extends AbstractRecordTool<M> {
  remove(recordId: string | number): Promise<void>;
}

export class RecordsRemover<M extends Sequelize.Model> extends AbstractRecordTool<M> {
  remove(recordIds: string[] | number[]): Promise<void>;
}

// Everything related to Forest permissions

export class PermissionMiddlewareCreator {
  constructor(collectionName: string)
  list(): RequestHandler;
  export(): RequestHandler;
  details(): RequestHandler;
  create(): RequestHandler;
  update(): RequestHandler;
  delete(): RequestHandler;
  smartAction(): RequestHandler;
}

// Everything related to Forest Charts

export interface StatSerialized {
  data: {
    type: string,
    id: string,
    attributes: {
      value: any[]
    }
  };
}

export class StatSerializer {
  constructor(stats: { value: any[] })
  perform(): StatSerialized;
}

// Everything related to Forest request params

export interface Page {
  number: number;
  size: number;
}

export interface Filter {
  field: string;
  operator: string;
  value: string;
}

export enum Aggregator {
  AND = 'and',
  OR = 'or'
}

export interface AggregatedFilters {
  aggregator: Aggregator;
  conditions: Filter[];
}

export interface Query {
  timezone?: string;
  search?: string;
  fields?: {[key: string]: string};
  sort?: string;
  filters?: Filter|AggregatedFilters;
  page?: Page;
  searchExtended?: string;
}

// Everything related to Forest collection configuration

export interface SmartFieldValueGetter<M extends Sequelize.Model = any> {
  (record: M): any;
}

export interface SmartFieldValueSetter<M extends Sequelize.Model = any> {
  (record: M, fieldValue: any): any;
}

export interface SmartFieldSearchQuery {
  include: string[],
  where: Sequelize.WhereOptions,
}

export interface SmartFieldSearcher {
  (query: SmartFieldSearchQuery, search: string): SmartFieldSearchQuery;
}

export interface SmartFieldFiltererFilter {
  condition: Filter,
  where: Record<symbol, Record<symbol, any> | any>,
}

export interface SmartFieldFilterer {
  (filter: SmartFieldFiltererFilter): Sequelize.WhereOptions;
}

export interface SegmentAggregationCreator<M extends Sequelize.Model = any> {
  (model: M): Sequelize.WhereOptions;
}

type FieldType = 'Boolean' | 'Date' | 'Dateonly' | 'Enum' | 'File' | 'Number' | 'String' | ['Enum'] | ['Number'] | ['String'];

type FieldEnumsType = string[] | number[] | Date[] | boolean[];

export interface SmartFieldOptions {
  field: string;
  description?: string;
  type: FieldType;
  isFilterable?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  reference?: string;
  enums?: FieldEnumsType;
  defaultValue?: any;
  get?: SmartFieldValueGetter;
  set?: SmartFieldValueSetter;
  search?: SmartFieldSearcher;
  filter?: SmartFieldFilterer;
}

export interface SmartActionField {
  field: string,
  description?: string,
  type: FieldType,
  isRequired?: boolean,
  isReadOnly?: boolean,
  enums?: FieldEnumsType,
  defaultValue?: any,
  reference?: string,
}

export interface SmartActionHookField extends SmartActionField {
  value: any,
}

export interface SmartActionLoadHookField extends SmartActionHookField {
  position: number,
}

export interface SmartActionLoadHook<M extends Sequelize.Model = any> {
  (context: { fields: Record<string, SmartActionLoadHookField>, record: M }): Record<string, SmartActionLoadHookField>
}

export interface SmartActionChangeHookField extends SmartActionHookField {
  previousValue: any,
}

export interface SmartActionChangeHook<M extends Sequelize.Model = any> {
  (context: { fields: Record<string, SmartActionChangeHookField>, record: M }): Record<string, SmartActionChangeHookField>
}

export interface SmartActionHooks {
  load: SmartActionLoadHook;
  change: Record<string, SmartActionChangeHook>;
}

export interface SmartActionOptions {
  name: string;
  type?: 'global' | 'bulk' | 'single';
  fields?: SmartActionField[];
  download?: boolean;
  endpoint?: string;
  httpMethod?: string;
  hooks?: SmartActionHooks;
}

export interface SmartSegmentOptions {
  name: string;
  where: SegmentAggregationCreator;
}

export interface CollectionOptions {
  fields?: SmartFieldOptions[];
  actions?: SmartActionOptions[];
  segments?: SmartSegmentOptions[];
}

export function collection(name: string, options: CollectionOptions): void;

export function errorHandler(): RequestHandler;
