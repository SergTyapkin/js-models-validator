type SimpleType = StringConstructor | NumberConstructor | BigIntConstructor | SymbolConstructor | BooleanConstructor
type ConstructableType = { new(any?: any): any }
type SetType = Set<any>
type ArrayType = Array<any>
type ComplexType = ConstructableType | SetType | ArrayType
type _DefaultLongTypeDeclaringFields = {
  type: TypeDeclaring,
  from?: string,
  optional?: boolean,
  default?: any,
}
type ArrayLongTypeDeclaring = {
  type: ArrayConstructor,
  item: TypeDeclaring,
} & _DefaultLongTypeDeclaringFields
type ObjectLongTypeDeclaring = {
  type: ObjectConstructor,
  fields: {},
} & _DefaultLongTypeDeclaringFields
type SimpleLongTypeDeclaring = {
  type: TypeDeclaring,
} & _DefaultLongTypeDeclaringFields
type LongTypeDeclaring = SimpleLongTypeDeclaring | ArrayLongTypeDeclaring | ObjectLongTypeDeclaring
type ShortTypeDeclaring = SimpleType | ComplexType
type TypeDeclaring = LongTypeDeclaring | ShortTypeDeclaring

export interface Model {
  readonly [index: string]: TypeDeclaring
}

interface EditableModel {
  [index: string]: TypeDeclaring
}

const SIMPLE_TYPES_CONSTRUCTORS = [String, Number, BigInt, Symbol, Boolean];


function throwFieldNotExists(type: TypeDeclaring, stackTrace: string, stackTraceFrom: string) {
  // @ts-ignore
  throw TypeError(`Field ${stackTrace} ${stackTrace !== stackTraceFrom ? `searched in ${stackTraceFrom}` : ''} not exists in provided data. Expecting type: ${JSON.stringify(type) || type?.name || type}`);
}

function throwParseError(expectedType: any, realValue: any, stackTrace: string, stackTraceFrom: string) {
  throw TypeError(`Field ${stackTrace} ${stackTrace !== stackTraceFrom ? `searched in ${stackTraceFrom}` : ''} doesn\'t match type in declared model. Expected type: ${expectedType.name}. Gotten: ${JSON.stringify(realValue)}`);
}

function throwEnumError(allowedValuesSet: Iterable<any> | ArrayLike<any>, gottenValue: any, stackTrace: string, stackTraceFrom: string) {
  throw TypeError(`Field ${stackTrace} ${stackTrace !== stackTraceFrom ? `searched in ${stackTraceFrom}` : ''} value not allowed in Enum. Allowed one of this values: ${JSON.stringify(Array.from(allowedValuesSet))}. Gotten: ${JSON.stringify(gottenValue)}`);
}

function throwDeclaringError(stackTrace: string) {
  throw SyntaxError(`Error in declaring model field "${stackTrace}"`);
}

function parseFieldSimpleType(dataValue: any, type: SimpleType | ConstructableType, stackTrace: string, stackTraceFrom: string) {
  let res;
  try {
    if (SIMPLE_TYPES_CONSTRUCTORS.includes(type as SimpleType)) {
      // @ts-ignore
      res = (type as SimpleType)(dataValue); // use functional type construction for simple types
    } else if (type === Object) { // "any" type
      res = dataValue;
    } else {
      res = new (type as ConstructableType)(dataValue); // use class constructor for another types
    }
  } catch {
    throwParseError(type, dataValue, stackTrace, stackTraceFrom);
  }
  if (typeof res === 'number' && (isNaN(res) && !Number.isNaN(dataValue))) {
    throwParseError(type, dataValue, stackTrace, stackTraceFrom);
  }
  return res;
}

function parseArray(dataValue: Array<any>, typesArray: Array<ShortTypeDeclaring>, stackTrace: string, stackTraceFrom: string, isReverse: boolean): any[] {
  const res: any[] = [];
  typesArray.forEach((innerType, idx) => {
    parseField(res, dataValue[idx], innerType, String(idx), undefined, undefined, `${stackTrace}[${idx}]`, `${stackTraceFrom}[${idx}]`, isReverse);
  });
  return res;
}

function parseUnlimitedArray(dataValue: Array<any>, itemType: TypeDeclaring, stackTrace: string, stackTraceFrom: string, isReverse: boolean) {
  if (!itemType) {
    throwDeclaringError(stackTrace);
  }
  const res: any[] = [];
  dataValue.forEach((dataValueItem, idx) => {
    // @ts-ignore
    parseField(res, dataValueItem, itemType, String(idx), itemType.optional, itemType.default, `${stackTrace}[${idx}]`, `${stackTraceFrom}[${idx}]`, isReverse);
  });
  return res;
}

