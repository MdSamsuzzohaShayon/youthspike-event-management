import { IDocument } from "./document";


interface IProStatsCommon{
  servingPercentage: number; // serving %
  acePercentage: number; // Ace %
  receivingPercentage: number; // Receiving %
  hittingPercentage: number; // Hiting %
  settingPercentage: number; // Setting %
  defensiveConversionPercentage: number; // DC%
}


export interface IProStats extends IProStatsCommon {
  _id: string;
  event: string;
}


export interface IProStatsAdd extends IProStatsCommon {
  servingPercentage: number; // serving %
  acePercentage: number; // Ace %
  receivingPercentage: number; // Receiving %
  hittingPercentage: number; // Hiting %
  settingPercentage: number; // Setting %
  defensiveConversionPercentage: number; // DC%
}
