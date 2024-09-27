import validateModel from "../dist/index.js";

describe('Simple short declaration. Positive', () => {
  it('Simple parsing', () => {
    const model = {
      field_1: String,
      field_2: Number,
    };
    const data = {
      field_1: "some string",
      field_2: 515,
    };
    const result = {
      field_1: "some string",
      field_2: 515,
    };
    expect(validateModel(model, data)).toEqual(result);
  });

  it('Discard extra fields', () => {
    const model = {
      field_1: String,
      field_2: Number,
    };
    const data = {
      field_1: "some string",
      field_2: 515,
      field_3: [415, "some_string"],
      field_4: 888,
      field_5: {
        a: 1,
        b: "515",
      },
    };
    const result = {
      field_1: "some string",
      field_2: 515,
    };
    expect(validateModel(model, data)).toEqual(result);
  });

  it('Convert types', () => {
    const model = {
      field_1: String,
      field_2: String,
      field_3: String,
      field_4: String,
      field_5: Number,
      field_6: Number,
      field_7: Number,
      field_8: Number,
      field_9: Date,
    };
    const data = {
      field_1: 61,
      field_2: null,
      field_3: NaN,
      field_4: [5, 5],
      field_5: "00567",
      field_6: null,
      field_7: NaN,
      field_8: "515e-14",
      field_9: '2016-01-14T19:37:36-08:00',
    };
    const result = {
      field_1: "61",
      field_2: "null",
      field_3: "NaN",
      field_4: "5,5",
      field_5: 567,
      field_6: 0,
      field_7: NaN,
      field_8: 515e-14,
      field_9: new Date('2016-01-15T03:37:36.000Z'),
    };
    expect(validateModel(model, data)).toEqual(result);
  });
});

describe('Simple short declaration. Negative', () => {
  it('Inconvertible type', () => {
    const model = {
      field_1: Number,
    };
    const data = {
      field_1: "string",
    };
    expect(() => {validateModel(model, data)}).toThrow(TypeError);
  });

  it('Field not exists', () => {
    const model = {
      field_1: String,
      field_2: String,
    };
    const data = {
      field_2: "string",
    };
    expect(() => {validateModel(model, data)}).toThrow(TypeError);
  });

  it('Error when converting type', () => {
    const model = {
      field_1: BigInt,
    };
    const data = {
      field_1: "string",
    };
    expect(() => {validateModel(model, data)}).toThrow(TypeError);
  });
});


describe('Short declaration Enums. Positive', () => {
  it('Default enum', () => {
    const model = {
      field_1: new Set(["some_value", 515, 61]),
      field_2: new Set(["some_value", 515, 61]),
    };
    const data = {
      field_1: 61,
      field_2: "some_value",
    };
    const result = {
      field_1: 61,
      field_2: "some_value",
    };
    expect(validateModel(model, data)).toEqual(result);
  });

  it('Enum 1 value', () => {
    const model = {
      field_1: new Set([123]),
    };
    const data = {
      field_1: 123,
    };
    const result = {
      field_1: 123,
    };
    expect(validateModel(model, data)).toEqual(result);
  });
});


describe('Short declaration Enums. Negative', () => {
  it('Field not in enum', () => {
    const model = {
      field_1: new Set(["some_value", 515, 61]),
    };
    const data = {
      field_1: 62,
    };
    expect(() => {validateModel(model, data)}).toThrow(TypeError);
  });

  it('Enum not converting types', () => {
    const model = {
      field_1: new Set(["some_value", 515, 61]),
    };
    const data = {
      field_1: "61",
    };
    expect(() => {validateModel(model, data)}).toThrow(TypeError);
  });

  it('Empty enum', () => {
    const model = {
      field_1: new Set([]),
    };
    const data = {
      field_1: null,
    };
    expect(() => {validateModel(model, data)}).toThrow(TypeError);
  });
});


describe('Short declaration Arrays with fixed length. Positive', () => {
  it('Default array', () => {
    const model = {
      field_1: [String, Number, String]
    };
    const data = {
      field_1: ["some string", 515, 600],
    };
    const result = {
      field_1: ["some string", 515, "600"],
    };
    expect(validateModel(model, data)).toEqual(result);
  });

  it('Empty array', () => {
    const model = {
      field_1: []
    };
    const data = {
      field_1: [],
    };
    const result = {
      field_1: [],
    };
    expect(validateModel(model, data)).toEqual(result);
  });

  it('Enum in array', () => {
    const model = {
      field_1: [Number, new Set([515, "some string"])]
    };
    const data = {
      field_1: ["5", "some string"],
    };
    const result = {
      field_1: [5, "some string"],
    };
    expect(validateModel(model, data)).toEqual(result);
  });

  it('Different array length. Longer than needs', () => {
    const model = {
      field_1: [Number, String, Number],
    };
    const data = {
      field_1: [333, 444, 555, 666],
    };
    const result = {
      field_1: [333, "444", 555],
    };
    expect(validateModel(model, data)).toEqual(result);
  });
});


