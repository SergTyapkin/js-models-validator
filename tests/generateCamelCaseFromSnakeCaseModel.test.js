import {generateCamelCaseFromSnakeCaseModel} from "../dist/index.js";

describe('Simple short declaration', () => {
  it('Simple', () => {
    const model = {
      field_one: String,
      field_two: Number,
    };
    const result = {
      field_one: {
        type: String,
        from: 'fieldOne',
      },
      field_two: {
        type: Number,
        from: 'fieldTwo',
      },
    };
    expect(generateCamelCaseFromSnakeCaseModel(model)).toEqual(result);
  });

  it('Numbers', () => {
    const model = {
      field_1_one_10: String,
      field_2_two_222: Number,
    };
    const result = {
      field_1_one_10: {
        type: String,
        from: 'field1One10',
      },
      field_2_two_222: {
        type: Number,
        from: 'field2Two222',
      },
    };
    expect(generateCamelCaseFromSnakeCaseModel(model)).toEqual(result);
  });

  it('Caps', () => {
    const model = {
      field_ONE_Two: String,
      FIELD_TWO_ONE: Number,
    };
    const result = {
      field_ONE_Two: {
        type: String,
        from: 'fieldONETwo',
      },
      FIELD_TWO_ONE: {
        type: Number,
        from: 'FIELDTWOONE',
      },
    };
    expect(generateCamelCaseFromSnakeCaseModel(model)).toEqual(result);
  });

  it('No effects', () => {
    const model = {
      field1: String,
      field2: Number,
    };
    const result = {
      field1: String,
      field2: Number,
    };
    expect(generateCamelCaseFromSnakeCaseModel(model)).toEqual(result);
  });


  it('Different types', () => {
    const model = {
      field_1: [String, Number],
      field_2: new Set(['some_string', 123]),
      field_3: {
        type: String,
        optional: true,
      },
      field_4: {
        type: Array,
      },
      field_5: {
        type: Object,
      },
    };
    const result = {
      field_1: {
        type: [String, Number],
        from: 'field1',
      },
      field_2: {
        type: new Set(['some_string', 123]),
        from: 'field2',
      },
      field_3: {
        type: String,
        optional: true,
        from: 'field3',
      },
      field_4: {
        type: Array,
        from: 'field4',
      },
      field_5: {
        type: Object,
        from: 'field5',
      },
    };
    expect(generateCamelCaseFromSnakeCaseModel(model)).toEqual(result);
  });

  it('Arrays', () => {
    const model = {
      field_1: {
        type: Array,
        item: String,
      },
    };
    const result = {
      field_1: {
        type: Array,
        item: String,
        from: 'field1',
      },
    };
    expect(generateCamelCaseFromSnakeCaseModel(model)).toEqual(result);
  });

  it('Nested objects', () => {
    const model = {
      field_1: {
        type: Object,
        fields: {
          field_1_1: String,
          field_1_2: Number,
        },
      },
    };
    const result = {
      field_1: {
        type: Object,
        from: 'field1',
        fields: {
          field_1_1: {
            type: String,
            from: 'field11',
          },
          field_1_2: {
            type: Number,
            from: 'field12',
          },
        }
      },
    };
    expect(generateCamelCaseFromSnakeCaseModel(model)).toEqual(result);
  });

  it('Nested objects in arrays', () => {
    const model = {
      field_1: {
        type: Array,
        item: {
          type: Object,
          fields: {
            field_11: String,
            field_12: {
              type: Object,
              fields: {
                field_121: Number,
              }
            },
          },
        },
      },
    };
    const result = {
      field_1: {
        type: Array,
        from: 'field1',
        item: {
          type: Object,
          fields: {
            field_11: {
              type: String,
              from: 'field11',
            },
            field_12: {
              type: Object,
              from: 'field12',
              fields: {
                field_121: {
                  type: Number,
                  from: 'field121',
                },
              },
            },
          }
        }
      },
    };
    expect(generateCamelCaseFromSnakeCaseModel(model)).toEqual(result);
  });
});
