import {conf} from '../bootstrap';
import {Seeder} from './seed';
import {RelationshipStatus, RelationshipInitiatedBy} from '../models/relationship.model';

// seeder .............................................................................................................

/* tslint:disable:no-any */
/* tslint:disable:max-func-body-length */
export class JMFoodPackagingRelationshipsSeeder {

    private static async load_jenscatering_universal() {
        try {

            Seeder.log('\nInserting Sample Relationship - J&M Food Packaging Pty Ltd / Jen\'s Catering Pty Ltd:\n'.underline);

            if (!conf.devMode) {

                Seeder.log('Skipped in prod mode'.gray);

            } else {

                Seeder.jmfoodpackaging_and_jenscatering_relationship = await Seeder.createRelationshipModel({
                    relationshipType: Seeder.universal_delegate_relationshipType,
                    subject: Seeder.jmfoodpackaging_party,
                    subjectNickName: Seeder.jmfoodpackaging_name,
                    delegate: Seeder.jenscatering_party,
                    delegateNickName: Seeder.jenscatering_name,
                    startTimestamp: Seeder.now,
                    status: RelationshipStatus.Accepted.code,
                    initiatedBy: RelationshipInitiatedBy.Subject.code,
                    attributes: [
                        await Seeder.createRelationshipAttributeModel({
                            value: true,
                            attributeName: Seeder.delegateManageAuthorisationAllowedInd_relAttributeName
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
        await JMFoodPackagingRelationshipsSeeder.load_jenscatering_universal();
    }

}
