import {conf} from '../bootstrap';
import {Seeder} from './seed';
import {RelationshipStatus, RelationshipInitiatedBy} from '../models/relationship.model';

// seeder .............................................................................................................

/* tslint:disable:no-any */
/* tslint:disable:max-func-body-length */
export class EdTechOspRelationshipsSeeder {

    private static async load_edtech_associate() {
        try {

            Seeder.log('\nInserting Sample Relationship - Ed Tech OSP Pty Ltd / Ed Oaner:\n'.underline);

            if (!conf.devMode) {

                Seeder.log('Skipped in prod mode'.gray);

            } else {

                Seeder.edtechosp_and_edoaner_relationship = await Seeder.createRelationshipModel({
                    relationshipType: Seeder.associate_delegate_relationshipType,
                    subject: Seeder.edtechosp_party,
                    subjectNickName: Seeder.edtechosp_name,
                    delegate: Seeder.edoaner_party,
                    delegateNickName: Seeder.edoaner_name,
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
        await EdTechOspRelationshipsSeeder.load_edtech_associate();
    }

}
