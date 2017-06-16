/* global describe, it, expect */
import {Loki as loki} from '../../../src/core/loki';

describe('dynamicviews', () => {
  let testRecords;

  beforeEach(() => {
    testRecords = [
			{name: 'mjolnir', owner: 'thor', maker: 'dwarves'},
			{name: 'gungnir', owner: 'odin', maker: 'elves'},
			{name: 'tyrfing', owner: 'Svafrlami', maker: 'dwarves'},
			{name: 'draupnir', owner: 'odin', maker: 'elves'}
    ];
  });

  describe('test empty filter across changes', () => {
    it('works', () => {

      const db = new loki('dvtest');
      const items = db.addCollection('users');
      items.insert(testRecords);
      const dv = items.addDynamicView();

			// with no filter, results should be all documents
      let results = dv.data();
      expect(results.length).toBe(4);

			// find and update a document which will notify view to re-evaluate
      const gungnir = items.findOne({'name': 'gungnir'});
      expect(gungnir.owner).toBe('odin');
      gungnir.maker = 'dvalin';
      items.update(gungnir);

      results = dv.data();
      expect(results.length).toBe(4);
    });
  });

  describe('dynamic view rematerialize works as expected', () => {
    it('works', () => {
      const db = new loki('dvtest');
      const items = db.addCollection('users');
      items.insert(testRecords);
      const dv = items.addDynamicView();

      dv.applyFind({'owner': 'odin'});
      dv.applyWhere((obj) => obj.maker === 'elves');

      expect(dv.data().length).toEqual(2);
      expect(dv._filterPipeline.length).toEqual(2);

      dv.rematerialize({removeWhereFilters: true});
      expect(dv.data().length).toEqual(2);
      expect(dv._filterPipeline.length).toEqual(1);
    });
  });

  describe('dynamic view toJSON does not circularly reference', () => {
    it('works', () => {
      const db = new loki('dvtest');
      const items = db.addCollection('users');
      items.insert(testRecords);
      const dv = items.addDynamicView();

      const obj = dv.toJSON();
      expect(obj._collection).toEqual(undefined);
    });
  });

  describe('dynamic view removeFilters works as expected', () => {
    it('works', () => {
      const db = new loki('dvtest');
      const items = db.addCollection('users');
      items.insert(testRecords);
      const dv = items.addDynamicView("ownr");

      dv.applyFind({'owner': 'odin'});
      dv.applyWhere((obj) => obj.maker === 'elves');

      expect(dv._filterPipeline.length).toEqual(2);
      expect(dv.data().length).toEqual(2);

      dv.removeFilters();
      expect(dv._filterPipeline.length).toEqual(0);
      expect(dv.count()).toEqual(4);
    });
  });

  describe('removeDynamicView works correctly', () => {
    it('works', () => {
      const db = new loki('dvtest');
      const items = db.addCollection('users');
      items.insert(testRecords);
      const dv = items.addDynamicView("ownr", {persistent: true});

      dv.applyFind({'owner': 'odin'});
      dv.applyWhere((obj) => obj.maker === 'elves');

      expect(items._dynamicViews.length).toEqual(1);

      items.removeDynamicView('ownr');
      expect(items._dynamicViews.length).toEqual(0);
    });
  });

});
