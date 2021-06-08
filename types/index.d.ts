import { RequestHandler, Response, Request, NextFunction, Application } from 'express';
import * as Sequelize from 'sequelize';

// Everything related to Forest initialization

export interface LianaOptions {
    objectMapping: Sequelize.Sequelize;
    envSecret: string;
    authSecret: string;
    connections: {
        [connectionName: string]: Sequelize.Sequelize;
    };
    includedModels?: string[];
    excludedModels?: string[];
    configDir?: string;
}

export function init (options: LianaOptions): Promise<Application>;

// Everything related to Forest Authentication

export interface ensureAuthenticated {
    (request: Request, response: Response, next: NextFunction): void
}

// Everything related to Forest constants

export const PUBLIC_ROUTES: string[];

// Everything related to record manipulation

export class AbstractRecordTool {
    constructor(model: Sequelize.Model)
    serialize(records: Sequelize.Model[]): Promise<StatSerialized>;
}

export class RecordGetter extends AbstractRecordTool {
    get(recordId: string): Promise<Sequelize.Model>;
}

export class RecordsGetter extends AbstractRecordTool {
    getAll(params: Params): Promise<Sequelize.Model[]>;
    getIdsFromRequest(request: Request): Promise<string[]>;
}

export class RecordsCounter extends AbstractRecordTool {
    count(params: Params): Promise<number>;
}

export class RecordsExporter extends AbstractRecordTool {
    streamExport(response: Response, params: Params): Promise<void>;
}

export class RecordUpdater extends AbstractRecordTool {
    deserialize(body: Record<string, unknown>): Promise<Record<string, unknown>>;
    update(record: Record<string, unknown>, recordId: string): Promise<Sequelize.Model>;
}

export class RecordCreator extends AbstractRecordTool {
    deserialize(body: Record<string, unknown>): Promise<Record<string, unknown>>;
    create(record: Record<string, unknown>): Promise<Sequelize.Model>;
}

export class RecordRemover extends AbstractRecordTool {
    remove(recordId: string): Promise<void>;
}

export class RecordsRemover extends AbstractRecordTool {
    remove(recordIds: string[]): Promise<void>;
}

export class RecordSerializer extends AbstractRecordTool { }

// Everyting related to Forest permissions

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
    number: string;
    size: string;
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

export interface Params {
    timezone: string;
    search: string;
    fields: {[key: string]: string};
    sort: string;
    filters: Filter|AggregatedFilters;
    page: Page;
    searchExtended: string;
}

// Everything related to Forest collection configuration

export interface SmartFieldValueGetter {
    (record: Sequelize.Model): Sequelize.Model;
}

export interface SmartFieldValueSetter {
    (record: Sequelize.Model, attributeValue: any): Sequelize.Model;
}

export interface SmartFieldSearcher {
    (query: any, search: string): any;
}

// TODO to be updated, deprecated since v6
export interface SmartActionValuesInjector {
    (record: Sequelize.Model): Record<string, unknown>;
}

export interface SegmentAggregationCreator {
    (): Record<string, unknown>;
}

export interface SmartFieldOptions {
    field: string;
    description?: string;
    type: string | string[];
    isReadOnly?: boolean;
    reference?: string;
    enums?: string[];
    defaultValue?: any;
    get?: SmartFieldValueGetter;
    set?: SmartFieldValueSetter;
    search?: SmartFieldSearcher;
}

// TODO add smart field definition
// TODO add enum for smart field type
export interface SmartActionOptions {
    name: string;
    type?: string;
    fields?: Array<{
        field: string;
        type: string | string[];
        reference?: string;
        enums?: string[];
        description?: string;
        isRequired?: boolean;
    }>;
    download?: boolean;
    endpoint?: string;
    httpMethod?: string;
    values?: SmartActionValuesInjector;
}

export interface SmartSegmentOptions {
    name: string;
    where: SegmentAggregationCreator;
}

export declare interface CollectionOptions {
    fields?: SmartFieldOptions[];
    actions?: SmartActionOptions[];
    segments?: SmartSegmentOptions[];
}

export function collection(name: string, options: CollectionOptions): void;
