const pool = require('./db');

async function setupDatabase() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔧 Setting up database...');
    
    // Create tasks table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task VARCHAR(255) NOT NULL,
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tasks table created successfully');
    
    // Optional: Insert some sample data for demo
    const [existingTasks] = await connection.query('SELECT COUNT(*) as count FROM tasks');
    
    if (existingTasks[0].count === 0) {
      console.log('📝 Inserting sample tasks...');
      
      await connection.query(`
        INSERT INTO tasks (task, completed) VALUES
        ('Setup Vultr Managed MySQL Database cluster', true),
        ('Create Node.js application', true),
        ('Test CRUD operations', false),
        ('Explore cluster capabilities on Vultr', false)
      `);
      
      console.log('✅ Sample tasks inserted');
    } else {
      console.log(`ℹ️  Database already has ${existingTasks[0].count} task(s)`);
    }
    
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

setupDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));