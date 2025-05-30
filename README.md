# Models validator
![Run tests](https://github.com/SergTyapkin/js-models-validator/workflows/Run%20tests/badge.svg)
![downloads](https://img.shields.io/npm/dt/%40sergtyapkin%2Fmodels-validator)

**🎉 Be sure of the right types of incoming data with this! 🎉**

Models Validator for Objects.
For example, for JSON-parsed Objects that received from network. <br>
_You can see examples in tests [validateModel.test.js](./tests/validateModel.test.js)_

---
# ⏩ Docs for validateModel
> [!IMPORTANT]
> All model fields describes as:
> <br> `from`: `fieldType`

### 📝 `fieldType` can be declared as:

1. <u><b>Simple type</b></u>: `String`, `Number`, `Date`, `Object`, `Array`,... (`Array` in this case can contain any elements of any types)
2. <u><b>Enum</b></u>: `new Set(["some_val", 456, "val2"])` (Field can only be `"some_val"` or `456` or `"val2"`)
3. <u><b>One of types</b></u>: `new Set([Number, Boolean])` (Field can only be `Number` or `Boolean`. Not string or any other type)
4. <u><b>Specialized Array</b></u> <i>(fixed length)</i>: `[Number, String, String]` (specialized type of every element in array)
5. <u><b>Specialized Array</b></u> <i>(unlimited length)</i>:
  ```JS
  {
    fieldName: {
      {   
        type: Array,
        item: /**{{any fieldType declaration}}**/,
      }
    }
  }
  ```
6. <u><b>Long type declaration</b></u> (you can set `optional`, `default` and `from` params):
  ```JS
  {
    fieldName: {
      type: /**{{short fieldType declaration}}**/,
      optional: true, // |=>  field will not be exists in result object if it's not provided
      default: "SomeDefaultValue", // => If field not provided in source data, it will have this value
      from: "some_name", // |=>  field will be searched in the source model as a field with the name "some_name" 
    }
  }
  ```
7. <u><b>Nested object declaration</b></u>:
  ```JS
  {
    fieldNested: {
      type: Object,
      fields: {
        // field_1: String,
        // field_2: Number,
      }
      // from: "field_nested",
      // optional: true,
      // default: null,
    }
  }
  ```

## ⚙ All fields options at long declaration:

| Field      | Type                                         | Description                                                                                     |
|------------|----------------------------------------------|-------------------------------------------------------------------------------------------------|
| `type`     | `{{short fieldType}}`                        | Describes the type to which the original field value is converted                               |
| `optional` | `Boolean]                                    | If it has value "false", field can be not provided.                                             |
| `default`  | `Any value that converts to declared 'type'` | If field is `optional` and it's not provided in source data, it will have this value.           |
| `from`     | `String`                                     | Name of field with which it will be searched in the source model.                               |
| `item`     | `{{long or short fieldType}}`                | If field type is `Array`, it can be long or short declaring of field type.                      |
| `fields`   | `Object with other fields`                   | If field type is `Object`, it must be Object with long or short declaring of each object field. |

----
## Example model description:
```JS
const exampleModel = {
  field1: String, // |=> "some_string"
  field2: Number, // |=> 123.4123
  field3: Object, // |=> {any_fields: any_values, ...}
  field4: Array,  // |=> [any_types, ...]
  field5: [Number, String], // |=> [123.1244, "some_string"]
  field6: new Set(["some_val", 456, "val2"]), // |=> Enumeration. Can only be "some_val" or 456 or "val2"
  field7: new Set([String, Boolean]), // |=> 123.231 or `false` but not "any string" or any other type
  field8: { // Equals as `field8: String`
    type: String
  }, 
  field9: {
    type: Object,
    fields: {
      // ... Any fields of nested model, for example:
      field9_1: String,
    },
  },
  field10: {
    type: Number,
    optional: true, // |=>  field will not be exists in result object if it's not provided
  },
  field11: {
    type: Array,
    item: String, // |=> short or long declaration of each field in array
    from: "some_field_11", // |=> field will searched as field "some_field_11" and written in "field11"
  },
  field12: {
    type: Array,
    item: {  // example of long declaration of each field in array:
      type: Object,
      fields: {
        field12_1: String,
      }
    },
  },
}
```
---
## Example model validation:

```JS
import { validateModel } from '@sergtyapkin/models-validator';

const UserModel = { // declare model
  age: Number,
  userName: {
    type: [String, String], // maybe ["john", "doe"]
    from: "user_name", // name in incoming data for validation
  }, 
  sex: new Set(['male', 'female']), // one of two values
  children: {
    type: Array, // array with unlimited length
    optional: true, // mey be not exists
    item: {
      type: Object,
      fields: {
        name: String,
        age: Number,
      }
    }
  }
}

const response = fetch('/user', {method: 'GET'}); // get unvalidated JSON data
const data = validateModel(UserModel, await response.text()); // validate
```

_For more examples you can see file with tests [validateModel.test.js](./tests/validateModel.test.js)_

---
# ♻️ Reverse validation

Use the function `reverseValidateModel` to compress validated model back.
If in model was fields with `from` params, reverse validating will writes values in this fields
in fields which names describes in `from` params.

### Example:
```JS
import { validateModel, reverseValidateModel } from '@sergtyapkin/models-validator';

// STRAIGHT VALIDATING
const Model = { // declare model
  userName: {
    type: [String, String], // maybe ["john", "doe"]
    from: "user_name_snake_case", // name in incoming data for validation 
  }, 
  userAge: {
    type: Number,
    from: "user_age_snake_case",
  }
}

const unvalidatedData = {
  user_name_snake_case: ["John", "Doe"],
  user_age_snake_case: 30,
}
const data = validateModel(Model, unvalidatedData);
/* data = {
  userName: ["John", "Doe"],
  userAge: 30,
}
*/

// REVERSE VALIDATING
const reversedData = reverseValidateModel(Model, data);
/* reversedData = {
  user_name_snake_case: ["John", "Doe"],
  user_age_snake_case: 30,
}
*/
```

---
# 🔁 snake_case and CamelCase generators
You can describe model in only camelCase or PascalCase fields and generator
adds longDeclaring param `from` with snake_case field name. Or vice versa.
 
### Example:
```JS
/** CamelCase -> snake_case **/
import { generateSnakeCaseFromCamelCaseModel } from '@sergtyapkin/models-validator';

const Model = generateSnakeCaseFromCamelCaseModel({ // declare model
  someUSERName: String,
  UserAgePascalCase: Number,
});
/* Model = {
  someUSERName: {
    type: String,
    from: "some_user_name",
  }, 
  UserAgePascalCase: {
    type: Number,
    from: "user_age_pascal_case",
  }
}
 */
```
```JS
/** snake_case -> CamelCase **/
import { generateCamelCaseFromSnakeCaseModel } from '@sergtyapkin/models-validator';

const Model = generateCamelCaseFromSnakeCaseModel({ // declare model
  some_user_name: String, 
  user_age_snake_case: Number,
});
/* Model = {
  some_user_name: {
    type: String,
    from: "someUserName",
  }, 
  user_age_snake_case: {
    type: Number,
    from: "userAgeSnakeCase",
  }
}
 */
```

---
# ✂️ Shortcuts
You can describe long types, simple Array or Object fields shortly:
 
```JS
import { Type, ArrayType, ObjectType } from '@sergtyapkin/models-validator';

const Model = { // declare model
  someField: Type(String, true, 'default value'),
};
/* Model = {
  someField: {
    type: String,
    optional: true,
    default: 'default value',
  }, 
}
 */

const ModelWithArray = { // declare model
  someArray: ArrayType(String),
};
/* ModelWithArray = {
  someArrayStr: {
    type: Array,
    item: String,
  }, 
}
 */

const ModelWithObject = { // declare model
  someObject: ObjectType({
    field1: String,
    field2: Number,
  }),
};
/* ModelWithObject = {
  someObject: {
    type: Object,
    fields: {
      field1: String,
      field2: Number,
    },
  }, 
}
 */

const ModelWithObjectInArray = { // declare model
  someObjectInArray: ArrayType({
    field1: String,
    field2: Number,
  }),
};
/* ModelWithObjecwtInArray = {
  someObjectInArray: {
    type: Array,
    item: {
      type: Object,
      fields: {
        field1: String,
        field2: Number,
      },
    },
  }, 
}
 */
```
