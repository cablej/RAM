import {connectDisconnectMongo, resetDataInMongo} from './helpers';
import {
    IRelationshipAttributeName,
    RelationshipAttributeNameModel,
    RelationshipAttributeNameDomain,
    RelationshipAttributeNameClassifier} from '../models/relationshipAttributeName.model';
import {RelationshipAttributeNameUsageModel} from '../models/relationshipAttributeNameUsage.model';
import {IRelationshipType, RelationshipTypeModel, RelationshipTypeCategory} from '../models/relationshipType.model';

/* tslint:disable:max-func-body-length */
describe('RAM Relationship Attribute Name', () => {

    connectDisconnectMongo();
    resetDataInMongo();

    let stringRelationshipAttributeNameNoEndDate: IRelationshipAttributeName;
    let stringRelationshipAttributeNameFutureEndDate: IRelationshipAttributeName;
    let stringRelationshipAttributeNameExpiredEndDate: IRelationshipAttributeName;
    let singleSelectRelationshipAttributeNameNoEndDate: IRelationshipAttributeName;

    let relationshipType1: IRelationshipType;

    beforeEach(async (done) => {

        try {

            stringRelationshipAttributeNameNoEndDate = await RelationshipAttributeNameModel.create({
                code: 'ATTRIBUTE_NAME_1',
                shortDecodeText: 'Attribute Name',
                longDecodeText: 'Attribute Name',
                startDate: new Date(),
                domain: RelationshipAttributeNameDomain.String.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: 'category',
                purposeText: 'This attribute purpose text',
                appliesToInstance: true
            });

            stringRelationshipAttributeNameFutureEndDate = await RelationshipAttributeNameModel.create({
                code: 'ATTRIBUTE_NAME_2',
                shortDecodeText: 'Attribute Name',
                longDecodeText: 'Attribute Name',
                startDate: new Date(),
                endDate: new Date(2099, 1, 1),
                domain: RelationshipAttributeNameDomain.String.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: 'category',
                purposeText: 'This attribute purpose text',
                appliesToInstance: true
            });

            stringRelationshipAttributeNameExpiredEndDate = await RelationshipAttributeNameModel.create({
                code: 'ATTRIBUTE_NAME_3',
                shortDecodeText: 'Attribute Name',
                longDecodeText: 'Attribute Name',
                startDate: new Date(2016, 1, 1),
                endDate: new Date(2016, 1, 2),
                domain: RelationshipAttributeNameDomain.String.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: 'category',
                purposeText: 'This attribute purpose text',
                appliesToInstance: true
            });

            singleSelectRelationshipAttributeNameNoEndDate = await RelationshipAttributeNameModel.create({
                code: 'ATTRIBUTE_NAME_4',
                shortDecodeText: 'Attribute Name',
                longDecodeText: 'Attribute Name',
                startDate: new Date(),
                domain: RelationshipAttributeNameDomain.SelectSingle.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: 'category',
                purposeText: 'This attribute purpose text',
                permittedValues: ['Choice 1', 'Choice 2', 'Choice 3'],
                appliesToInstance: true
            });

            relationshipType1 = await RelationshipTypeModel.create({
                code: 'RELATIONSHIP_TYPE_1',
                shortDecodeText: 'Relationship Type 1',
                longDecodeText: 'Relationship Type 1',
                startDate: new Date(),
                category: RelationshipTypeCategory.Authorisation.code,
                attributeNameUsages: [
                    await RelationshipAttributeNameUsageModel.create({
                        optionalInd: true,
                        attributeName: stringRelationshipAttributeNameNoEndDate,
                        sortOrder : 1
                    })
                ]
            });

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }

    });

    it('finds relationship type with inflated attributes', async (done) => {
        try {
            const instance = await RelationshipTypeModel.findByCodeInDateRange(relationshipType1.code, new Date());
            expect(instance).not.toBeNull();
            expect(instance.attributeNameUsages.length).toBe(1);
            expect(instance.attributeNameUsages[0].optionalInd).toBe(true);
            expect(instance.attributeNameUsages[0].sortOrder).toBe(1);
            expect(instance.attributeNameUsages[0].attributeName.domain).toBe(stringRelationshipAttributeNameNoEndDate.domain);
            expect(instance.attributeNameUsages[0].attributeName.purposeText).toBe(stringRelationshipAttributeNameNoEndDate.purposeText);
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('finds in date range with no end date by code', async (done) => {
        try {
            const instance = await RelationshipAttributeNameModel.findByCodeInDateRange(
                stringRelationshipAttributeNameNoEndDate.code, new Date());
            expect(instance).not.toBeNull();
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('finds in date range or invalid by code', async (done) => {
        try {
            const instance = await RelationshipAttributeNameModel.findByCodeIgnoringDateRange(
                stringRelationshipAttributeNameNoEndDate.code);
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
            const instance = await RelationshipAttributeNameModel.findByCodeInDateRange(code, new Date());
            expect(instance).toBeNull();
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('fails find not in date range by code', async (done) => {
        try {
            const instance = await RelationshipAttributeNameModel.findByCodeInDateRange(
                stringRelationshipAttributeNameExpiredEndDate.code, new Date());
            expect(instance).toBeNull();
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('finds with permitted values by code', async (done) => {
        try {
            const instance = await RelationshipAttributeNameModel.findByCodeInDateRange(
                singleSelectRelationshipAttributeNameNoEndDate.code, new Date());
            expect(instance).not.toBeNull();
            expect(instance.permittedValues).not.toBeNull();
            expect(instance.permittedValues.length).toBe(singleSelectRelationshipAttributeNameNoEndDate.permittedValues.length);
            expect(instance.permittedValues[0]).toBe(singleSelectRelationshipAttributeNameNoEndDate.permittedValues[0]);
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('lists ignoring date range', async (done) => {
        try {
            const instances = await RelationshipAttributeNameModel.listIgnoringDateRange();
            expect(instances).not.toBeNull();
            expect(instances.length).toBe(4);
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('lists in date range', async (done) => {
        try {
            const instances = await RelationshipAttributeNameModel.listInDateRange(new Date());
            expect(instances).not.toBeNull();
            expect(instances.length).toBe(3);
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

    it('fails insert with null code', async (done) => {
        try {
            await RelationshipAttributeNameModel.create({
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                domain: RelationshipAttributeNameDomain.String.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: 'category',
                purposeText: 'This attribute purpose text',
                startDate: new Date(),
                appliesToInstance: true
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
            await RelationshipAttributeNameModel.create({
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                domain: RelationshipAttributeNameDomain.String.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: 'category',
                purposeText: 'This attribute purpose text',
                appliesToInstance: true
            });
            fail('should not have inserted with empty code');
            done();
        } catch (e) {
            expect(e.name).toBe('ValidationError');
            expect(e.errors.code).not.toBeNull();
            done();
        }
    });

    it('fails insert with null domain', async (done) => {
        try {
            await RelationshipAttributeNameModel.create({
                code: 'ATTRIBUTE_NAME_X',
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: 'category',
                appliesToInstance: true
            });
            fail('should not have inserted with null domain');
            done();
        } catch (e) {
            expect(e.name).toBe('ValidationError');
            expect(e.errors.domain).not.toBeNull();
            done();
        }
    });

    it('fails insert with invalid domain', async (done) => {
        try {
            await RelationshipAttributeNameModel.create({
                code: 'ATTRIBUTE_NAME_X',
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                domain: '__BOGUS__',
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: 'category',
                purposeText: 'This attribute purpose text',
                appliesToInstance: true
            });
            fail('should not have inserted with invalid domain');
            done();
        } catch (e) {
            expect(e.name).toBe('ValidationError');
            expect(e.errors.domain).not.toBeNull();
            done();
        }
    });

    it('fails insert with null classifier', async (done) => {
        try {
            await RelationshipAttributeNameModel.create({
                code: 'ATTRIBUTE_NAME_X',
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                domain: RelationshipAttributeNameDomain.String.code,
                category: 'category',
                appliesToInstance: true
            });
            fail('should not have inserted with null domain');
            done();
        } catch (e) {
            expect(e.name).toBe('ValidationError');
            expect(e.errors.classifider).not.toBeNull();
            done();
        }
    });

    it('fails insert with invalid classifier', async (done) => {
        try {
            await RelationshipAttributeNameModel.create({
                code: 'ATTRIBUTE_NAME_X',
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                domain: RelationshipAttributeNameDomain.String.code,
                classifier: '__BOGUS__',
                category: 'category',
                appliesToInstance: true
            });
            fail('should not have inserted with null domain');
            done();
        } catch (e) {
            expect(e.name).toBe('ValidationError');
            expect(e.errors.classifider).not.toBeNull();
            done();
        }
    });

    it('fails insert with null purpose text', async (done) => {
        try {
            await RelationshipAttributeNameModel.create({
                code: 'ATTRIBUTE_NAME_X',
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                domain: RelationshipAttributeNameDomain.String.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: 'category',
                appliesToInstance: true
            });
            fail('should not have inserted with null purpose text');
            done();
        } catch (e) {
            expect(e.name).toBe('ValidationError');
            expect(e.errors.purposeText).not.toBeNull();
            done();
        }
    });

    it('fails insert with empty purpose text', async (done) => {
        try {
            await RelationshipAttributeNameModel.create({
                code: 'ATTRIBUTE_NAME_X',
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                domain: RelationshipAttributeNameDomain.String.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: 'category',
                purposeText: '',
                appliesToInstance: true
            });
            fail('should not have inserted with empty purpose text');
            done();
        } catch (e) {
            expect(e.name).toBe('ValidationError');
            expect(e.errors.purposeText).not.toBeNull();
            done();
        }
    });

    it('fails insert with duplicate code', async (done) => {
        try {

            const code = 'CODE_DUPLICATE';

            await RelationshipAttributeNameModel.create({
                code: code,
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                domain: RelationshipAttributeNameDomain.String.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: 'category',
                purposeText: 'This attribute purpose text',
                appliesToInstance: true
            });

            await RelationshipAttributeNameModel.create({
                code: code,
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                domain: RelationshipAttributeNameDomain.String.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: 'category',
                purposeText: 'This attribute purpose text',
                appliesToInstance: true
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

    it('converts domain to enum', async (done) => {
        try {
            expect(stringRelationshipAttributeNameNoEndDate).not.toBeNull();
            expect(stringRelationshipAttributeNameNoEndDate.domain).toBe(RelationshipAttributeNameDomain.String.code);
            expect(stringRelationshipAttributeNameNoEndDate.domainEnum()).toBe(RelationshipAttributeNameDomain.String);
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

});