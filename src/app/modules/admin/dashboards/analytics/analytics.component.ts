import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApexOptions } from 'ng-apexcharts';
import { AnalyticsService } from 'app/modules/admin/dashboards/analytics/analytics.service';
import { CountryOption, ApiResponseByCountryCode } from 'app/modules/admin/dashboards/analytics/analytics.types';

@Component({
    selector: 'analytics',
    templateUrl: './analytics.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.Default
})
export class AnalyticsComponent implements OnInit, OnDestroy {
    chartBar: ApexOptions;
    chartPie: ApexOptions;
    data: ApiResponseByCountryCode | null;
    allCountries: CountryOption[];
    filteredCountries: CountryOption[] = [];
    selectedCountry: CountryOption = {
        countryCode: 'all',
        countryName: 'All'
    };

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    private _selectedCountryCode: string = 'all';

    /**
     * Constructor
     */
    constructor(
        private _analyticsService: AnalyticsService,
        private _router: Router,
    ) {
    }

    get selectedCountryCode(): string {
        return this._selectedCountryCode;
    }

    set selectedCountryCode(value: string) {
        if (this._selectedCountryCode !== value) {
            this._selectedCountryCode = value;

            this._onCountryCodeChange(value);
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Get the data
        this._analyticsService.data$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((data: ApiResponseByCountryCode) => {

                // Store the data
                this.data = data;

                // Prepare the chart data
                this._prepareChartData();

            });

        // Attach SVG fill fixer to all ApexCharts
        window['Apex'] = {
            chart: {
                events: {
                    mounted: (chart: any, options?: any): void => {
                        this._fixSvgFill(chart.el);
                    },
                    updated: (chart: any, options?: any): void => {
                        this._fixSvgFill(chart.el);
                    }
                }
            }
        };

        this._analyticsService.countriesList$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((countryList) => {
                const newCountryList = countryList.map(country => (
                    {
                        countryName: country.name,
                        countryCode: country.alpha2code,
                    }
                ));

                newCountryList.unshift({
                    countryCode: 'all',
                    countryName: 'All'
                });

                this.allCountries = newCountryList;
                this.filteredCountries = this.allCountries;
                this.selectedCountryCode = 'all';
                this.selectedCountry = {
                    countryCode: 'all',
                    countryName: 'All'
                };
            });

        this.selectedCountryCode = 'all';
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    onCountryInputChange(value: string | CountryOption): void {
        if (typeof value !== 'string') {
            return;
        }

        this.filteredCountries = this.allCountries.filter(country=>
            country.countryName.toLowerCase().startsWith(value.toLowerCase())
        );
    }

    onCountrySelected(country: CountryOption): void {
        if (country && country.countryCode !== this._selectedCountryCode) {
            this.selectedCountryCode = country.countryCode;
        }
    }

    displayCountry(country: CountryOption): string {
        return country ? country.countryName : '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Fix the SVG fill references. This fix must be applied to all ApexCharts
     * charts in order to fix 'black color on gradient fills on certain browsers'
     * issue caused by the '<base>' tag.
     *
     * Fix based on https://gist.github.com/Kamshak/c84cdc175209d1a30f711abd6a81d472
     *
     * @param element
     * @private
     */
    private _fixSvgFill(element: Element): void {
        // Current URL
        const currentURL = this._router.url;

        // 1. Find all elements with 'fill' attribute within the element
        // 2. Filter out the ones that doesn't have cross reference so we only left with the ones that use the 'url(#id)' syntax
        // 3. Insert the 'currentURL' at the front of the 'fill' attribute value
        Array.from(element.querySelectorAll('*[fill]'))
            .filter(el => el.getAttribute('fill').indexOf('url(') !== -1)
            .forEach((el) => {
                const attrVal = el.getAttribute('fill');
                el.setAttribute('fill', `url(${currentURL}${attrVal.slice(attrVal.indexOf('#'))}`);
            });
    }

    /**
     * Prepare the chart data from the data
     *
     * @private
     */
    private _prepareChartData(): void {
        if (!(this.data && Array.isArray(this.data) && this.data.length > 0)) {
            return;
        }

        this.chartBar = {
            chart: {
                foreColor: '#94a3b8',
                type: 'bar',
                height: 400,
                toolbar: {
                    show: false
                },
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        position: 'top',
                    },
                    borderRadius: 10,
                    barHeight: '70%',
                }
            },
            dataLabels: {
                enabled: false,
                style: {
                    fontSize: '12px',
                }
            },
            series: [
                {
                    name: 'Total Cases',
                    data: [
                        this.data?.[0]?.confirmed,
                    ],
                    color: '#0ea5e9'
                },
                {
                    name: 'Total Recovered',
                    data: [
                        this.data?.[0]?.recovered
                    ],
                    color: '#22c55e'
                },
                {
                    name: 'Total Deaths',
                    data: [
                        this.data?.[0]?.deaths
                    ],
                    color: '#ef4444'
                }
            ],
            grid: {
                show: true,
                borderColor: '#475569',
                padding: {
                    top: 10,
                    bottom: 0,
                    left: 10,
                    right: 10
                },
                position: 'back',
                xaxis: {
                    lines: {
                        show: true
                    }
                }
            },
            tooltip: {
                followCursor: true,
                theme: 'dark',
                x: {
                    formatter: (value: number): string => `${value.toLocaleString()}`
                },
                y: {
                    formatter: (value: number): string => `${value.toLocaleString()}`,
                }
            },
            xaxis: {
                categories: ['Stats'],
                type: 'category',
                labels: {
                    show: false
                }
            },
            yaxis: {
                labels: {
                    formatter: (value: number): string => `${value / 1000000}`,
                },
                title: {
                    text: 'Number in Million',
                    style: {
                        cssClass: 'font-light tracking-wider'
                    }
                }
            },
        };

        this.chartPie = {
            chart: {
                type: 'donut',
                foreColor: '#94a3b8',
            },
            series: [
                this.data?.[0]?.recovered,
                this.data?.[0]?.deaths,
                (
                    this.data?.[0]?.confirmed - (this.data?.[0]?.recovered + this.data?.[0]?.deaths)
                )
            ],
            labels: ['Recoveries', 'Deaths', 'Unknown'],
            colors: ['#22c55e', '#ef4444', '#52525b'],
            plotOptions: {
                pie: {
                    customScale: 0.85,
                    donut: {
                        size: '70%',
                        background: 'transparent',
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                formatter: (): string => `${Number(this.data?.[0]?.confirmed).toLocaleString()}`,
                                color: '#0ea5e9',
                                label: 'Total Cases'
                            },
                            value: {
                                formatter: (value: string): string => `${Number(value).toLocaleString()}`,
                            }
                        }
                    },
                    dataLabels: {
                        offset: 0,
                        minAngleToShowLabel: 0
                    },
                }
            },
            stroke: {
                colors: ['transparent']
            },
            tooltip: {
                followCursor: true,
                theme: 'dark',
                y: {
                    formatter: (value: number): string => `${value.toLocaleString()}`
                },
            },
            legend: {
                position: 'bottom'
            },
            dataLabels: {
                dropShadow: {
                    enabled: false
                }
            },
        };
    }

    private _onCountryCodeChange(newCountryCode: string): void {
        if(newCountryCode === 'all'){
            this._analyticsService.updateData();
        }
        else{
            this._analyticsService.updateData(newCountryCode);
        }
    }
}
