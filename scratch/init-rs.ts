
import { MongoClient } from 'mongodb';

function hasMessage(value: unknown): value is { message: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as Record<string, unknown>).message === 'string'
  );
}

async function main() {
  // IMPORTANT: Use directConnection=true to connect to a member of a replica set that is not yet initialized
  const url = 'mongodb://localhost:27017/?directConnection=true';
  const client = new MongoClient(url);

  try {
    await client.connect();
    console.log('Connected to MongoDB local instance (Direct Connection).');

    const admin = client.db('admin');
    
    console.log('Attempting to initialize Replica Set "rs0"...');
    try {
      const result = await admin.command({
        replSetInitiate: {
          _id: 'rs0',
          members: [{ _id: 0, host: 'localhost:27017' }]
        }
      });
      console.log('Success! Replica set initialized:', JSON.stringify(result, null, 2));
    } catch (cmdError: unknown) {
      const message = hasMessage(cmdError) ? cmdError.message : '';
      if (message.includes('already initialized')) {
        console.log('Replica set is already initialized.');
      } else {
        throw cmdError;
      }
    }

  } catch (err: unknown) {
    console.error(
      'Error during initialization:',
      hasMessage(err) ? err.message : String(err),
    );
  } finally {
    await client.close();
  }
}

main();
