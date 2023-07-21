import { BasePayload } from "./BasePayload";

export class Event {
    eventType: string;
    eventPayload: BasePayload;
    eventVersion: number;

    constructor(eventType: string, eventPayload: BasePayload, eventVersion: number) {
        this.eventType = eventType;
        this.eventPayload = eventPayload;
        this.eventVersion = eventVersion;
    }
}