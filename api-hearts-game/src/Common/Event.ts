import { BasePayload } from "./BasePayload";

export class Event {
    eventType: string;
    eventPayload: BasePayload;

    constructor(eventType: string, eventPayload: BasePayload) {
        this.eventType = eventType;
        this.eventPayload = eventPayload;
    }
}