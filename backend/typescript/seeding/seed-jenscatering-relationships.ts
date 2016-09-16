import {conf} from '../bootstrap';
import {Seeder} from './seed';
import {ProfileProvider} from '../models/profile.model';
import {PartyType} from '../models/party.model';
import {IdentityType, IdentityLinkIdScheme, IdentityInvitationCodeStatus} from '../models/identity.model';
import {RelationshipStatus, RelationshipInitiatedBy} from '../models/relationship.model';

const lpad = (value: Object, size: number, char: string) => {
    let s = value + '';
    while (s.length < size) {
        s = char + s;
    }
    return s;
};

// seeder .............................................................................................................

/* tslint:disable:no-any */
/* tslint:disable:max-func-body-length */
export class JensCateringRelationshipsSeeder {

    private static async load_jennifermaxims_associate() {
        try {

            Seeder.log('\nInserting Sample Relationship - Jen\'s Catering Pty Ltd / Jennifer Maxims:\n'.underline);

            if (!conf.devMode) {

                Seeder.log('Skipped in prod mode'.gray);

            } else {

                Seeder.jenscatering_and_jennifermaxims_relationship = await Seeder.createRelationshipModel({
                    relationshipType: Seeder.associate_delegate_relationshipType,
                    subject: Seeder.jenscatering_party,
                    subjectNickName: Seeder.jenscatering_name,
                    delegate: Seeder.jennifermaxims_party,
                    delegateNickName: Seeder.jennifermaxims_name,
                    startTimestamp: Seeder.now,
                    status: RelationshipStatus.Accepted.code,
                    initiatedBy: RelationshipInitiatedBy.Subject.code,
                    attributes: [
                        await Seeder.createRelationshipAttributeModel({
                            value: true,
                            attributeName: Seeder.delegateManageAuthorisationAllowedInd_relAttributeName
                        } as any),
                        await Seeder.createRelationshipAttributeModel({
                            value: null,
                            attributeName: Seeder.delegateRelationshipDeclaration_relAttributeName
                        } as any),
                        await Seeder.createRelationshipAttributeModel({
                            value: null,
                            attributeName: Seeder.subjectRelationshipDeclaration_relAttributeName
                        } as any)
                    ]
                } as any);

                Seeder.log('');

            }

        } catch (e) {
            Seeder.log('Seeding failed!');
            Seeder.log(e);
        }
    }

    private static async load_jenscatering_edtech_relationship() {
        try {

            Seeder.log('\nInserting Sample Relationship - Jen\'s Catering Pty Ltd / Ed Tech OSP:\n'.underline);

            if (!conf.devMode) {

                Seeder.log('Skipped in prod mode'.gray);

            } else {

                Seeder.jenscatering_and_edtech_relationship = await Seeder.createRelationshipModel({
                    relationshipType: Seeder.osp_delegate_relationshipType,
                    subject: Seeder.jenscatering_party,
                    subjectNickName: Seeder.jenscatering_name,
                    delegate: Seeder.edtechosp_party,
                    delegateNickName: Seeder.edtechosp_name,
                    startTimestamp: Seeder.now,
                    status: RelationshipStatus.Accepted.code,
                    initiatedBy: RelationshipInitiatedBy.Subject.code,
                    attributes: [
                        await Seeder.createRelationshipAttributeModel({
                            value: ['USI'],
                            attributeName: Seeder.selectedGovernmentServicesList_relAttributeName
                        } as any),
                        await Seeder.createRelationshipAttributeModel({
                            value: 'mySSID-1234',
                            attributeName: Seeder.ssid_relAttributeName
                        } as any)
                    ]
                } as any);

                Seeder.log('');

            }

        } catch (e) {
            Seeder.log('Seeding failed!');
            Seeder.log(e);
        }
    }

    private static async load_johnmaxims_custom() {
        try {

            Seeder.log('\nInserting Sample Relationship - Jen\'s Catering Pty Ltd / John Maxims:\n'.underline);

            if (!conf.devMode) {

                Seeder.log('Skipped in prod mode'.gray);

            } else {

                Seeder.jenscatering_and_johnmaxims_relationship = await Seeder.createRelationshipModel({
                    relationshipType: Seeder.custom_delegate_relationshipType,
                    subject: Seeder.jenscatering_party,
                    subjectNickName: Seeder.jenscatering_name,
                    delegate: Seeder.johnmaxims_party,
                    delegateNickName: Seeder.johnmaxims_name,
                    startTimestamp: Seeder.now,
                    status: RelationshipStatus.Accepted.code,
                    initiatedBy: RelationshipInitiatedBy.Subject.code,
                    attributes: [
                        await Seeder.createRelationshipAttributeModel({
                            value: false,
                            attributeName: Seeder.delegateManageAuthorisationAllowedInd_relAttributeName
                        } as any),
                        await Seeder.createRelationshipAttributeModel({
                            value: null,
                            attributeName: Seeder.delegateRelationshipDeclaration_relAttributeName
                        } as any),
                        await Seeder.createRelationshipAttributeModel({
                            value: null,
                            attributeName: Seeder.subjectRelationshipDeclaration_relAttributeName
                        } as any),
                        await Seeder.createRelationshipAttributeModel({
                            value: Seeder.limited_accessLevel,
                            attributeName: Seeder.taxSuperServices_relAttributeName
                        } as any)
                    ]
                } as any);

                Seeder.log('');

            }

        } catch (e) {
            Seeder.log('Seeding failed!');
            Seeder.log(e);
        }
    }

