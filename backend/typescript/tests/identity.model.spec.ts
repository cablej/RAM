import {connectDisconnectMongo, resetDataInMongo, login} from './helpers';
import {
    IIdentity,
    IdentityModel,
    IdentityType,
    IdentityInvitationCodeStatus,
    IdentityAgencyScheme,
    IdentityPublicIdentifierScheme,
    IdentityLinkIdScheme
} from '../models/identity.model';
import {
    IName,
    NameModel
} from '../models/name.model';
import {
    IProfile,
    ProfileModel,
    ProfileProvider
} from '../models/profile.model';
import {
    IParty,
    PartyModel,
    PartyType
} from '../models/party.model';
import {Seeder} from '../seeding/seed';
import {context} from '../providers/context.provider';

/* tslint:disable:max-func-body-length */
describe('RAM Identity', () => {

    connectDisconnectMongo();
    resetDataInMongo();

    let name1:IName;
    let profile1:IProfile;
    let party1:IParty;
    let identity1:IIdentity;

    beforeEach(async (done) => {

        Seeder.verbose(false);

        Promise.resolve(null)
            .then(Seeder.resetDataInMongo)
            .then(Seeder.loadReference)
            .then(async () => {

                try {
                    context.init();

                    name1 = await NameModel.create({
                        givenName: 'John',
                        familyName: 'Smith'
                    });

                    profile1 = await ProfileModel.create({
                        provider: ProfileProvider.MyGov.code,
                        name: name1
                    });

                    party1 = await PartyModel.create({
                        partyType: PartyType.Individual.code,
                        name: name1
                    });

                    identity1 = await IdentityModel.create({
                        rawIdValue: 'uuid_1',
                        identityType: IdentityType.LinkId.code,
                        defaultInd: false,
                        linkIdScheme: IdentityLinkIdScheme.MyGov.code,
                        profile: profile1,
                        party: party1
                    });

                    login(identity1);

                    done();

                } catch (e) {
                    fail('Because ' + e);
                    done();
                }

            })
            .then(() => {
                done();
            });

    });

    it('finds by id value', async (done) => {
        try {
            const instance = await IdentityModel.findByIdValue(identity1.idValue);
            expect(instance).not.toBeNull();
            expect(instance.party.id).toBe(party1.id);
            expect(instance.party.partyType).not.toBeNull();
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('finds pending by invitation code', async (done) => {
        try {

            const instance = await IdentityModel.create({
                identityType: IdentityType.InvitationCode.code,
                defaultInd: false,
                invitationCodeStatus: IdentityInvitationCodeStatus.Pending.code,
                invitationCodeExpiryTimestamp: new Date(2055, 1, 1),
                invitationCodeTemporaryEmailAddress: 'bob@example.com',
                profile: profile1,
                party: party1
            });

            const retrievedInstance = await IdentityModel.findPendingByInvitationCodeInDateRange(instance.rawIdValue, new Date());
            expect(retrievedInstance).not.toBeNull();
            expect(retrievedInstance.id).toBe(instance.id);

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('fails find by invalid id value', async (done) => {
        try {
            const instance = await IdentityModel.findByIdValue('__BOGUS__');
            expect(instance).toBeNull();
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('lists for party', async (done) => {
        try {
            const instances = await IdentityModel.listByPartyId(party1.id);
            expect(instances).not.toBeNull();
            expect(instances.length).toBe(1);
            for (let instance of instances) {
                expect(instance.party.id).toBe(party1.id);
            }
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('inserts base with valid values', async (done) => {
        try {

            const rawIdValue = 'uuid_x';
            const type = IdentityType.LinkId;
            const defaultInd = false;

            const instance = await IdentityModel.create({
                rawIdValue: rawIdValue,
                identityType: type.code,
                defaultInd: defaultInd,
                linkIdScheme: IdentityLinkIdScheme.MyGov.code,
                profile: profile1,
                party: party1
            });

            expect(instance).not.toBeNull();
            expect(instance.id).not.toBeNull();
            expect(instance.idValue).not.toBeNull();
            expect(instance.identityType).not.toBeNull();
            expect(instance.profile).not.toBeNull();
            expect(instance.profile.name).not.toBeNull();

            const retrievedInstance = await IdentityModel.findByIdValue(instance.idValue);
            expect(retrievedInstance).not.toBeNull();
            expect(retrievedInstance.id).toBe(instance.id);
            expect(retrievedInstance.identityType).toBe(type.code);
            expect(retrievedInstance.identityTypeEnum()).toBe(type);
            expect(retrievedInstance.defaultInd).toBe(defaultInd);
            expect(retrievedInstance.profile.id).toBe(profile1.id);
            expect(retrievedInstance.profile.name.id).toBe(name1.id);

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('inserts agency provided token with valid values', async (done) => {
        try {

            const rawIdValue = 'uuid_x';
            const type = IdentityType.AgencyProvidedToken;
            const defaultInd = false;
            const scheme = IdentityAgencyScheme.Medicare;
            const agencyToken = 'agency_token_x';

            const instance = await IdentityModel.create({
                rawIdValue: rawIdValue,
                identityType: type.code,
                defaultInd: defaultInd,
                agencyScheme: scheme.code,
                agencyToken: agencyToken,
                profile: profile1,
                party: party1
            });

            const retrievedInstance = await IdentityModel.findByIdValue(instance.idValue);
            expect(retrievedInstance).not.toBeNull();
            expect(retrievedInstance.id).toBe(instance.id);
            expect(retrievedInstance.idValue).toBe(`${type.code}:${scheme.code}:${rawIdValue}`);
            expect(retrievedInstance.rawIdValue).toBe(rawIdValue);
            expect(retrievedInstance.identityType).toBe(type.code);
            expect(retrievedInstance.identityTypeEnum()).toBe(type);
            expect(retrievedInstance.agencyToken).toBe(agencyToken);

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('inserts invitation code with valid values', async (done) => {
        try {

            const rawIdValue = 'uuid_invitation_code';
            const type = IdentityType.InvitationCode;
            const defaultInd = false;
            const status = IdentityInvitationCodeStatus.Claimed;
            const expiryTimestamp = new Date(2055, 1, 1);
            const claimedTimestamp = new Date(2066, 1, 1);
            const emailAddress = 'bob@example.com';

            const instance = await IdentityModel.create({
                rawIdValue: rawIdValue,
                identityType: type.code,
                defaultInd: defaultInd,
                invitationCodeStatus: status.code,
                invitationCodeExpiryTimestamp: expiryTimestamp,
                invitationCodeClaimedTimestamp: claimedTimestamp,
                invitationCodeTemporaryEmailAddress: emailAddress,
                profile: profile1,
                party: party1
            });

            const retrievedInstance = await IdentityModel.findByIdValue(instance.idValue);
            expect(retrievedInstance).not.toBeNull();
            expect(retrievedInstance.id).toBe(instance.id);
            expect(retrievedInstance.idValue).toBe(`${type.code}:${rawIdValue}`);
            expect(retrievedInstance.rawIdValue).toBe(rawIdValue);
            expect(retrievedInstance.identityType).toBe(type.code);
            expect(retrievedInstance.identityTypeEnum()).toBe(type);
            expect(retrievedInstance.invitationCodeStatus).toBe(status.code);
            expect(retrievedInstance.invitationCodeStatusEnum()).toBe(status);
            expect(retrievedInstance.invitationCodeExpiryTimestamp.getTime()).toBe(expiryTimestamp.getTime());
            expect(retrievedInstance.invitationCodeClaimedTimestamp.getTime()).toBe(claimedTimestamp.getTime());
            expect(retrievedInstance.invitationCodeTemporaryEmailAddress).toBe(emailAddress);

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('inserts invitation code with generated raw id value', async (done) => {
        try {

            const expectedIdValues = [
                '9dRZvR',
                'kYVnxr',
                'jEVYNX',
                '1LVxvr',
                'wGV7nR',
                'wEXWJV',
                'y7RpLR',
                'ewRgKR',
                'EJrqPX',
                'gqXKzV'
            ];

            for (let i = 0; i < 10; i = i + 1) {
                const instance = await IdentityModel.create({
                    identityType: IdentityType.InvitationCode.code,
                    defaultInd: false,
                    invitationCodeStatus: IdentityInvitationCodeStatus.Pending.code,
                    invitationCodeExpiryTimestamp: new Date(),
                    profile: profile1,
                    party: party1
                });
                expect(instance.rawIdValue).not.toBeNull();
                expect(instance.rawIdValue).toBe(expectedIdValues[i]);
            }

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('inserts public identifier with valid values', async (done) => {
        try {

            const rawIdValue = 'uuid_public_identifier';
            const type = IdentityType.PublicIdentifier;
            const defaultInd = false;
            const scheme = IdentityPublicIdentifierScheme.ABN;

            const instance = await IdentityModel.create({
                rawIdValue: rawIdValue,
                identityType: type.code,
                defaultInd: defaultInd,
                publicIdentifierScheme: scheme.code,
                profile: profile1,
                party: party1
            });

            const retrievedInstance = await IdentityModel.findByIdValue(instance.idValue);
            expect(retrievedInstance).not.toBeNull();
            expect(retrievedInstance.id).toBe(instance.id);
            expect(retrievedInstance.idValue).toBe(`${type.code}:${scheme.code}:${rawIdValue}`);
            expect(retrievedInstance.rawIdValue).toBe(rawIdValue);
            expect(retrievedInstance.identityType).toBe(type.code);
            expect(retrievedInstance.identityTypeEnum()).toBe(type);
            expect(retrievedInstance.publicIdentifierScheme).toBe(scheme.code);
            expect(retrievedInstance.publicIdentifierSchemeEnum()).toBe(scheme);

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('inserts link id with valid values', async (done) => {
        try {

            const rawIdValue = 'uuid_link_id';
            const type = IdentityType.LinkId;
            const scheme = IdentityLinkIdScheme.MyGov;
            const defaultInd = false;

            const instance = await IdentityModel.create({
                rawIdValue: rawIdValue,
                identityType: type.code,
                defaultInd: defaultInd,
                linkIdScheme: scheme.code,
                profile: profile1,
                party: party1
            });

            const retrievedInstance = await IdentityModel.findByIdValue(instance.idValue);
            expect(retrievedInstance).not.toBeNull();
            expect(retrievedInstance.id).toBe(instance.id);
            expect(retrievedInstance.idValue).toBe(`${type.code}:${scheme.code}:${rawIdValue}`);
            expect(retrievedInstance.rawIdValue).toBe(rawIdValue);
            expect(retrievedInstance.identityType).toBe(type.code);
            expect(retrievedInstance.identityTypeEnum()).toBe(type);
            expect(retrievedInstance.linkIdScheme).toBe(scheme.code);
            expect(retrievedInstance.linkIdSchemeEnum()).toBe(scheme);

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('fails insert with invalid type', async (done) => {
        try {
            await IdentityModel.create({
                rawIdValue: 'uuid_x',
                identityType: '__BOGUS__',
                defaultInd: false,
                profile: profile1,
                party: party1
            });
            fail('should not have inserted with invalid type');
            done();
        } catch (e) {
            expect(e.name).toBe('ValidationError');
            expect(e.errors.type).not.toBeNull();
            done();
        }
    });

    it('fails insert with null type', async (done) => {
        try {
            await IdentityModel.create({
                rawIdValue: 'uuid_x',
                defaultInd: false,
                profile: profile1,
                party: party1
            });
            fail('should not have inserted with null type');
            done();
        } catch (e) {
            expect(e.name).toBe('ValidationError');
            expect(e.errors.type).not.toBeNull();
            done();
        }
    });

    it('fails insert with null profile', async (done) => {
        try {
            await IdentityModel.create({
                rawIdValue: 'uuid_x',
                identityType: IdentityType.LinkId.code,
                defaultInd: false,
                party: party1
            });
            fail('should not have inserted with null profile');
            done();
        } catch (e) {
            expect(e.name).toBe('ValidationError');
            expect(e.errors.profile).not.toBeNull();
            done();
        }
    });

    it('fails insert with null party', async (done) => {
        try {
            await IdentityModel.create({
                rawIdValue: 'uuid_x',
                identityType: IdentityType.LinkId.code,
                defaultInd: false,
                profile: profile1
            });
            fail('should not have inserted with null party');
            done();
        } catch (e) {
            expect(e.name).toBe('ValidationError');
            expect(e.errors.party).not.toBeNull();
            done();
        }
    });

    it('converts type to enum', async (done) => {
        try {
            expect(identity1).not.toBeNull();
            expect(identity1.identityType).toBe(IdentityType.LinkId.code);
            expect(identity1.identityTypeEnum()).toBe(IdentityType.LinkId);
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('search should be populated', async (done) => {
        try {
            const searchResult = await IdentityModel.searchLinkIds(1, 10);
            expect(searchResult.list[0].idValue).toBe(identity1.idValue);
            expect(searchResult.list[0].party.partyType).toBe(party1.partyType);
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('creates a invitation code identity', async (done) => {
        try {

            // Create new temp identity for invitation code
            const tempIdentity = await IdentityModel.createInvitationCodeIdentity('John', 'Doe', '2015-07-31');

            // Verify
            expect(tempIdentity).not.toBeNull();
            expect(tempIdentity.defaultInd).toBe(true);
            expect(tempIdentity.identityType).toBe(IdentityType.InvitationCode.code);
            expect(tempIdentity.identityTypeEnum()).toBe(IdentityType.InvitationCode);
            expect(tempIdentity.party).not.toBeNull();
            expect(tempIdentity.profile).not.toBeNull();
            expect(tempIdentity.profile.name).not.toBeNull();
            expect(tempIdentity.profile.sharedSecrets.length).toBe(1);

            // console.log(JSON.stringify(tempIdentity));
            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

});