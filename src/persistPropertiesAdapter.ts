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

module powerbi.extensibility.visual.persistPropertiesAdapter {
    export interface PersistPropertiesAdapterVisualObjectInstance {
        objectInstance: VisualObjectInstance;
        callback?: () => void;
    }

    export interface PersistPropertiesAdapterFrame {
        [objectName: string]: PersistPropertiesAdapterVisualObjectInstance;
    }

    /**
     * PersistPropertiesAdapter is an adapter for IVisualHostServices.persistProperties.
     * We are going to remove it when IVisualHostServices will be fixed.
     */
    export class PersistPropertiesAdapter {
        private persistPropertiesTimeout: number = 250; // ms
        private timeoutId: number = null;

        private frame: PersistPropertiesAdapterFrame;

        private host: IVisualHost;
        public get visualHost(): IVisualHost {
            return this.host;
        }

        constructor(host: IVisualHost) {
            this.host = host;
        }

        public static create(host: IVisualHost): PersistPropertiesAdapter {
            return new PersistPropertiesAdapter(host);
        }

        public persistProperties(instance: PersistPropertiesAdapterVisualObjectInstance): void {
            if (!instance || !instance.objectInstance || !instance.objectInstance.objectName) {
                return;
            }

            this.mergeInstances(instance);

            this.sheduleToPersistProperties();
        }

        private mergeInstances(instance: PersistPropertiesAdapterVisualObjectInstance): void {
            if (!this.frame) {
                this.createFrame();
            }

            const objectName: string = instance.objectInstance.objectName;

            if (!this.frame[objectName]) {
                this.frame[objectName] = instance;
            } else if (this.frame[objectName]) {
                const propertyNames: string[] = Object.keys(instance.objectInstance.properties);

                propertyNames.forEach((propertyName: string) => {
                    this.frame[objectName].objectInstance.properties[propertyName] =
                        instance.objectInstance.properties[propertyName];
                });

                this.frame[objectName].callback = instance.callback;
            }
        }

        private sheduleToPersistProperties(): void {
            if (this.timeoutId) {
                return;
            }

            this.timeoutId = setTimeout(() => {
                this.corePersistProperties();

                this.timeoutId = null;
            }, this.persistPropertiesTimeout);
        }

        private corePersistProperties(): void {
            let changes: VisualObjectInstancesToPersist,
                frameKeys: string[];

            changes = { merge: [] };
            frameKeys = Object.keys(this.frame);

            frameKeys.forEach((frameKey: string) => {
                changes.merge.push(this.frame[frameKey].objectInstance);
            });

            if (changes.merge.length > 0) {
                this.host.persistProperties(changes);

                this.executeCallbacks();
            }

            this.createFrame();
        }

        private executeCallbacks(): void {
            if (!this.frame) {
                return;
            }

            const frameKeys: string[] = Object.keys(this.frame);

            frameKeys.forEach((frameKey: string) => {
                const instance: PersistPropertiesAdapterVisualObjectInstance = this.frame[frameKey];

                if (instance.callback) {
                    instance.callback();
                }
            });
        }

        private createFrame(): void {
            this.frame = {};
        }
    }
}
