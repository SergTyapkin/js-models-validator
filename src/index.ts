type SimpleType = StringConstructor | NumberConstructor | BigIntConstructor | SymbolConstructor | BooleanConstructor
type ConstructableType = {new (any?: any): any}
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


function throwFieldNotExists(key: string) {
    throw TypeError(`Field "${key}" not exists in provided data`);
}
function throwParseError(key: string, expectedType: any, realValue: any) {
    throw TypeError(`Field "${key}" doesn\'t match type in declared model. Expected type: ${expectedType.name}. Gotten: ${JSON.stringify(realValue)}`);
}
function throwEnumError(key: string, allowedValuesSet: Iterable<any> | ArrayLike<any>, gottenValue: any) {
    throw TypeError(`Field "${key}" value not allowed in Enum. Allowed one of this values: ${JSON.stringify(Array.from(allowedValuesSet))}. Gotten: ${JSON.stringify(gottenValue)}`);
}
function throwDeclaringError(key: string) {
    throw SyntaxError(`Error in declaring model field "${key}"`);
}

function parseFieldSimpleType(dataValue: any, type: SimpleType | ConstructableType, key: string) {
    let res;
    try {
        if ([String, Number, BigInt, Symbol, Boolean].includes(type as SimpleType)) {
            // @ts-ignore
            res = (type as SimpleType)(dataValue); // use functional type construction for simple types
        } else {
            res = new (type as ConstructableType)(dataValue); // use class constructor for another types
        }
    } catch {
        throwParseError(key, type, dataValue);
    }
    if (typeof res === 'number' && (isNaN(res) && !Number.isNaN(dataValue))) {
        throwParseError(key, type, dataValue);
    }
    return res;
}
function parseArray(dataValue: Array<any>, typesArray: Array<ShortTypeDeclaring>, key: string): any[] {
    key;
    const res: any[] = [];
    typesArray.forEach((innerType, idx) => {
        parseField(res, dataValue[idx], innerType, String(idx));
    });
    return res;
}
function parseUnlimitedArray(dataValue: Array<any>, itemType: TypeDeclaring, key: string) {
    if (!itemType) {
        throwDeclaringError(key);
    }
    const res: any[] = [];
    dataValue.forEach((dataValueItem, idx) => {
        // @ts-ignore
        parseField(res, dataValueItem, itemType, String(idx), itemType.optional, itemType.default);
    });
    return res;
}
function parseSet(dataValue: any, type: SetType, key: string) {
    if (!type.has(dataValue)) {
        throwEnumError(key, type, dataValue);
    }
    return dataValue;
}

function parseLongDeclaring(resultObject: any, dataValue: any, type: LongTypeDeclaring, key: string) {
    const longDeclaringType = type.type;
    if (!longDeclaringType) {
        throwDeclaringError(key);
    }

    if (Array.isArray(longDeclaringType)) { // long limited array declaring
        resultObject[key] = parseArray(dataValue, longDeclaringType, key);
        return;
    }

    if (longDeclaringType === Array) { // long unlimited array declaring
        const longDeclaringItem = (type as ArrayLongTypeDeclaring).item;
        resultObject[key] = parseUnlimitedArray(dataValue, longDeclaringItem, key);
        return;
    }

    if (longDeclaringType instanceof Set) { // long set declaring
        resultObject[key] = parseSet(dataValue, longDeclaringType, key);
        return;
    }

    if (longDeclaringType === Object) { // long field declaring
        const longDeclaringModel = (type as ObjectLongTypeDeclaring).fields;
        resultObject[key] = {};
        parseFields(resultObject[key], longDeclaringModel, dataValue);
        return;
    }

    resultObject[key] = parseFieldSimpleType(dataValue, longDeclaringType as SimpleType | ConstructableType, key); // long simple type declaring
}
function parseField(resultObject: any, dataValue: any, type: TypeDeclaring, key: string, optional: boolean = false, defaultValue: any = undefined) {
    // Assert field existing (optional)
    if (dataValue === undefined) { // Field not exists or equals undefined
        if (optional) { // Field not exists and optional
            if (defaultValue !== undefined) { // Field not exists, optional, but has default value
                dataValue = defaultValue;
            } else {
                return; // Field not exists, optional, and hasn't default value -> skip
            }
        } else {
            throwFieldNotExists(key); // Field not exists but must be exists
        }
    }

    // Parse field by it's type
    if (type instanceof Function) { // short declaring of any type
        resultObject[key] = parseFieldSimpleType(dataValue, type as SimpleType, key);
        return;
    }

    if (Array.isArray(type)) { // short array declaring
        resultObject[key] = parseArray(dataValue, type, key);
        return;
    }

    if (type instanceof Set) { // short set declaring
        resultObject[key] = parseSet(dataValue, type, key);
        return;
    }

    if (type instanceof Object) { // long any type declaring
        parseLongDeclaring(resultObject, dataValue, type as LongTypeDeclaring, key);
        return;
    }

    throwDeclaringError(key);
}
function parseFields(resultObject: any, model: Model, data: object) {
    Object.getOwnPropertyNames(model).forEach(key => {
        const type = model[key];
        // @ts-ignore
        const dataValue: any | undefined = data[type.from || key];
        // @ts-ignore
        const optional = type.optional;
        // @ts-ignore
        const defaultValue = type.default;
        parseField(resultObject, dataValue, type, key, optional, defaultValue);
    });
}

export default function validateModel(model: Model, data: object | string) {
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
    parseFields(resultObject, model, data);
    return resultObject;
}
