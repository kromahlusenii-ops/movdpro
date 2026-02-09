import prisma from '../src/lib/db'

async function main() {
  const buildings = await prisma.building.count()
  const units = await prisma.unit.count()
  const specials = await prisma.special.count()
  const neighborhoods = await prisma.neighborhood.count()

  const byMgmt = await prisma.building.groupBy({ by: ['managementId'], _count: true })
  const mgmts = await prisma.managementCompany.findMany()
  const mgmtMap = Object.fromEntries(mgmts.map(m => [m.id, m.name]))

  console.log('=== Database Summary ===')
  console.log('Buildings:', buildings)
  console.log('Units:', units)
  console.log('Specials:', specials)
  console.log('Neighborhoods:', neighborhoods)
  console.log()
  console.log('By Management Company:')
  for (const g of byMgmt) {
    const name = mgmtMap[g.managementId] || 'Unknown'
    const unitCount = await prisma.unit.count({ where: { building: { managementId: g.managementId } } })
    console.log(`  ${name}: ${g._count} buildings, ${unitCount} units`)
  }
  await prisma.$disconnect()
}

main()
