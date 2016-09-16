import {connectDisconnectMongo, resetDataInMongo, login} from './helpers';
import {Seeder} from '../seeding/seed';
import {
    IIdentity,
    IdentityModel,
    IdentityType,
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
import {RelationshipStatus} from '../models/relationship.model';
import {
    IInvitationCodeRelationshipAddDTO,
    ICreateInvitationCodeDTO,
    IAttributeDTO
} from '../../../commons/api';
import {context} from '../providers/context.provider';

/* tslint:disable:max-func-body-length */
describe('RAM Party', () => {

    connectDisconnectMongo();
    resetDataInMongo();

    let name1: IName;
    let profile1: IProfile;
    let party1: IParty;
    let identity1: IIdentity;

    beforeEach(async(done) => {

        Seeder.verbose(false);

        Promise.resolve(null)
            .then(Seeder.resetDataInMongo)
            .then(Seeder.loadReference)
            .then(async() => {

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
            .then(()=> {
                done();
            });
    });

    it('finds by id', async(done) => {
        try {
            const instance = await PartyModel.findById(party1.id);
            expect(instance).not.toBeNull();
            expect(instance.id).toBe(party1.id);
            expect(instance.partyType).not.toBeNull();
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('finds by identity id value', async(done) => {
        try {
            const instance = await PartyModel.findByIdentityIdValue(identity1.idValue);
            expect(instance).not.toBeNull();
            expect(instance.id).toBe(party1.id);
            expect(instance.partyType).not.toBeNull();
            done();
        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('can add relationship', async(done) => {
        try {

            const instance = await PartyModel.findByIdentityIdValue(identity1.idValue);

            const identity: ICreateInvitationCodeDTO = {
                givenName: 'John',
                familyName: 'Doe',
                sharedSecretValue: '2015-12-31'
            };

            const attribute: IAttributeDTO = {
                code: Seeder.permissionCustomisationAllowedInd_relAttributeName.code,
                value: 'true'
            };

            const relationshipAddDTO: IInvitationCodeRelationshipAddDTO = {
                relationshipType: Seeder.custom_delegate_relationshipType.code,
                subjectIdValue: identity1.idValue,
                delegate: identity,
                startTimestamp: new Date(),
                endTimestamp: new Date(),
                attributes: [attribute]
            };

            const newRelationship = await instance.addRelationship(relationshipAddDTO);
            expect(newRelationship).not.toBeNull();
            expect(newRelationship.statusEnum()).toBe(RelationshipStatus.Pending);
            expect(newRelationship.delegate).not.toBeNull();
            expect(newRelationship.delegateNickName).not.toBeNull();
            expect(newRelationship.subject).not.toBeNull();
            expect(newRelationship.subjectNickName).not.toBeNull();
            expect(newRelationship.startTimestamp).not.toBeNull();
            expect(newRelationship.endTimestamp).not.toBeNull();

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }

    });

});