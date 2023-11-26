import {Calendar, CalendarFormat, WeekDayFormat} from "./calendar";
import { WeekStandard } from "./weekStandard";
import { CalendarISO8061 } from "./calendarISO8061";

export class CalendarFactory {
    public create(
        weekStandard: WeekStandard,
        calendarSettings: CalendarFormat,
        weekDaySettings: WeekDayFormat) : Calendar {

        let calendar: Calendar = null;

        switch (weekStandard) {
            case WeekStandard.ISO8061:
                calendar = new CalendarISO8061();
                break;
            default:
                calendar = new Calendar(calendarSettings, weekDaySettings)
        }

        return calendar;
    }
}
