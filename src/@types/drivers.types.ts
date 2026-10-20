export interface IDriver {
  id: number;
  driver_number: number;
  full_name: string;
  team_name: string;
  team_colour: string;
  headshot_url?: string;
  country_code: string;
}
