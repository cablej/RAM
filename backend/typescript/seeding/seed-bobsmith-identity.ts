import {conf} from '../bootstrap';
import {Seeder} from './seed';
import {ProfileProvider} from '../models/profile.model';
import {PartyType} from '../models/party.model';
import {IdentityType, IdentityLinkIdScheme} from '../models/identity.model';

// seeder .............................................................................................................

/* tslint:disable:no-any */
/* tslint:disable:max-func-body-length */
export class BobSmithIdentitySeeder {

    public static async load_party() {
        try {

            Seeder.log('\nInserting Sample Party - Bob Smith:\n'.underline);

            if (!conf.devMode) {

                Seeder.log('Skipped in prod mode'.gray);

            } else {

                Seeder.bobsmith_name = await Seeder.createNameModel({
                    givenName: 'Bob',
                    familyName: 'Smith'
                } as any);

                Seeder.bobsmith_dob = await Seeder.createSharedSecretModel({
                    value: '01/01/2000',
                    sharedSecretType: Seeder.dob_sharedSecretType
                } as any);

                Seeder.bobsmith_profile = await Seeder.createProfileModel({
                    provider: ProfileProvider.MyGov.code,
                    name: Seeder.bobsmith_name,
                    sharedSecrets: [Seeder.bobsmith_dob]
                } as any);

                Seeder.bobsmith_party = await Seeder.createPartyModel({
                    partyType: PartyType.Individual.code
                } as any);

            }

        } catch (e) {
            Seeder.log('Seeding failed!');
            Seeder.log(e);
        }
    }

    public static async load_identity_1() {
        try {

            Seeder.log('\nInserting Sample Identity 1 - Bob Smith:\n'.underline);

            if (!conf.devMode) {

                Seeder.log('Skipped in prod mode'.gray);

            } else {

                Seeder.bobsmith_identity_1 = await Seeder.createIdentityModel({
                    rawIdValue: 'bobsmith_identity_1',
                    identityType: IdentityType.LinkId.code,
                    defaultInd: false,
                    strength: 1,
                    linkIdScheme: IdentityLinkIdScheme.MyGov.code,
                    profile: Seeder.bobsmith_profile,
                    party: Seeder.bobsmith_party
                } as any);

            }

        } catch (e) {
            Seeder.log('Seeding failed!');
            Seeder.log(e);
        }
    }

    public static async load_identity_2() {
        try {

            Seeder.log('\nInserting Sample Identity 2 - Bob Smith:\n'.underline);

            if (!conf.devMode) {

                Seeder.log('Skipped in prod mode'.gray);

            } else {

                Seeder.bobsmith_identity_1 = await Seeder.createIdentityModel({
                    rawIdValue: 'bobsmith_identity_2',
                    identityType: IdentityType.LinkId.code,
                    defaultInd: true,
                    strength: 2,
                    linkIdScheme: IdentityLinkIdScheme.MyGov.code,
                    profile: Seeder.bobsmith_profile,
                    party: Seeder.bobsmith_party
                } as any);

            }

        } catch (e) {
            Seeder.log('Seeding failed!');
            Seeder.log(e);
        }
    }

    public static async load() {
        await BobSmithIdentitySeeder.load_party();
        await BobSmithIdentitySeeder.load_identity_1();
        await BobSmithIdentitySeeder.load_identity_2();
    }

}
