import {conf} from '../bootstrap';
import {Seeder} from './seed';
import {RelationshipStatus, RelationshipInitiatedBy} from '../models/relationship.model';

// seeder .............................................................................................................

/* tslint:disable:no-any */
/* tslint:disable:max-func-body-length */
export class CakeryBakeryRelationshipsSeeder {

    private static async load_jenniferMaxim_custom() {
        try {

            Seeder.log('\nInserting Sample Relationship - Cakery Bakery Pty Ltd / Jennifer Maxim:\n'.underline);

            if (!conf.devMode) {

                Seeder.log('Skipped in prod mode'.gray);

            } else {

                console.log(Seeder.delegateManageAuthorisationAllowedInd_relAttributeName);
                console.log(Seeder.delegateRelationshipDeclaration_relAttributeName);
                console.log(Seeder.subjectRelationshipDeclaration_relAttributeName);

                Seeder.cakerybakery_and_jennifermaxims_relationship = await Seeder.createRelationshipModel({
                    relationshipType: Seeder.custom_delegate_relationshipType,
                    subject: Seeder.cakerybakery_party,
                    subjectNickName: Seeder.cakerybakery_name,
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
                            value: '',
                            attributeName: Seeder.delegateRelationshipDeclaration_relAttributeName
                        } as any),
                        await Seeder.createRelationshipAttributeModel({
                            value: '',
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
        await CakeryBakeryRelationshipsSeeder.load_jenniferMaxim_custom();
    }

}