function parseSet(dataValue: any, type: SetType, stackTrace: string, stackTraceFrom: string) {
  // Straight equality
  if (type.has(dataValue)) {
    return dataValue;
  } else { // Simple type
    // Trying to found its type directly
    let result = null;
    type.forEach(oneOfTypes => {
      if (!(oneOfTypes instanceof Function)) {
        return;
      }
      try {
        const res = parseFieldSimpleType(dataValue, oneOfTypes, '', '');
        if (typeof res === typeof dataValue) {
          result = res;
        }
      } catch {
      }
    });
    if (result !== null) {
      return result;
    }
  }
  throwEnumError(type, dataValue, stackTrace, stackTraceFrom);
}

function parseLongDeclaring(resultObject: any, dataValue: any, key: string, type: LongTypeDeclaring, stackTrace: string, stackTraceFrom: string, isReverse: boolean) {
  const longDeclaringType = type.type;
  if (!longDeclaringType) {
    throwDeclaringError(stackTrace);
  }

  if (Array.isArray(longDeclaringType)) { // long limited array declaring
    resultObject[key] = parseArray(dataValue, longDeclaringType, stackTrace, stackTraceFrom, isReverse);
    return;
  }

  if (longDeclaringType === Array) { // long unlimited array declaring
    const longDeclaringItem = (type as ArrayLongTypeDeclaring).item;
    resultObject[key] = parseUnlimitedArray(dataValue, longDeclaringItem, stackTrace, stackTraceFrom, isReverse);
    return;
  }

  if (longDeclaringType instanceof Set) { // long set declaring
    resultObject[key] = parseSet(dataValue, longDeclaringType, stackTrace, stackTraceFrom);
    return;
  }

  if (longDeclaringType === Object) { // long field declaring
    const longDeclaringModel = (type as ObjectLongTypeDeclaring).fields;
    // @ts-ignore
    const targetKey = isReverse ? (longDeclaringType.from ?? key) : key;
    resultObject[targetKey] = {};

    if (!longDeclaringModel) { // unlimited Object with any fields
      if (typeof dataValue !== 'object') {
        throwParseError(longDeclaringType, dataValue, stackTrace, stackTraceFrom);
        return;
      }
      resultObject[targetKey] = dataValue;
      return;
    }
    parseFields(resultObject[targetKey], longDeclaringModel, dataValue, stackTrace, stackTraceFrom, isReverse);
    return;
  }

  resultObject[key] = parseFieldSimpleType(dataValue, longDeclaringType as SimpleType | ConstructableType, stackTrace, stackTraceFrom); // long simple type declaring
}

function parseField(resultObject: any, dataValue: any, type: TypeDeclaring, key: string, optional: boolean = false, defaultValue: any = undefined, stackTrace: string, stackTraceFrom: string, isReverse: boolean) {
  // Assert field existing (optional)
  if (dataValue === undefined || dataValue === null) { // Field not exists or equals undefined or null
    if (optional) { // Field not exists and optional
      if (defaultValue !== undefined) { // Field not exists, optional, but has default value
        resultObject[key] = defaultValue;
        return;
      } else {
        return; // Field not exists, optional, and hasn't default value -> skip
      }
    } else {
      throwFieldNotExists(type, stackTrace, stackTraceFrom); // Field not exists but must be exists
    }
  }

  // Parse field by it's type
  if (type instanceof Function) { // short declaring of any type
    resultObject[key] = parseFieldSimpleType(dataValue, type as SimpleType, stackTrace, stackTraceFrom);
    return;
  }

  if (Array.isArray(type)) { // short array declaring
    resultObject[key] = parseArray(dataValue, type, stackTrace, stackTraceFrom, isReverse);
    return;
  }

  if (type instanceof Set) { // short set declaring
    resultObject[key] = parseSet(dataValue, type, stackTrace, stackTraceFrom);
    return;
  }

  if (type instanceof Object) { // long any type declaring
    parseLongDeclaring(resultObject, dataValue, key, type as LongTypeDeclaring, stackTrace, stackTraceFrom, isReverse);
    return;
  }

  throwDeclaringError(stackTrace);
}

function parseFields(resultObject: any, model: Model, data: object, stackTrace: string, stackTraceFrom: string, isReverse = false) {
  Object.getOwnPropertyNames(model).forEach(key => {
    const type = model[key];
    // @ts-ignore
    let dataValue: any | undefined = data[isReverse ? key : (type.from ?? key)];
    // @ts-ignore
    const optional = type.optional;
    // @ts-ignore
    const defaultValue = type.default;
    // @ts-ignore
    const targetKey = isReverse ? (type.from ?? key) : key;
    // @ts-ignore
    parseField(resultObject, dataValue, type, targetKey, optional, defaultValue, `${stackTrace}.${key}`, `${stackTraceFrom}.${type.from ?? key}`, isReverse);
  });
}

