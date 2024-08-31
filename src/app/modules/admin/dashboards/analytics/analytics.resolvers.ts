import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { AnalyticsService } from 'app/modules/admin/dashboards/analytics/analytics.service';
import { delay, switchMap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AnalyticsResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _analyticsService: AnalyticsService)
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     * This is a hack to prevent the rate limit imposed by API(1 request per second)
     * During application load, the resolver uses this to circumvent firing bith this request
     * and getCountriesList within 1 second.
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
        return this._analyticsService.getCountriesList().pipe(
            // Delay by 1 second before making the next API call
            delay(1000),
            switchMap(countriesList =>
                forkJoin({
                    countriesList: of(countriesList),
                    data: this._analyticsService.getData(),
                })
            )
        );
    }
}
