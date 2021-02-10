/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

import { GranularityData } from "../granularity/granularityData";
import { CalendarSettings } from "../settings/calendarSettings";
import { WeekDaySettings } from "../settings/weekDaySettings";
import { WeeksDetermintaionStandardsSettings } from "../settings/weeksDetermintaionStandardsSettings";
import { Utils } from "../utils";
import { WeekStandards } from "./weekStandards";

interface IDateDictionary {
    [year: number]: Date;
}

export interface IPeriodDates {
    startDate: Date;
    endDate: Date;
}

export class Calendar {
    private static QuarterFirstMonths: number[] = [0, 3, 6, 9];

    protected firstDayOfWeek: number;
    protected firstMonthOfYear: number;
    protected firstDayOfYear: number;
    protected dateOfFirstWeek: IDateDictionary;
    protected dateOfFirstFullWeek: IDateDictionary;
    protected quarterFirstMonths: number[];
    protected isDaySelection: boolean;
    protected EmptyYearOffset: number = 0;
    protected YearOffset: number = 1;

    constructor(calendarFormat: CalendarSettings, weekDaySettings: WeekDaySettings) {
        this.isDaySelection = weekDaySettings.daySelection;
        this.firstDayOfWeek = weekDaySettings.day;
        this.firstMonthOfYear = calendarFormat.month;
        this.firstDayOfYear = calendarFormat.day;

        this.dateOfFirstWeek = {};
        this.dateOfFirstFullWeek = {};

        this.quarterFirstMonths = Calendar.QuarterFirstMonths.map((monthIndex: number) => {
            return monthIndex + this.firstMonthOfYear;
        });
    }

    public getFiscalYearAjustment(): number {
        const firstMonthOfYear = this.getFirstMonthOfYear();
        const firstDayOfYear = this.getFirstDayOfYear();

        return ((firstMonthOfYear === 0 && firstDayOfYear === 1) ? 0 : 1);
    }

    public determineYear(date: Date): number {
        const firstMonthOfYear = this.getFirstMonthOfYear();
        const firstDayOfYear = this.getFirstDayOfYear();

        const firstDate: Date = new Date(
            date.getFullYear(),
            firstMonthOfYear,
            firstDayOfYear,
        );

        return date.getFullYear() + this.getFiscalYearAjustment() - ((firstDate <= date)
            ? this.EmptyYearOffset
            : this.YearOffset);
    }

    public determineWeek(date: Date): number[] {
        // For fiscal calendar case that started not from the 1st January a year may be greater on 1.
        // It's Ok until this year is used to calculate date of first week.
        // So, here is some adjustment was applied.
        const year: number = this.determineYear(date);
        const fiscalYearAdjustment = this.getFiscalYearAjustment();

        const dateOfFirstWeek: Date = this.getDateOfFirstWeek(year - fiscalYearAdjustment);
        const dateOfFirstFullWeek: Date = this.getDateOfFirstFullWeek(year - fiscalYearAdjustment);
        // But number of weeks must be calculated using original date.
        const weeks: number = Utils.GET_NUMBER_OF_WEEKS_BETWEEN_DATES(dateOfFirstFullWeek, date);

        if (date >= dateOfFirstFullWeek && dateOfFirstWeek < dateOfFirstFullWeek) {
            return [weeks + 1, year];
        }

        return [weeks, year];
    }

    public getFirstDayOfWeek(): number {
        return this.firstDayOfWeek;
    }

    public getFirstMonthOfYear(): number {
        return this.firstMonthOfYear;
    }

    public getFirstDayOfYear(): number {
        return this.firstDayOfYear;
    }

    public getNextDate(date: Date): Date {
        return GranularityData.NEXT_DAY(date);
    }

    public getWeekPeriod(date: Date): IPeriodDates {
        const year: number = date.getFullYear();
        const month: number = date.getMonth();
        const dayOfWeek: number = date.getDay();

        const weekDay = this.isDaySelection
            ? this.firstDayOfWeek
            : new Date(year, this.firstMonthOfYear, this.firstDayOfYear).getDay();

        let deltaDays: number = 0;
        if (weekDay !== dayOfWeek) {
            deltaDays = dayOfWeek - weekDay;
        }

        if (deltaDays < 0) {
            deltaDays = 7 + deltaDays;
        }

        const daysToWeekEnd = (7 - deltaDays);
        const startDate = new Date(year, month, date.getDate() - deltaDays);
        const endDate = new Date(year, month, date.getDate() + daysToWeekEnd);

        return { startDate, endDate };
    }

    public getQuarterIndex(date: Date): number {
        return Math.floor(date.getMonth() / 3);
    }

    public getQuarterStartDate(year: number, quarterIndex: number): Date {
        return new Date(year, this.quarterFirstMonths[quarterIndex], this.firstDayOfYear);
    }

    public getQuarterEndDate(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth() + 3, this.firstDayOfYear);
    }

    public getQuarterPeriod(date: Date): IPeriodDates {
        const quarterIndex = this.getQuarterIndex(date);

        const startDate: Date = this.getQuarterStartDate(date.getFullYear(), quarterIndex);
        const endDate: Date = this.getQuarterEndDate(startDate);

        return { startDate, endDate };
    }

    public getMonthPeriod(date: Date): IPeriodDates {
        const year: number = date.getFullYear();
        const month: number = date.getMonth();

        const startDate: Date = new Date(year, month, this.firstDayOfYear);
        const endDate: Date = new Date(year, month + 1, this.firstDayOfYear);

        return { startDate, endDate };
    }

    public getYearPeriod(date: Date): IPeriodDates {
        const year: number = date.getFullYear();

        const startDate: Date = new Date(year, this.firstMonthOfYear, this.firstDayOfYear);
        const endDate: Date = new Date(year + 1, this.firstMonthOfYear, this.firstDayOfYear);

        return { startDate, endDate };
    }

    public isChanged(
        calendarSettings: CalendarSettings,
        weekDaySettings: WeekDaySettings,
        weeksDetermintaionStandardsSettings: WeeksDetermintaionStandardsSettings
    ): boolean {
        return this.firstMonthOfYear !== calendarSettings.month
            || this.firstDayOfYear !== calendarSettings.day
            || this.firstDayOfWeek !== weekDaySettings.day
            || weeksDetermintaionStandardsSettings.weekStandard !== WeekStandards.NotSet;
    }

    public getDateOfFirstWeek(year: number): Date {
        if (!this.dateOfFirstWeek[year]) {
            this.dateOfFirstWeek[year] = new Date(year, this.firstMonthOfYear, this.firstDayOfYear);
        }

        return this.dateOfFirstWeek[year];
    }

    public getDateOfFirstFullWeek(year: number): Date {
        if (!this.dateOfFirstFullWeek[year]) {
            this.dateOfFirstFullWeek[year] = this.calculateDateOfFirstFullWeek(year);
        }

        return this.dateOfFirstFullWeek[year];
    }

    private calculateDateOfFirstFullWeek(year: number): Date {
        let date: Date = new Date(year, this.firstMonthOfYear, this.firstDayOfYear);

        const weekDay = this.isDaySelection
            ? this.firstDayOfWeek
            : new Date(year, this.firstMonthOfYear, this.firstDayOfYear).getDay();

        while (date.getDay() !== weekDay) {
            date = GranularityData.NEXT_DAY(date);
        }

        return date;
    }
}
