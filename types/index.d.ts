import { Application, NextFunction, Request, RequestHandler, Response } from 'express';
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
  schemaDir?: string;
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

export interface User {
  renderingId: number;
}

export interface ForestRequest extends Request {
  user: User,
}

// Base attributes for actions requests (content of request.data.body.attributes)
interface ActionRequestAttributes {
  collection_name: string,
  ids: string[],
  parent_collection_name: string,
  parent_collection_id: string,
  parent_association_name: string,
  all_records: boolean,
  all_records_subset_query: Query,
  all_records_ids_excluded: string[],
  smart_action_id: string,
}

// Base body from requests for action routes / hooks
interface ActionRequestBody {
  data: {
    attributes: ActionRequestAttributes,
    type: 'action-requests',
  },
}

// Base body from requests for classic smart action routes
interface SmartActionRequestBody {
  data: {
    attributes: ActionRequestAttributes & { values: Record<string, any> },
    type: 'custom-action-requests',
  },
}

// Base body from requests for smart action hooks
interface SmartActionHookRequestBody {
  data: {
    attributes: ActionRequestAttributes & {
      fields: SmartActionChangeHookField[],
      changedField: string,
    },
    type: 'custom-action-hook-requests',
  },
}

// Concrete smart action request for classic smart action routes
export interface SmartActionRequest extends ForestRequest {
  body: SmartActionRequestBody,
}

// Request passed to smart action load hooks
export interface SmartActionLoadHookRequest extends ForestRequest {
  body: ActionRequestBody,
}

// Request passed to smart action change hooks
export interface SmartActionChangeHookRequest extends ForestRequest {
  body: SmartActionHookRequestBody,
}

// Everything related to Forest constants

export const PUBLIC_ROUTES: string[];

// Everything related to record manipulation

interface RecordsSerialized {
  data: Record<string, unknown>[],
  included: Record<string, unknown>[],
}

interface Meta {
  count: number,
  [k: string]: any,
}

export class AbstractRecordTool<M extends Sequelize.Model> {
  constructor(model: Sequelize.ModelCtor<M>, user: User, query: Query)
  serialize(records: M | M[], meta?: Meta): Promise<RecordsSerialized>;
}

export class RecordGetter<M extends Sequelize.Model> extends AbstractRecordTool<M> {
  get(recordId: string): Promise<M>;
}

export class RecordsGetter<M extends Sequelize.Model> extends AbstractRecordTool<M> {
  getAll(queryExtra?: Query): Promise<M[]>;
  getIdsFromRequest(request: SmartActionRequest | SmartActionLoadHookRequest | SmartActionChangeHookRequest): Promise<string[]>;
}

export class RecordsCounter<M extends Sequelize.Model> extends AbstractRecordTool<M> {
  count(): Promise<number>;
}

export class RecordsExporter<M extends Sequelize.Model> extends AbstractRecordTool<M> {
  streamExport(response: Response): Promise<void>;
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

export class RecordSerializer {
  constructor(model: { name: string } | Sequelize.ModelCtor<any>, user?: User, query?: Query);
  serialize(records: Record<string, any> | Record<string, any>[], meta?: Meta): Promise<RecordsSerialized>;
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

// Optional middleware(s) related to the perf

export function deactivateCountMiddleware(request: Request, response: Response, next: NextFunction): void;

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
  filters?: string
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
  include: Sequelize.Includeable | Sequelize.Includeable[],
  where: Sequelize.WhereOptions,
}

export interface SmartFieldSearcher {
  (query: SmartFieldSearchQuery, search: string): SmartFieldSearchQuery | Promise<SmartFieldSearchQuery>;
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

type FieldType = 'Boolean' | 'Date' | 'Dateonly' | 'Enum' | 'File' | 'Number' | 'String' | 'Json' | ['Enum'] | ['Number'] | ['String'];

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
  hook?: string,
  widget?: string;
}

export interface SmartActionHookField extends SmartActionField {
  value: any,
}

export interface SmartActionLoadHookField extends SmartActionHookField {
  position: number,
}

export interface SmartActionLoadHook {
  (context: { fields: SmartActionLoadHookField[], request: SmartActionLoadHookRequest }): SmartActionLoadHookField[] | Promise<SmartActionLoadHookField[]>
}

export interface SmartActionChangeHookField extends SmartActionHookField {
  previousValue: any,
}

export interface SmartActionChangeHook {
  (context: { fields: SmartActionChangeHookField[], changedField: SmartActionChangeHookField, request: SmartActionChangeHookRequest }): SmartActionChangeHookField[] | Promise<SmartActionChangeHookField[]>
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
  isSearchable?: boolean;
  fields?: SmartFieldOptions[];
  actions?: SmartActionOptions[];
  segments?: SmartSegmentOptions[];
  searchFields?: string[];
}

export function collection(name: string, options: CollectionOptions): void;

export function errorHandler(): RequestHandler;