// ------- MODELS VALIDATORS ---------
export function validateModel(model: Model, data: object | string): object {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (err) {
      throw TypeError(`Second argument "data" cannot be parsed from string. Error:\n${err}`);
    }
  }
  if (typeof data !== 'object' || data === null) {
    throw TypeError('Second argument "data" is not valid type. Must be Object or String');
  }
  if (typeof model !== 'object' || model === null) {
    throw TypeError('First argument "model" must be Object');
  }

  const resultObject = {};
  parseFields(resultObject, model, data, '<object>', '<object>');
  return resultObject;
}

export function reverseValidateModel(model: Model, data: object): object {
  if (typeof data !== 'object' || data === null) {
    throw TypeError('Second argument "data" is not valid type. Must be Object or String');
  }
  if (typeof model !== 'object' || model === null) {
    throw TypeError('First argument "model" must be Object');
  }

  const resultObject = {};
  parseFields(resultObject, model, data, '<object>', '<object>', true);
  return resultObject;
}

// ------- MODELS GENERATORS ---------
function camelCaseToSnakeCase(str: string) {
  return str.replace(/([a-z](?=[A-Z][a-zA-Z])|[A-Z](?=[A-Z][a-z])|[0-9](?=[A-Za-z])|[a-zA-Z](?=[0-9]))/g, '$1_').toLowerCase();
}

function snakeCaseToCamelCase(str: string) {
  return str.replace(/_([^_])/g, (_, word) => word[0].toUpperCase() + word.slice(1));
}

function generateModelWithChangedKeys<T extends Model | TypeDeclaring>(model: T, keyChangingFoo: (str: string) => string): T {
  function getChangedFieldType(type: TypeDeclaring, key: string): TypeDeclaring {
    const changedKey = keyChangingFoo(key);
    if (
      type instanceof Function ||
      Array.isArray(type) ||
      type instanceof Set
    ) { // short declaring
      return changedKey === key ? type : {
        type: type,
        from: changedKey,
      }
    }

    // long declaring
    return Object.assign(
      changedKey !== key ? {from: changedKey} : {},
      type,
      // @ts-ignore
      type.item ? {item: getChangedFieldType(type.item, '')} : {},
      // @ts-ignore
      type.fields ? {fields: generateModelWithChangedKeys(type.fields, keyChangingFoo)} : {},
    );
  }

  const resultModel = {} as EditableModel;
  Object.getOwnPropertyNames(model).forEach(key => {
    // @ts-ignore
    const type = model[key];
    resultModel[key] = getChangedFieldType(type, key);
  });
  // @ts-ignore
  return resultModel;
}

export function generateSnakeCaseFromCamelCaseModel(model: Model): Model {
  return generateModelWithChangedKeys(model, camelCaseToSnakeCase);
}

export function generateCamelCaseFromSnakeCaseModel(model: Model): Model {
  return generateModelWithChangedKeys(model, snakeCaseToCamelCase);
}

// ------ MODELS SHORTCUTS -----
export function ArrayType(type: TypeDeclaring | Model, optional = false, defaultValue: any = undefined): ArrayLongTypeDeclaring {
  if (
    type instanceof Function ||
    Array.isArray(type) ||
    type instanceof Set
  ) { // short declaring
    return {
      type: Array,
      item: type,
      ...(optional && {optional: true}),
      ...(defaultValue !== undefined && {default: defaultValue}),
    }
  }

  if (typeof type === 'object' && type !== null) { // object declaring
    return {
      type: Array,
      // @ts-ignore
      item: ObjectType(type),
      ...(optional && {optional: true}),
      ...(defaultValue !== undefined && {default: defaultValue}),
    }
  }

  throw SyntaxError(`Error in declaring ArrayType. Expected type declaration. Provided: "${type}"`);
}
export function ObjectType(fields: Model, optional = false, defaultValue: any = undefined): ObjectLongTypeDeclaring {
  if (typeof fields !== 'object' || fields === null) {
    throw SyntaxError(`Error in declaring ObjectType. Expected object with fields declaration. Provided: "${fields}"`);
  }

  return {
    type: Object,
    fields: fields,
    ...(optional && {optional: true}),
    ...(defaultValue !== undefined && {default: defaultValue}),
  }
}
export function Type(type: TypeDeclaring, optional = false, defaultValue: any = undefined): LongTypeDeclaring {
  return {
    type: type,
    ...(optional && {optional: true}),
    ...(defaultValue !== undefined && {default: defaultValue}),
    }
}
