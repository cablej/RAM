import {conf} from '../bootstrap';
import {Seeder} from './seed';
import {RelationshipStatus, RelationshipInitiatedBy} from '../models/relationship.model';

// seeder .............................................................................................................

/* tslint:disable:no-any */
/* tslint:disable:max-func-body-length */
export class PeacefulGardenRelationshipsSeeder {

    private static async load_peacefulgarden_associate() {
        try {

            Seeder.log('\nInserting Sample Relationship - Peaceful Gardens Organic Cooking School Ltd / Patty Peaceful:\n'.underline);

            if (!conf.devMode) {

                Seeder.log('Skipped in prod mode'.gray);

            } else {

                Seeder.peacefulgarden_and_pattypeaceful_relationship = await Seeder.createRelationshipModel({
                    relationshipType: Seeder.associate_delegate_relationshipType,
                    subject: Seeder.peacefulgarden_party,
                    subjectNickName: Seeder.peacefulgarden_name,
                    delegate: Seeder.pattypeaceful_party,
                    delegateNickName: Seeder.pattypeaceful_name,
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

    public static async load() {
        await PeacefulGardenRelationshipsSeeder.load_peacefulgarden_associate();
    }

}
