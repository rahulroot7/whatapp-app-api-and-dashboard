const seedUser = require('./userSeed');

async function runAllSeeders() {
  try {
    console.log('Seeding User...');
    await seedUser();
    console.log('User seeded successfully!');

  } catch (error) {
    console.error('Error running seeders:', error.message);
  } finally {
    process.exit();
  }
}

runAllSeeders();
