import 'reflect-metadata';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {TranslateUniversalLoader} from '../translateUniversalLoader';

const translateServiceMap: {[key: string] : TranslateService} = {};

export class Translator {

    public static initialise() {
        this.initialiaseTranslateServiceFor('en');
        this.initialiaseTranslateServiceFor('fr');
    }

    private static initialiaseTranslateServiceFor(lang: string) {
        const translateService = new TranslateService(new TranslateUniversalLoader(), null);
        translateService.setDefaultLang('en');
        translateService.use(lang);

        translateServiceMap[lang] = translateService;

        // force an initial load
        const ob = translateService.get('HELLO');
        ob.subscribe(data => {
        });
    }

    public static get(key: string): string {
        // figure out language somehow
        let lang = 'en';

        let translateService = translateServiceMap[lang];

        if (translateService === null) {
            // sync call to async not possible - boo
            // this.initialiaseTranslateServiceFor(lang);

            // we don't have language, so just use english
            translateService = translateServiceMap['en'];
        }

        return translateService.instant(key);
    }

}
