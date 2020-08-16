import { module, test } from 'qunit';
import { resolve } from 'rsvp';

import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import JSONAPISerializer from '@ember-data/serializer/json-api'
import { setupTest } from 'ember-qunit';

import { JSONAPIFieldsAdapter } from 'ember-data-jsonapi-fields';

let store, adapter;
let passedUrl, passedVerb, passedHash;

let Post, Comment;

module('integration/adapter/json-api-adapter - JSONAPIAdapter', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    Post = Model.extend({
      title: attr('string'),
      comments: hasMany('comment', { async: true }),
    });

    Comment = Model.extend({
      text: attr('string'),
      post: belongsTo('post', { async: true }),
    });

    const MyJSONAPIAdapter = JSONAPIFieldsAdapter.extend({
      // background requests will fail test
      shouldBackgroundReloadRecord() {
        return false;
      },
    });
    this.owner.register('adapter:application', MyJSONAPIAdapter);
    this.owner.register('serializer:application', JSONAPISerializer.extend());

    this.owner.register('model:post', Post);
    this.owner.register('model:comment', Comment);

    store = this.owner.lookup('service:store');
    adapter = store.adapterFor('application');
  });

  function ajaxResponse(responses) {
    let counter = 0;
    let index;

    passedUrl = [];
    passedVerb = [];
    passedHash = [];

    adapter.ajax = function(url, verb, hash) {
      index = counter++;

      passedUrl[index] = url;
      passedVerb[index] = verb;
      passedHash[index] = hash;

      return resolve(responses[index]);
    };
  }

  test('find a single record', async function(assert) {
    assert.expect(3);

    ajaxResponse([
      {
        data: {
          type: 'post',
          id: '1',
          attributes: {
            title: 'Ember.js rocks',
          },
        },
      },
    ]);

    let post = await store.findRecord('post', '1');

    assert.equal(passedUrl[0], '/posts/1', 'Builds URL correctly');
    assert.equal(post.get('id'), '1', 'Stores record with correct id');
    assert.equal(post.get('title'), 'Ember.js rocks', 'Title for record is correct');
  });

  test('findRecord - passes `fields` as a query parameter to ajax', async function(assert) {
    ajaxResponse([
      {
        data: {
          type: 'post',
          id: '1',
          attributes: {
            title: 'Ember.js rocks',
          },
        },
      },
    ]);

    await store.findRecord('post', 1, { adapterOptions: { fields: { post: 'title,body' } } });

    assert.deepEqual(passedHash[0].data, { fields: { post: 'title,body' } }, '`fields` parameter sent to adapter.ajax');
    assert.equal(passedUrl[0], '/posts/1', 'The primary record post:1 was fetched by the correct url');
  });

  test('findRecord - does not fetch again after successive calls', async function(assert) {
    ajaxResponse([
      {
        data: {
          type: 'post',
          id: '1',
          attributes: {
            title: 'Ember.js rocks',
          },
        },
      },
    ]);

    await store.findRecord('post', 1, { adapterOptions: { fields: { post: 'title,body' } } });

    assert.deepEqual(passedHash[0].data, { fields: { post: 'title,body' } }, '`fields` parameter sent to adapter.ajax');
    assert.equal(passedUrl[0], '/posts/1', 'The primary record post:1 was fetched by the correct url');

    // if fields are different, this test will fail b/c it will initiate a request
    await store.findRecord('post', 1, { adapterOptions: { fields: { post: 'title,body' } } });

    assert.deepEqual(passedHash[0].data, { fields: { post: 'title,body' } }, '`fields` parameter sent to adapter.ajax');
    assert.equal(passedUrl[0], '/posts/1', 'The primary record post:1 was fetched by the correct url');
  });

  test('findRecord - passes `fields` and `includes` as a query parameter to ajax', async function(assert) {
    ajaxResponse([
      {
        data: {
          type: 'post',
          id: '1',
          attributes: {
            title: 'Ember.js rocks',
          },
        },
      },
    ]);

    await store.findRecord('post', 1, { adapterOptions: { fields: { post: 'title,body' } }, include: 'comments' });

    assert.deepEqual(
      passedHash[0].data,
      { fields: { post: 'title,body' }, include: 'comments' },
      '`fields` parameter sent to adapter.ajax'
    );
  });
});
