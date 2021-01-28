import { Calendar } from "./calendar";
import { CalendarSettings } from "../settings/calendarSettings";
import { WeekDaySettings } from "../settings/weekDaySettings";
import { WeeksDetermintaionStandardsSettings } from "../settings/weeksDetermintaionStandardsSettings";
import { WeekStandards } from "./weekStandards";
import { Utils } from "../utils";

export class CalendarISO8061 extends Calendar {

    constructor() {
        const isoCalendarSettings = new CalendarSettings();
        isoCalendarSettings.month = 0;
        isoCalendarSettings.day = 1;
        const isoWeekDaySettings = new WeekDaySettings();
        isoWeekDaySettings.daySelection = true;
        isoWeekDaySettings.day = 1;

        super(isoCalendarSettings, isoWeekDaySettings);

        //this.firstDayOfYear = calendarFormat.day;
    }

    public determineWeek(date: Date): number[] {
        const year: number = this.determineWeekYear(date);
        const dateOfFirstWeek: Date = this.getDateOfFirstWeek(year);
        const dateOfFirstFullWeek: Date = this.getDateOfFirstFullWeek(year);

        const weeks: number = Utils.GET_NUMBER_OF_WEEKS_BETWEEN_DATES(dateOfFirstFullWeek, date);

        return [weeks, year];
    }

    private determineWeekYear(date: Date): number {
        let dateYear = date.getFullYear();
        const dateOfFirstWeek: Date = this.getDateOfFirstWeek(dateYear);
        const dateOfFirstWeekNext: Date = this.getDateOfFirstWeek(dateYear + 1);
        const dateOfFirstWeekPrevious: Date = this.getDateOfFirstWeek(dateYear - 1);

        if (dateYear === 2019 && date.getDate() === 31 && date.getMonth() === 11) {
            debugger;
        }
        
        if (date < dateOfFirstWeek) {
            dateYear = new Date((dateOfFirstWeekPrevious.getTime() + dateOfFirstWeek.getTime()) / 2).getFullYear();
        } else if (date >= dateOfFirstWeekNext) {
            dateYear = dateYear + 1;
        } else {
            dateYear = new Date((dateOfFirstWeek.getTime() + dateOfFirstWeekNext.getTime()) / 2).getFullYear();
        }

        return dateYear;
    }

    public getDateOfFirstWeek(year: number): Date {
        const dateOfFirstJan = new Date(year, 0, 1);
        const dayOfWeek = dateOfFirstJan.getDay();

        let dateOfFirstWeek = dateOfFirstJan;
        if (dayOfWeek <= 4) {
            dateOfFirstWeek.setDate(dateOfFirstJan.getDate() - dateOfFirstJan.getDay() + 1);
        } else {
            dateOfFirstWeek.setDate(dateOfFirstJan.getDate() + 8 - dateOfFirstJan.getDay());
        }

        if (!this.dateOfFirstWeek[year]) {
            this.dateOfFirstWeek[year] = dateOfFirstWeek;
        }

        return this.dateOfFirstWeek[year];
    }

    public getDateOfFirstFullWeek(year: number): Date {
        if (!this.dateOfFirstFullWeek[year]) {
            this.dateOfFirstFullWeek[year] = this.getDateOfFirstWeek(year);
        }

        return this.dateOfFirstFullWeek[year];
    }

    public isChanged(
        calendarSettings: CalendarSettings,
        weekDaySettings: WeekDaySettings,
        weeksDetermintaionStandardsSettings: WeeksDetermintaionStandardsSettings
    ): boolean {
        return weeksDetermintaionStandardsSettings.weekStandard !== WeekStandards.ISO8061
    }
}