import {connectDisconnectMongo, resetDataInMongo} from './helpers';
import {
    IRoleAttributeName,
    RoleAttributeNameModel,
    RoleAttributeNameDomain,
    RoleAttributeNameClassifier} from '../models/roleAttributeName.model';
import {RoleAttributeNameUsageModel} from '../models/roleAttributeNameUsage.model';
import {IRoleType, RoleTypeModel} from '../models/roleType.model';

/* tslint:disable:max-func-body-length */
describe('RAM Role Attribute Name', () => {

    connectDisconnectMongo();
    resetDataInMongo();

    let stringRoleAttributeNameNoEndDate: IRoleAttributeName;
    let stringRoleAttributeNameFutureEndDate: IRoleAttributeName;
    let stringRoleAttributeNameExpiredEndDate: IRoleAttributeName;
    let singleSelectRoleAttributeNameNoEndDate: IRoleAttributeName;

    let roleType1: IRoleType;

    beforeEach(async (done) => {

        try {

            stringRoleAttributeNameNoEndDate = await RoleAttributeNameModel.create({
                code: 'ATTRIBUTE_NAME_1',
                shortDecodeText: 'Attribute Name',
                longDecodeText: 'Attribute Name',
                startDate: new Date(),
                domain: RoleAttributeNameDomain.String.code,
                classifier: RoleAttributeNameClassifier.Other.code,
                category: 'category',
                purposeText: 'This attribute purpose text',
                appliesToInstance: true
            });

            stringRoleAttributeNameFutureEndDate = await RoleAttributeNameModel.create({
                code: 'ATTRIBUTE_NAME_2',
                shortDecodeText: 'Attribute Name',
                longDecodeText: 'Attribute Name',
                startDate: new Date(),
                endDate: new Date(2099, 1, 1),
                domain: RoleAttributeNameDomain.String.code,
                classifier: RoleAttributeNameClassifier.Other.code,
                category: 'category',
                purposeText: 'This attribute purpose text',
                appliesToInstance: true
            });

            stringRoleAttributeNameExpiredEndDate = await RoleAttributeNameModel.create({
                code: 'ATTRIBUTE_NAME_3',
                shortDecodeText: 'Attribute Name',
                longDecodeText: 'Attribute Name',
                startDate: new Date(2016, 1, 1),
                endDate: new Date(2016, 1, 2),
                domain: RoleAttributeNameDomain.String.code,
                classifier: RoleAttributeNameClassifier.Other.code,
                category: 'category',
                purposeText: 'This attribute purpose text',
                appliesToInstance: true
            });

            singleSelectRoleAttributeNameNoEndDate = await RoleAttributeNameModel.create({
                code: 'ATTRIBUTE_NAME_4',
                shortDecodeText: 'Attribute Name',
                longDecodeText: 'Attribute Name',
                startDate: new Date(),
                domain: RoleAttributeNameDomain.SelectSingle.code,
                classifier: RoleAttributeNameClassifier.Other.code,
                category: 'category',
                purposeText: 'This attribute purpose text',
                permittedValues: ['Choice 1', 'Choice 2', 'Choice 3'],
                appliesToInstance: true
            });

            roleType1 = await RoleTypeModel.create({
                code: 'RELATIONSHIP_TYPE_1',
                shortDecodeText: 'Role Type 1',
                longDecodeText: 'Role Type 1',
                startDate: new Date(),
                attributeNameUsages: [
                    await RoleAttributeNameUsageModel.create({
                        optionalInd: true,
                        attributeName: stringRoleAttributeNameNoEndDate
                    })
                ]
            });

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }

    });

    it('finds role type with inflated attributes', async (done) => {
        try {
            const instance = await RoleTypeModel.findByCodeInDateRange(roleType1.code, new Date());
            expect(instance).not.toBeNull();
            expect(instance.attributeNameUsages.length).toBe(1);
            expect(instance.attributeNameUsages[0].optionalInd).toBe(true);
            expect(instance.attributeNameUsages[0].attributeName.domain).toBe(stringRoleAttributeNameNoEndDate.domain);
            expect(instance.attributeNameUsages[0].attributeName.purposeText).toBe(stringRoleAttributeNameNoEndDate.purposeText);
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('finds in date range with no end date by code', async (done) => {
        try {
            const instance = await RoleAttributeNameModel.findByCodeInDateRange(
                stringRoleAttributeNameNoEndDate.code, new Date());
            expect(instance).not.toBeNull();
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('finds in date range or invalid by code', async (done) => {
        try {
            const instance = await RoleAttributeNameModel.findByCodeIgnoringDateRange(
                stringRoleAttributeNameNoEndDate.code);
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
            const instance = await RoleAttributeNameModel.findByCodeInDateRange(code, new Date());
            expect(instance).toBeNull();
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('fails find not in date range by code', async (done) => {
        try {
            const instance = await RoleAttributeNameModel.findByCodeInDateRange(
                stringRoleAttributeNameExpiredEndDate.code, new Date());
            expect(instance).toBeNull();
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('finds with permitted values by code', async (done) => {
        try {
            const instance = await RoleAttributeNameModel.findByCodeInDateRange(
                singleSelectRoleAttributeNameNoEndDate.code, new Date());
            expect(instance).not.toBeNull();
            expect(instance.permittedValues).not.toBeNull();
            expect(instance.permittedValues.length).toBe(singleSelectRoleAttributeNameNoEndDate.permittedValues.length);
            expect(instance.permittedValues[0]).toBe(singleSelectRoleAttributeNameNoEndDate.permittedValues[0]);
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('lists ignoring date range', async (done) => {
        try {
            const instances = await RoleAttributeNameModel.listIgnoringDateRange();
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
            const instances = await RoleAttributeNameModel.listInDateRange(new Date());
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
            await RoleAttributeNameModel.create({
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                domain: RoleAttributeNameDomain.String.code,
                classifier: RoleAttributeNameClassifier.Other.code,
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
            await RoleAttributeNameModel.create({
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                domain: RoleAttributeNameDomain.String.code,
                classifier: RoleAttributeNameClassifier.Other.code,
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
            await RoleAttributeNameModel.create({
                code: 'ATTRIBUTE_NAME_X',
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                classifier: RoleAttributeNameClassifier.Other.code,
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
            await RoleAttributeNameModel.create({
                code: 'ATTRIBUTE_NAME_X',
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                domain: '__BOGUS__',
                classifier: RoleAttributeNameClassifier.Other.code,
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
            await RoleAttributeNameModel.create({
                code: 'ATTRIBUTE_NAME_X',
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                domain: RoleAttributeNameDomain.String.code,
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
            await RoleAttributeNameModel.create({
                code: 'ATTRIBUTE_NAME_X',
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                domain: RoleAttributeNameDomain.String.code,
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
            await RoleAttributeNameModel.create({
                code: 'ATTRIBUTE_NAME_X',
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                domain: RoleAttributeNameDomain.String.code,
                classifier: RoleAttributeNameClassifier.Other.code,
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
            await RoleAttributeNameModel.create({
                code: 'ATTRIBUTE_NAME_X',
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                domain: RoleAttributeNameDomain.String.code,
                classifier: RoleAttributeNameClassifier.Other.code,
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

            await RoleAttributeNameModel.create({
                code: code,
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                domain: RoleAttributeNameDomain.String.code,
                classifier: RoleAttributeNameClassifier.Other.code,
                category: 'category',
                purposeText: 'This attribute purpose text',
                appliesToInstance: true
            });

            await RoleAttributeNameModel.create({
                code: code,
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                domain: RoleAttributeNameDomain.String.code,
                classifier: RoleAttributeNameClassifier.Other.code,
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
            expect(stringRoleAttributeNameNoEndDate).not.toBeNull();
            expect(stringRoleAttributeNameNoEndDate.domain).toBe(RoleAttributeNameDomain.String.code);
            expect(stringRoleAttributeNameNoEndDate.domainEnum()).toBe(RoleAttributeNameDomain.String);
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

});