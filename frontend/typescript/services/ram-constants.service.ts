import { Injectable } from '@angular/core';

@Injectable()
export class RAMConstantsService {
    public PageSizeOptions = [5, 10, 25, 100];
    public DefaultPageSize = 5;
    public PartyId = '5719bc5d65cae16c197e1ecd';
}