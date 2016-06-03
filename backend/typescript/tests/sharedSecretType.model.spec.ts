import {connectDisconnectMongo, dropMongo} from './helpers';
import {
    ISharedSecretType,
    SharedSecretTypeModel} from '../models/sharedSecretType.model';

/* tslint:disable:max-func-body-length */
describe('RAM Shared Secret Type', () => {

    connectDisconnectMongo();
    dropMongo();

    let sharedSecretTypeNoEndDate: ISharedSecretType;
    let sharedSecretTypeFutureEndDate: ISharedSecretType;
    let sharedSecretTypeExpiredEndDate: ISharedSecretType;

    beforeEach(async (done) => {

        try {

            sharedSecretTypeNoEndDate = await SharedSecretTypeModel.create({
                code: 'SHARED_SECRET_TYPE_1',
                shortDecodeText: 'Shared Secret',
                longDecodeText: 'Shared Secret',
                startDate: new Date(),
                domain: 'domain'
            });

            sharedSecretTypeFutureEndDate = await SharedSecretTypeModel.create({
                code: 'SHARED_SECRET_TYPE_2',
                shortDecodeText: 'Shared Secret',
                longDecodeText: 'Shared Secret',
                startDate: new Date(),
                endDate: new Date(2099, 1, 1),
                domain: 'domain'
            });

            sharedSecretTypeExpiredEndDate = await SharedSecretTypeModel.create({
                code: 'SHARED_SECRET_TYPE_3',
                shortDecodeText: 'Shared Secret',
                longDecodeText: 'Shared Secret',
                startDate: new Date(2016, 1, 1),
                endDate: new Date(2016, 1, 2),
                domain: 'domain'
            });

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }

    });

    it('finds in date range with no end date by code', async (done) => {
        try {
            const instance = await SharedSecretTypeModel.findByCodeInDateRange(sharedSecretTypeNoEndDate.code);
            expect(instance).not.toBeNull();
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('finds in date range or invalid by code', async (done) => {
        try {
            const instance = await SharedSecretTypeModel.findByCodeIgnoringDateRange(
                sharedSecretTypeNoEndDate.code);
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
            const instance = await SharedSecretTypeModel.findByCodeInDateRange(code);
            expect(instance).toBeNull();
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('fails find not in date range by code', async (done) => {
        try {
            const instance = await SharedSecretTypeModel.findByCodeInDateRange(sharedSecretTypeExpiredEndDate.code);
            expect(instance).toBeNull();
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('lists ignoring date range', async (done) => {
        try {
            const instances = await SharedSecretTypeModel.listIgnoringDateRange();
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
            const instances = await SharedSecretTypeModel.listInDateRange();
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

    it('fails insert with null code', async (done) => {
        try {
            await SharedSecretTypeModel.create({
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                domain: 'domain'
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
            await SharedSecretTypeModel.create({
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                domain: 'domain'
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
            await SharedSecretTypeModel.create({
                code: 'SHARED_SECRET_TYPE_X',
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date()
            });
            fail('should not have inserted with null domain');
            done();
        } catch (e) {
            expect(e.name).toBe('ValidationError');
            expect(e.errors.domain).not.toBeNull();
            done();
        }
    });

    it('fails insert with duplicate code', async (done) => {
        try {

            const code = 'CODE_DUPLICATE';

            await SharedSecretTypeModel.create({
                code: code,
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                domain: 'domain',
            });

            await SharedSecretTypeModel.create({
                code: code,
                shortDecodeText: 'Some short decode text',
                longDecodeText: 'Some long decode text',
                startDate: new Date(),
                domain: 'domain'
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