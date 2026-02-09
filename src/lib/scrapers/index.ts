/**
 * Scraper Registry - Central hub for all building scrapers
 */

import greystarScraper from './greystar'
import maaScraper from './maa'
import cortlandScraper from './cortland'
import greystarDiscovery from './greystar-discovery'
import { Scraper } from './types'

export const scrapers: Record<string, Scraper> = {
  greystar: greystarScraper,
  maa: maaScraper,
  cortland: cortlandScraper,
}

export { scrapeGreystarCharlotte, CHARLOTTE_GREYSTAR_PROPERTIES } from './greystar'
export { scrapeMAACHarlotte, CHARLOTTE_MAA_PROPERTIES } from './maa'
export { scrapeCortlandCharlotte, CHARLOTTE_CORTLAND_PROPERTIES } from './cortland'
export { discoverGreystarProperties } from './greystar-discovery'
export { greystarDiscovery }
export { fullSync, fullSyncAll } from './full-sync'
export * from './types'
