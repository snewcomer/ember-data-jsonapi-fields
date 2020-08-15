import RESTAdapter from '@ember-data/adapter/rest';

const FieldsForRecord = new WeakMap();

export class JSONAPIFieldsAdapter extends RESTAdapter {
  /**
    @method buildQuery
    @public
    @param  {Snapshot} snapshot
    @return {Object}
    */
  buildQuery(snapshot) {
    let query = super.buildQuery(...arguments);

    if (snapshot.adapterOptions) {
      let { fields } = snapshot.adapterOptions;

      if (fields) {
        query.fields = fields;
      }
    }

    return query;
  }

  /**
    The same snapshot might be requested multiple times. If you request a same snapshot with different fields, the
    record will be fetched and will block user interaction.

    @method shouldReloadRecord
    @param {Store} store
    @param {Snapshot} snapshot
    @return {Boolean}
    */
  shouldReloadRecord(store, snapshot) {
    let snapshotFields = snapshot.adapterOptions && snapshot.adapterOptions.fields;
    if (snapshotFields) {
      let { identifier } = snapshot._internalModel;
      return captureFields(identifier, snapshotFields);
    }

    return false;
  }

  /**
    In order to provide proper should reload tracking, we need to track if `fields`
    was passed through adapterOptions.

    @method findRecord
    @param {Store} store
    @param {Model} type
    @param {String} id
    @param {Snapshot} snapshot
    @return {Promise} promise
    */
  findRecord(store, type, id, snapshot) {
    let snapshotFields = snapshot.adapterOptions && snapshot.adapterOptions.fields;
    if (snapshotFields) {
      let { identifier } = snapshot._internalModel;
      captureFields(identifier, snapshotFields);
    }

    return super.findRecord(...arguments);
  }
}

function hasSomeFields(cachedFields, snapshotFields) {
  const listOfCachedFields = cachedFields.split(',').map(field => field.trim());
  const listOfSnapshotFields = snapshotFields.split(',').map(field => field.trim());

  return (
    listOfSnapshotFields.every(i => listOfCachedFields.indexOf(i) > -1) ||
    (listOfSnapshotFields.length < listOfCachedFields.length &&
      listOfSnapshotFields.every(i => listOfCachedFields.indexOf(i) > -1))
  );
}

function equalFields(cachedFields, snapshotFields) {
  return cachedFields.some(entry => {
    let isEqual;

    for (let key in snapshotFields) {
      if (entry[key]) {
        // we found a potential match
        isEqual = hasSomeFields(entry[key], snapshotFields[key]);
      } else {
        isEqual = false;
      }

      if (isEqual === false) {
        // if entry doesn't have it, lets move onto the other cached fields
        break;
      }
    }

    return isEqual;
  });
}

export function captureFields(identifier, snapshotFields) {
  let cachedFields = FieldsForRecord.get(identifier);
  if (cachedFields && cachedFields.length) {
    // have seen this record with these fields before - don't fetch
    if (equalFields(cachedFields, snapshotFields)) {
      return false;
    }

    // have seen this record but not these fields - fetch new record
    cachedFields.push(snapshotFields);
    FieldsForRecord.set(identifier, cachedFields);
    return true;
  } else {
    // never seen this record yet
    FieldsForRecord.set(identifier, [snapshotFields]);
    // TODO: Since we capture fields in the initial requests, I don't think this is possible.  However,
    // if we are missing a piece of the puzzle, then should we reload or not? Or just return undefined?
    return true;
  }
}
