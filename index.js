function throwFieldNotExists(key) {
    throw TypeError(`Field "${key}" not exists in provided data`);
}
function throwParseError(key, expectedType, realValue) {
    throw TypeError(`Field "${key}" doesn\'t match type in declared model. Expected type: ${expectedType.name}. Gotten: ${JSON.stringify(realValue)}`);
}
function throwEnumError(key, allowedValuesSet, gottenValue) {
    throw TypeError(`Field "${key}" value not allowed in Enum. Allowed one of this values: ${JSON.stringify(Array.from(allowedValuesSet))}. Gotten: ${JSON.stringify(gottenValue)}`);
}
function throwDeclaringError(key) {
    throw SyntaxError(`Error in declaring model field "${key}"`);
}

function parseFieldSimpleType(dataValue, type, key) {
    let res;
    try {
        if ([String, Number, BigInt, Symbol, Boolean].includes(type)) {
            res = type(dataValue); // use functional type construction for simple types
        } else {
            res = new type(dataValue); // use class constructor for another types
        }
    } catch {
        throwParseError(key, type, dataValue);
    }
    if (typeof res === 'number' && (isNaN(res) && !Number.isNaN(dataValue))) {
        throwParseError(key, type, dataValue);
    }
    return res;
}
function parseArray(dataValue, type, key) {
    const res = [];
    type.forEach((innerType, idx) => {
        parseField(res, dataValue[idx], innerType, `${idx}`);
    });
    return res;
}
function parseUnlimitedArray(dataValue, itemType, key) {
    if (!itemType) {
        throwDeclaringError(key);
    }
    const res = [];
    dataValue.forEach((dataValueItem, idx) => {
        parseField(res, dataValueItem, itemType, idx, itemType.optional, itemType.default);
    });
    return res;
}
function parseSet(dataValue, type, key) {
    if (!type.has(dataValue)) {
        throwEnumError(key, type, dataValue);
    }
    return dataValue;
}

function parseLongDeclaring(resultObject, dataValue, type, key) {
    const longDeclaringType = type.type;
    if (!longDeclaringType) {
        throwDeclaringError(key)
    }

    if (Array.isArray(longDeclaringType)) { // long limited array declaring
        resultObject[key] = parseArray(dataValue, longDeclaringType, key);
        return;
    }

    if (longDeclaringType === Array) { // long unlimited array declaring
        const longDeclaringItem = type.item;
        resultObject[key] = parseUnlimitedArray(dataValue, longDeclaringItem, key);
        return;
    }

    if (longDeclaringType instanceof Set) { // long set declaring
        resultObject[key] = parseSet(dataValue, longDeclaringType, key);
        return;
    }

    if (longDeclaringType === Object) { // long field declaring
        const longDeclaringModel = type.fields;
        resultObject[key] = {};
        parseFields(resultObject[key], longDeclaringModel, dataValue);
        return;
    }

    resultObject[key] = parseFieldSimpleType(dataValue, longDeclaringType, key); // long simple type declaring
}
function parseField(resultObject, dataValue, type, key, optional=false, defaultValue=undefined) {
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
        resultObject[key] = parseFieldSimpleType(dataValue, type, key);
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
        parseLongDeclaring(resultObject, dataValue, type, key);
        return;
    }

    throwDeclaringError(key);
}
function parseFields(resultObject, model, data) {
    Object.getOwnPropertyNames(model).forEach(key => {
        const type = model[key];
        const dataValue = data[type.fieldName || key];
        const optional = type.optional;
        const defaultValue = type.default;
        parseField(resultObject, dataValue, type, key, optional, defaultValue);
    });
}

export default function validateModel(model, data) {
    if (typeof data === 'string') {
        data = JSON.parse(data);
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
