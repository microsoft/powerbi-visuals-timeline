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

export enum PeriodSlicerPosition {
    topLeft = "topLeft",
    topCenter = "topCenter",
    topRight = "topRight",
    bottomLeft = "bottomLeft",
    bottomCenter = "bottomCenter",
    bottomRight = "bottomRight",
}

export enum PeriodSlicerHorizontalPosition {
    left = "left",
    center = "center",
    right = "right",
}

export interface IPeriodSlicerPlacement {
    isAtBottom: boolean;
    horizontalPosition: PeriodSlicerHorizontalPosition;
}

export const periodSlicerPlacements: Record<PeriodSlicerPosition, IPeriodSlicerPlacement> = {
    [PeriodSlicerPosition.topLeft]: {
        isAtBottom: false,
        horizontalPosition: PeriodSlicerHorizontalPosition.left,
    },
    [PeriodSlicerPosition.topCenter]: {
        isAtBottom: false,
        horizontalPosition: PeriodSlicerHorizontalPosition.center,
    },
    [PeriodSlicerPosition.topRight]: {
        isAtBottom: false,
        horizontalPosition: PeriodSlicerHorizontalPosition.right,
    },
    [PeriodSlicerPosition.bottomLeft]: {
        isAtBottom: true,
        horizontalPosition: PeriodSlicerHorizontalPosition.left,
    },
    [PeriodSlicerPosition.bottomCenter]: {
        isAtBottom: true,
        horizontalPosition: PeriodSlicerHorizontalPosition.center,
    },
    [PeriodSlicerPosition.bottomRight]: {
        isAtBottom: true,
        horizontalPosition: PeriodSlicerHorizontalPosition.right,
    },
};
