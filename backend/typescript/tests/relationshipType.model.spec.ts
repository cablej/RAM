import {connectDisconnectMongo, resetDataInMongo} from './helpers';
import {IRelationshipType, RelationshipTypeModel, RelationshipTypeCategory} from '../models/relationshipType.model';

/* tslint:disable:max-func-body-length */
describe('RAM Relationship Type', () => {

    connectDisconnectMongo();
    resetDataInMongo();

    let relationshipTypeNoEndDate: IRelationshipType;
    let relationshipTypeFutureEndDate: IRelationshipType;
    let relationshipTypeExpiredEndDate: IRelationshipType;

    beforeEach(async (done) => {

        try {

            relationshipTypeNoEndDate = await RelationshipTypeModel.create({
                code: 'RELATIONSHIP_TYPE_1',
                shortDecodeText: 'Relationship Type 1',
                longDecodeText: 'Relationship Type 1',
                startDate: new Date(),
                attributeNameUsages: [],
                category: RelationshipTypeCategory.Authorisation.code
            });

            relationshipTypeFutureEndDate = await RelationshipTypeModel.create({
                code: 'RELATIONSHIP_TYPE_2',
                shortDecodeText: 'Relationship Type 2',
                longDecodeText: 'Relationship Type 2',
                startDate: new Date(),
                endDate: new Date(2099, 1, 1),
                attributeNameUsages: [],
                category: RelationshipTypeCategory.Authorisation.code
            });

            relationshipTypeExpiredEndDate = await RelationshipTypeModel.create({
                code: 'RELATIONSHIP_TYPE_3',
                shortDecodeText: 'Relationship Type 3',
                longDecodeText: 'Relationship Type 3',
                startDate: new Date(2016, 1, 1),
                endDate: new Date(2016, 1, 2),
                attributeNameUsages: [],
                category: RelationshipTypeCategory.Authorisation.code
            });

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }

    });

    it('finds in date range with no end date by code', async (done) => {
        try {
            const instance = await RelationshipTypeModel.findByCodeInDateRange(relationshipTypeNoEndDate.code, new Date());
            expect(instance).not.toBeNull();
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('finds in date range with future end date by code', async (done) => {
        try {
            const instance = await RelationshipTypeModel.findByCodeInDateRange(relationshipTypeFutureEndDate.code, new Date());
            expect(instance).not.toBeNull();
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('finds in date range or invalid by code', async (done) => {
        try {
            const instance = await RelationshipTypeModel.findByCodeIgnoringDateRange(relationshipTypeExpiredEndDate.code);
            expect(instance).not.toBeNull();
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('fails find in date range by non-existent code', async (done) => {
        try {
            const code = '__BOGUS__';
            const instance = await RelationshipTypeModel.findByCodeInDateRange(code, new Date());
            expect(instance).toBeNull();
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('fails find not in date range by code', async (done) => {
        try {
            const instance = await RelationshipTypeModel.findByCodeInDateRange(relationshipTypeExpiredEndDate.code, new Date());
            expect(instance).toBeNull();
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('lists ignoring date range', async (done) => {
        try {
            const instances = await RelationshipTypeModel.listIgnoringDateRange();
            expect(instances).not.toBeNull();
            expect(instances.length).toBe(3);
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('lists in date range', async (done) => {
        try {
            const instances = await RelationshipTypeModel.listInDateRange(new Date());
            expect(instances).not.toBeNull();
            expect(instances.length).toBe(2);
            instances.forEach((instance) => {
                expect(instance.startDate.valueOf()).toBeLessThan(new Date().valueOf());
                if (instance.endDate) {
                    expect(instance.endDate.valueOf()).toBeGreaterThan(new Date().valueOf());
                }
            });
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('inserts with valid values', async (done) => {
        try {

            const minCredentialStrength = 5;
            const minIdentityStrength = 6;

            const instance = await RelationshipTypeModel.create({
                code: 'CODE_1',
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                minCredentialStrength: minCredentialStrength,
                minIdentityStrength: minIdentityStrength,
                category: RelationshipTypeCategory.Authorisation.code
            });

            expect(instance).not.toBeNull();
            expect(instance.id).not.toBeNull();
            expect(instance.code).not.toBeNull();

            const retrievedInstance = await RelationshipTypeModel.findByCodeInDateRange(instance.code, new Date());
            expect(retrievedInstance).not.toBeNull();
            expect(retrievedInstance.id).toBe(instance.id);
            expect(retrievedInstance.minCredentialStrength).toBe(minCredentialStrength);
            expect(retrievedInstance.minIdentityStrength).toBe(minIdentityStrength);

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('fails insert with null code', async (done) => {
        try {
            await RelationshipTypeModel.create({
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                category: RelationshipTypeCategory.Authorisation.code
            });
            fail('should not have inserted with null code');
            done();
        } catch (e) {
            expect(e.name).toBe('ValidationError');
            expect(e.errors.code).not.toBeNull();
            done();
        }
    });

    it('fails insert with empty code', async (done) => {
        try {
            await RelationshipTypeModel.create({
                code: '',
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                category: RelationshipTypeCategory.Authorisation.code
            });
            fail('should not have inserted with empty code');
            done();
        } catch (e) {
            expect(e.name).toBe('ValidationError');
            expect(e.errors.code).not.toBeNull();
            done();
        }
    });

    it('fails insert with duplicate code', async (done) => {
        try {

            const code = 'CODE_DUPLICATE';

            await RelationshipTypeModel.create({
                code: code,
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                category: RelationshipTypeCategory.Authorisation.code
            });

            await RelationshipTypeModel.create({
                code: code,
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                category: RelationshipTypeCategory.Authorisation.code
            });

            fail('should not have inserted with duplicate code');
            done();

        } catch (e) {
            expect(e.name).toBe('ValidationError');
            expect(e.errors.code).not.toBeNull();
            expect(e.errors.code.message).toContain('unique');
            done();
        }
    });

});