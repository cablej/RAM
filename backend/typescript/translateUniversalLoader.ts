import {TranslateLoader} from 'ng2-translate/ng2-translate';
import {Observable} from 'rxjs/Observable';
import fs = require('fs');

export class TranslateUniversalLoader implements TranslateLoader {

    constructor(private prefix: string = '../i18n',
                private suffix: string = '.json') {
    }

    /**
     * Gets the translations from the server
     * @param lang
     * @returns {any}
     */
    public getTranslation(lang: string): Observable<any> {
        return Observable.create((observer: any) => {
            observer.next(JSON.parse(fs.readFileSync(`${__dirname}/${this.prefix}/${lang}${this.suffix}`, 'utf8')));
            observer.complete();
        });
    }

}
