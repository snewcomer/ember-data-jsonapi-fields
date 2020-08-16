ember-data-jsonapi-fields
==============================================================================

Currently, [@ember/data](https://github.com/emberjs/data) does not handle support for JSONAPI [fields](https://jsonapi.org/format/#document-resource-object-fields).  [`fields`](https://jsonapi.org/format/#fetching-sparse-fieldsets) allows you to serve a minimal payload, saving time on the wire. This will change in the future.  However, the current system does not allow for a robust, drop in replacement for everyone.  In the meantime, this addon exists!


Compatibility
------------------------------------------------------------------------------

* Ember.js v3.8 or above
* Ember CLI v2.13 or above
* Node.js v8 or above


Installation
------------------------------------------------------------------------------

```
ember install ember-data-jsonapi-fields
```


You want to use this
------------------------------------------------------------------------------

```js
import { JSONAPIFieldsAdapter } from 'ember-data-jsonapi-fields';

export default class MyJSONAPIAdapter extends JSONAPIFieldsAdapter {
  ...
}
```
```js
store.findRecord('post', 123, {
  adapterOptions: { fields: { post: 'name,body' } }
});

// Note: @ember/data already includes support for `includes`.
store.findRecord('post', 123, {
  adapterOptions: { fields: { post: 'name,body', comments: 'title' } }, include: 'comments'
});
```

You may not want to use this
------------------------------------------------------------------------------

You may not want to install this addon for a variety of reasons.  One might be your visceral reaction to installing yet another library.

There is one case you might want to roll your own implementation.  If you don't care about caching mechanisms, simply override `buildQuery`.

```js
import JSONAPIAdapter from '@ember-data/adapter/json-api';

export default ApplicationAdapter extends JSONAPIAdapter {
  buildQuery(snapshot) {
    let query = this._super(...arguments);

    if (snapshot.adapterOptions) {
      let { fields } = snapshot.adapterOptions;

      if (fields) {
        query.fields = fields;
      }
    }

    return query;
  },
}
```

Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
