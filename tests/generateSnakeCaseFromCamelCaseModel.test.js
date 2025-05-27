import {generateSnakeCaseFromCamelCaseModel} from "../dist/index.js";

describe('Simple short declaration', () => {
  it('Simple', () => {
    const model = {
      fieldOne: String,
      fieldTwo: Number,
    };
    const result = {
      fieldOne: {
        type: String,
        from: 'field_one',
      },
      fieldTwo: {
        type: Number,
        from: 'field_two',
      },
    };
    expect(generateSnakeCaseFromCamelCaseModel(model)).toEqual(result);
  });

  it('Numbers', () => {
    const model = {
      field1One10: String,
      field2Two222: Number,
    };
    const result = {
      field1One10: {
        type: String,
        from: 'field_1_one_10',
      },
      field2Two222: {
        type: Number,
        from: 'field_2_two_222',
      },
    };
    expect(generateSnakeCaseFromCamelCaseModel(model)).toEqual(result);
  });

  it('Caps', () => {
    const model = {
      fieldONETwo: String,
      FIELD_TWO_ONE: Number,
    };
    const result = {
      fieldONETwo: {
        type: String,
        from: 'field_one_two',
      },
      FIELD_TWO_ONE: {
        type: Number,
        from: 'field_two_one',
      },
    };
    expect(generateSnakeCaseFromCamelCaseModel(model)).toEqual(result);
  });

  it('No effects', () => {
    const model = {
      field_1: String,
      field_2: Number,
    };
    const result = {
      field_1: String,
      field_2: Number,
    };
    expect(generateSnakeCaseFromCamelCaseModel(model)).toEqual(result);
  });


  it('Different types', () => {
    const model = {
      field1: [String, Number],
      field2: new Set(['some_string', 123]),
      field3: {
        type: String,
        optional: true,
      },
      field4: {
        type: Array,
      },
      field5: {
        type: Object,
      },
    };
    const result = {
      field1: {
        type: [String, Number],
        from: 'field_1',
      },
      field2: {
        type: new Set(['some_string', 123]),
        from: 'field_2',
      },
      field3: {
        type: String,
        optional: true,
        from: 'field_3',
      },
      field4: {
        type: Array,
        from: 'field_4',
      },
      field5: {
        type: Object,
        from: 'field_5',
      },
    };
    expect(generateSnakeCaseFromCamelCaseModel(model)).toEqual(result);
  });

  it('Arrays', () => {
    const model = {
      field1: {
        type: Array,
        item: String,
      },
    };
    const result = {
      field1: {
        type: Array,
        item: String,
        from: 'field_1',
      },
    };
    expect(generateSnakeCaseFromCamelCaseModel(model)).toEqual(result);
  });

  it('Nested objects', () => {
    const model = {
      field1: {
        type: Object,
        fields: {
          field11: String,
          field12: Number,
        },
      },
    };
    const result = {
      field1: {
        type: Object,
        from: 'field_1',
        fields: {
          field11: {
            type: String,
            from: 'field_11',
          },
          field12: {
            type: Number,
            from: 'field_12',
          },
        }
      },
    };
    expect(generateSnakeCaseFromCamelCaseModel(model)).toEqual(result);
  });

  it('Nested objects in arrays', () => {
    const model = {
      field1: {
        type: Array,
        item: {
          type: Object,
          fields: {
            field11: String,
            field12: {
              type: Object,
              fields: {
                field121: Number,
              }
            },
          },
        },
      },
    };
    const result = {
      field1: {
        type: Array,
        from: 'field_1',
        item: {
          type: Object,
          fields: {
            field11: {
              type: String,
              from: 'field_11',
            },
            field12: {
              type: Object,
              from: 'field_12',
              fields: {
                field121: {
                  type: Number,
                  from: 'field_121',
                },
              },
            },
          }
        }
      },
    };
    expect(generateSnakeCaseFromCamelCaseModel(model)).toEqual(result);
  });
});
