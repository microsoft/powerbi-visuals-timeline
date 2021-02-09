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
        const dateOfFirstFullWeek: Date = this.getDateOfFirstFullWeek(year);
        const weeks: number = Utils.GET_NUMBER_OF_WEEKS_BETWEEN_DATES(dateOfFirstFullWeek, date);

        return [weeks, year];
    }

    /*
    Returns a correct year for passed as a parameter date.
    Regarding ISO, first week can start from 29th December to 4th January so,
    If we pass date as 2021-01-03 for US calendar it belongs to the first week and should return 2021
    However, for ISO it still belongs to the latest week of 2020 year and here we have to return 2020
    */
    private determineWeekYear(date: Date): number {
        let dateYear = date.getFullYear();
        const dateOfFirstWeek: Date = this.getDateOfFirstWeek(dateYear);
        const dateOfFirstWeekNext: Date = this.getDateOfFirstWeek(dateYear + 1);

        if (date < dateOfFirstWeek) {
            // This scenario works when the first date of ISO week year starts from the beginning of January: 1th, 2nd, 3rd, 4th
            // 
            // Input date:                                   January 3, 2021 [left condition expression]
            // The first date of 2021 regarding ISO weeks:   January 4, 2021 [right condition expression]
            // Returning ISO week year for January 3, 2021:  2020
            //
            // To get the ISO week year correctly, the algorythm just deduct 1 from actual year that is 2021 to get 2020
            dateYear -= 1
        } else if (date >= dateOfFirstWeekNext) {
            // This scenario works when the first date of ISO week year starts from the last days of actual previous year: December, 29th | 30th | 31st
            //
            // Input date:                                 December 31, 2019 [left condition expression]
            // The first date of 2020 regarding ISO weeks: December 30, 2019 [right condition expression]
            // Returning ISO week year:                    2020
            //
            // To get the ISO week year correctly, the algorythm just add 1 to actual year that is 2019 to get 2020
            dateYear += 1;
        }

        return dateYear;
    }

    public getDateOfFirstWeek(year: number): Date {
        const dateOfFirstJan = new Date(year, 0, 1);
        const dayOfFirstJanWeek = dateOfFirstJan.getDay();
        const firstJanDig = 1;

        let dateOfFirstWeek = dateOfFirstJan;
        // The first week regarding ISO has to contain Thursday (4th day in the week)
        if (dayOfFirstJanWeek <= 4) {
            // If 1st January is Monday, Tuesday, Wednesday or Thursday => the first week date should be adjusted to left up to Monday
            // 1st Jan is Tuesday    setDate(1 - 2 + 1) = setDate(0)  => 31st December (last day of previous month)
            // 1st Jan is Monday     setDate(1 - 1 + 1) = setDate(1)  => 1st  January  (nothing has changed)
            // 1st Jan is Wednesday  setDate(1 - 3 + 1) = setDate(-1) => 30th December
            // 1st Jan is Thursday   setDate(1 - 4 + 1) = setDate(-2) => 29th December
            // Digit 1 here is just  constant to correct calculation
            dateOfFirstWeek.setDate(firstJanDig - dayOfFirstJanWeek + 1);
        } else {
            // If 1st January is Friday, Saturday or Sunday => the first week date should be adjusted to right up to Monday
            // 1st Jan is Friday     setDate(1 + 8 - 5) = setDate(4) => 4th January
            // 1st Jan is Saturday   setDate(1 + 8 - 6) = setDate(3) => 3rd January
            // 1st Jan is Sunday     setDate(1 + 8 - 7) = setDate(2) => 2nd January
            // Digit 8 here is just constant to correct calculation that represents a week + 1
            dateOfFirstWeek.setDate(firstJanDig - dayOfFirstJanWeek + 8);
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