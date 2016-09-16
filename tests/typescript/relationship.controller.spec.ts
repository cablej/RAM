import RelationshipHelper from './helpers/relationshipHelper';
import InitializationHelper from './helpers/initializationHelper';
import AuthHelper from './helpers/authHelper';

const relationshipHelper = new RelationshipHelper();
const initializationHelper = new InitializationHelper();
const authHelper = new AuthHelper();

/* tslint:disable:max-func-body-length */
describe('Relationship API', () => {

    beforeAll(async(done) => {
        try {
            await initializationHelper.loadData();
        } catch (e) {
            fail(e);
        }
        done();
    });

    afterAll((done) => {
        done();
    });

    it('can list by subject', async(done) => {

        try {
            const identity = authHelper.KNOWN_IDENTITIES['jenscatering_identity_1'];
            await authHelper.logIn(identity);

            const response = await relationshipHelper.subject(identity, 1, 10);
            relationshipHelper.validateRelationshipList(response.body.list);

        } catch (e) {
            fail(e);
        }

        done();
    });

    it('can list by delegate', async(done) => {

        try {
            const identity = authHelper.KNOWN_IDENTITIES['jennifermaxims_identity_1'];
            await authHelper.logIn(identity);

            const response = await relationshipHelper.delegate(identity, 1, 10);
            relationshipHelper.validateRelationshipList(response.body.list);

        } catch (e) {
            fail(e);
        }

        done();
    });

    it('can upgrade online government service to from limited to full', async(done) => {

        // requires acceptance, new relationship created but pending

        fail('To be implemented');

        done();
    });

    it('can downgrade online government service from full to limited', async(done) => {

        // should not require acceptance, new relationship active, old one superseeded

        fail('To be implemented');

        done();
    });

    it('can upgrade authorisation management', async(done) => {

        // should not require acceptance, new relationship active, old one superseeded

        fail('To be implemented');

        done();
    });

    it('can downgrade authorisation management', async(done) => {

        // should not require acceptance, new relationship active, old one superseeded

        fail('To be implemented');

        done();
    });

    it('can upgrade relationship type from custom to universal', async(done) => {

        // requires acceptance, new relationship created but pending

        fail('To be implemented');

        done();
    });

    it('can downgrade relationship type from universal to custom', async(done) => {

        // should not require acceptance, new relationship active, old one superseeded

        fail('To be implemented');

        done();
    });

    it('transact uses latest relationship where one was superseeded', async(done) => {

        fail('To be implemented');

        done();
    });

    it('can list superseeded relationships', async(done) => {

        fail('To be implemented');

        done();
    });

});