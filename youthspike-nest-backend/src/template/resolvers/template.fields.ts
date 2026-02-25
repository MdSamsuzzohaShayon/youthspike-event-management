import { Injectable } from '@nestjs/common';
import { Template } from '../template.schema';
import { EventService } from 'src/event/event.service';

@Injectable()
export class TemplateFields {
  constructor(
    private eventService: EventService,
  ) { }

  async event(template: Template) {
    try {
      const eventId = String(template.event);
      const event = await this.eventService.findById(eventId);
      return event;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

}