describe('Short declaration Arrays with fixed length. Negative', () => {
  it('Wrong type in array', () => {
    const model = {
      field_1: [String, Number],
    };
    const data = {
      field_1: [555, "some string"],
    };
    expect(() => {validateModel(model, data)}).toThrow(TypeError);
  });

  it('Different array length. Shorter than needs', () => {
    const model = {
      field_1: [Number, String, Number],
    };
    const data = {
      field_1: [333, 444],
    };
    expect(() => {validateModel(model, data)}).toThrow(TypeError);
  });
});


describe('Long declaration simple types. Positive', () => {
  it('Default', () => {
    const model = {
      field_1: {
        type: String,
      },
      field_2: {
        type: Number,
      },
      field_3: {
        type: Date,
      },
    };
    const data = {
      field_1: "some string",
      field_2: 500,
      field_3: '2016-01-14T19:37:36-08:00',
    };
    const result = {
      field_1: "some string",
      field_2: 500,
      field_3: new Date('2016-01-15T03:37:36.000Z'),
    }
    expect(validateModel(model, data)).toEqual(result);
  });

  it('Optional', () => {
    const model = {
      field_1: {
        type: String,
        optional: true,
      },
      field_2: {
        type: Number,
      },
      field_3: {
        type: Date,
        optional: true,
      },
    };
    const data = {
      field_2: 500,
      field_3: '2016-01-14T19:37:36-08:00',
    };
    const result = {
      field_2: 500,
      field_3: new Date('2016-01-15T03:37:36.000Z'),
    }
    expect(validateModel(model, data)).toEqual(result);
  });

  it('Optional with default', () => {
    const model = {
      field_1: {
        type: String,
        optional: true,
        default: "default string",
      },
      field_2: {
        type: Number,
      },
      field_3: {
        type: Date,
        optional: true,
        default: new Date('2002-09-09'),
      },
    };
    const data = {
      field_2: 500,
      field_3: '2016-01-14T19:37:36-08:00',
    };
    const result = {
      field_1: "default string",
      field_2: 500,
      field_3: new Date('2016-01-15T03:37:36.000Z'),
    };
    expect(validateModel(model, data)).toEqual(result);
  });

  it('Another model names', () => {
    const model = {
      field_1: {
        type: String,
        from: "another_field_1",
      },
      field_2: {
        type: Number,
        from: "another_field_2",
      },
      field_3: {
        type: Date,
        from: "another_field_3",
      },
    };
    const data = {
      another_field_1: 400,
      another_field_2: 500,
      another_field_3: '2016-01-14T19:37:36-08:00',
    };
    const result = {
      field_1: "400",
      field_2: 500,
      field_3: new Date('2016-01-15T03:37:36.000Z'),
    };
    expect(validateModel(model, data)).toEqual(result);
  });

  it('Optional with another model names', () => {
    const model = {
      field_1: {
        type: String,
        optional: true,
        default: "default string",
        from: "another_field_1",
      },
      field_2: {
        type: Number,
        from: "another_field_2",
      },
      field_3: {
        type: Date,
        optional: true,
        from: "another_field_3",
      },
    };
    const data = {
      another_field_2: 500,
      another_field_3: '2016-01-14T19:37:36-08:00',
    };
    const result = {
      field_1: "default string",
      field_2: 500,
      field_3: new Date('2016-01-15T03:37:36.000Z'),
    };
    expect(validateModel(model, data)).toEqual(result);
  });

  it('Unlimited array', () => {
    const model = {
      field_1: {
        type: [String, Number, String],
      },
    };
    const data = {
      field_1: ["str1", "515", "str2"],
    };
    const result = {
      field_1: ["str1", 515, "str2"],
    };
    expect(validateModel(model, data)).toEqual(result);
  });

  it('Enum', () => {
    const model = {
      field_1: {
        type: new Set(["str1", 515, "str2"]),
      },
    };
    const data = {
      field_1: 515,
    };
    const result = {
      field_1: 515,
    };
    expect(validateModel(model, data)).toEqual(result);
  });
});

