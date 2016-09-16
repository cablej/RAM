import {Utils} from '../../commons/utils';

/* tslint:disable:max-func-body-length */
describe('Util tests', () => {

    it('can find the end of a string', async(done) => {

        try {
            let result = Utils.endsWith('blah de blah Thing', 'Thing');
            expect(result).toBe(true);

            result = Utils.endsWith('Thing', 'Thing');
            expect(result).toBe(true);

            result = Utils.endsWith('whatever', '');
            expect(result).toBe(true);
        } catch (e) {
            fail(e);
        }

        done();

    });

    it('can not find the end of a string', async(done) => {

        try {
            let result = Utils.endsWith('lower thing', 'Thing');
            expect(result).toBe(false);

            result = Utils.endsWith('blah de blah nope', 'Thing');
            expect(result).toBe(false);

            result = Utils.endsWith('blah', 'Thing');
            expect(result).toBe(false);

            result = Utils.endsWith('', 'Thing');
            expect(result).toBe(false);
        } catch (e) {
            fail(e);
        }

        done();

    });

    it('says today is not in the future', async(done) => {

        try {
            const now = new Date();
            expect(Utils.dateIsTodayOrInFuture(now)).toBe(true);
            expect(Utils.dateIsInFuture(now)).toBe(false);
        } catch (e) {
            fail(e);
        }

        done();

    });

});