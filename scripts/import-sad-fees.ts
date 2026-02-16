/**
 * Import Building Fees & Policies from Smart Apartment Data CSV
 *
 * Usage:
 *   npx tsx scripts/import-sad-fees.ts [path-to-csv]
 *
 * If no path provided, defaults to ~/Downloads/Charlotte_Apartment_Data.csv
 */

import * as fs from 'fs'
import * as path from 'path'
import prisma from '../src/lib/db'

interface CSVRow {
  buildingName: string
  address: string
  adminFee: string
  applicationFee: string
  petDeposit: string
  petRent: string
  petWeightLimit: string
  petBreedRestrictions: string
  maxPetsAllowed: string
  currentSpecials: string
  rentRangeStudio: string
  rentRange1BR: string
  rentRange2BR: string
  rentRange3BR: string
  parkingFee: string
  trashValetFee: string
  utilitiesIncluded: string
  shortTermLeasePremium: string
  earlyTerminationFee: string
  guarantorPolicy: string
  incomeRequirement: string
  additionalFeesProvisions: string
}

// Dice coefficient for string similarity
function diceCoefficient(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '')
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '')

  if (s1 === s2) return 1
  if (s1.length < 2 || s2.length < 2) return 0

  const bigrams1 = new Set<string>()
  for (let i = 0; i < s1.length - 1; i++) {
    bigrams1.add(s1.slice(i, i + 2))
  }

  const bigrams2 = new Set<string>()
  for (let i = 0; i < s2.length - 1; i++) {
    bigrams2.add(s2.slice(i, i + 2))
  }

  let intersection = 0
  for (const bigram of bigrams1) {
    if (bigrams2.has(bigram)) intersection++
  }

  return (2 * intersection) / (bigrams1.size + bigrams2.size)
}

// Parse CSV
function parseCSV(content: string): CSVRow[] {
  const lines = content.split('\n')
  const headers = lines[0].split(',').map((h) => h.trim())
  const rows: CSVRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Handle quoted fields with commas
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    if (values.length >= headers.length) {
      rows.push({
        buildingName: values[0],
        address: values[1],
        adminFee: values[2],
        applicationFee: values[3],
        petDeposit: values[4],
        petRent: values[5],
        petWeightLimit: values[6],
        petBreedRestrictions: values[7],
        maxPetsAllowed: values[8],
        currentSpecials: values[9],
        rentRangeStudio: values[10],
        rentRange1BR: values[11],
        rentRange2BR: values[12],
        rentRange3BR: values[13],
        parkingFee: values[14],
        trashValetFee: values[15],
        utilitiesIncluded: values[16],
        shortTermLeasePremium: values[17],
        earlyTerminationFee: values[18],
        guarantorPolicy: values[19],
        incomeRequirement: values[20],
        additionalFeesProvisions: values[21],
      })
    }
  }

  return rows
}

// Parse fee value (extract number from "$150" or similar)
function parseFee(value: string): number | null {
  if (!value || value === 'N/A') return null
  const match = value.replace(/[$,]/g, '').match(/^\d+/)
  return match ? parseInt(match[0]) : null
}

// Parse max pets
function parseMaxPets(value: string): number | null {
  if (!value || value === 'N/A') return null
  const match = value.match(/\d+/)
  return match ? parseInt(match[0]) : null
}

// Convert N/A to null
function nullIfNA(value: string): string | null {
  if (!value || value === 'N/A' || value.trim() === '') return null
  return value.trim()
}

async function main() {
  const csvPath =
    process.argv[2] ||
    path.join(process.env.HOME || '', 'Downloads/Charlotte_Apartment_Data.csv')

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`)
    process.exit(1)
  }

  console.log(`Reading CSV from: ${csvPath}`)
  const content = fs.readFileSync(csvPath, 'utf-8')
  const rows = parseCSV(content)
  console.log(`Parsed ${rows.length} rows from CSV`)

  // Fetch all buildings from database
  const buildings = await prisma.building.findMany({
    select: { id: true, name: true, address: true },
  })
  console.log(`Found ${buildings.length} buildings in database`)

  // Match and update
  let matched = 0
  let skipped = 0
  let notFound = 0

  for (const row of rows) {
    // Skip "NOT FOUND" entries
    if (row.address === 'NOT FOUND') {
      console.log(`[SKIP] ${row.buildingName} - not found on Smart Apartment Data`)
      skipped++
      continue
    }

    // Find best match
    let bestMatch: { id: string; name: string; score: number } | null = null
    for (const building of buildings) {
      const score = diceCoefficient(row.buildingName, building.name)
      if (score > 0.6 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { id: building.id, name: building.name, score }
      }
    }

    if (!bestMatch) {
      console.log(`[NOT FOUND] ${row.buildingName} - no match in database`)
      notFound++
      continue
    }

    console.log(
      `[MATCH] "${row.buildingName}" → "${bestMatch.name}" (score: ${bestMatch.score.toFixed(2)})`
    )

    // Update the building
    await prisma.building.update({
      where: { id: bestMatch.id },
      data: {
        adminFee: parseFee(row.adminFee),
        applicationFee: parseFee(row.applicationFee),
        petDeposit: nullIfNA(row.petDeposit),
        petRent: nullIfNA(row.petRent),
        petWeightLimit: nullIfNA(row.petWeightLimit),
        petBreedRestrictions: nullIfNA(row.petBreedRestrictions),
        maxPets: parseMaxPets(row.maxPetsAllowed),
        currentSpecials: nullIfNA(row.currentSpecials),
        specialsUpdatedAt: new Date(),
        rentRangeStudio: nullIfNA(row.rentRangeStudio),
        rentRange1br: nullIfNA(row.rentRange1BR),
        rentRange2br: nullIfNA(row.rentRange2BR),
        rentRange3br: nullIfNA(row.rentRange3BR),
        parkingFee: nullIfNA(row.parkingFee),
        trashValetFee: nullIfNA(row.trashValetFee),
        utilitiesIncluded: nullIfNA(row.utilitiesIncluded),
        shortTermPremium: nullIfNA(row.shortTermLeasePremium),
        earlyTerminationFee: nullIfNA(row.earlyTerminationFee),
        guarantorPolicy: nullIfNA(row.guarantorPolicy),
        incomeRequirement: nullIfNA(row.incomeRequirement),
        additionalProvisions: nullIfNA(row.additionalFeesProvisions),
        sadDataUpdatedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    matched++
  }

  console.log('\n=== Import Summary ===')
  console.log(`Matched & updated: ${matched}`)
  console.log(`Skipped (not in SAD): ${skipped}`)
  console.log(`Not found in DB: ${notFound}`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