    public static async load_robertsmith_invitationCode() {
        try {

            Seeder.log('\nInserting Sample Invitation Code - Jen\'s Catering Pty Ltd / Robert Smith:\n'.underline);

            if (!conf.devMode) {

                Seeder.log('Skipped in prod mode'.gray);

            } else {

                Seeder.robertsmith_name = await Seeder.createNameModel({
                    givenName: 'Robert',
                    familyName: 'Smith'
                } as any);

                Seeder.robertsmith_dob = await Seeder.createSharedSecretModel({
                    value: '01/01/2000',
                    sharedSecretType: Seeder.dob_sharedSecretType
                } as any);

                Seeder.robertsmith_profile = await Seeder.createProfileModel({
                    provider: ProfileProvider.Invitation.code,
                    name: Seeder.robertsmith_name,
                    sharedSecrets: [Seeder.robertsmith_dob]
                } as any);

                Seeder.robertsmith_party = await Seeder.createPartyModel({
                    partyType: PartyType.Individual.code
                } as any);

                Seeder.log('');

                Seeder.robertsmith_identity_1 = await Seeder.createIdentityModel({
                    identityType: IdentityType.InvitationCode.code,
                    defaultInd: true,
                    invitationCodeStatus: IdentityInvitationCodeStatus.Pending.code,
                    invitationCodeExpiryTimestamp: new Date(2055, 1, 1),
                    profile: Seeder.robertsmith_profile,
                    party: Seeder.robertsmith_party
                } as any);

                Seeder.log('');

                // TODO link to invitation code
                Seeder.jenscatering_and_robertsmith_relationship = await Seeder.createRelationshipModel({
                    relationshipType: Seeder.custom_delegate_relationshipType,
                    subject: Seeder.jenscatering_party,
                    subjectNickName: Seeder.jenscatering_name,
                    delegate: Seeder.robertsmith_party,
                    delegateNickName: Seeder.robertsmith_name,
                    startTimestamp: Seeder.now,
                    status: RelationshipStatus.Pending.code,
                    initiatedBy: RelationshipInitiatedBy.Subject.code,
                    attributes: [
                        await Seeder.createRelationshipAttributeModel({
                            value: true,
                            attributeName: Seeder.delegateManageAuthorisationAllowedInd_relAttributeName
                        } as any),
                        await Seeder.createRelationshipAttributeModel({
                            value: null,
                            attributeName: Seeder.delegateRelationshipDeclaration_relAttributeName
                        } as any),
                        await Seeder.createRelationshipAttributeModel({
                            value: null,
                            attributeName: Seeder.subjectRelationshipDeclaration_relAttributeName
                        } as any)
                    ]
                } as any);

            }

        } catch (e) {
            Seeder.log('Seeding failed!');
            Seeder.log(e);
        }
    }

