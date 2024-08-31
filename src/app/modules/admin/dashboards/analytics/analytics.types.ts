export type CountryOption = {
    countryName: string;
    countryCode: string;
};

export type CountryListOptions = {
    name: string;
    alpha2code: string;
    alpha3code: string;
    latitude: number | null;
    longitude: number | null;
};

export type ApiResponseByCountryCode = {
    country: string;
    code: string;
    confirmed: number;
    recovered: number;
    critical: number;
    deaths: number;
    latitude?: string | number;
    longitude?: string | number;
    lastChange: string;
    lastUpdate: string;
}[];
