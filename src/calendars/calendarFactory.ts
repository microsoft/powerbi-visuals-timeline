import { CalendarSettings } from "../settings/calendarSettings";
import { WeekDaySettings } from "../settings/weekDaySettings";
import { WeeksDetermintaionStandardsSettings } from "../settings/weeksDetermintaionStandardsSettings";
import { Calendar } from "./calendar";
import { WeekStandards } from "./weekStandards";
import { CalendarISO8061 } from "./calendarISO8061";

export class CalendarFactory {
    public create(
        weeksDetermintaionStandardsSettings: WeeksDetermintaionStandardsSettings,
        calendarSettings: CalendarSettings,
        weekDaySettings: WeekDaySettings) : Calendar {

        let calendar: Calendar = null;

        switch (weeksDetermintaionStandardsSettings.weekStandard) {
            case WeekStandards.ISO8061:
                calendar = new CalendarISO8061();
                break;
            default:
                calendar = new Calendar(calendarSettings, weekDaySettings)
        }

        return calendar;
    }
}