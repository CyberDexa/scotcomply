import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function showCredentials() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log('\n🔐 Available User Accounts:\n')
    console.log('=' .repeat(60))
    
    if (users.length === 0) {
      console.log('\n❌ No users found in database!')
      console.log('\n💡 Run: npm run db:seed to create demo users\n')
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name || 'Unknown'}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Role: ${user.role}`)
        console.log(`   Created: ${user.createdAt.toLocaleDateString()}`)
      })
      
      console.log('\n' + '='.repeat(60))
      console.log('\n📝 Default Password: password123')
      console.log('\n💡 Login at: http://localhost:3001/auth/signin\n')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

showCredentials()
