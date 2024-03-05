import { WeeksDetermintaionStandardsSettings } from "../settings/weeksDetermintaionStandardsSettings";
import {Calendar, CalendarFormat, WeekdayFormat} from "./calendar";
import { WeekStandards } from "./weekStandards";
import { CalendarISO8061 } from "./calendarISO8061";

export class CalendarFactory {
    public create(
        weeksDeterminationStandardsSettings: WeeksDetermintaionStandardsSettings,
        calendarSettings: CalendarFormat,
        weekDaySettings: WeekdayFormat) : Calendar {

        let calendar: Calendar = null;

        switch (weeksDeterminationStandardsSettings.weekStandard) {
            case WeekStandards.ISO8061:
                calendar = new CalendarISO8061();
                break;
            default:
                calendar = new Calendar(calendarSettings, weekDaySettings)
        }

        return calendar;
    }
}
