/* Copy of https://github.com/evanplaice/ng2-markdown
 * converting to TS as we do not transpile es6 (babel)
 * Attempting to turn transpiler on causes an internal
 * error.
 */
import {Directive, ElementRef, OnInit, Input, OnChanges, SimpleChanges} from '@angular/core';
import Showdown from 'showdown';

@Directive({
    selector: 'ng2-markdown'
})

export class MarkdownComponent implements OnInit, OnChanges {

    @Input() public markdown: string;

    constructor(private elementRef: ElementRef) {
    }

    public ngOnInit() {
        this.process();
    }

    public ngOnChanges(changes: SimpleChanges): any {
        this.process();
    }

    private process() {
        let converter = new Showdown.Converter();
        this.elementRef.nativeElement.innerHTML = converter.makeHtml(this.markdown);
    }
}
