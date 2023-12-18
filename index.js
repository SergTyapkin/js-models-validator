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
function assertNotNull(dataValue, key, optional=false) {
    if (dataValue === undefined || dataValue === null) {
        if (optional) {
            return null;
        } else {
            throwFieldNotExists(key);
        }
    }
    return dataValue;
}

function parseFieldSimpleType(dataValue, type, key) {
    let res;
    try {
        res = new type(dataValue);
    } catch {
        throwParseError(key, type, dataValue);
    }
    if (typeof res === 'number' && isNaN(res)) {
        throwParseError(key, type, dataValue);
    }
    return res;
}
function parseArray(dataValue, type, key) {
    const res = [];
    type.forEach((innerType, idx) => {
        res[idx] = parseFieldSimpleType(dataValue[idx], innerType, `${key}[${idx}]`);
    });
    return res;
}
function parseUnlimitedArray(dataValue, itemType, key) {
    const res = [];
    dataValue.forEach((dataValueItem, idx) => {
        parseField(res, dataValueItem, itemType, idx, itemType.optional);
    });
    return res;
}
function parseSet(dataValue, type, key) {
    if (!type.has(dataValue)) {
        throwEnumError(key, type, dataValue);
        return;
    }
    return dataValue;
}

function parseLongDeclaring(resultObject, dataValue, type, key) {
    const longDeclaringType = type.type;
    const optional = type.optional;

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

    if (longDeclaringType instanceof Object) { // long field declaring
        const longDeclaringModel = type.fields;
        resultObject[key] = {};
        parseFields(resultObject[key], longDeclaringModel, dataValue);
        return;
    }
    resultObject[key] = parseFieldSimpleType(dataValue, longDeclaringType, key);
}
function parseField(resultObject, dataValue, type, key, optional=false) {
    if (assertNotNull(dataValue, key, optional) === null) {
        return;
    }

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
        const dataValue = data[key];
        const optional = type.optional;
        parseField(resultObject, dataValue, type, key, optional);
    });
}

export default function validateModel(model, data) {
    if (typeof data === 'string') {
        data = JSON.parse(data);
    }
    if (typeof data !== 'object' || data === null) {
        throw TypeError('Argument "data" is not valid type');
    }
    if (typeof model !== 'object' || model === null) {
        throw TypeError('Argument "model" must be Object');
    }

    const resultObject = {};
    parseFields(resultObject, model, data);
    return resultObject;
}