    public static async load_fredjohnson_invitationCode() {
        try {

            Seeder.log('\nInserting Sample Invitation Code - Jen\'s Catering Pty Ltd / Fred Johnson:\n'.underline);

            if (!conf.devMode) {

                Seeder.log('Skipped in prod mode'.gray);

            } else {

                Seeder.fredjohnson_name = await Seeder.createNameModel({
                    givenName: 'Fred',
                    familyName: 'Johnson'
                } as any);

                Seeder.fredjohnson_dob = await Seeder.createSharedSecretModel({
                    value: '01/01/2000',
                    sharedSecretType: Seeder.dob_sharedSecretType
                } as any);

                Seeder.fredjohnson_profile = await Seeder.createProfileModel({
                    provider: ProfileProvider.Invitation.code,
                    name: Seeder.fredjohnson_name,
                    sharedSecrets: [Seeder.fredjohnson_dob]
                } as any);

                Seeder.fredjohnson_party = await Seeder.createPartyModel({
                    partyType: PartyType.Individual.code
                } as any);

                Seeder.log('');

                Seeder.fredjohnson_identity_1 = await Seeder.createIdentityModel({
                    identityType: IdentityType.InvitationCode.code,
                    defaultInd: true,
                    invitationCodeStatus: IdentityInvitationCodeStatus.Pending.code,
                    invitationCodeExpiryTimestamp: new Date(2055, 1, 1),
                    profile: Seeder.fredjohnson_profile,
                    party: Seeder.fredjohnson_party
                } as any);

                Seeder.log('');

                Seeder.jenscatering_and_fredjohnson_relationship = await Seeder.createRelationshipModel({
                    relationshipType: Seeder.custom_delegate_relationshipType,
                    subject: Seeder.jenscatering_party,
                    subjectNickName: Seeder.jenscatering_name,
                    delegate: Seeder.fredjohnson_party,
                    delegateNickName: Seeder.fredjohnson_name,
                    startTimestamp: Seeder.now,
                    status: RelationshipStatus.Pending.code,
                    initiatedBy: RelationshipInitiatedBy.Subject.code,
                    attributes: [
                        await Seeder.createRelationshipAttributeModel({
                            value: true,
                            attributeName: Seeder.delegateManageAuthorisationAllowedInd_relAttributeName
                        } as any),
                        await Seeder.createRelationshipAttributeModel({
                            value: null,
                            attributeName: Seeder.delegateRelationshipDeclaration_relAttributeName
                        } as any),
                        await Seeder.createRelationshipAttributeModel({
                            value: null,
                            attributeName: Seeder.subjectRelationshipDeclaration_relAttributeName
                        } as any)
                    ]
                } as any);

            }

        } catch (e) {
            Seeder.log('Seeding failed!');
            Seeder.log(e);
        }
    }

    public static async load_zoezombies() {
        try {

            if (!conf.devMode) {

                Seeder.log('Skipped in prod mode'.gray);

            } else {

                for (let i = 1; i <= 50; i = i + 1) {

                    const suffix = lpad(i, 3, '0');

                    Seeder.log(('\nInserting Jen\'s Catering Pty Ltd / Zoe Zombie: ' + suffix + '\n').underline);

                    const delegateName = await Seeder.createNameModel({
                        givenName: 'Zoe',
                        familyName: 'Zombie ' + suffix
                    } as any);

                    const delegateDob = await Seeder.createSharedSecretModel({
                        value: '01/01/2000',
                        sharedSecretType: Seeder.dob_sharedSecretType
                    } as any);

                    const delegateProfile = await Seeder.createProfileModel({
                        provider: ProfileProvider.MyGov.code,
                        name: delegateName,
                        sharedSecrets: [delegateDob]
                    } as any);

                    const delegateParty = await Seeder.createPartyModel({
                        partyType: PartyType.Individual.code
                    } as any);

                    Seeder.log('');

                    await Seeder.createIdentityModel({
                        rawIdValue: 'zoezombie_identity_' + suffix,
                        identityType: IdentityType.LinkId.code,
                        defaultInd: true,
                        linkIdScheme: IdentityLinkIdScheme.MyGov.code,
                        profile: delegateProfile,
                        party: delegateParty
                    } as any);

                    Seeder.log('');

                    await Seeder.createRelationshipModel({
                        relationshipType: Seeder.universal_delegate_relationshipType,
                        subject: Seeder.jenscatering_party,
                        subjectNickName: Seeder.jenscatering_name,
                        delegate: delegateParty,
                        delegateNickName: delegateName,
                        startTimestamp: Seeder.now,
                        status: RelationshipStatus.Accepted.code,
                        initiatedBy: RelationshipInitiatedBy.Subject.code,
                        attributes: [
                            await Seeder.createRelationshipAttributeModel({
                                value: true,
                                attributeName: Seeder.delegateManageAuthorisationAllowedInd_relAttributeName
                            } as any),
                            await Seeder.createRelationshipAttributeModel({
                                value: null,
                                attributeName: Seeder.delegateRelationshipDeclaration_relAttributeName
                            } as any),
                            await Seeder.createRelationshipAttributeModel({
                                value: null,
                                attributeName: Seeder.subjectRelationshipDeclaration_relAttributeName
                            } as any)
                        ]
                    } as any);

                }

            }

        } catch (e) {
            Seeder.log('Seeding failed!');
            Seeder.log(e);
        }
    }

    public static async load() {
        await JensCateringRelationshipsSeeder.load_jennifermaxims_associate();
        await JensCateringRelationshipsSeeder.load_jenscatering_edtech_relationship();
        await JensCateringRelationshipsSeeder.load_johnmaxims_custom();
        await JensCateringRelationshipsSeeder.load_robertsmith_invitationCode();
        await JensCateringRelationshipsSeeder.load_fredjohnson_invitationCode();
        await JensCateringRelationshipsSeeder.load_zoezombies();
    }

}