describe('Long declaration simple types. Negative', () => {
  it('inconvertible types', () => {
    const model = {
      field_1: {
        type: Number,
      },
    };
    const data = {
      field_1: "some string",
    };
    expect(() => {validateModel(model, data)}).toThrow(TypeError);
  });

  it('field not exists', () => {
    const model = {
      field_1: {
        type: Number,
      },
      field_2: {
        type: Number,
      },
    };
    const data = {
      field_1: 515,
    };
    expect(() => {validateModel(model, data)}).toThrow(TypeError);
  });

  it('another model name not exists', () => {
    const model = {
      field_1: {
        type: Number,
        from: "another_field_1"
      },
      field_2: {
        type: Number,
      },
    };
    const data = {
      field_1: 414,
      field_2: 515,
    };
    expect(() => {validateModel(model, data)}).toThrow(TypeError);
  });

  it('Field type is Object without field "type"', () => {
    const model = {
      field_1: {},
    };
    const data = {
      field_1: 515,
    };
    expect(() => {validateModel(model, data)}).toThrow(SyntaxError);
  });

  it('Field type is value', () => {
    const model = {
      field_1: 515,
    };
    const data = {
      field_1: 515,
    };
    expect(() => {validateModel(model, data)}).toThrow(SyntaxError);
  });

  it('Unlimited array type is value', () => {
    const model = {
      field_1: {
        type: [String, 515, String],
      },
    };
    const data = {
      field_1: ["str1", "515", "str2"],
    };
    expect(() => {validateModel(model, data)}).toThrow(SyntaxError);
  });

  it('Unlimited array inconvertible type', () => {
    const model = {
      field_1: {
        type: [String, Number, String],
      },
    };
    const data = {
      field_1: ["str1", "str2", "str3"],
    };
    expect(() => {validateModel(model, data)}).toThrow(TypeError);
  });

  it('Enum not allowed value', () => {
    const model = {
      field_1: {
        type: new Set(["str1", 515, "str2"]),
      },
    };
    const data = {
      field_1: 616,
    };
    expect(() => {validateModel(model, data)}).toThrow(TypeError);
  });
});

describe('Long declaration unlimited arrays. Positive', () => {
  it('Default', () => {
    const model = {
      field_1: {
        type: Array,
        item: String,
      },
      field_2: {
        type: Array,
        item: Number,
      },
    };
    const data = {
      field_1: ['string', '414', 'cell', '2 words'],
      field_2: [515, 567, 2.1323, 0],
    };
    const result = {
      field_1: ['string', '414', 'cell', '2 words'],
      field_2: [515, 567, 2.1323, 0],
    }
    expect(validateModel(model, data)).toEqual(result);
  });

  it('Types converting', () => {
    const model = {
      field_1: {
        type: Array,
        item: String,
      },
      field_2: {
        type: Array,
        item: Number,
      },
    };
    const data = {
      field_1: ['string', 414, NaN, null],
      field_2: ["515", BigInt(567), 2.1323, null],
    };
    const result = {
      field_1: ['string', '414', 'NaN', 'null'],
      field_2: [515, 567, 2.1323, 0],
    }
    expect(validateModel(model, data)).toEqual(result);
  });

  it('Empty array', () => {
    const model = {
      field_1: {
        type: Array,
        item: String,
      },
      field_2: {
        type: Array,
        item: Number,
      },
    };
    const data = {
      field_1: [],
      field_2: [],
    };
    const result = {
      field_1: [],
      field_2: [],
    }
    expect(validateModel(model, data)).toEqual(result);
  });
});

describe('Long declaration unlimited arrays. Negative', () => {
  it('inconvertible types', () => {
    const model = {
      field_1: {
        type: Array,
        item: Number,
      },
    };
    const data = {
      field_1: ['some string'],
    };
    expect(() => {validateModel(model, data)}).toThrow(TypeError);
  });

  it('Not array. May be iterable', () => {
    const model = {
      field_1: {
        type: Array,
        item: Number,
      },
    };
    const data = {
      field_1: 'some string',
    };
    expect(() => {validateModel(model, data)}).toThrow(TypeError);
  });

  it('Not array. Object', () => {
    const model = {
      field_1: {
        type: Array,
        item: Number,
      },
    };
    const data = {
      field_1: {0: "str1", 1: "str2"},
    };
    expect(() => {validateModel(model, data)}).toThrow(TypeError);
  });

  it('Not specified item type', () => {
    const model = {
      field_1: {
        type: Array,
      },
    };
    const data = {
      field_1: ["str1", "str2"],
    };
    expect(() => {validateModel(model, data)}).toThrow(SyntaxError);
  });
});



