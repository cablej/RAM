import {connectDisconnectMongo, login} from './helpers';
import {Seeder} from '../seeding/seed';
import {
    IIdentity,
    IdentityModel,
    IdentityType,
    IdentityLinkIdScheme,
    IdentityInvitationCodeStatus
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
import {
    IRelationship,
    RelationshipModel,
    RelationshipStatus,
    RelationshipInitiatedBy
} from '../models/relationship.model';
import {IRelationshipType} from '../models/relationshipType.model';
import {context} from '../providers/context.provider';

/* tslint:disable:max-func-body-length */
describe('RAM Relationship', () => {

    connectDisconnectMongo();

    let relationshipTypeCustom: IRelationshipType;

    let subjectNickName1: IName;
    let subjectProfile1: IProfile;
    let subjectParty1: IParty;
    let subjectIdentity1: IIdentity;

    let delegateNickName1: IName;
    let delegateProfile1: IProfile;
    let delegateParty1: IParty;
    let delegateIdentity1: IIdentity;

    let relationship1: IRelationship;

    beforeEach((done) => {

        Seeder.verbose(false);

        Promise.resolve(null)
            .then()
            .then(Seeder.resetDataInMongo)
            .then(Seeder.loadReference)
            .then(async() => {

                try {
                    context.init();

                    relationshipTypeCustom = Seeder.custom_delegate_relationshipType;

                    subjectNickName1 = await NameModel.create({
                        givenName: 'Jane',
                        familyName: 'Subject 1'
                    });

                    subjectProfile1 = await ProfileModel.create({
                        provider: ProfileProvider.MyGov.code,
                        name: subjectNickName1
                    });

                    subjectParty1 = await PartyModel.create({
                        partyType: PartyType.Individual.code
                    });

                    delegateNickName1 = await NameModel.create({
                        givenName: 'John',
                        familyName: 'Delegate 1'
                    });

                    delegateProfile1 = await ProfileModel.create({
                        provider: ProfileProvider.MyGov.code,
                        name: delegateNickName1
                    });

                    delegateParty1 = await PartyModel.create({
                        partyType: PartyType.Individual.code
                    });

                    subjectIdentity1 = await IdentityModel.create({
                        rawIdValue: 'uuid_1',
                        identityType: IdentityType.LinkId.code,
                        defaultInd: true,
                        linkIdScheme: IdentityLinkIdScheme.MyGov.code,
                        profile: subjectProfile1,
                        party: subjectParty1
                    });

                    delegateIdentity1 = await IdentityModel.create({
                        identityType: IdentityType.InvitationCode.code,
                        defaultInd: true,
                        invitationCodeStatus: IdentityInvitationCodeStatus.Pending.code,
                        invitationCodeExpiryTimestamp: new Date(2055, 1, 1),
                        profile: delegateProfile1,
                        party: delegateParty1
                    });

                    relationship1 = await RelationshipModel.add(relationshipTypeCustom,
                        subjectParty1,
                        subjectNickName1,
                        delegateIdentity1.party,
                        delegateIdentity1.profile.name,
                        new Date(),
                        null,
                        RelationshipInitiatedBy.Subject,
                        delegateIdentity1,
                        []
                    );

                } catch (e) {
                    fail(e);
                    done();
                }

            }).then(()=> {
            done();
        });
    });

    it('finds by identifier', async(done) => {
        try {

            const retrievedInstance = await RelationshipModel.findByIdentifier(relationship1.id);

            expect(retrievedInstance).not.toBeNull();
            expect(retrievedInstance.id).not.toBeNull();
            expect(retrievedInstance.id).toBe(relationship1.id);

            done();

        } catch (e) {
            fail(e);
            done();
        }
    });

    it('converts to DTO', async(done) => {
        try {

            login(subjectIdentity1);

            const retrievedInstance = await RelationshipModel.findByIdentifier(relationship1.id);

            expect(retrievedInstance).not.toBeNull();

            const dto = await retrievedInstance.toDTO();

            expect(dto).not.toBeNull();

            done();

        } catch (e) {
            fail(e);
            done();
        }
    });

    it('auto converts strings to dates', async(done) => {
        try {

            const retrievedInstance = await RelationshipModel.findByIdentifier(relationship1.id);

            expect(retrievedInstance).not.toBeNull();
            expect(retrievedInstance.id).not.toBeNull();
            expect(retrievedInstance.id).toBe(relationship1.id);
            expect(typeof retrievedInstance.startTimestamp).toBe('object');

            const coerceStringAndDate = (input: string): Date|String => {
                return input;
            };

            retrievedInstance.startTimestamp = coerceStringAndDate('2012-12-10') as Date;
            expect(typeof retrievedInstance.startTimestamp).toBe('object');

            done();

        } catch (e) {
            fail(e);
            done();
        }
    });

    it('finds by invitation code in date range', async(done) => {
        try {

            const retrievedInstance = await RelationshipModel.findPendingByInvitationCodeInDateRange(
                delegateIdentity1.rawIdValue,
                new Date()
            );

            expect(retrievedInstance).not.toBeNull();
            expect(retrievedInstance.id).not.toBeNull();
            expect(retrievedInstance.id).toBe(relationship1.id);

            done();

        } catch (e) {
            fail(e);
            done();
        }
    });

    it('inserts with no end timestamp', async(done) => {
        try {

            const instance = await RelationshipModel.create({
                relationshipType: relationshipTypeCustom,
                subject: subjectParty1,
                subjectNickName: subjectNickName1,
                delegate: delegateParty1,
                delegateNickName: delegateNickName1,
                startTimestamp: new Date(),
                status: RelationshipStatus.Accepted.code,
                initiatedBy: RelationshipInitiatedBy.Subject.code
            } as any);

            expect(instance).not.toBeNull();
            expect(instance.id).not.toBeNull();
            expect(instance.subject).not.toBeNull();
            expect(instance.status).not.toBeNull();
            expect(instance.statusEnum()).toBe(RelationshipStatus.Accepted);
            expect(instance.endEventTimestamp).toBeFalsy();
            expect(instance._subjectNickNameString).not.toBeNull();
            expect(instance._delegateNickNameString).not.toBeNull();

            done();

        } catch (e) {
            fail(e);
            done();
        }
    });

    it('inserts with end timestamp', async(done) => {
        try {

            const instance = await RelationshipModel.create({
                relationshipType: relationshipTypeCustom,
                subject: subjectParty1,
                subjectNickName: subjectNickName1,
                delegate: delegateParty1,
                delegateNickName: delegateNickName1,
                startTimestamp: new Date(),
                endTimestamp: new Date(),
                status: RelationshipStatus.Accepted.code,
                initiatedBy: RelationshipInitiatedBy.Subject.code
            } as any);

            expect(instance).not.toBeNull();
            expect(instance.id).not.toBeNull();
            expect(instance.subject).not.toBeNull();
            expect(instance.status).not.toBeNull();
            expect(instance.statusEnum()).toBe(RelationshipStatus.Accepted);
            expect(instance.endEventTimestamp).not.toBeFalsy();
            expect(instance._subjectNickNameString).not.toBeNull();
            expect(instance._delegateNickNameString).not.toBeNull();

            done();

        } catch (e) {
            fail(e);
            done();
        }
    });

    it('claims pending invitation', async(done) => {

        try {

            const invitationCodeIdentity = await IdentityModel.createInvitationCodeIdentity(
                delegateProfile1.name.givenName,
                delegateProfile1.name.familyName,
                '01/01/1999');
            const invitationCode = invitationCodeIdentity.rawIdValue;

            const relationshipToClaim = await RelationshipModel.add(
                relationshipTypeCustom,
                subjectParty1,
                subjectNickName1,
                invitationCodeIdentity.party,
                invitationCodeIdentity.profile.name,
                new Date(),
                new Date(2020, 12, 31),
                RelationshipInitiatedBy.Subject,
                invitationCodeIdentity,
                []
            );

            const claimingDelegateIdentity1 = await IdentityModel.create({
                rawIdValue: 'accepting_delegate_identity_1',
                identityType: IdentityType.LinkId.code,
                defaultInd: true,
                linkIdScheme: IdentityLinkIdScheme.MyGov.code,
                profile: delegateProfile1,
                party: delegateParty1
            });

            // relationship should be created with a PENDING invitation code delegate
            const preClaimedDelegateIdentity = (await IdentityModel.findByInvitationCode(invitationCode));
            expect(preClaimedDelegateIdentity.invitationCodeStatusEnum()).toBe(IdentityInvitationCodeStatus.Pending);

            // perform claim

            login(claimingDelegateIdentity1);

            await relationshipToClaim.claimPendingInvitation(claimingDelegateIdentity1, invitationCode);
            const retrievedClaimedInstance = await RelationshipModel.findByIdentifier(relationshipToClaim.id);

            // delegate should be updated to claimingDelegateIdentity1
            expect(retrievedClaimedInstance.delegate.id).toBe(claimingDelegateIdentity1.party.id);

            // invitation identity should be claimed
            const postClaimedDelegateIdentity = (await IdentityModel.findByInvitationCode(invitationCode));
            expect(postClaimedDelegateIdentity.invitationCodeStatusEnum()).toBe(IdentityInvitationCodeStatus.Claimed);
            expect(postClaimedDelegateIdentity.invitationCodeClaimedTimestamp).not.toBeNull();

            done();

        } catch (e) {
            fail(e);
            done();
        }
    });

    it('accepts pending invitation', async(done) => {
        try {

            const invitationCodeIdentity = await IdentityModel.createInvitationCodeIdentity('John', 'Delegate 1', '01/01/1999');

            const relationshipToAccept = await RelationshipModel.add(
                relationshipTypeCustom,
                subjectParty1,
                subjectNickName1,
                invitationCodeIdentity.party,
                invitationCodeIdentity.profile.name,
                new Date(),
                new Date(2020, 12, 31),
                RelationshipInitiatedBy.Subject,
                invitationCodeIdentity,
                []
            );

            const acceptingDelegateIdentity1 = await IdentityModel.create({
                rawIdValue: 'accepting_delegate_identity_1',
                identityType: IdentityType.LinkId.code,
                defaultInd: true,
                linkIdScheme: IdentityLinkIdScheme.MyGov.code,
                profile: delegateProfile1,
                party: delegateParty1,
                strength: 2
            });

            login(acceptingDelegateIdentity1);

            await relationshipToAccept.claimPendingInvitation(acceptingDelegateIdentity1, invitationCodeIdentity.rawIdValue);
            const acceptedInstance = await relationshipToAccept.acceptPendingInvitation(acceptingDelegateIdentity1);
            const retrievedAcceptedInstance = await RelationshipModel.findByIdentifier(relationshipToAccept.id);

            const retrievedAcceptedDelegateIdentity = await IdentityModel.findByIdValue(acceptingDelegateIdentity1.idValue);

            expect(relationshipToAccept.statusEnum()).toBe(RelationshipStatus.Accepted);
            expect(acceptedInstance.statusEnum()).toBe(relationshipToAccept.statusEnum());
            expect(acceptedInstance.delegate.id).toBe(retrievedAcceptedDelegateIdentity.party.id);
            expect(retrievedAcceptedInstance.delegate.id).toBe(retrievedAcceptedDelegateIdentity.party.id);
            expect(retrievedAcceptedInstance.id).toBe(acceptedInstance.id);

            done();

        } catch (e) {
            fail(e);
            done();
        }
    });

    it('stores email when notifying delegate', async(done) => {
        try {

            login(subjectIdentity1);

            const email = 'test@example.com';
            await relationship1.notifyDelegate(email, subjectIdentity1);

            const retrievedDelegateIdentity = await IdentityModel.findByIdValue(delegateIdentity1.idValue);

            expect(retrievedDelegateIdentity.invitationCodeTemporaryEmailAddress).toBe(email);

            done();

        } catch (e) {
            fail(e);
            done();
        }
    });

    it('fails accept non-pending invitation', async(done) => {
        try {

            const acceptingDelegateIdentity1 = await IdentityModel.create({
                rawIdValue: 'accepting_delegate_identity_1',
                identityType: IdentityType.LinkId.code,
                defaultInd: true,
                linkIdScheme: IdentityLinkIdScheme.MyGov.code,
                profile: delegateProfile1,
                party: delegateParty1
            });

            login(acceptingDelegateIdentity1);

            await relationship1.acceptPendingInvitation(acceptingDelegateIdentity1);
            expect(relationship1.statusEnum()).toBe(RelationshipStatus.Accepted);

            await relationship1.acceptPendingInvitation(acceptingDelegateIdentity1);
            fail('should not have been able to accept a non-pending relationship');

            done();

        } catch (e) {
            done();
        }
    });

    it('rejects pending invitation', async(done) => {

        try {

            const invitationCodeIdentity = await IdentityModel.createInvitationCodeIdentity('John', 'Delegate 1', '01/01/1999');
            const relationshipToReject = await RelationshipModel.add(
                relationshipTypeCustom,
                subjectParty1,
                subjectNickName1,
                invitationCodeIdentity.party,
                invitationCodeIdentity.profile.name,
                new Date(),
                new Date(2020, 12, 31),
                RelationshipInitiatedBy.Subject,
                invitationCodeIdentity,
                []
            );

            const acceptingDelegateIdentity1 = await IdentityModel.create({
                rawIdValue: 'accepting_delegate_identity_1',
                identityType: IdentityType.LinkId.code,
                defaultInd: true,
                linkIdScheme: IdentityLinkIdScheme.MyGov.code,
                profile: delegateProfile1,
                party: delegateParty1,
                strength: 2
            });

            login(acceptingDelegateIdentity1);

            await relationshipToReject.claimPendingInvitation(acceptingDelegateIdentity1, invitationCodeIdentity.rawIdValue);

            await relationshipToReject.rejectPendingInvitation(acceptingDelegateIdentity1);

            const retrievedInstance = await RelationshipModel.findByIdentifier(relationshipToReject.id);

            expect(relationshipToReject.statusEnum()).toBe(RelationshipStatus.Declined);
            expect(retrievedInstance.statusEnum()).toBe(relationshipToReject.statusEnum());

            done();

        } catch (e) {
            fail(e);
            done();
        }
    });

    it('fails reject non-pending invitation', async(done) => {
        try {

            await relationship1.rejectPendingInvitation(delegateIdentity1);
            expect(relationship1.statusEnum()).toBe(RelationshipStatus.Declined);

            await relationship1.rejectPendingInvitation(delegateIdentity1);
            fail('should not have been able to reject a non-pending relationship');

            done();

        } catch (e) {
            done();
        }
    });

    it('searches with subject', async(done) => {
        try {

            const relationships = await RelationshipModel.search(subjectIdentity1.idValue, null, 1, 10);
            expect(relationships.totalCount).toBe(1);
            expect(relationships.list.length).toBe(1);
            expect(relationships.list[0].id).toBe(relationship1.id);

            done();

        } catch (e) {
            fail(e);
            done();
        }
    });

    it('fails searches with non-existent subject', async(done) => {
        try {

            const relationships = await RelationshipModel.search('__BOGUS__', null, 1, 10);
            expect(relationships.totalCount).toBe(0);
            expect(relationships.list.length).toBe(0);

            done();

        } catch (e) {
            fail(e);
            done();
        }
    });

    it('searches with delegate', async(done) => {
        try {

            const relationships = await RelationshipModel.search(null, delegateIdentity1.idValue, 1, 10);
            expect(relationships.totalCount).toBe(1);
            expect(relationships.list.length).toBe(1);
            expect(relationships.list[0].id).toBe(relationship1.id);

            done();

        } catch (e) {
            fail(e);
            done();
        }
    });

    it('fails searches with non-existent delegate', async(done) => {
        try {

            const relationships = await RelationshipModel.search(null, '__BOGUS__', 1, 10);
            expect(relationships.totalCount).toBe(0);
            expect(relationships.list.length).toBe(0);

            done();

        } catch (e) {
            fail(e);
            done();
        }
    });

    it('searches with subject as party', async(done) => {
        try {

            const relationships = await RelationshipModel.searchByIdentity(subjectIdentity1.idValue,
                null, null, null, null, null, false, null, null, 1, 10);
            expect(relationships.totalCount).toBe(1);
            expect(relationships.list.length).toBe(1);
            expect(relationships.list[0].id).toBe(relationship1.id);

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('searches with delegate as party', async(done) => {
        try {

            const relationships = await RelationshipModel.searchByIdentity(delegateIdentity1.idValue,
                null, null, null, null, null, false, null, null, 1, 10);
            expect(relationships.totalCount).toBe(1);
            expect(relationships.list.length).toBe(1);
            expect(relationships.list[0].id).toBe(relationship1.id);

            done();

        } catch (e) {
            fail(e);
            done();
        }
    });

    it('searches with subject as party with good filters', async(done) => {
        try {

            const relationships = await RelationshipModel.searchByIdentity(subjectIdentity1.idValue,
                PartyType.Individual.code, null, null, null, null, false, null, null, 1, 10);
            expect(relationships.totalCount).toBe(1);
            expect(relationships.list.length).toBe(1);
            expect(relationships.list[0].id).toBe(relationship1.id);

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('searches with subject as party with bad filters', async(done) => {
        try {

            const relationships = await RelationshipModel.searchByIdentity(subjectIdentity1.idValue,
                PartyType.ABN.code, null, null, null, null, false, null, null, 1, 10);
            expect(relationships.totalCount).toBe(0);
            expect(relationships.list.length).toBe(0);

            done();

        } catch (e) {
            fail(e);
            done();
        }
    });

    it('searches distinct subjects with delegate', async(done) => {
        try {

            // create another relationship to the same parties
            await RelationshipModel.create({
                relationshipType: relationshipTypeCustom,
                subject: subjectParty1,
                subjectNickName: subjectNickName1,
                delegate: delegateParty1,
                delegateNickName: delegateNickName1,
                startTimestamp: new Date(),
                status: RelationshipStatus.Pending.code,
                initiatedBy: RelationshipInitiatedBy.Subject.code
            } as any);

            // create another relationship to the same parties (inverted)
            await RelationshipModel.create({
                relationshipType: relationshipTypeCustom,
                subject: delegateParty1,
                subjectNickName: delegateNickName1,
                delegate: subjectParty1,
                delegateNickName: subjectNickName1,
                startTimestamp: new Date(),
                status: RelationshipStatus.Pending.code,
                initiatedBy: RelationshipInitiatedBy.Subject.code
            } as any);

            const parties = await RelationshipModel.searchDistinctSubjectsForMe(delegateParty1, null, 'false', null, 'asc', 1, 10);
            expect(parties.totalCount).toBe(1);
            expect(parties.list.length).toBe(1);

            for (let party of parties.list) {
                if (party.id !== subjectParty1.id && party.id !== delegateParty1.id) {
                    fail('Party id is not expected');
                }
            }

            done();

        } catch (e) {
            fail(e);
            done();
        }
    });

});