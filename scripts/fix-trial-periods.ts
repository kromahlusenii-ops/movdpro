import prisma from '../src/lib/db'

async function main() {
  // Find all trialing users
  const trialingUsers = await prisma.locatorProfile.findMany({
    where: { subscriptionStatus: 'trialing' },
    select: {
      id: true,
      createdAt: true,
      trialEndsAt: true,
      creditsResetAt: true,
      companyName: true,
    },
  })

  console.log(`Found ${trialingUsers.length} trialing user(s)`)

  for (const user of trialingUsers) {
    // Calculate correct 7-day trial end date
    const correctTrialEnd = new Date(user.createdAt)
    correctTrialEnd.setDate(correctTrialEnd.getDate() + 7)

    // Skip if already correct (within 1 day tolerance)
    if (user.trialEndsAt) {
      const diff = Math.abs(user.trialEndsAt.getTime() - correctTrialEnd.getTime())
      if (diff < 24 * 60 * 60 * 1000) {
        console.log(`  ${user.companyName || user.id}: Already has 7-day trial, skipping`)
        continue
      }
    }

    console.log(`  ${user.companyName || user.id}:`)
    console.log(`    Old trialEndsAt: ${user.trialEndsAt?.toISOString()}`)
    console.log(`    New trialEndsAt: ${correctTrialEnd.toISOString()}`)

    await prisma.locatorProfile.update({
      where: { id: user.id },
      data: {
        trialEndsAt: correctTrialEnd,
        creditsResetAt: correctTrialEnd,
      },
    })

    console.log(`    Updated!`)
  }

  console.log('\nDone!')
  await prisma.$disconnect()
}

main()
