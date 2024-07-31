import {Calendar, CalendarFormat, CalendarFormattingSettings, WeekdayFormat} from "./calendar";
import { WeekStandard } from "./weekStandard";
import { CalendarISO8061 } from "./calendarISO8061";

export class CalendarFactory {
    public create(
        weekStandard: WeekStandard,
        calendarSettings: CalendarFormat,
        weekDaySettings: WeekdayFormat,
        settings: CalendarFormattingSettings) : Calendar {

        let calendar: Calendar;

        switch (weekStandard) {
            case WeekStandard.ISO8061:
                calendar = new CalendarISO8061(settings);
                break;
            default:
                calendar = new Calendar(calendarSettings, weekDaySettings, settings)
        }

        return calendar;
    }
}
