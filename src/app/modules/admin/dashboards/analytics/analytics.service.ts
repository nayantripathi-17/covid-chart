import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiResponseByCountryCode, CountryListOptions } from './analytics.types';
import { environment } from 'environments/environment.prod';

@Injectable({
    providedIn: 'root'
})
export class AnalyticsService {
    private _data: BehaviorSubject<any> = new BehaviorSubject(null);
    private _baseApiUrl = environment.apiRoute;
    private _allCountriesUrl = `${this._baseApiUrl}/help/countries`;
    private _totalByCountryCodeUrl = `${this._baseApiUrl}/country/code`;
    private _globalTotalUrl = `${this._baseApiUrl}/totals`;
    private _httpOptions = {
        headers: new HttpHeaders({
            'x-rapidapi-key': environment.apiKey,
            'x-rapidapi-host': environment.apiHost,
        }),
    };
    private _countriesList: BehaviorSubject<CountryListOptions[]> = new BehaviorSubject([]);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for data
     */
    get data$(): Observable<any> {
        return this._data.asObservable();
    }

    get countriesList$(): Observable<CountryListOptions[]> {
        return this._countriesList.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get data
     */
    getData(code?: string): Observable<any> {
        let finalUrl = this._globalTotalUrl;

        if (code) {
            finalUrl = this._appendQueryParams(this._totalByCountryCodeUrl, {
                code,
            });
        }

        return this._httpClient.get<ApiResponseByCountryCode>(finalUrl, this._httpOptions).pipe(
            tap({
                next: (response) => {
                    this._data.next(response);
                },
            })
        );
    }

    /**
     * Update data
     */
    updateData(code?: string): void {
        let finalUrl = this._globalTotalUrl;

        if (code) {
            finalUrl = this._appendQueryParams(this._totalByCountryCodeUrl, {
                code,
            });
        }

        this._httpClient.get<ApiResponseByCountryCode>(finalUrl, this._httpOptions)
            .pipe(
                tap((response) => {
                    this._data.next(response);
                })
            )
            .subscribe();
    }



    getCountriesList(): Observable<CountryListOptions[]> {
        return this._httpClient.get<CountryListOptions[]>(this._allCountriesUrl, this._httpOptions).pipe(
            tap({
                next: (countryList) => {
                    this._countriesList.next(countryList);
                },
            })
        );
    }

    private _appendQueryParams(url: string, params?: { [key: string]: string }): string {
        if (!params) {
            return url;
        }
        const urlObj = new URL(url);

        Object.keys(params).forEach((key) => {
            urlObj.searchParams.append(key, params[key]);
        });

        return urlObj.toString();
    }
}
