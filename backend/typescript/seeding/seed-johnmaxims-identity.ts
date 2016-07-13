import {conf} from '../bootstrap';
import {Seeder} from './seed';
import {ProfileProvider} from '../models/profile.model';
import {PartyType} from '../models/party.model';
import {IdentityType, IdentityLinkIdScheme} from '../models/identity.model';

// seeder .............................................................................................................

/* tslint:disable:no-any */
/* tslint:disable:max-func-body-length */
export class JohnMaximsIdentitySeeder {

    public static async load() {
        try {

            Seeder.log('\nInserting Sample Identity - John Maxim:\n'.underline);

            if (!conf.devMode) {

                Seeder.log('Skipped in prod mode'.gray);

            } else {

                Seeder.johnmaxims_name = await Seeder.createNameModel({
                    givenName: 'John',
                    familyName: 'Maxims'
                } as any);

                Seeder.johnmaxims_dob = await Seeder.createSharedSecretModel({
                    value: '31/01/1990',
                    sharedSecretType: Seeder.dob_sharedSecretType
                } as any);

                Seeder.johnmaxims_profile = await Seeder.createProfileModel({
                    provider: ProfileProvider.MyGov.name,
                    name: Seeder.johnmaxims_name,
                    sharedSecrets: [Seeder.johnmaxims_dob]
                } as any);

                Seeder.johnmaxims_party = await Seeder.createPartyModel({
                    partyType: PartyType.Individual.name
                } as any);

                Seeder.log('');

                Seeder.johnmaxims_identity_1 = await Seeder.createIdentityModel({
                    rawIdValue: 'johnmaxims_identity_1',
                    identityType: IdentityType.LinkId.name,
                    defaultInd: true,
                    linkIdScheme: IdentityLinkIdScheme.MyGov.name,
                    profile: Seeder.johnmaxims_profile,
                    party: Seeder.johnmaxims_party
                } as any);

            }

        } catch (e) {
            Seeder.log('Seeding failed!');
            Seeder.log(e);
        }
    }

}
