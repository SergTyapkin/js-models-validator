# Models validator
![npm](https://img.shields.io/npm/dt/%40sergtyapkin%2Fmodels-validator)

Models Validator for Objects.
For example, for JSON-parsed Objects that received from network.

---
## Docs for models:
All model fields describes as:
<br> `fieldName`: `fieldType`

`fieldType` can be declared as:

- Simple type: `String`, `Number`, `Date`, `Object`, `Array`,...
  > `Array` in this case can contain any elements of any types
- Enum: `new Set(["some_val", 456, "val2"])` (Field can only be `"some_val"` or `456` or `"val2"`)
- Specialized Array (fixed length): `[Number, String, String]` (specialized type of every element in array)
- Specialized Array (unlimited length):
  ```JS
  {
    type: Array,
    item: /**{{fieldType}}**/,
  }
  ```
- Long type declaration (you can set `optional` param):
  ```JS
  {
    type: /**{{fieldType}}**/,
    optional: true, // |=>  field will not be exists in result object if it's not provided
  }
  ```
- Nested object declaration:
  ```JS
  {
    type: Object,
    fields: {
      // fieldName: fieldType,
      // ...    
    }
  }
  ```

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
  field7: {
    type: String
  }, // Equals as `field7: String`
  field8: {
    type: Object,
    fields: {
      // ... Any fields of nested model, for example:
      field8_1: String,
    },
  },
  field9: {
    type: Number,
    optional: true, // |=>  field will not be exists in result object if it's not provided
  },
  field10: {
    type: Array,
    item: String, // |=> short or long declaration of each field in array
  },
  field11: {
    type: Array,
    item: {  // example of long declaration of each field in array:
      type: Object,
      fields: {
        field11_1: String,
      }
    },
  },
}
```
---
## Example model validation:

```JS
const UserModel = { // declare model
  value: Number,
  userName: [String, String],
  sex: new Set(['male', 'female']),
  children: {
    type: Array,
    optional: true,
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