describe('Nested objects. Positive', () => {
  it('Default', () => {
    const model = {
      field_1: {
        type: Object,
        fields: {
          field_1_1: String,
          field_1_2: Number,
          field_1_3: new Set([515, 414]),
        }
      },
    };
    const data = {
      field_1: {
        field_1_1: "some string",
        field_1_2: "515.6e-10",
        field_1_3: 414,
        field_1_4: 515,
      },
      field_2: {},
    };
    const result = {
      field_1: {
        field_1_1: "some string",
        field_1_2: 515.6e-10,
        field_1_3: 414,
      },
    }
    expect(validateModel(model, data)).toEqual(result);
  });

  it('Deep nesting', () => {
    const model = {
      field_1: {
        type: Object,
        fields: {
          field_1_1: {
            type: Object,
            fields: {
              field_1_1_1: {
                type: Object,
                fields: {
                  field_1_1_1_1: String,
                  field_1_1_1_2: Number,
                }
              },
              field_1_1_2: Number,
            }
          },
          field_1_2: Number,
        }
      },
    };
    const data = {
      field_1: {
        field_1_1: {
          field_1_1_1: {
            field_1_1_1_1: "515",
            field_1_1_1_2: 3,
          },
          field_1_1_2: 2
        },
        field_1_2: 1,
      },
    };
    const result = {
      field_1: {
        field_1_1: {
          field_1_1_1: {
            field_1_1_1_1: "515",
            field_1_1_1_2: 3,
          },
          field_1_1_2: 2
        },
        field_1_2: 1,
      },
    };
    expect(validateModel(model, data)).toEqual(result);
  });

  it('Nested object in long declared array', () => {
    const model = {
      field_1: {
        type: Array,
        item: {
          type: Object,
          fields: {
            field_item_1: Number,
            field_item_2: String,
          }
        },
      },
    };
    const data = {
      field_1: [
        {
          field_item_1: 515,
          field_item_2: "some string",
        },
        {
          field_item_1: 414,
          field_item_2: "string 2",
        }
      ]
    };
    const result = {
      field_1: [
        {
          field_item_1: 515,
          field_item_2: "some string",
        },
        {
          field_item_1: 414,
          field_item_2: "string 2",
        }
      ]
    };
    expect(validateModel(model, data)).toEqual(result);
  });


  it('Nested object in short declared array', () => {
    const model = {
      field_1: [
        {
          type: Object,
          fields: {
            field_item_1: Number,
            field_item_2: String,
          }
        },
        Number,
        String,
      ]
    };
    const data = {
      field_1: [
        {
          field_item_1: 515,
          field_item_2: "some string",
        },
        414,
        "some string 2"
      ]
    };
    const result = {
      field_1: [
        {
          field_item_1: 515,
          field_item_2: "some string",
        },
        414,
        "some string 2"
      ]
    };
    expect(validateModel(model, data)).toEqual(result);
  });
});

describe('Base function arguments. Negative', () => {
  it('Model not Object 1', () => {
    const model = String;
    const data = {
      field_1: "string",
    };
    expect(() => {validateModel(model, data)}).toThrow(TypeError);
  });

  it('Model not Object 2', () => {
    const model = 515;
    const data = {
      field_2: "string",
    };
    expect(() => {validateModel(model, data)}).toThrow(TypeError);
  });

  it('Data not string or object', () => {
    const model = {
      field_1: BigInt,
    };
    const data = 700;
    expect(() => {validateModel(model, data)}).toThrow(TypeError);
  });
});

describe("Data converts from string. Positive", () => {
  it('Data is string', () => {
    const model = {
      field_1: String,
      field_2: Number,
    };
    const data = '{"field_1": "61", "field_2": 515}';
    const result = {
      field_1: "61",
      field_2: 515,
    };
    expect(validateModel(model, data)).toEqual(result);
  });
});
describe("Data converts from string. Negative", () => {
  it('Invalid JSON', () => {
    const model = {
      field_1: String,
      field_2: Number,
    };
    const data = 'field_1: "61", "field_2": 515';
    expect(() => {validateModel(model, data)}).toThrow(TypeError);
  });
});
